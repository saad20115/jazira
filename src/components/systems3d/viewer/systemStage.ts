/**
 * Entering and leaving a system in the live view (`handoff/tasks/P3-T5.md` §4, contract
 * `extras-schema.md`: `enter`, `SYS_<s>.enter_motion` / `section` / `orbit_limits` / `fan_spin`,
 * `turntable`, KHR_materials_variants), adapted from the 3D lead's reference viewer.
 *
 * A small state machine stepped by the render loop:
 *   rest → ease-back (turntable to 0) → variant → fly-in → entered → fly-out → rest.
 * A request for another system while entered goes out through the overview first (never through
 * the geometry). Every value comes from the validated extras.
 */

import {
  CatmullRomCurve3,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  type PerspectiveCamera,
  Plane,
  type Quaternion,
  Raycaster,
  type Intersection,
  Vector3,
} from 'three'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

import { SYSTEM_IDS, type SystemId, type ValidatedExtras } from '../contract'
import { cubicBezier, easeBackAngle, shortestAngle } from '../motion'
import { FACADE_MATERIALS } from '../renderContract'
import {
  collectMaterials,
  COMPILE_TASK_MS,
  drawableRepresentatives,
  yieldToMain,
} from './precompile'

const GLASS_MATERIALS = [
  'MAT_glass_cw',
  'MAT_glass_wing',
  'MAT_glass_side',
  'MAT_glass_terrace',
  'MAT_podium_glass',
]
const SITE_LIT_MATERIALS = ['MAT_stone', 'MAT_bronze', 'MAT_paving', 'MAT_planting']
const CORE_MATERIALS = ['MAT_concrete', 'MAT_concrete_floor']
/** The section plane slides in from this far behind its final position (reference viewer). */
const SECTION_SLIDE = 150
/** Label occlusion raycasts are throttled; positions are still projected every frame. */
const OCCLUSION_INTERVAL_MS = 250
/**
 * O-12: the occlusion rays of one frame stop after this much time (at least one ray per frame); the
 * rest are cast in the next frames. All of them in one frame cost up to ~75 ms on the HD 530 box.
 */
const OCCLUSION_FRAME_BUDGET_MS = 6

export interface ProjectedLabel {
  name: string
  label: string
  /** CSS px from the top-left of the card. */
  x: number
  y: number
  visible: boolean
}

export interface StageDeps {
  gltf: GLTF
  nodes: ReadonlyMap<string, Object3D>
  materials: ReadonlyMap<string, MeshStandardMaterial>
  extras: ValidatedExtras
  camera: PerspectiveCamera
  controls: OrbitControls
  heroQuaternion: Quaternion
  /** Applies the cover-crop view offset with this lens shift. */
  setShift: (shiftY: number) => void
  turntable: { getAngle: () => number; setAngle: (angle: number) => void }
  reducedMotion: boolean
  /**
   * Compiles the programs of these objects as they are now (`renderer.compileAsync` with the
   * scene's lights): every program is created before this returns, and the promise resolves once
   * all are linked, without blocking.
   */
  compileObjects: (objects: readonly Object3D[]) => Promise<unknown>
  /** O-12: resolves once new programs may be created (few are still linking). */
  compileRoom?: () => Promise<void>
  /** O-12: true while no new program may be created. */
  compileFull?: () => boolean
  /** First use of the materials' programs, spread over short tasks (`warmPrograms`). */
  warm: (materials: readonly Material[]) => Promise<void>
  /**
   * The wait between two warm-up tasks of `system` (O-9: idle slices until the model is shown, and
   * no other system's warm-up while the camera flies to the one asked for).
   */
  pause?: (system: SystemId) => Promise<void>
  /**
   * The entered look's share of the frame (0 = overview, 1 = inside a system), on every flight step
   * (never during a shader warm-up, which puts the material look back but not scene-level values).
   */
  onEnterMix?: (k: number) => void
}

type Phase = 'rest' | 'easeBack' | 'variant' | 'flyIn' | 'entered' | 'flyOut'

