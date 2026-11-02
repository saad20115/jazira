import {
  BoxGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from 'three'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SYSTEM_IDS,
  type SystemExtras,
  type SystemId,
  type ValidatedExtras,
} from '@/components/systems3d/contract'
import { createSystemStage, type SystemStage } from '@/components/systems3d/viewer/systemStage'

const LINEAR = [0, 0, 1, 1] as const

function systemExtras(id: SystemId): SystemExtras {
  return {
    id,
    floorSlabs: [],
    enterMotion: {
      durationS: 1,
      easing: LINEAR,
      path: ['CAM_hero', `CAM_${id}`],
      targetFrom: 'CAM_hero',
      targetTo: `CAM_${id}`,
      fovFrom: 0.6,
      fovTo: 0.8,
      shiftYFrom: 0,
      shiftYTo: 0,
      fadeStart: 0,
      fadeEnd: 1,
    },
    section: { normal: [0, -1, 0], constant: 10 },
    orbitLimits: {
      target: [0, 0, 0],
      minDistance: 1,
      maxDistance: 50,
      minPolar: 0.1,
      maxPolar: 1.5,
      panRadius: 5,
    },
    fanSpin: null,
  }
}

const EXTRAS: ValidatedExtras = {
  scene: {
    enter: {
      facadeOpacity: 0.15,
      interiorOpacity: 0.3,
      glassEmissiveScale: 0.5,
      transparentDepthWrite: false,
      floorSlabOpacity: 1,
      otherSystemsOpacity: 0.2,
      siteEmissiveScale: 0.5,
      siteOcclusionScale: 0.5,
    },
    cameraLimits: {
      target: [0, 0, 0],
      panCenter: [0, 0, 0],
      panRadius: 10,
      minDistance: 10,
      maxDistance: 420,
      minPolar: 0.1,
      maxPolar: 1.5,
      minCameraHeight: 1,
      fovY: 0.6,
      heroShiftY: 0.148,
    },
    turntable: { root: 'ROOT', rpm: 0.6, easeBackS: 0.5, resumeAfterS: 8 },
    studio: {
      mode: 'night',
      room: 'ROOM',
      envOnly: [],
      envPosition: [0, 0, 0],
      exposureStops: 0,
      bloom: false,
      moon: null,
      nightGlow: null,
    },
  },
  systems: Object.fromEntries(SYSTEM_IDS.map((id) => [id, systemExtras(id)])) as Record<
    SystemId,
    SystemExtras
  >,
  hotspots: [],
}

interface Deferred {
  promise: Promise<void>
  resolve: () => void
  reject: (err: Error) => void
}
function deferred(): Deferred {
  let resolve!: () => void
  let reject!: (err: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Lets every queued promise reaction (and zero-delay timer) run. */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
  }
}

interface Fixture {
  stage: SystemStage
  camera: PerspectiveCamera
  facade: Mesh
  stone: Mesh
  hvacEquipment: Mesh
  restHvacMaterial: Material
  highlight: Record<'hvac' | 'fire', MeshStandardMaterial>
  /** One entry per `compileObjects` call: the objects it was asked to compile. */
  compiled: Object3D[][]
  /** The pending compile of each call, settled by the test. */
  compiles: Deferred[]
  warmed: number
  /** Every `onEnterMix` value, in order (O-5: the system light blend). */
  mixes: number[]
}

