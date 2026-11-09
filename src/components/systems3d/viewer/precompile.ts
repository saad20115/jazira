/**
 * Shader programs compiled off the main thread (`KHR_parallel_shader_compile`) before they are
 * first used. A program used before its link finishes blocks the main thread until it does (P3-T5
 * M4 profile on the HD 530: PMREM's GGX filter alone ~0.9 s).
 *
 * `renderer.compile` creates every program synchronously, so render state that changes the
 * program (render target, tone mapping) is set around that call and restored before any wait. The
 * links are then awaited here (`waitForLinks`), one program per check: each check is a
 * synchronous round trip to the GPU process.
 *
 * O-9: all of this runs before the visitor asks for the model (`createViewer`'s `whenShown`), in
 * idle slices, so a click finds the work done.
 */

import {
  BackSide,
  BoxGeometry,
  type BufferGeometry,
  type Camera,
  CompressedTexture,
  Line,
  type Material,
  Mesh,
  MeshBasicMaterial,
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
  type Vector3,
  Vector4,
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
  /** The six cube faces of `fromScene` into the output target. */
  _sceneToCubeUV: (
    scene: Scene,
    near: number,
    far: number,
    target: WebGLRenderTarget,
    position: Vector3,
  ) => void
  /** One GGX level of `fromScene` (`_applyPMREM` runs them in a row with autoClear off). */
  _applyGGXFilter: (target: WebGLRenderTarget, lodIn: number, lodOut: number) => void
  /** The solid background `_sceneToCubeUV` draws first; it creates it on first use. */
  _backgroundBox: Mesh | null
}

/** Exported for the unit test that pins these internals to three 0.186.1. */
export function hasPmremInternals(pmrem: PMREMGenerator): pmrem is PMREMGenerator & PmremInternals {
  return (
    ['_setSize', '_allocateTargets', '_sceneToCubeUV', '_applyGGXFilter'].every(
      (name) => typeof Reflect.get(pmrem, name) === 'function',
    ) &&
    Reflect.has(pmrem, '_ggxMaterial') &&
    Reflect.has(pmrem, '_backgroundBox') &&
    Array.isArray(Reflect.get(pmrem, '_lodMeshes'))
  )
}

/**
 * Creates the programs `object` draws with into `target` with tone mapping off (as PMREM renders),
 * lit by `scene` (`object` itself when null), synchronously, and returns them; they link in
 * parallel (`waitForLinks`).
 */
function compileOffscreenNow(
  renderer: WebGLRenderer,
  object: Object3D,
  camera: OrthographicCamera | PerspectiveCamera,
  target: WebGLRenderTarget,
  scene: Scene | null = null,
): unknown[] {
  const previousTarget = renderer.getRenderTarget()
  const previousToneMapping = renderer.toneMapping
  renderer.setRenderTarget(target)
  renderer.toneMapping = NoToneMapping
  try {
    return programsCompiled(renderer, renderer.compile(object, camera, scene))
  } finally {
    renderer.toneMapping = previousToneMapping
    renderer.setRenderTarget(previousTarget)
  }
}

/** Where and how far `fromScene` renders the studio from. */
export interface PmremBakeView {
  near: number
  far: number
  position: Vector3
}

/** The warm-up of `pmrem.fromScene(envScene, 0, …, { size })`, started before the model loads. */
export interface PmremWarmup {
  /**
   * A texture with the baked environment's mapping and size: programs compiled with it as the
   * environment are the ones the baked one uses (three keys them by mapping and size). Null without
   * the PMREM internals.
   */
  readonly standIn: Texture | null
  /**
   * Compiles the studio scene as the cube render draws it, then resolves once it and the GGX filter
   * are linked and used once, so the bake blocks on nothing.
   */
  compileStudio: (envScene: Scene, isCancelled: () => boolean, pause: Pause) => Promise<void>
  /**
   * `fromScene(envScene, 0, near, far, { size, position })` in steps (O-9: in one task it is a long
   * task on the HD 530): the six cube faces, then each GGX level, with `pause` in between and the
   * renderer's own target back between steps. Without the internals, `fromScene` in one go.
   */
  bake: (envScene: Scene, view: PmremBakeView, pause: Pause) => Promise<WebGLRenderTarget>
  dispose: () => void
}