interface Flight {
  start: number
  durationMs: number
  curve: CatmullRomCurve3
  into: boolean
  system: SystemId
  target0: Vector3
  target1: Vector3
  fov0: number
  fov1: number
  shift0: number
  shift1: number
  ease: (x: number) => number
  fadeStart: number
  fadeEnd: number
}

interface VariantMapping {
  material: number
  variants: number[]
}

/** `instanceof Mesh` narrows to `Mesh<any, any, any>`; this keeps the default generics. */
function isMesh(object: Object3D): object is Mesh {
  return object instanceof Mesh
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => Number.isInteger(v) && v >= 0)
}

/** KHR_materials_variants mappings of a mesh (untrusted JSON: shape-checked). */
function variantMappings(object: Object3D): VariantMapping[] {
  const ext: unknown = (object.userData as { gltfExtensions?: Record<string, unknown> })
    .gltfExtensions?.KHR_materials_variants
  const mappings: unknown = (ext as { mappings?: unknown } | undefined)?.mappings
  if (!Array.isArray(mappings)) {
    return []
  }
  return mappings.filter(
    (m): m is VariantMapping =>
      typeof m === 'object' &&
      m !== null &&
      Number.isInteger((m as VariantMapping).material) &&
      isNumberArray((m as VariantMapping).variants),
  )
}

export interface SystemStage {
  readonly entered: SystemId | null
  /** True while anything moves (ease-back, variant switch, flight). */
  readonly moving: boolean
  /** True while shader warm-up work runs (its tasks lengthen frames; not a GPU speed sample). */
  readonly preparing: boolean
  /** True while no entered look is on screen, so `prepare` can run (it fails otherwise). */
  readonly canPrepare: boolean
  /** The system the visitor asked for last (null = overview). */
  readonly wanted: SystemId | null
  /** The system the visitor wants (null = overview); the stage gets there step by step. */
  request: (system: SystemId | null) => void
  /** Advances by `dtS`; returns true when another frame is needed. */
  step: (now: number, dtS: number) => boolean
  /** Hotspot labels of the entered system, projected into the card (null when none). */
  labels: (width: number, height: number) => ProjectedLabel[] | null
  /**
   * Compiles the programs of `system`'s entered view ahead of time (once per system), so entering
   * never blocks the main thread on shader links. Entering waits for it.
   */
  prepare: (system: SystemId) => Promise<void>
}