function buildFixture(): Fixture {
  const scene = new Group()
  const nodes = new Map<string, Object3D>()
  const materials = new Map<string, MeshStandardMaterial>()
  const addNode = (name: string, position: [number, number, number]): void => {
    const node = new Object3D()
    node.name = name
    node.position.set(...position)
    scene.add(node)
    nodes.set(name, node)
  }
  addNode('CAM_hero', [0, 50, 200])
  SYSTEM_IDS.forEach((id, i) => {
    addNode(`CAM_${id}`, [10 * (i + 1), 20, 40])
    addNode(`SYS_${id}`, [0, 0, 0])
  })

  const geometry = new BoxGeometry()
  const glass = new MeshStandardMaterial({ name: 'MAT_glass_cw' })
  materials.set('MAT_glass_cw', glass)
  const facade = new Mesh(geometry, glass)
  facade.name = 'ARCH_facade'
  const stoneMaterial = new MeshStandardMaterial({ name: 'MAT_stone' })
  materials.set('MAT_stone', stoneMaterial)
  const stone = new Mesh(geometry, stoneMaterial)
  stone.name = 'SITE_stone'
  const restHvacMaterial = new MeshStandardMaterial({ name: 'MAT_hvac_metal' })
  materials.set('MAT_hvac_metal', restHvacMaterial)
  const hvacEquipment = new Mesh(geometry, restHvacMaterial)
  hvacEquipment.name = 'SYS_hvac_unit'
  hvacEquipment.userData = {
    gltfExtensions: {
      KHR_materials_variants: {
        mappings: [
          { material: 0, variants: [0] },
          { material: 1, variants: [1] },
        ],
      },
    },
  }
  scene.add(facade, stone, hvacEquipment)

  const highlight = {
    hvac: new MeshStandardMaterial({ name: 'MAT_highlight_hvac' }),
    fire: new MeshStandardMaterial({ name: 'MAT_highlight_fire' }),
  }
  const gltf = {
    scene,
    userData: {
      gltfExtensions: {
        KHR_materials_variants: {
          variants: [{ name: 'highlight_hvac' }, { name: 'highlight_fire' }],
        },
      },
    },
    parser: {
      getDependency: (_type: string, index: number) =>
        Promise.resolve(index === 0 ? highlight.hvac : highlight.fire),
      assignFinalMaterial: () => undefined,
    },
  } as unknown as GLTF

  const camera = new PerspectiveCamera(35, 1, 0.1, 1000)
  nodes.get('CAM_hero')?.getWorldPosition(camera.position)
  const controls = {
    target: new Vector3(),
    enabled: true,
    minDistance: 0,
    maxDistance: 0,
    minPolarAngle: 0,
    maxPolarAngle: 0,
  } as unknown as OrbitControls

  const compiled: Object3D[][] = []
  const compiles: Deferred[] = []
  const mixes: number[] = []
  const fixture = {
    camera,
    facade,
    stone,
    hvacEquipment,
    restHvacMaterial,
    highlight,
    compiled,
    compiles,
    warmed: 0,
    mixes,
  }
  let angle = 0
  const stage = createSystemStage({
    gltf,
    nodes,
    materials,
    extras: EXTRAS,
    camera,
    controls,
    heroQuaternion: new Quaternion(),
    setShift: () => undefined,
    turntable: {
      getAngle: () => angle,
      setAngle: (next) => {
        angle = next
      },
    },
    reducedMotion: true,
    compileObjects: (objects) => {
      compiled.push([...objects])
      const job = deferred()
      compiles.push(job)
      return job.promise
    },
    warm: () => {
      fixture.warmed += 1
      return Promise.resolve()
    },
    onEnterMix: (k) => {
      mixes.push(k)
    },
  })
  return {
    ...fixture,
    stage,
    get warmed() {
      return fixture.warmed
    },
  }
}

/** Settles every compile started so far. */
function finishCompiles(f: Fixture): void {
  for (const job of f.compiles) {
    job.resolve()
  }
}

/** Steps the stage at 10 ms frames from `start` for `frames` frames; returns the last time. */
function run(stage: SystemStage, start: number, frames: number): number {
  let now = start
  for (let i = 0; i < frames; i += 1) {
    now += 10
    stage.step(now, 0.01)
  }
  return now
}