/**
 * O-9: starts PMREM's GGX filter at once (the slowest program here: ~0.9 s of link on the HD 530),
 * so it links while the model downloads. It is compiled on the very mesh it draws with (a stand-in
 * geometry gives a different program cache key, and the bake then links its own copy). With sigma
 * 0 the blur filter is never used. Without the expected internals nothing is precompiled and
 * `fromScene` compiles as before.
 */
export function startPmremWarmup(
  renderer: WebGLRenderer,
  pmrem: PMREMGenerator,
  size: number,
  budget: LinkBudget = NO_LINK_BUDGET,
): PmremWarmup {
  if (!hasPmremInternals(pmrem)) {
    return {
      standIn: null,
      compileStudio: () => Promise.resolve(),
      bake: (envScene, view) =>
        Promise.resolve(
          pmrem.fromScene(envScene, 0, view.near, view.far, { size, position: view.position }),
        ),
      dispose: () => undefined,
    }
  }
  pmrem._setSize(size)
  // Creates the filter materials (kept for the bake at the same size) and a target of the cube
  // render's format and size; it is only compiled against, and lends its texture.
  const target = pmrem._allocateTargets()
  let targetDisposed = false
  const ggxPrograms: unknown[] = []
  const ggxMesh = pmrem._lodMeshes.at(-1)
  const ggxMaterial = pmrem._ggxMaterial
  if (ggxMesh && ggxMaterial) {
    // `_applyGGXFilter` assigns this same material to the mesh before each draw.
    ggxMesh.material = ggxMaterial
    ggxPrograms.push(...compileOffscreenNow(renderer, ggxMesh, new OrthographicCamera(), target))
  }
  // The background box exactly as  creates it, so its program links here too
  // instead of inside the bake.
  pmrem._backgroundBox ??= new Mesh(
    new BoxGeometry(),
    new MeshBasicMaterial({
      name: 'PMREM.Background',
      side: BackSide,
      depthWrite: false,
      depthTest: false,
    }),
  )
  ggxPrograms.push(
    ...compileOffscreenNow(
      renderer,
      pmrem._backgroundBox,
      new PerspectiveCamera(90, 1, 0.1, 100),
      target,
    ),
  )
  budget.track(ggxPrograms)
  startLinks(renderer)
  /** One bake step with the renderer's target and auto-clear as they were around it. */
  const step = (work: () => void): void => {
    const previousTarget = renderer.getRenderTarget()
    const autoClear = renderer.autoClear
    try {
      work()
    } finally {
      renderer.autoClear = autoClear
      renderer.setRenderTarget(previousTarget)
    }
  }
  return {
    standIn: target.texture,
    async compileStudio(envScene, isCancelled, pause) {
      const cubeCamera = new PerspectiveCamera(90, 1, 0.1, 100)
      const studioPrograms = await compileEach(
        drawableRepresentatives(envScene),
        (object) => compileOffscreenNow(renderer, object, cubeCamera, target, envScene),
        () => {
          startLinks(renderer)
        },
        isCancelled,
        pause,
        budget,
      )
      await waitForLinks([...ggxPrograms, ...studioPrograms], isCancelled)
      await warmPrograms(
        renderer,
        [...collectMaterials(envScene), ...(ggxMaterial ? [ggxMaterial] : [])],
        isCancelled,
        pause,
      )
    },
    async bake(envScene, view, pause) {
      pmrem._setSize(size)
      const output = pmrem._allocateTargets()
      output.depthBuffer = true
      try {
        step(() => {
          pmrem._sceneToCubeUV(envScene, view.near, view.far, output, view.position)
        })
        for (let lod = 1; lod < pmrem._lodMeshes.length; lod += 1) {
          await pause()
          step(() => {
            renderer.autoClear = false
            pmrem._applyGGXFilter(output, lod - 1, lod)
          })
        }
      } catch (err) {
        // A pause that ends the bake (the viewer was disposed) leaves no target behind.
        output.dispose()
        throw err
      }
      // What `fromScene`'s cleanup does to the output target.
      output.scissorTest = false
      output.viewport.set(0, 0, output.width, output.height)
      output.scissor.set(0, 0, output.width, output.height)
      return output
    },
    dispose() {
      if (!targetDisposed) {
        targetDisposed = true
        target.dispose()
      }
    },
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
function isTexture(value: unknown): value is Texture {
  return value instanceof Texture
}

/** One macrotask boundary: input and paint run between the chunks of the work below. */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

/** The wait between two chunks of work: `yieldToMain`, or an idle slice while nothing is shown. */
export type Pause = () => Promise<void>

/** Longest wait for the next frame (none come while the tab is hidden or the card is off screen). */
export const FRAME_WAIT_MAX_MS = 100

/**
 * O-9b: the next animation frame, at the latest after `FRAME_WAIT_MAX_MS`. Work done in slices with
 * this wait in between takes at most one slice per frame, so a flight on screen keeps its rate.
 */
export function yieldToFrame(maxWaitMs = FRAME_WAIT_MAX_MS): Promise<void> {
  return new Promise((resolve) => {
    const fallback = window.setTimeout(done, maxWaitMs)
    const frame = requestAnimationFrame(done)
    function done(): void {
      window.clearTimeout(fallback)
      cancelAnimationFrame(frame)
      resolve()
    }
  })
}

/** How often a fence is checked, and the longest wait for one (a lost context never signals). */
const FENCE_POLL_MS = 4
const FENCE_MAX_WAIT_MS = 2_000

/**
 * O-9: resolves once the GPU process has worked through every command issued so far (a fence; its
 * status is read without blocking). Work issued in chunks with this wait in between never queues
 * behind a backlog, so the synchronous calls a chunk makes (uniform lookups, a canvas resize) wait
 * only for that chunk, not for seconds of shader translation issued before it.
 */
export async function gpuSettled(gl: WebGL2RenderingContext): Promise<void> {
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
  if (!sync) {
    return
  }
  gl.flush()
  const start = performance.now()
  try {
    while (
      !gl.isContextLost() &&
      gl.getSyncParameter(sync, gl.SYNC_STATUS) !== gl.SIGNALED &&
      performance.now() - start < FENCE_MAX_WAIT_MS
    ) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, FENCE_POLL_MS)
      })
    }
  } finally {
    gl.deleteSync(sync)
  }
}

