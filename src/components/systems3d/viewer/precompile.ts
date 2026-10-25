/**
 * Shader programs compiled off the main thread (`KHR_parallel_shader_compile`, through three's
 * `compileAsync`) before they are first used. A program used before its link finishes blocks the
 * main thread until it does (P3-T5 M4 profile on the HD 530: PMREM's GGX filter alone ~0.9 s).
 *
 * `compileAsync` creates every program synchronously and only waits asynchronously, so render
 * state that changes the program (render target, tone mapping) is set around that synchronous call
 * and restored before awaiting.
 */

import {
  type Camera,
  Line,
  type Material,
  Mesh,
  NoToneMapping,
  Points,
  Sprite,
  Texture,
  type Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  type PMREMGenerator,
  type Scene,
  type ShaderMaterial,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from 'three'

/** The PMREMGenerator members of three 0.186.1 used here (not in its public types). */
interface PmremInternals {
  _setSize: (cubeSize: number) => void
  _allocateTargets: () => WebGLRenderTarget
  _ggxMaterial: ShaderMaterial | null
  /** The meshes the filters draw with; their geometry is part of the program cache key. */
  _lodMeshes: Mesh[]
}

/** Exported for the unit test that pins these internals to three 0.186.1. */
export function hasPmremInternals(pmrem: PMREMGenerator): pmrem is PMREMGenerator & PmremInternals {
  const setSize: unknown = Reflect.get(pmrem, '_setSize')
  const allocate: unknown = Reflect.get(pmrem, '_allocateTargets')
  return (
    typeof setSize === 'function' &&
    typeof allocate === 'function' &&
    Reflect.has(pmrem, '_ggxMaterial') &&
    Array.isArray(Reflect.get(pmrem, '_lodMeshes'))
  )
}

/** Compiles `object` as it will render into `target` with tone mapping off, then waits. */
async function compileOffscreen(
  renderer: WebGLRenderer,
  object: Object3D,
  camera: OrthographicCamera | PerspectiveCamera,
  target: WebGLRenderTarget,
): Promise<void> {
  const previousTarget = renderer.getRenderTarget()
  const previousToneMapping = renderer.toneMapping
  renderer.setRenderTarget(target)
  renderer.toneMapping = NoToneMapping
  let ready: Promise<unknown>
  try {
    ready = renderer.compileAsync(object, camera)
  } finally {
    renderer.toneMapping = previousToneMapping
    renderer.setRenderTarget(previousTarget)
  }
  await ready
}

/**
 * Prepares `pmrem.fromScene(envScene, 0, …, { size })`: compiles the studio scene as the cube
 * render draws it, and PMREM's GGX filter on the very mesh it draws with (a stand-in geometry gives
 * a different program cache key, and the bake then links its own copy). With sigma 0 the blur
 * filter is never used. Without the expected internals nothing is precompiled and `fromScene`
 * compiles as before.
 */
export async function precompilePmrem(
  renderer: WebGLRenderer,
  pmrem: PMREMGenerator,
  envScene: Scene,
  size: number,
): Promise<void> {
  if (!hasPmremInternals(pmrem)) {
    return
  }
  pmrem._setSize(size)
  // Creates the filter materials (kept for `fromScene` at the same size) and a target of the
  // cube render's format; the target itself is only used to compile against.
  const target = pmrem._allocateTargets()
  try {
    await compileOffscreen(renderer, envScene, new PerspectiveCamera(90, 1, 0.1, 100), target)
    const ggxMesh = pmrem._lodMeshes.at(-1)
    if (ggxMesh && pmrem._ggxMaterial) {
      // `_applyGGXFilter` assigns this same material to the mesh before each draw.
      ggxMesh.material = pmrem._ggxMaterial
      await compileOffscreen(renderer, ggxMesh, new OrthographicCamera(), target)
    }
    await warmPrograms(
      renderer,
      [...collectMaterials(envScene), ...(pmrem._ggxMaterial ? [pmrem._ggxMaterial] : [])],
      () => false,
    )
  } finally {
    target.dispose()
  }
}

/** `instanceof` narrows to `any` generics; these guards keep three's default ones. */
function isDrawable(object: Object3D): object is Mesh | Points | Line | Sprite {
  return (
    object instanceof Mesh ||
    object instanceof Points ||
    object instanceof Line ||
    object instanceof Sprite
  )
}
function isMesh(object: Object3D): object is Mesh {
  return object instanceof Mesh
}
function isTexture(value: unknown): value is Texture {
  return value instanceof Texture
}

/** One macrotask boundary: input and paint run between the chunks of the work below. */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

/** Every material on a drawable object under `root` (variants included while assigned). */
export function collectMaterials(root: Object3D): Material[] {
  const materials = new Set<Material>()
  root.traverse((object) => {
    if (isDrawable(object)) {
      const material: Material | Material[] = object.material
      for (const m of Array.isArray(material) ? material : [material]) {
        materials.add(m)
      }
    }
  })
  return [...materials]
}

/** The programs three keeps for a material (`materialProperties.programs`, three 0.186.1). */
function programsOf(renderer: WebGLRenderer, material: Material): unknown[] {
  const properties = renderer.properties.get(material)
  if (typeof properties !== 'object' || properties === null) {
    return []
  }
  const programs: unknown = Reflect.get(properties, 'programs')
  const list: unknown[] = []
  if (programs instanceof Map) {
    programs.forEach((program: unknown) => {
      list.push(program)
    })
  }
  return list
}

/** Time budget of one warm-up or upload task (ms). */
const TASK_BUDGET_MS = 30

/**
 * First use of linked programs, ahead of the draw that needs them. On ANGLE (D3D11) a program's
 * first use still costs main-thread time after its parallel link has finished (three's
 * `getUniforms()`: info logs and uniform locations); here it is spread over tasks of ~30 ms.
 */
export async function warmPrograms(
  renderer: WebGLRenderer,
  materials: Iterable<Material>,
  isCancelled: () => boolean,
): Promise<void> {
  const seen = new Set<unknown>()
  let taskStart = performance.now()
  for (const material of materials) {
    for (const program of programsOf(renderer, material)) {
      if (seen.has(program) || typeof program !== 'object' || program === null) {
        continue
      }
      seen.add(program)
      if (isCancelled()) {
        return
      }
      const getUniforms: unknown = Reflect.get(program, 'getUniforms')
      if (typeof getUniforms === 'function') {
        Reflect.apply(getUniforms, program, [])
      }
      if (performance.now() - taskStart > TASK_BUDGET_MS) {
        await yieldToMain()
        taskStart = performance.now()
      }
    }
  }
}

/**
 * One object per distinct material, geometry layout and object kind under `root`: what three's
 * program choice depends on here, so compiling these compiles every program the scene draws with.
 */
export function drawableRepresentatives(root: Object3D): Object3D[] {
  const seen = new Set<string>()
  const representatives: Object3D[] = []
  root.traverse((object) => {
    if (!isDrawable(object)) {
      return
    }
    const material: Material | Material[] = object.material
    const materials = Array.isArray(material) ? material : [material]
    const attributes =
      object instanceof Sprite ? '' : Object.keys(object.geometry.attributes).sort().join(',')
    const key = `${object.type}|${materials.map((m) => m.uuid).join(',')}|${attributes}`
    if (!seen.has(key)) {
      seen.add(key)
      representatives.push(object)
    }
  })
  return representatives
}

/**
 * Time budget for the program creation of one task (ms). Creating a program costs ~5–60 ms of JS
 * on the HD 530 box depending on the shader, so tasks are cut by time, not by count.
 */
export const COMPILE_TASK_MS = 25

/**
 * `renderer.compileAsync(scene, camera)` split into tasks: the scene's representative objects
 * (`drawableRepresentatives`), as many per task as fit in `COMPILE_TASK_MS`. Lights and
 * environment still come from `scene`.
 */
export async function compileInChunks(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  isCancelled: () => boolean,
): Promise<void> {
  const representatives = drawableRepresentatives(scene)
  const pending: Promise<unknown>[] = []
  let next = 0
  while (next < representatives.length) {
    if (isCancelled()) {
      return
    }
    const taskStart = performance.now()
    do {
      pending.push(renderer.compileAsync(representatives[next], camera, scene))
      next += 1
    } while (next < representatives.length && performance.now() - taskStart < COMPILE_TASK_MS)
    await yieldToMain()
  }
  await Promise.all(pending)
}

const MAP_KEYS = [
  'map',
  'emissiveMap',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'lightMap',
  'alphaMap',
  'bumpMap',
] as const

/** Uploads the scene's material maps before the first draw, in tasks of about 30 ms. */
export async function uploadTexturesInChunks(
  renderer: WebGLRenderer,
  scene: Scene,
  isCancelled: () => boolean,
): Promise<void> {
  const textures = new Set<Texture>()
  scene.traverse((object) => {
    if (!isMesh(object)) {
      return
    }
    const material: Material | Material[] = object.material
    for (const m of Array.isArray(material) ? material : [material]) {
      for (const key of MAP_KEYS) {
        const value: unknown = Reflect.get(m, key)
        if (isTexture(value)) {
          textures.add(value)
        }
      }
    }
  })
  let taskStart = performance.now()
  for (const texture of textures) {
    if (isCancelled()) {
      return
    }
    renderer.initTexture(texture)
    if (performance.now() - taskStart > TASK_BUDGET_MS) {
      await yieldToMain()
      taskStart = performance.now()
    }
  }
}