describe('P3-T5 system stage: entering waits for the shader warm-up', () => {
  beforeEach(() => {
    // `yieldToMain` uses `window.setTimeout`; vitest runs in node.
    vi.stubGlobal('window', { setTimeout })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('compiles only the objects whose program the entered look changes', async () => {
    const f = buildFixture()
    void f.stage.prepare('hvac')
    await settle()
    const asked = f.compiled.flat()
    // The façade turns transparent and clipped; the HVAC unit gets its highlight material.
    expect(asked).toContain(f.facade)
    expect(asked).toContain(f.hvacEquipment)
    // Stone only changes uniforms (emissive, AO): its program is already compiled.
    expect(asked).not.toContain(f.stone)
    finishCompiles(f)
    await settle()
    expect(f.warmed).toBe(1)
  })

  it('puts the rest look back after each warm-up step', async () => {
    const f = buildFixture()
    void f.stage.prepare('hvac')
    await settle()
    expect(f.hvacEquipment.material).toBe(f.restHvacMaterial)
    expect((f.facade.material as Material).transparent).toBe(false)
    expect((f.facade.material as Material).clippingPlanes).toBeNull()
  })

  it('is `preparing` while the compile runs, and not after', async () => {
    const f = buildFixture()
    expect(f.stage.preparing).toBe(false)
    const job = f.stage.prepare('hvac')
    await settle()
    expect(f.stage.preparing).toBe(true)
    finishCompiles(f)
    await job
    expect(f.stage.preparing).toBe(false)
  })

  it('a failed warm-up clears `preparing` and is tried again on the next request', async () => {
    const f = buildFixture()
    const job = f.stage.prepare('hvac')
    await settle()
    for (const c of f.compiles) {
      c.reject(new Error('context lost'))
    }
    await job
    expect(f.stage.preparing).toBe(false)
    const before = f.compiled.length
    void f.stage.prepare('hvac')
    await settle()
    expect(f.compiled.length).toBeGreaterThan(before)
  })

  it('does not fly in before the warm-up ends, then enters', async () => {
    const f = buildFixture()
    const start = f.camera.position.clone()
    f.stage.request('hvac')
    let now = run(f.stage, 0, 60)
    await settle()
    now = run(f.stage, now, 60)
    expect(f.stage.moving).toBe(true)
    expect(f.stage.entered).toBeNull()
    expect(f.camera.position.equals(start)).toBe(true)
    finishCompiles(f)
    await settle()
    now = run(f.stage, now, 5)
    expect(f.camera.position.equals(start)).toBe(false)
    run(f.stage, now, 200)
    expect(f.stage.entered).toBe('hvac')
    expect(f.hvacEquipment.material).toBe(f.highlight.hvac)
  })

  it('a visitor who leaves during the warm-up goes back to rest without flying', async () => {
    const f = buildFixture()
    const start = f.camera.position.clone()
    f.stage.request('hvac')
    const now = run(f.stage, 0, 60)
    await settle()
    f.stage.request(null)
    finishCompiles(f)
    await settle()
    run(f.stage, now, 200)
    expect(f.stage.moving).toBe(false)
    expect(f.stage.entered).toBeNull()
    expect(f.camera.position.equals(start)).toBe(true)
    expect(f.hvacEquipment.material).toBe(f.restHvacMaterial)
  })

  it('picking another system during the warm-up warms that system up and enters it', async () => {
    const f = buildFixture()
    f.stage.request('hvac')
    let now = run(f.stage, 0, 60)
    await settle()
    f.stage.request('fire')
    finishCompiles(f)
    await settle()
    // The HVAC highlight is on now; the fire warm-up must still run (not refuse as busy).
    const warmedBefore = f.warmed
    now = run(f.stage, now, 2)
    await settle()
    finishCompiles(f)
    await settle()
    expect(f.warmed).toBe(warmedBefore + 1)
    run(f.stage, now, 200)
    expect(f.stage.entered).toBe('fire')
    expect(f.hvacEquipment.material).toBe(f.highlight.fire)
  })
})

describe('P3-T5 O-5: the system light blend follows the flight, never the warm-up', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { setTimeout })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rises from 0 to 1 while flying in, ends at 0 after flying out, and the warm-up sends none', async () => {
    const f = buildFixture()
    f.stage.request('hvac')
    let now = run(f.stage, 0, 60)
    await settle()
    now = run(f.stage, now, 60)
    // The warm-up applies the entered look and puts it back: it must not touch the scene light.
    expect(f.compiled.length).toBeGreaterThan(0)
    expect(f.mixes).toEqual([])
    finishCompiles(f)
    await settle()
    now = run(f.stage, now, 5)
    now = run(f.stage, now, 200)
    expect(f.stage.entered).toBe('hvac')
    expect(f.mixes.length).toBeGreaterThan(2)
    expect(f.mixes.at(-1)).toBe(1)
    for (let i = 1; i < f.mixes.length; i += 1) {
      expect(f.mixes[i]).toBeGreaterThanOrEqual(f.mixes[i - 1] ?? 0)
    }
    f.mixes.length = 0
    f.stage.request(null)
    run(f.stage, now, 300)
    expect(f.stage.entered).toBeNull()
    expect(f.mixes.at(-1)).toBe(0)
  })
})