/** Longest wait for an idle slice before a chunk runs anyway (ms). */
const IDLE_TIMEOUT_MS = 1_000

/**
 * O-9: the next idle period (`requestIdleCallback`), so work prepared before the visitor asks for
 * the model never competes with scrolling, input or the page's own frames.
 */
export function yieldToIdle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(
        () => {
          resolve()
        },
        { timeout: IDLE_TIMEOUT_MS },
      )
    } else {
      window.setTimeout(resolve, 0)
    }
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
  pause: Pause = yieldToMain,
): Promise<void> {
  const programs: unknown[] = []
  for (const material of materials) {
    programs.push(...programsOf(renderer, material))
  }
  await firstUse(programs, isCancelled, pause)
}

/**
 * The first use of these programs (`warmPrograms`). O-9: it waits for their links first; a program
 * still linking (another warm-up may have just created it) would block the main thread here.
 */
export async function firstUse(
  list: Iterable<unknown>,
  isCancelled: () => boolean,
  pause: Pause = yieldToMain,
): Promise<void> {
  const programs = new Set<object>()
  for (const program of list) {
    if (typeof program === 'object' && program !== null) {
      programs.add(program)
    }
  }
  await waitForLinks(programs, isCancelled)
  let taskStart = performance.now()
  for (const program of programs) {
    if (isCancelled()) {
      return
    }
    const getUniforms: unknown = Reflect.get(program, 'getUniforms')
    if (typeof getUniforms === 'function') {
      Reflect.apply(getUniforms, program, [])
    }
    if (performance.now() - taskStart > TASK_BUDGET_MS) {
      await pause()
      taskStart = performance.now()
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

/** How often a link still running is checked (ms). */
const LINK_POLL_MS = 50

/**
 * O-14: the longest wait for links (ms). A link on a loaded machine can take seconds, and on a
 * context lost before the first frame `isReady()` never turns true; past this the work goes on (a
 * program still linking is then waited for by its first use, which the driver bounds).
 */
export const LINK_MAX_WAIT_MS = 4_000

/** three's `isReady()` of a program: KHR_parallel_shader_compile reports its link done. */
function isLinked(program: unknown): boolean {
  if (typeof program !== 'object' || program === null) {
    return true
  }
  // A program three has already released (`destroy()` clears `program`) links no more.
  if (Reflect.has(program, 'program') && Reflect.get(program, 'program') === undefined) {
    return true
  }
  const isReady: unknown = Reflect.get(program, 'isReady')
  return typeof isReady !== 'function' || Reflect.apply(isReady, program, []) === true
}

/**
 * O-9: waits until these programs are linked. Every check is a synchronous round trip to the GPU
 * process, so it asks about one program per poll (the first one not yet linked), where three's
 * `compileAsync` asks about every pending program of every call every 10 ms.
 */
export async function waitForLinks(
  programs: Iterable<unknown>,
  isCancelled: () => boolean,
  maxWaitMs = LINK_MAX_WAIT_MS,
): Promise<void> {
  const pending = [...new Set(programs)]
  const start = performance.now()
  while (pending.length > 0) {
    if (isCancelled() || performance.now() - start >= maxWaitMs) {
      return
    }
    while (pending.length > 0 && isLinked(pending[0])) {
      pending.shift()
    }
    if (pending.length > 0) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, LINK_POLL_MS)
      })
    }
  }
}