export function createSystemStage(deps: StageDeps): SystemStage {
  const { camera, controls, extras, materials, nodes } = deps
  const { enter, cameraLimits, turntable } = extras.scene

  const node = (name: string): Object3D => {
    const found = nodes.get(name)
    if (!found) {
      throw new Error(`node ${name}: missing`)
    }
    return found
  }
  const worldPos = (name: string): Vector3 => node(name).getWorldPosition(new Vector3())

  const heroFov = camera.fov
  const base = new Map<string, { emissiveIntensity: number; aoMapIntensity: number }>()
  for (const [name, material] of materials) {
    base.set(name, {
      emissiveIntensity: material.emissiveIntensity,
      aoMapIntensity: material.aoMapIntensity,
    })
  }

  const clipPlane = new Plane()
  const setClip = (material: Material, on: boolean): void => {
    const want = on ? [clipPlane] : null
    const has = material.clippingPlanes !== null && material.clippingPlanes.length > 0
    if (on !== has) {
      material.clippingPlanes = want
      material.needsUpdate = true
    }
  }
  const setFade = (material: MeshStandardMaterial, opacity: number): void => {
    if (!material.transparent) {
      material.needsUpdate = true
    }
    material.transparent = true
    material.opacity = opacity
    material.depthWrite = enter.transparentDepthWrite
  }
  const setOpaque = (material: MeshStandardMaterial): void => {
    if (material.transparent) {
      material.needsUpdate = true
    }
    material.transparent = false
    material.opacity = 1
    material.depthWrite = true
  }

  // Floor slabs of the entered system stay opaque and unclipped: they get their own material.
  const slabs: { mesh: Mesh; shared: Material }[] = []
  deps.gltf.scene.traverse((object) => {
    if (isMesh(object) && object.name.startsWith('CORE_slab_')) {
      slabs.push({ mesh: object, shared: object.material as Material })
    }
  })

  const applyFade = (system: SystemId | null, k: number): void => {
    const lerp = (to: number): number => 1 + (to - 1) * k
    const section = system ? extras.systems[system].section : null
    if (section) {
      clipPlane.normal.set(section.normal[0], section.normal[1], section.normal[2])
      clipPlane.constant = section.constant + (1 - k) * SECTION_SLIDE
    }
    for (const name of FACADE_MATERIALS) {
      const material = materials.get(name)
      if (!material) {
        continue
      }
      if (k > 0) {
        setFade(material, lerp(enter.facadeOpacity))
      } else {
        setOpaque(material)
      }
      if (GLASS_MATERIALS.includes(name)) {
        material.emissiveIntensity =
          (base.get(name)?.emissiveIntensity ?? 1) * lerp(enter.glassEmissiveScale)
      }
      setClip(material, k > 0 && section !== null)
    }
    for (const name of SITE_LIT_MATERIALS) {
      const material = materials.get(name)
      if (!material) {
        continue
      }
      material.emissiveIntensity =
        (base.get(name)?.emissiveIntensity ?? 1) * lerp(enter.siteEmissiveScale)
      material.aoMapIntensity = lerp(enter.siteOcclusionScale)
    }
    for (const name of CORE_MATERIALS) {
      const material = materials.get(name)
      if (!material) {
        continue
      }
      if (k > 0) {
        setFade(material, lerp(enter.interiorOpacity))
      } else {
        setOpaque(material)
      }
      setClip(material, k > 0 && section !== null)
    }
    for (const other of SYSTEM_IDS) {
      const glow = materials.get(`MAT_${other}_glow`)
      if (glow) {
        glow.visible = k > 0 && other === system
      }
      if (other === system) {
        continue
      }
      for (const material of [
        materials.get(`MAT_${other}_metal`),
        materials.get(`MAT_${other}_fans`),
      ]) {
        if (!material) {
          continue
        }
        if (k > 0) {
          setFade(material, lerp(enter.otherSystemsOpacity))
        } else {
          setOpaque(material)
        }
      }
    }
    const keep = k > 0 && system ? extras.systems[system].floorSlabs : []
    for (const slab of slabs) {
      if (keep.includes(slab.mesh.name)) {
        if (slab.mesh.material === slab.shared && slab.shared instanceof MeshStandardMaterial) {
          const own = slab.shared.clone()
          setOpaque(own)
          own.clippingPlanes = null
          own.opacity = enter.floorSlabOpacity
          slab.mesh.material = own
        }
      } else if (slab.mesh.material !== slab.shared) {
        ;(slab.mesh.material as Material).dispose()
        slab.mesh.material = slab.shared
      }
    }
  }

  // KHR_materials_variants: `highlight_<s>` while entered, the original materials otherwise.
  const variantNames: string[] = (() => {
    const ext: unknown = (deps.gltf.userData as { gltfExtensions?: Record<string, unknown> })
      .gltfExtensions?.KHR_materials_variants
    const list: unknown = (ext as { variants?: unknown } | undefined)?.variants
    return Array.isArray(list)
      ? list.map((v) =>
          typeof (v as { name?: unknown }).name === 'string' ? (v as { name: string }).name : '',
        )
      : []
  })()
  const originals = new Map<Mesh, Material | Material[]>()
  let variantAssigned = false
  /** Loads the `highlight_<s>` materials of a system (the parser caches them). */
  const loadVariant = async (system: SystemId | null): Promise<Map<Mesh, Material>> => {
    const index = system ? variantNames.indexOf(`highlight_${system}`) : -1
    const loaded = new Map<Mesh, Material>()
    if (index < 0) {
      return loaded
    }
    const jobs: Promise<void>[] = []
    deps.gltf.scene.traverse((object) => {
      if (!isMesh(object)) {
        return
      }
      const mapping = variantMappings(object).find((m) => m.variants.includes(index))
      if (!mapping) {
        return
      }
      jobs.push(
        (deps.gltf.parser.getDependency('material', mapping.material) as Promise<Material>).then(
          (material) => {
            loaded.set(object, material)
          },
        ),
      )
    })
    await Promise.all(jobs)
    return loaded
  }
  /** Puts loaded variant materials on their meshes; every other mapped mesh gets its original. */
  const assignVariant = (loaded: ReadonlyMap<Mesh, Material>): void => {
    deps.gltf.scene.traverse((object) => {
      if (!isMesh(object) || variantMappings(object).length === 0) {
        return
      }
      if (!originals.has(object)) {
        originals.set(object, object.material)
      }
      const material = loaded.get(object)
      if (material) {
        object.material = material
        deps.gltf.parser.assignFinalMaterial(object)
      } else {
        object.material = originals.get(object) as Material
      }
    })
    variantAssigned = loaded.size > 0
  }
  const selectVariant = async (system: SystemId | null): Promise<void> => {
    assignVariant(await loadVariant(system))
  }

  // Fans (SYS_<s>.fan_spin): the rotor texture turns while the system is entered.
  const fans = SYSTEM_IDS.flatMap((id) => {
    const cfg = extras.systems[id].fanSpin
    const map = cfg ? materials.get(cfg.material)?.map : null
    if (!cfg || !map) {
      return []
    }
    map.center.set(0.5, 0.5)
    return [{ id, cfg, map, level: cfg.play === 'always' ? 1 : 0 }]
  })

  let phase: Phase = 'rest'
  let entered: SystemId | null = null
  let desired: SystemId | null = null
  let flight: Flight | null = null
  let easeBack: { from: number; start: number; durationS: number } | null = null
  let variantPending = false
  /** The system whose variant the `variant` phase prepared (or is preparing). */
  let variantFor: SystemId | null = null
  const raycaster = new Raycaster()
  let occlusion: {
    system: SystemId
    occluders: Object3D[]
    checkedAt: number
    /** Hotspots whose ray is still to be cast in this round. */
    queue: Set<string>
    /** Hotspots found hidden, or not yet checked once (a label shows only once found visible). */
    hidden: Set<string>
  } | null = null
  const hits: Intersection[] = []
  /** Whether anything blocks the ray (stops at the first occluder hit, unlike `intersectObjects`). */
  const rayBlocked = (occluders: readonly Object3D[]): boolean => {
    for (const object of occluders) {
      if (!object.layers.test(raycaster.layers)) {
        continue
      }
      hits.length = 0
      object.raycast(raycaster, hits)
      if (hits.length > 0) {
        hits.length = 0
        return true
      }
    }
    return false
  }

  /** The part of a material's state that the fades change and that selects its shader program. */
  const programState = (material: Material): string =>
    `${String(material.transparent)}|${String(material.clippingPlanes?.length ?? 0)}`

  /** Captures the look state the fades change; the returned function puts it back exactly. */
  const snapshotLook = (): (() => void) => {
    const saved = [...materials.values()].map((material) => ({
      material,
      transparent: material.transparent,
      opacity: material.opacity,
      depthWrite: material.depthWrite,
      clippingPlanes: material.clippingPlanes,
      emissiveIntensity: material.emissiveIntensity,
      aoMapIntensity: material.aoMapIntensity,
      visible: material.visible,
    }))
    const slabMaterials = slabs.map((slab) => ({ mesh: slab.mesh, material: slab.mesh.material }))
    const plane = clipPlane.clone()
    return () => {
      for (const s of saved) {
        const m = s.material
        if (
          m.transparent !== s.transparent ||
          (m.clippingPlanes?.length ?? 0) !== (s.clippingPlanes?.length ?? 0)
        ) {
          m.needsUpdate = true
        }
        m.transparent = s.transparent
        m.opacity = s.opacity
        m.depthWrite = s.depthWrite
        m.clippingPlanes = s.clippingPlanes
        m.emissiveIntensity = s.emissiveIntensity
        m.aoMapIntensity = s.aoMapIntensity
        m.visible = s.visible
      }
      for (const { mesh, material } of slabMaterials) {
        if (mesh.material !== material) {
          ;(mesh.material as Material).dispose()
          mesh.material = material
        }
      }
      clipPlane.copy(plane)
    }
  }

  // Shader warm-up: the entered look of a system (its variant, faded and section-clipped materials,
  // kept slabs) is applied for one synchronous moment, its programs are created and linked in
  // parallel, and the look is put back before any frame can draw it. Only while nothing of an
  // entered look is on screen (no fade, no variant).
  const prepared = new Map<SystemId, Promise<void>>()
  const lookAtRest = (): boolean =>
    (phase === 'rest' || phase === 'easeBack' || phase === 'variant') && !variantAssigned
  const compileEntered = async (system: SystemId): Promise<void> => {
    const loaded = await loadVariant(system)
    // Each step applies the entered look, works on it synchronously and puts the rest look back,
    // so no frame ever draws it; the steps are separate tasks (no long task).
    const withEnteredLook = <T>(work: () => T): T => {
      if (!lookAtRest()) {
        throw new Error('stage busy')
      }
      const restore = snapshotLook()
      try {
        assignVariant(loaded)
        applyFade(system, 1)
        return work()
      } finally {
        restore()
        assignVariant(new Map())
      }
    }
    // Only objects whose program the entered look can change: another material (variant, kept
    // slab) or another transparency / clipping state. Everything else is already compiled.
    const restMaterialOf = new Map<Object3D, Material | Material[]>()
    deps.gltf.scene.traverse((object) => {
      if (isMesh(object)) {
        restMaterialOf.set(object, object.material)
      }
    })
    const restState = new Map<Material, string>()
    for (const material of materials.values()) {
      restState.set(material, programState(material))
    }
    const lookChanges = (object: Object3D): boolean => {
      if (!isMesh(object)) {
        return false
      }
      if (object.material !== restMaterialOf.get(object)) {
        return true
      }
      const list = Array.isArray(object.material) ? object.material : [object.material]
      return list.some((m) => {
        const rest = restState.get(m)
        return rest !== undefined && rest !== programState(m)
      })
    }
    const { objects, used } = withEnteredLook(() => ({
      objects: drawableRepresentatives(deps.gltf.scene).filter(lookChanges),
      used: collectMaterials(deps.gltf.scene),
    }))
    const pending: Promise<unknown>[] = []
    let next = 0
    while (next < objects.length) {
      if (next > 0) {
        await (deps.pause ? deps.pause(system) : yieldToMain())
      }
      // O-12: only while few new programs are still linking; then at once, in the same task.
      if (deps.compileRoom) {
        await deps.compileRoom()
      }
      pending.push(
        withEnteredLook(() => {
          const taskStart = performance.now()
          const started: Promise<unknown>[] = []
          do {
            started.push(deps.compileObjects(objects.slice(next, next + 1)))
            next += 1
          } while (
            next < objects.length &&
            !deps.compileFull?.() &&
            performance.now() - taskStart < COMPILE_TASK_MS
          )
          return Promise.all(started)
        }),
      )
    }
    await (deps.pause ? deps.pause(system) : yieldToMain())
    await Promise.all(pending)
    await deps.warm(used)
  }
  let preparing = 0
  const prepare = (system: SystemId): Promise<void> => {
    let job = prepared.get(system)
    if (!job) {
      preparing += 1
      job = compileEntered(system)
        .finally(() => {
          preparing -= 1
        })
        .catch(() => {
          // Busy (a look on screen) or lost: the next request tries again.
          prepared.delete(system)
        })
      prepared.set(system, job)
    }
    return job
  }

  /** Shaders of `target` first (no stall when the flight starts), then its variant materials. */
  const startVariant = (target: SystemId): void => {
    variantPending = true
    variantFor = target
    // A switch while waiting leaves the previous system's highlight on; the warm-up needs the rest
    // look (it refuses to run while an entered look is on).
    if (variantAssigned) {
      assignVariant(new Map())
    }
    void prepare(target)
      .then(() => selectVariant(target))
      .catch(() => {
        // A variant material that does not load: fly in without the highlight.
        assignVariant(new Map())
      })
      .then(() => {
        variantPending = false
      })
  }

  const startFlight = (system: SystemId, into: boolean, now: number): void => {
    const motion = extras.systems[system].enterMotion
    const mid = motion.path.slice(1, -1)
    const waypoints = (into ? mid : [...mid].reverse()).map(worldPos)
    const destination = worldPos(into ? `CAM_${system}` : 'CAM_hero')
    flight = {
      start: now,
      durationMs: motion.durationS * 1000,
      curve: new CatmullRomCurve3(
        [camera.position.clone(), ...waypoints, destination],
        false,
        'centripetal',
      ),
      into,
      system,
      target0: controls.target.clone(),
      target1: worldPos(into ? motion.targetTo : motion.targetFrom),
      fov0: camera.fov,
      fov1: ((into ? motion.fovTo : motion.fovFrom) * 180) / Math.PI,
      shift0: into ? motion.shiftYFrom : 0,
      shift1: into ? motion.shiftYTo : cameraLimits.heroShiftY,
      ease: cubicBezier(motion.easing),
      fadeStart: motion.fadeStart,
      fadeEnd: motion.fadeEnd,
    }
    controls.enabled = false
  }

  const applyOrbitLimits = (system: SystemId | null): void => {
    const limits = system ? extras.systems[system].orbitLimits : cameraLimits
    controls.minDistance = limits.minDistance
    controls.maxDistance = limits.maxDistance
    controls.minPolarAngle = limits.minPolar
    controls.maxPolarAngle = limits.maxPolar
  }

  const stepFlight = (now: number): boolean => {
    if (!flight) {
      return false
    }
    const t = Math.min(1, Math.max(0, (now - flight.start) / flight.durationMs))
    const e = flight.ease(t)
    camera.position.copy(flight.curve.getPoint(e))
    controls.target.lerpVectors(flight.target0, flight.target1, e)
    camera.fov = flight.fov0 + (flight.fov1 - flight.fov0) * e
    deps.setShift(flight.shift0 + (flight.shift1 - flight.shift0) * e)
    camera.lookAt(controls.target)
    const span = Math.max(1e-3, flight.fadeEnd - flight.fadeStart)
    const k = flight.into
      ? Math.min(1, Math.max(0, (e - flight.fadeStart) / span))
      : 1 - Math.min(1, Math.max(0, (e - (1 - flight.fadeEnd)) / span))
    applyFade(flight.system, k)
    deps.onEnterMix?.(k)
    if (t < 1) {
      return true
    }
    if (flight.into) {
      entered = flight.system
      phase = 'entered'
      applyOrbitLimits(flight.system)
    } else {
      camera.quaternion.copy(deps.heroQuaternion)
      camera.fov = heroFov
      deps.setShift(cameraLimits.heroShiftY)
      applyFade(null, 0)
      deps.onEnterMix?.(0)
      void selectVariant(null)
      applyOrbitLimits(null)
      entered = null
      phase = 'rest'
    }
    flight = null
    return true
  }

  return {
    get entered() {
      return entered
    },
    get preparing() {
      return preparing > 0
    },
    get wanted() {
      return desired
    },
    get canPrepare() {
      return lookAtRest()
    },
    get moving() {
      return phase !== 'rest' && phase !== 'entered'
    },
    request(system) {
      desired = system
    },
    prepare,
    step(now, dtS) {
      let again = false
      for (const fan of fans) {
        const want =
          fan.cfg.play === 'always'
            ? 1
            : entered === fan.id || (flight?.into && flight.system === fan.id)
              ? 1
              : 0
        const rate = dtS / Math.max(0.01, fan.cfg.rampS)
        fan.level += Math.sign(want - fan.level) * Math.min(Math.abs(want - fan.level), rate)
        if (!deps.reducedMotion && fan.level > 0) {
          fan.map.rotation =
            (fan.map.rotation - (fan.cfg.rpm / 60) * 2 * Math.PI * dtS * fan.level) % (2 * Math.PI)
          again = true
        }
      }
      switch (phase) {
        case 'rest': {
          if (desired !== null) {
            const from = shortestAngle(deps.turntable.getAngle())
            easeBack = { from, start: now, durationS: turntable.easeBackS }
            phase = 'easeBack'
            again = true
          }
          break
        }
        case 'easeBack': {
          if (!easeBack || desired === null) {
            phase = 'rest'
            break
          }
          const ease = cubicBezier(extras.systems[desired].enterMotion.easing)
          const { angle, done } = easeBackAngle(
            easeBack.from,
            (now - easeBack.start) / 1000,
            easeBack.durationS,
            ease,
          )
          deps.turntable.setAngle(angle)
          if (done) {
            easeBack = null
            phase = 'variant'
            startVariant(desired)
          }
          again = true
          break
        }
        case 'variant': {
          // The wait for the shaders can be long on a slow GPU: the visitor may have left or
          // picked another system meanwhile.
          if (!variantPending) {
            if (desired === null) {
              assignVariant(new Map())
              variantFor = null
              phase = 'rest'
            } else if (desired !== variantFor) {
              startVariant(desired)
            } else {
              startFlight(desired, true, now)
              phase = 'flyIn'
            }
          }
          again = true
          break
        }
        case 'flyIn':
        case 'flyOut': {
          again = stepFlight(now) || again
          break
        }
        case 'entered': {
          if (desired !== entered && entered !== null) {
            startFlight(entered, false, now)
            phase = 'flyOut'
            again = true
          }
          break
        }
      }
      return again
    },
    labels(width, height) {
      if (phase !== 'entered' || entered === null) {
        occlusion = null
        return null
      }
      const id = entered
      const now = performance.now()
      if (!occlusion || occlusion.system !== id) {
        // Opaque, visible meshes at k = 1 (faded façade and core do not hide labels). The entered
        // system's own equipment and its kept slabs never hide its labels (anchors sit inside).
        const own = new Set<Object3D>()
        node(`SYS_${id}`).traverse((object) => own.add(object))
        const occluders: Object3D[] = []
        deps.gltf.scene.traverse((object) => {
          if (
            !own.has(object) &&
            !extras.systems[id].floorSlabs.includes(object.name) &&
            isMesh(object) &&
            object.visible &&
            object.material instanceof MeshStandardMaterial &&
            !object.material.transparent &&
            object.material.visible
          ) {
            occluders.push(object)
          }
        })
        const names = extras.hotspots.filter((h) => h.system === id).map((h) => h.name)
        occlusion = {
          system: id,
          occluders,
          checkedAt: -Infinity,
          queue: new Set(),
          hidden: new Set(names),
        }
      }
      const state = occlusion
      const hotspots = extras.hotspots.filter((h) => h.system === id)
      if (state.queue.size === 0 && now - state.checkedAt >= OCCLUSION_INTERVAL_MS) {
        state.checkedAt = now
        for (const hotspot of hotspots) {
          state.queue.add(hotspot.name)
        }
      }
      let rays = 0
      return hotspots.map((hotspot) => {
        const world = worldPos(hotspot.name)
        const ndc = world.clone().project(camera)
        const inFrame = ndc.z < 1 && Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1
        if (
          inFrame &&
          state.queue.has(hotspot.name) &&
          (rays === 0 || performance.now() - now < OCCLUSION_FRAME_BUDGET_MS)
        ) {
          rays += 1
          state.queue.delete(hotspot.name)
          const direction = world.clone().sub(camera.position)
          const distance = direction.length()
          raycaster.set(camera.position, direction.normalize())
          raycaster.far = Math.max(0, distance - 0.5)
          if (rayBlocked(state.occluders)) {
            state.hidden.add(hotspot.name)
          } else {
            state.hidden.delete(hotspot.name)
          }
        } else if (!inFrame) {
          // Out of the frame it shows nowhere; it is checked again once back in a new round.
          state.queue.delete(hotspot.name)
        }
        return {
          name: hotspot.name,
          label: hotspot.label,
          x: ((ndc.x + 1) / 2) * width,
          y: ((1 - ndc.y) / 2) * height,
          visible: inFrame && !state.hidden.has(hotspot.name),
        }
      })
    },
  }
}