/**
 * How many new programs may link at once: the hero's and the studio's, whether prepared unseen or
 * while the visitor waits for the first frame (O-9a: with 3 while waiting, a click right after the
 * scroll waited for every hero link at half the rate, with cores idle: P3-T5 r8 trace); the
 * systems' (prepared after the hero, and on demand once live, while the visitor watches: each link
 * takes a core the page's frames need).
 */
export const LINKS_HERO = 6
export const LINKS_SYSTEMS = 2

/**
 * O-12: new programs are created only while fewer than `limit()` are still linking. Each link is
 * D3D shader compiles on the GPU process's worker threads (up to ~2 s of CPU each on the HD 530
 * box); many at once leave the page's main thread without a core, and its tasks stall for hundreds
 * of ms inside plain WebGL calls (P3-T5 r6 trace: 291 ms of wall time, 16 ms of CPU, in
 * `shaderSource`). A program three reuses is counted once at most, and leaves the count at the next
 * check once linked.
 */
export interface LinkBudget {
  /** Resolves once a new program may be created (at once while there is room). */
  room: (isCancelled: () => boolean) => Promise<void>
  /** True while no new program may be created (no GPU round trip). */
  readonly full: boolean
  /** Records what a compile returned; the programs not seen before are counted until linked. */
  track: (programs: Iterable<unknown>) => void
}

export function createLinkBudget(limit: () => number, maxWaitMs = LINK_MAX_WAIT_MS): LinkBudget {
  const seen = new WeakSet()
  let linking: object[] = []
  const waitPoll = (): Promise<void> =>
    new Promise((resolve) => {
      window.setTimeout(resolve, LINK_POLL_MS)
    })
  /** One status check per program still counted (each is a synchronous round trip). */
  const prune = (): void => {
    linking = linking.filter((program) => !isLinked(program))
  }
  return {
    async room(isCancelled) {
      prune()
      const start = performance.now()
      while (linking.length >= limit() && !isCancelled()) {
        if (performance.now() - start >= maxWaitMs) {
          // O-14: links this slow are no longer counted (they go on in the GPU process).
          linking = []
          return
        }
        await waitPoll()
        prune()
      }
    },
    get full() {
      return linking.length >= limit()
    },
    track(programs) {
      for (const program of programs) {
        if (typeof program === 'object' && program !== null && !seen.has(program)) {
          seen.add(program)
          linking.push(program)
        }
      }
    },
  }
}

/** Unlimited: every program at once (the unit tests' stand-in; tracks nothing). */
export const NO_LINK_BUDGET: LinkBudget = {
  room: () => Promise.resolve(),
  full: false,
  track: () => undefined,
}

/**
 * O-9a: sends the commands issued so far to the GPU process, so the links of the programs just
 * created start now. WebGL only queues them in the page until something flushes the queue (a fence,
 * a status check, a presented frame), and a canvas outside the page presents nothing (P3-T5 r8
 * trace: PMREM's filter, the slowest link, started ~1 s after its program was created).
 */
export function startLinks(renderer: WebGLRenderer): void {
  renderer.getContext().flush()
}

/**
 * Creates the programs `object` draws with in `scene` (its lights and environment), synchronously,
 * and returns them; they link in parallel (`waitForLinks`).
 */
export function compileNow(
  renderer: WebGLRenderer,
  object: Object3D,
  camera: Camera,
  scene: Scene,
): unknown[] {
  return programsCompiled(renderer, renderer.compile(object, camera, scene))
}

/** The program three just chose for each material (`currentProgram`, three 0.186.1). */
function programsCompiled(renderer: WebGLRenderer, materials: Iterable<Material>): unknown[] {
  const programs: unknown[] = []
  for (const material of materials) {
    const properties = renderer.properties.get(material)
    const program: unknown =
      typeof properties === 'object' && properties !== null
        ? Reflect.get(properties, 'currentProgram')
        : undefined
    if (program !== undefined) {
      programs.push(program)
    }
  }
  return programs
}

/**
 * The program creation of `renderer.compile(scene, camera)` split into tasks: the scene's
 * representative objects (`drawableRepresentatives`), as many per task as fit in
 * `COMPILE_TASK_MS`, and only while `budget` has room (O-12). Lights and environment still come
 * from `scene`. Returns the programs, which link in parallel; the caller waits for them
 * (`waitForLinks`) when it needs them.
 */
export async function compileInChunks(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  isCancelled: () => boolean,
  pause: Pause = yieldToMain,
  budget: LinkBudget = NO_LINK_BUDGET,
): Promise<unknown[]> {
  return compileEach(
    drawableRepresentatives(scene),
    (object) => compileNow(renderer, object, camera, scene),
    () => {
      startLinks(renderer)
    },
    isCancelled,
    pause,
    budget,
  )
}

/**
 * `compile` for each object, as many per task as fit in `COMPILE_TASK_MS` while `budget` has room,
 * then `flush` (their links start); between tasks `pause`, and the wait for room. Returns the
 * programs.
 */
async function compileEach(
  objects: readonly Object3D[],
  compile: (object: Object3D) => unknown[],
  flush: () => void,
  isCancelled: () => boolean,
  pause: Pause,
  budget: LinkBudget,
): Promise<unknown[]> {
  const programs: unknown[] = []
  let next = 0
  while (next < objects.length) {
    // The pause first: once there is room, the next programs are created in that same task.
    await pause()
    await budget.room(isCancelled)
    if (isCancelled()) {
      break
    }
    const taskStart = performance.now()
    do {
      const created = compile(objects[next])
      budget.track(created)
      programs.push(...created)
      next += 1
    } while (
      next < objects.length &&
      !budget.full &&
      performance.now() - taskStart < COMPILE_TASK_MS
    )
    flush()
  }
  return programs
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

/** Uploads the scene's material maps before the first draw (`uploadMaterialTextures`). */
export async function uploadTexturesInChunks(
  renderer: WebGLRenderer,
  scene: Scene,
  isCancelled: () => boolean,
  pause: Pause = yieldToMain,
): Promise<void> {
  await uploadMaterialTextures(renderer, collectMaterials(scene), isCancelled, pause)
}

/** Whether three has this version of the texture on the GPU (`__version`, three 0.186.1). */
function isUploaded(renderer: WebGLRenderer, texture: Texture): boolean {
  const properties = renderer.properties.get(texture)
  return (
    typeof properties === 'object' &&
    properties !== null &&
    Reflect.get(properties, '__version') === texture.version
  )
}

/**
 * Uploads these materials' maps ahead of the draw that needs them, with `pause` before each one (O-9:
 * a GPU fence, so an upload never waits behind other GPU work; also the variant materials' maps
 * before a system is entered). Uploaded ones are skipped.
 */
export async function uploadMaterialTextures(
  renderer: WebGLRenderer,
  materials: Iterable<Material>,
  isCancelled: () => boolean,
  pause: Pause = yieldToMain,
): Promise<void> {
  const textures = new Set<Texture>()
  for (const material of materials) {
    for (const key of MAP_KEYS) {
      const value: unknown = Reflect.get(material, key)
      if (isTexture(value) && !isUploaded(renderer, value)) {
        textures.add(value)
      }
    }
  }
  for (const texture of textures) {
    await pause()
    if (isCancelled()) {
      return
    }
    renderer.initTexture(texture)
    // O-9: the transcoded mip levels (tens of MB in all) are on the GPU now; kept in the page they
    // only bring on long garbage collections. Nothing uploads these textures again.
    if (texture instanceof CompressedTexture && isUploaded(renderer, texture)) {
      texture.mipmaps = []
    }
  }
}

/** Vertex and index data uploaded per task ahead of the first frame (bytes). */
const GEOMETRY_TASK_BYTES = 4 * 1024 * 1024

function geometryBytes(geometry: BufferGeometry): number {
  let bytes = geometry.index?.array.byteLength ?? 0
  for (const attribute of Object.values(geometry.attributes)) {
    bytes += attribute.array.byteLength
  }
  return bytes
}

/**
 * O-12: the vertex and index buffers three uploads on an object's first draw, ahead of the first
 * frame, a few MB per task: each group is drawn once into a 1×1 viewport with everything else
 * hidden, and `pause` (a GPU fence) comes between groups. In one draw the whole model's buffers
 * held the main thread for ~360 ms on the HD 530 box while shaders compiled. Every program these
 * draws use must already be linked (a draw waits for its link).
 */
export async function uploadGeometryInChunks(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  isCancelled: () => boolean,
  pause: Pause = yieldToMain,
): Promise<void> {
  const groups: Object3D[][] = []
  const seen = new Set<BufferGeometry>()
  let group: Object3D[] = []
  let groupBytes = 0
  scene.traverse((object) => {
    if (!isDrawable(object) || object instanceof Sprite) {
      return
    }
    group.push(object)
    if (!seen.has(object.geometry)) {
      seen.add(object.geometry)
      groupBytes += geometryBytes(object.geometry)
    }
    if (groupBytes >= GEOMETRY_TASK_BYTES) {
      groups.push(group)
      group = []
      groupBytes = 0
    }
  })
  if (group.length > 0) {
    groups.push(group)
  }
  const viewport = renderer.getViewport(new Vector4())
  const drawables: Object3D[] = []
  scene.traverse((object) => {
    if (isDrawable(object)) {
      drawables.push(object)
    }
  })
  for (const members of groups) {
    await pause()
    if (isCancelled()) {
      return
    }
    const inGroup = new Set(members)
    // Objects and ancestors changed for this one draw, with what they were.
    const visibility = new Map<Object3D, boolean>()
    const culling = new Map<Object3D, boolean>()
    for (const object of drawables) {
      if (!inGroup.has(object) && object.visible) {
        visibility.set(object, true)
        object.visible = false
      }
    }
    for (const object of members) {
      culling.set(object, object.frustumCulled)
      object.frustumCulled = false
      let node: Object3D | null = object
      while (node && node !== scene) {
        if (!node.visible && !visibility.has(node)) {
          visibility.set(node, false)
          node.visible = true
        }
        node = node.parent
      }
    }
    try {
      renderer.setViewport(0, 0, 1, 1)
      renderer.render(scene, camera)
    } finally {
      renderer.setViewport(viewport)
      for (const [object, visible] of visibility) {
        object.visible = visible
      }
      for (const [object, frustumCulled] of culling) {
        object.frustumCulled = frustumCulled
      }
    }
  }
}

/**
 * O-9: the bounding spheres three computes on the first frustum test of each geometry (up to ~200
 * ms for the room on the HD 530 while shaders compile), ahead of the first draw, one geometry at a
 * time within the task budget.
 */
export async function computeBoundsInChunks(
  roots: readonly Object3D[],
  isCancelled: () => boolean,
  pause: Pause = yieldToMain,
): Promise<void> {
  const geometries = new Set<BufferGeometry>()
  for (const root of roots) {
    root.traverse((object) => {
      if (isDrawable(object) && !(object instanceof Sprite) && !object.geometry.boundingSphere) {
        geometries.add(object.geometry)
      }
    })
  }
  let taskStart = performance.now()
  for (const geometry of geometries) {
    if (isCancelled()) {
      return
    }
    geometry.computeBoundingSphere()
    if (performance.now() - taskStart > TASK_BUDGET_MS) {
      await pause()
      taskStart = performance.now()
    }
  }
}
