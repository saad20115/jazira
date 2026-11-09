/**
 * The live 3D tower (`handoff/tasks/P3-T5.md`), loaded on intent through a dynamic `import()` so
 * three.js is never in the initial bundle. It renders the pinned release under the live render
 * contract (`renderContract.ts`), starting exactly at CAM_hero with the still's cover crop.
 *
 * Adapted from the 3D lead's reference viewer (`viewer-test/index.html`, three 0.186.1); every value
 * comes from the validated GLB extras (`contract.ts`). Any failure rejects, and the caller keeps the
 * still (stills tier).
 */

import {
  AgXToneMapping,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  FileLoader,
  Float32BufferAttribute,
  HalfFloatType,
  HemisphereLight,
  InterleavedBufferAttribute,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Material,
  type Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Quaternion,
  Scene,
  ShaderChunk,
  Spherical,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  type WebGLProgramParametersWithUniforms,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { type GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

import {
  ContractError,
  type NightGlowExtras,
  SYSTEM_IDS,
  type SystemId,
  type ValidatedExtras,
  validateExtras,
} from '../contract'
import { advanceTurntable, coverViewOffset, turntableMayTurn } from '../motion'
import { atZoomOutLimit, WHEEL_EXIT_START, wheelDeltaPx, wheelExitStep } from '../wheelExit'
import {
  FPS_WINDOW,
  fpsVerdict,
  isSoftwareRenderer,
  PROBE_FRAMES,
  probeVerdict,
  warmupSample,
} from '../tier'
import {
  AGX_LOOK,
  BASIS_TRANSCODER_PATH,
  BLOOM,
  CAMERA_FAR,
  CAMERA_NEAR,
  COMPOSER_MSAA_SAMPLES,
  CORE_MATERIALS,
  FACADE_ANISOTROPY,
  FACADE_MATERIALS,
  INTERIOR,
  INTERIOR_MATERIALS,
  KTX2_WORKER_CSP,
  KTX2_WORKER_URL,
  type LiteGroundTint,
  type LiveLook,
  MODEL_FILES,
  type ModelTier,
  PMREM,
} from '../renderContract'
import { type ViewerFailure, ViewerStartError } from './failure'
import { inlineBasisuPlugin } from './inlineBasisuPlugin'
import {
  compileInChunks,
  COMPILE_TASK_MS,
  compileNow,
  computeBoundsInChunks,
  createLinkBudget,
  firstUse,
  gpuSettled,
  LINKS_HERO,
  LINKS_SYSTEMS,
  type Pause,
  startLinks,
  startPmremWarmup,
  uploadGeometryInChunks,
  uploadMaterialTextures,
  uploadTexturesInChunks,
  waitForLinks,
  warmPrograms,
  yieldToFrame,
  yieldToIdle,
  yieldToMain,
} from './precompile'
import { createSystemStage, type ProjectedLabel } from './systemStage'
import { UrlWorkerKTX2Loader } from './UrlWorkerKTX2Loader'

export type { ViewerFailure } from './failure'

export interface ViewerOptions {
  canvas: HTMLCanvasElement
  /** The element whose box the canvas fills (the card). */
  container: HTMLElement
  /** Picks the model once the WebGL renderer string is known (`tier.ts` chooseModelTier). */
  selectTier: (gpuRenderer: string | null) => ModelTier
  /** Bloom is allowed only on the full model, and only when the release asks for it. */
  allowBloom: boolean
  pixelRatioCap: number
  /** Frame cap (phones: 30); 0 = the display rate. */
  maxFps: number
  reducedMotion: boolean
  /** The live look (`LIVE_LOOK`, owner review O-5). */
  look: LiveLook
  /** C3-2 ground tint, applied to the lite model only (`LITE_GROUND_TINT`). */
  groundTint: LiteGroundTint
  /** Aborting disposes the viewer, also while the model is still loading. */
  signal: AbortSignal
  /**
   * O-9: resolves when the visitor asks for the model. Until then the viewer only prepares (in idle
   * slices, into a canvas that is not in the page) and draws nothing anyone sees.
   */
  whenShown: Promise<void>
  /** Called once the live canvas holds a rendered, presented frame (never before `whenShown`). */
  onFirstFrame: () => void
  /** Called on a failure after the first frame (the caller falls back to the stills tier). */
  onFailure: (reason: ViewerFailure) => void
  /**
   * Called once when the run-time FPS check drops to the low tier (§8b). O-9: only while the card is
   * off screen or the tab hidden, so the tier never changes in view.
   */
  onLowTier?: () => void
  /** Projected hotspot labels of the entered system after each frame (null when none). */
  onLabels?: (labels: ProjectedLabel[] | null) => void
  /** O-18: the visitor zoomed out past the entered system's limit with the wheel (exit it). */
  onWheelExit?: () => void
  /**
   * O-12: the system the card has entered (null = overview), read while the systems' programs are
   * prepared: that one comes first, so its flight finds them ready.
   */
  enteredSystem?: () => SystemId | null
}

export interface ViewerStats {
  tier: ModelTier
  gpu: string | null
  bloom: boolean
  lowTier: boolean
  pixelRatio: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
}

export interface ViewerHandle {
  /** Active = the visitor clicked, tapped or focused the card: drag and zoom go to the camera. */
  setActive: (active: boolean) => void
  /** Enter a system (camera flight) or go back to the overview (null). */
  setSystem: (system: SystemId | null) => void
  resetView: () => void
  /** Multiplies the camera distance (within the current orbit limits). */
  zoomBy: (factor: number) => void
  /** Orbits by these angles in radians (within the current polar limits). */
  rotateBy: (azimuth: number, polar: number) => void
  stats: () => ViewerStats
  dispose: () => void
}

const LOOK_TARGET = 'color = agxDefaultContrastApprox( color );'
let lookPatched = false

/** Blender's "Medium High Contrast" AgX look, applied right before three's AgX sigmoid (once). */
function patchAgxLook(): void {
  if (lookPatched) {
    return
  }
  const source = ShaderChunk.tonemapping_pars_fragment
  if (!source.includes(LOOK_TARGET)) {
    throw new ContractError('three AgX shader: look patch target not found')
  }
  const pivot = AGX_LOOK.pivot.toFixed(4)
  const contrast = AGX_LOOK.contrast.toFixed(4)
  ShaderChunk.tonemapping_pars_fragment = source.replace(
    LOOK_TARGET,
    `color = ( color - ${pivot} ) * ${contrast} + ${pivot};\n\t${LOOK_TARGET}`,
  )
  lookPatched = true
}

/** Interior mapping on the curtain-wall glass (full model only; `render.interior_mapping`). */
const INTERIOR_GLSL = /* glsl */ `
#ifdef USE_EMISSIVEMAP
  vec2 imUv = vEmissiveMapUv, imDx = dFdx(imUv), imDy = dFdy(imUv);
  vec3 imP = -vViewPosition, imPx = dFdx(imP), imPy = dFdy(imP);
  vec2 imG = imUv * vec2(${INTERIOR.grid[0].toFixed(1)}, ${INTERIOR.grid[1].toFixed(1)}), imCell = floor(imG), imF = imG - imCell;
  float imDet = imDx.x * imDy.y - imDx.y * imDy.x;
  vec4 emissiveColor;
  if (gl_FrontFacing && imF.y > ${INTERIOR.windowBand[0].toFixed(2)} && imF.y < ${INTERIOR.windowBand[1].toFixed(2)} && abs(imDet) > 1e-14) {
    vec3 imTu = (imPx * imDy.y - imPy * imDx.y) / imDet;
    vec3 imTv = (imPy * imDx.x - imPx * imDy.x) / imDet;
    vec3 imR = normalize(imP), imN = normalize(cross(imTu, imTv));
    if (dot(imN, imR) < 0.0) imN = -imN;
    float rx = dot(imR, normalize(imTu)), ry = -dot(imR, normalize(imTv)), rz = max(dot(imR, imN), 0.05);
    float y0 = (1.0 - (imF.y - 0.12) / 0.62) * 2.23;
    float tb = imDepth / rz;
    float ty = ry > 1e-4 ? (2.23 - y0) / ry : (ry < -1e-4 ? (-0.75 - y0) / ry : 1e9);
    float t = min(tb, ty), zh = rz * t, yh = y0 + ry * t, yp, k = 1.0;
    if (ty < tb && ry > 0.0) yp = 0.24 * zh / imDepth;
    else if (ty < tb) yp = 0.86 + 0.13 * (1.0 - zh / imDepth);
    else { yp = yh > 0.0 ? 0.24 + 0.48 * (2.23 - yh) / 2.23 : 0.72 + 0.27 * clamp(-yh / 0.75, 0.0, 1.0); k = 0.85; }
    float u2 = imUv.x + rx * t / 76.8, fx = fract(u2 * 64.0);
    if (fx < 0.05) u2 += (0.05 - fx) / 64.0;
    vec2 uv2 = vec2(u2, (imCell.y + 0.12 + clamp(yp, 0.005, 0.995) * 0.62) / 24.0);
    emissiveColor = textureGrad(emissiveMap, uv2, imDx, imDy);
    emissiveColor.rgb *= k;
  } else emissiveColor = texture2D(emissiveMap, imUv);
  totalEmissiveRadiance *= emissiveColor.rgb;
#endif
`

function addInteriorMapping(material: MeshStandardMaterial): void {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.imDepth = { value: INTERIOR.depthM }
    shader.fragmentShader =
      `uniform float imDepth;\n` +
      shader.fragmentShader.replace('#include <emissivemap_fragment>', INTERIOR_GLSL)
  }
  material.customProgramCacheKey = () => 'aljazira-interior-v022n'
  material.needsUpdate = true
}

const SHEEN_TARGET = '#include <aomap_fragment>'

/**
 * O-15: a warm sheen on the faces turned toward the key light (`LiveLook.keySheen`), in view space
 * (`direction` is kept current by the caller). Added after any patch the material already has.
 */
function addKeySheen(
  material: MeshStandardMaterial,
  direction: { value: Vector3 },
  level: { value: Color },
  sharpness: number,
): void {
  const previous = material.onBeforeCompile.bind(material)
  const previousKey = material.customProgramCacheKey()
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
    previous(shader, renderer)
    if (!shader.fragmentShader.includes(SHEEN_TARGET)) {
      throw new ContractError('three standard shader: key sheen target not found')
    }
    shader.uniforms.uKeySheenDir = direction
    shader.uniforms.uKeySheen = level
    shader.fragmentShader =
      'uniform vec3 uKeySheenDir;\nuniform vec3 uKeySheen;\n' +
      shader.fragmentShader.replace(
        SHEEN_TARGET,
        `totalEmissiveRadiance += uKeySheen * pow(max(dot(normal, uKeySheenDir), 0.0), ${sharpness.toFixed(2)});\n${SHEEN_TARGET}`,
      )
  }
  material.customProgramCacheKey = () => `${previousKey}-aljazira-key-sheen-${sharpness.toFixed(2)}`
  material.needsUpdate = true
}

/**
 * V-4: the room floor's inner disc (around the plinth) is lit flat in live and ends in a hard pale
 * ellipse at its edge. Its emissive is eased from 1 at the plinth edge to `edgeLevel` at the disc
 * edge, on floor fragments inside the disc only. Radii and height come from the geometry.
 *
 * O-13: the room is no longer the backdrop. Its floor fades out between `fade` plinth radii into the
 * card's dusk sky behind the transparent canvas, and its walls are not drawn.
 */
interface FloorDisc {
  centreX: number
  centreZ: number
  floorY: number
  plinthRadius: number
  discRadius: number
}

function addRoomGround(
  material: MeshStandardMaterial,
  disc: FloorDisc,
  edgeLevel: number,
  fade: readonly [number, number],
): void {
  material.transparent = true
  material.depthWrite = false
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uDiscCentre = { value: new Vector2(disc.centreX, disc.centreZ) }
    shader.uniforms.uDiscFloorY = { value: disc.floorY }
    shader.uniforms.uDiscInner = { value: disc.plinthRadius }
    shader.uniforms.uDiscOuter = { value: disc.discRadius }
    shader.uniforms.uDiscEdgeLevel = { value: edgeLevel }
    shader.uniforms.uGroundFade = {
      value: new Vector2(fade[0] * disc.plinthRadius, fade[1] * disc.plinthRadius),
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDiscWorld;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvDiscWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        [
          '#include <common>',
          'varying vec3 vDiscWorld;',
          'uniform vec2 uDiscCentre;',
          'uniform float uDiscFloorY, uDiscInner, uDiscOuter, uDiscEdgeLevel;',
          'uniform vec2 uGroundFade;',
        ].join('\n'),
      )
      .replace(
        '#include <emissivemap_fragment>',
        [
          '#include <emissivemap_fragment>',
          'float discR = length(vDiscWorld.xz - uDiscCentre);',
          'float discMask = (1.0 - step(uDiscFloorY + 0.5, vDiscWorld.y)) * (1.0 - step(uDiscOuter, discR));',
          'totalEmissiveRadiance *= mix(1.0, uDiscEdgeLevel, smoothstep(uDiscInner, uDiscOuter, discR) * discMask);',
          // The outer floor's first texels past the seam carry the inner disc's light: ease them too.
          'float seamMask = (1.0 - step(uDiscFloorY + 0.5, vDiscWorld.y)) * step(uDiscOuter, discR);',
          'totalEmissiveRadiance *= mix(1.0, 0.85, (1.0 - smoothstep(uDiscOuter, uDiscOuter + 2.0, discR)) * seamMask);',
          // O-13: the floor fades into the sky; the walls (above the floor) are not drawn.
          'diffuseColor.a *= (1.0 - step(uDiscFloorY + 0.5, vDiscWorld.y)) * (1.0 - smoothstep(uGroundFade.x, uGroundFade.y, discR));',
          'if (diffuseColor.a < 0.002) discard;',
        ].join('\n'),
      )
  }
  material.customProgramCacheKey = () =>
    `aljazira-room-ground-${edgeLevel.toFixed(3)}-${fade[0].toFixed(3)}-${fade[1].toFixed(3)}`
  material.needsUpdate = true
}

/** Measures the floor disc: the plinth radius and the room floor's vertex ring just outside it. */
/** World-space vertex positions of every mesh under `root`. */
function worldVertices(root: Object3D): Vector3[] {
  const out: Vector3[] = []
  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return
    }
    const geometry: unknown = object.geometry
    if (!(geometry instanceof BufferGeometry)) {
      return
    }
    const pos: unknown = geometry.getAttribute('position')
    // Quantized GLB positions load as InterleavedBufferAttribute (stride 8 for int16 x 3).
    if (!(pos instanceof BufferAttribute) && !(pos instanceof InterleavedBufferAttribute)) {
      return
    }
    for (let i = 0; i < pos.count; i += 1) {
      out.push(new Vector3().fromBufferAttribute(pos, i).applyMatrix4(object.matrixWorld))
    }
  })
  return out
}

function measureFloorDisc(room: Object3D, plinth: Object3D): FloorDisc | null {
  const centre = plinth.getWorldPosition(new Vector3())
  const radius = (v: Vector3): number => Math.hypot(v.x - centre.x, v.z - centre.z)
  const plinthRadius = worldVertices(plinth).reduce((max, v) => Math.max(max, radius(v)), 0)
  const roomVertices = worldVertices(room)
  const floorY = roomVertices.reduce((min, v) => Math.min(min, v.y), Infinity)
  const radii = roomVertices.filter((v) => v.y < floorY + 0.5).map(radius)
  // The smallest ring of floor vertices beyond the plinth is the edge of the inner disc.
  const discRadius = radii
    .filter((r) => r > plinthRadius + 1)
    .reduce((a, b) => Math.min(a, b), Infinity)
  if (!Number.isFinite(discRadius) || plinthRadius <= 0 || discRadius > plinthRadius * 2) {
    return null
  }
  return { centreX: centre.x, centreZ: centre.z, floorY, plinthRadius, discRadius }
}

/** BLEND materials that only fade while a system is entered are drawn opaque at rest. */
function setOpaque(material: MeshStandardMaterial): void {
  if (material.transparent) {
    material.needsUpdate = true
  }
  material.transparent = false
  material.opacity = 1
  material.depthWrite = true
}

function nightGlowShell(glow: NightGlowExtras): Mesh {
  const geometry = new SphereGeometry(glow.radius, 64, 32)
  const positions = geometry.getAttribute('position')
  const colors: number[] = []
  for (let i = 0; i < positions.count; i += 1) {
    const y = positions.getY(i) + glow.centre[1]
    const t = Math.min(1, Math.max(0, (y - glow.heightFrom) / (glow.heightTo - glow.heightFrom)))
    const f = glow.gain * (glow.min + (1 - glow.min) * t)
    colors.push(glow.color[0] * f, glow.color[1] * f, glow.color[2] * f)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const shell = new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, side: BackSide }))
  shell.position.set(glow.centre[0], glow.centre[1], glow.centre[2])
  return shell
}

function worldPosition(node: Object3D): Vector3 {
  return node.getWorldPosition(new Vector3())
}

function findCamera(node: Object3D): PerspectiveCamera {
  if (node instanceof PerspectiveCamera) {
    return node
  }
  const child = node.children.find((c): c is PerspectiveCamera => c instanceof PerspectiveCamera)
  if (!child) {
    throw new ContractError(`${node.name}: not a perspective camera`)
  }
  return child
}

/** `instanceof Mesh` narrows to `Mesh<any, any, any>`; this keeps the default generics. */
function isMesh(object: Object3D): object is Mesh {
  return object instanceof Mesh
}

/** Copies of a mesh's materials (they share the textures). */
function cloneMaterials(material: Material | Material[]): Material | Material[] {
  return Array.isArray(material) ? material.map((m) => m.clone()) : material.clone()
}

function disposeObject(root: Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return
    }
    ;(object.geometry as { dispose: () => void }).dispose()
    const materials: unknown[] = Array.isArray(object.material)
      ? object.material
      : [object.material]
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial) && !(material instanceof MeshBasicMaterial)) {
        continue
      }
      for (const value of Object.values(material)) {
        if (value instanceof Texture) {
          value.dispose()
        }
      }
      material.dispose()
    }
  })
}

/**
 * Once the GLB bytes are in, parsing and KTX2 transcoding get `TRANSCODE_WATCHDOG_MS`. A transcoder
 * worker that cannot start (e.g. its CSP lacks what H3b grants) never answers, so without this the
 * card would wait for the whole start timeout before falling back to the stills.
 */
const TRANSCODE_WATCHDOG_MS = 15_000

/** While a system is entered its look is on screen: the background warm-up waits this long. */
const WARMUP_BUSY_WAIT_MS = 250
/** O-12: once shown, the background warm-up waits this long after the first visible frame. */
const SWAP_SETTLE_MS = 1_000

/** The model file (the download is bounded by the card's start timeout). */
async function downloadModel(url: string): Promise<ArrayBuffer> {
  const fileLoader = new FileLoader()
  fileLoader.setResponseType('arraybuffer')
  const data = await fileLoader.loadAsync(url)
  if (!(data instanceof ArrayBuffer)) {
    throw new ContractError('model: not binary')
  }
  return data
}

/** Parse + transcode of the downloaded model, bounded by the watchdog. */
async function parseWithTranscodeWatchdog(
  loader: GLTFLoader,
  data: ArrayBuffer,
  url: string,
): Promise<GLTF> {
  let watchdog = 0
  const timeout = new Promise<never>((_resolve, reject) => {
    watchdog = window.setTimeout(() => {
      reject(new ContractError('model parse/transcode did not finish in time'))
    }, TRANSCODE_WATCHDOG_MS)
  })
  try {
    return await Promise.race([
      loader.parseAsync(data, url.slice(0, url.lastIndexOf('/') + 1)),
      timeout,
    ])
  } finally {
    window.clearTimeout(watchdog)
  }
}

/** The GPU name, unmasked where the browser allows it (used only for the tier decision). */
function readGpuRenderer(gl: WebGL2RenderingContext): string | null {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const value: unknown = gl.getParameter(
    debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER,
  )
  return typeof value === 'string' ? value : null
}

/**
 * The context three would create for these options (`WebGLRenderer`, three 0.186.1). O-13: with
 * alpha, so the card's dusk sky (the canvas's CSS background) shows behind the model.
 */
const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  depth: true,
  stencil: false,
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: 'high-performance',
  failIfMajorPerformanceCaveat: false,
}

/**
 * The extensions three, its KTX2 loader and this viewer ask for while they start (three 0.186.1).
 * Enabling one is a synchronous round trip to the GPU process; enabled once, later asks are answered
 * in the page.
 */
const START_EXTENSIONS = [
  'EXT_color_buffer_float',
  'WEBGL_clip_cull_distance',
  'OES_texture_float_linear',
  'EXT_color_buffer_half_float',
  'WEBGL_multisampled_render_to_texture',
  'WEBGL_render_shared_exponent',
  'EXT_texture_filter_anisotropic',
  'KHR_parallel_shader_compile',
  'WEBGL_debug_renderer_info',
  'WEBGL_compressed_texture_astc',
  'WEBGL_compressed_texture_etc1',
  'WEBGL_compressed_texture_etc',
  'WEBGL_compressed_texture_s3tc',
  'EXT_texture_compression_bptc',
  'WEBGL_compressed_texture_pvrtc',
  'WEBKIT_WEBGL_compressed_texture_pvrtc',
] as const

/**
 * O-12: the renderer starts in steps. Creating the context and enabling each extension wait for the
 * GPU process, which is busy every frame (P3-T5 r6 trace: ~250 ms in one task when three did it all
 * at once). Here the context is its own task (the import that brought this module in ends in the
 * task before), then each extension; three then finds them enabled.
 */
async function createContext(
  canvas: HTMLCanvasElement,
  pause: Pause,
): Promise<WebGL2RenderingContext> {
  await pause()
  await framesOnTime()
  let gl: WebGL2RenderingContext | null
  try {
    gl = canvas.getContext('webgl2', CONTEXT_ATTRIBUTES)
  } catch {
    gl = null
  }
  if (!gl) {
    throw new ViewerStartError('no-webgl', 'WebGL2 unavailable')
  }
  return gl
}

/** Frames closer than this mean the compositor and the GPU process keep up (no raster backlog). */
const ON_TIME_FRAME_MS = 25
const ON_TIME_FRAMES = 3
const ON_TIME_MAX_WAIT_MS = 1_000

/**
 * O-12: resolves once a few frames in a row came on time, at the latest after
 * `ON_TIME_MAX_WAIT_MS`. Creating the context makes synchronous calls to the GPU process; right
 * after a jump down the page it is still rasterising the new view, and they wait behind that
 * (P3-T5 r6 trace: ~200 ms in `getContext` for a click at once after the jump).
 */
function framesOnTime(): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now()
    let last = start
    let onTime = 0
    const fallback = window.setTimeout(resolve, ON_TIME_MAX_WAIT_MS)
    const step = (now: number): void => {
      onTime = now - last < ON_TIME_FRAME_MS ? onTime + 1 : 0
      last = now
      if (onTime >= ON_TIME_FRAMES || now - start > ON_TIME_MAX_WAIT_MS) {
        window.clearTimeout(fallback)
        resolve()
      } else {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  })
}

async function enableExtensions(
  gl: WebGL2RenderingContext,
  pause: Pause,
  isCancelled: () => boolean,
): Promise<void> {
  for (const name of START_EXTENSIONS) {
    if (isCancelled()) {
      return
    }
    await pause()
    gl.getExtension(name)
  }
  await pause()
}

/**
 * O-14: a context lost before the first frame answers no link, fence or frame again, so the start
 * would wait on it for ever. Losing it aborts the start (every wait checks the signal), and the start
 * rejects with `context-lost` at once, without waiting for the step in progress (a parse, say) to
 * notice. Once started, the viewer handles a loss itself.
 */
export async function createViewer(options: ViewerOptions): Promise<ViewerHandle> {
  const start = new AbortController()
  const abortStart = (): void => {
    start.abort()
  }
  if (options.signal.aborted) {
    start.abort()
  }
  options.signal.addEventListener('abort', abortStart, { once: true })
  let onLost = (_event: Event): void => undefined
  const lost = new Promise<never>((_resolve, reject) => {
    onLost = (event) => {
      event.preventDefault()
      start.abort()
      reject(new ViewerStartError('context-lost', 'WebGL context lost while starting'))
    }
  })
  options.canvas.addEventListener('webglcontextlost', onLost)
  const started = startViewer({ ...options, signal: start.signal })
  // After a loss the start ends on its own (it is aborted); its own error is not the reason.
  started.catch(() => undefined)
  try {
    return await Promise.race([started, lost])
  } finally {
    options.canvas.removeEventListener('webglcontextlost', onLost)
  }
}

async function startViewer(options: ViewerOptions): Promise<ViewerHandle> {
  const { canvas, container } = options
  patchAgxLook()

  /** O-9: idle slices until the visitor asks for the model, then plain task boundaries. */
  let shown = false
  void options.whenShown.then(() => {
    shown = true
  })
  const pace: Pause = () => (shown ? yieldToMain() : yieldToIdle())
  /** O-9b: once shown, a system's warm-up does one slice per frame (unseen, idle slices as before). */
  const nextFrameWhenShown = (): Promise<void> => (shown ? yieldToFrame() : Promise.resolve())
  const framePace: Pause = async () => {
    await pace()
    await nextFrameWhenShown()
  }
  /** O-12: the hero is ready; the systems' programs are being made. */
  let systemsWarming = false
  /** When the first visible frame was drawn. */
  let firstFrameAt: number | null = null

  // O-9a: the transcoder's policy check and binary download first (they need no renderer); its
  // workers start once the renderer says which formats it takes (`detectSupport`, `init` below).
  const ktx2 = new UrlWorkerKTX2Loader(KTX2_WORKER_URL, KTX2_WORKER_CSP)
  ktx2.setTranscoderPath(BASIS_TRANSCODER_PATH)
  void ktx2.fetchTranscoder()
  // Its workers end with the viewer, also when the start fails before the viewer holds it (the card
  // aborts a failed viewer once the failure shows, at the latest when it unmounts).
  options.signal.addEventListener(
    'abort',
    () => {
      ktx2.dispose()
    },
    { once: true },
  )

  const gl = await createContext(canvas, pace)
  await pace()
  const gpu = readGpuRenderer(gl)
  if (isSoftwareRenderer(gpu)) {
    throw new ViewerStartError('software', 'software WebGL renderer')
  }
  const tier = options.selectTier(gpu)
  // O-12: the model downloads while the renderer starts.
  const modelUrl = MODEL_FILES[tier]
  const modelData = downloadModel(modelUrl)
  modelData.catch(() => undefined)
  await enableExtensions(gl, pace, () => options.signal.aborted)
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({
      canvas,
      context: gl,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
  } catch {
    throw new ViewerStartError('no-webgl', 'WebGL context unavailable')
  }
  if (!renderer.capabilities.isWebGL2) {
    renderer.dispose()
    throw new ViewerStartError('no-webgl', 'WebGL2 unavailable')
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.pixelRatioCap))
  // O-9: no info-log reads on a program's first use. Each is a synchronous round trip that waits for
  // the GPU process (up to ~200 ms on the HD 530); a broken shader still renders nothing, as before.
  renderer.debug.checkShaderErrors = false
  renderer.toneMapping = AgXToneMapping
  renderer.outputColorSpace = SRGBColorSpace
  renderer.localClippingEnabled = true

  // O-12: three's own start-up above, the loaders and PMREM below, in separate tasks.
  await pace()
  if (options.signal.aborted) {
    renderer.dispose()
    throw new ContractError('aborted')
  }
  ktx2.detectSupport(renderer)
  const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder)
  loader.register(inlineBasisuPlugin(ktx2))
  // O-9a: the transcoding workers start now, while the model downloads (the parse waits for the
  // same promise and reports its failure).
  ktx2.init().catch(() => undefined)
  const pmrem = new PMREMGenerator(renderer)
  /** O-12: how many new programs link at once (`LINKS_*`: the hero's, the systems'). */
  const linkBudget = createLinkBudget(() => (systemsWarming ? LINKS_SYSTEMS : LINKS_HERO))
  // O-9: PMREM's slowest program links while the model downloads.
  const pmremWarmup = startPmremWarmup(renderer, pmrem, PMREM.size, linkBudget)
  const scene = new Scene()
  const disposables: { dispose: () => void }[] = [ktx2, pmremWarmup, pmrem]
  let disposed = false
  // Read through a function: `disposed` changes while this function awaits (abort, dispose).
  const isDisposed = (): boolean => disposed
  /** Between two texture uploads: the GPU has taken the last one, so the next never waits. */
  const uploadPause: Pause = () => gpuSettled(gl)

  const cleanup = (): void => {
    if (disposed) {
      return
    }
    disposed = true
    disposeObject(scene)
    for (const item of disposables) {
      item.dispose()
    }
    renderer.dispose()
  }

  options.signal.addEventListener('abort', cleanup, { once: true })

  let extras: ValidatedExtras
  let gltf: GLTF
  let nodes: Map<string, Object3D>
  try {
    const data = await modelData
    // O-12: the parse starts in a task of its own.
    await pace()
    gltf = await parseWithTranscodeWatchdog(loader, data, modelUrl)
    if (isDisposed()) {
      throw new ContractError('disposed while loading')
    }
    const root = gltf.scene
    nodes = new Map()
    const nodeExtras = new Map<string, unknown>()
    root.traverse((object) => {
      if (object.name && !nodes.has(object.name)) {
        nodes.set(object.name, object)
        nodeExtras.set(object.name, object.userData)
      }
    })
    extras = validateExtras(root.userData, nodeExtras)
    scene.add(root)
    root.updateMatrixWorld(true)
    // The parse ends in one task; the environment build starts in the next one.
    await pace()
    if (isDisposed()) {
      throw new ContractError('disposed after loading')
    }
  } catch (err) {
    cleanup()
    throw err
  }

  const node = (name: string): Object3D => {
    const found = nodes.get(name)
    if (!found) {
      throw new ContractError(`node ${name}: missing`)
    }
    return found
  }

  // Studio environment: PMREM of the lit room + env-only panels (+ the night glow shell). Its meshes
  // get their own copies of the materials, so the bake sees them as loaded whatever the live look
  // below does to the originals (O-9: the bake now comes after that setup).
  const { studio, cameraLimits, turntable } = extras.scene
  const envScene = new Scene()
  const envMaterials: Material[] = []
  for (const name of [studio.room, ...studio.envOnly]) {
    const source = node(name)
    const copy = source.clone()
    copy.matrixAutoUpdate = false
    copy.matrix.copy(source.matrixWorld)
    copy.visible = !(studio.nightGlow && name === studio.room)
    copy.traverse((object) => {
      if (isMesh(object)) {
        const own = cloneMaterials(object.material)
        object.material = own
        envMaterials.push(...(Array.isArray(own) ? own : [own]))
      }
    })
    envScene.add(copy)
  }
  let glowShell: Mesh | null = null
  if (studio.nightGlow) {
    glowShell = nightGlowShell(studio.nightGlow)
    envScene.add(glowShell)
  }
  // Linked in parallel with the hero's programs below; the bake waits for it.
  const studioReady = pmremWarmup.compileStudio(envScene, isDisposed, pace)
  studioReady.catch(() => undefined)
  // While those link: the bounding spheres the first frustum tests would compute (bake, hero frame).
  await computeBoundsInChunks([scene, envScene], isDisposed, pace)
  if (isDisposed()) {
    throw new ContractError('disposed while preparing')
  }
  /** The bake's steps end once the viewer is disposed (O-9a: it runs beside the hero's links). */
  const bakePause: Pause = async () => {
    await pace()
    if (isDisposed()) {
      throw new ContractError('disposed while baking')
    }
  }
  const bakeEnvironment = async (): Promise<WebGLRenderTarget> => {
    const target = await pmremWarmup.bake(
      envScene,
      { near: PMREM.near, far: PMREM.far, position: new Vector3(...studio.envPosition) },
      bakePause,
    )
    disposables.push(target)
    if (glowShell) {
      disposeObject(glowShell)
    }
    for (const material of envMaterials) {
      material.dispose()
    }
    return target
  }
  /** The baked environment, or until the bake its stand-in (same programs). */
  let environment: Texture
  let baked = false
  if (pmremWarmup.standIn) {
    environment = pmremWarmup.standIn
  } else {
    // Without the PMREM internals there is no stand-in: bake first, as before.
    try {
      await studioReady
      environment = (await bakeEnvironment()).texture
      baked = true
      await pace()
      if (isDisposed()) {
        throw new ContractError('disposed after the environment')
      }
    } catch (err) {
      cleanup()
      throw err
    }
  }
  scene.environment = environment
  scene.background = null
  // O-13: transparent (premultiplied, so black): the card's dusk sky is the backdrop.
  renderer.setClearColor(0x000000, 0)
  const { look } = options
  const baseExposure = 2 ** studio.exposureStops * look.exposureScale
  renderer.toneMappingExposure = baseExposure
  scene.environmentIntensity = look.envIntensity
  for (const name of studio.envOnly) {
    node(name).visible = false
  }
  if (studio.moon) {
    const { color, intensity, directionToLight } = studio.moon
    const moon = new DirectionalLight(new Color().setRGB(color[0], color[1], color[2]), intensity)
    moon.position.set(...directionToLight).multiplyScalar(1000)
    moon.target.position.set(0, 0, 0)
    scene.add(moon, moon.target)
  }
  // O-5: a warm key from beside the hero camera (gold pilasters, crown, plaza) and a sky/ground fill
  // (plaza and palms). Added before any program is compiled, so the light count never changes.
  const heroAt = node('CAM_hero').getWorldPosition(new Vector3())
  const azimuth = Math.atan2(heroAt.x, heroAt.z) + (look.key.azimuthDeg * Math.PI) / 180
  const elevation = (look.key.elevationDeg * Math.PI) / 180
  const key = new DirectionalLight(new Color().setRGB(...look.key.color), look.key.intensity)
  key.position
    .set(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.cos(azimuth) * Math.cos(elevation),
    )
    .multiplyScalar(1000)
  key.target.position.set(0, 0, 0)
  const fill = new HemisphereLight(
    new Color().setRGB(...look.fill.sky),
    new Color().setRGB(...look.fill.ground),
    look.fill.intensity,
  )
  scene.add(key, key.target, fill)

  // Materials at rest: façade and core opaque, system glow hidden, interior mapping on full.
  const materials = new Map<string, MeshStandardMaterial>()
  scene.traverse((object) => {
    if (object instanceof Mesh && object.material instanceof MeshStandardMaterial) {
      materials.set(object.material.name, object.material)
    }
  })
  for (const name of [...FACADE_MATERIALS, ...CORE_MATERIALS]) {
    const material = materials.get(name)
    if (material) {
      setOpaque(material)
    }
  }
  for (const [name, material] of materials) {
    material.emissiveIntensity *= look.materialEmissive[name] ?? look.emissiveScale
  }
  if (tier === 'lite') {
    const [pr, pg, pb] = options.groundTint.paving
    const paving = materials.get('MAT_paving')
    // The paving is lit both by its baked site light (emissive) and by the moon (base colour).
    paving?.emissive.multiply(new Color(pr, pg, pb))
    paving?.color.multiply(new Color(pr, pg, pb))
    const [vr, vg, vb] = options.groundTint.vegetation
    materials.get('MAT_vegetation')?.color.multiply(new Color(vr, vg, vb))
  }
  // V-3: palm fronds are alpha-tested; alpha-to-coverage uses the MSAA samples to soften them.
  const vegetation = materials.get('MAT_vegetation')
  if (vegetation) {
    vegetation.alphaToCoverage = true
    vegetation.needsUpdate = true
  }
  // O-13: the room floor and the plinth in the evening light. Their light is baked (emissive).
  materials.get('MAT_room')?.emissive.multiply(new Color(...look.floorTint))
  for (const name of ['MAT_plinth_top', 'MAT_plinth_side']) {
    materials.get(name)?.emissive.multiply(new Color(...look.plinthTint))
  }
  for (const [name, tint] of Object.entries(look.materialColor)) {
    materials.get(name)?.color.multiply(new Color(...tint))
  }
  const room = materials.get('MAT_room')
  const roomNode = node(studio.room)
  const disc = room ? measureFloorDisc(roomNode, node('MAQ_plinth')) : null
  if (room && disc) {
    addRoomGround(room, disc, look.floorEdgeLevel, look.groundFade)
    // First among the transparent meshes: the faded façade inside a system blends over the ground.
    roomNode.traverse((object) => {
      object.renderOrder = -1
    })
  } else {
    // Without a floor to fade, the room would hide the sky: it is not drawn.
    roomNode.visible = false
  }
  if (room) {
    // three ignores envMapIntensity on materials without their own envMap (it uses
    // scene.environmentIntensity), so the room gets the same PMREM texture explicitly.
    room.envMap = environment
    room.envMapIntensity = look.roomEnvIntensity
  }
  // The façade glass reflects the same environment, at its own intensity (lowered inside a system).
  for (const name of INTERIOR_MATERIALS) {
    const material = materials.get(name)
    if (material) {
      material.envMap = environment
      material.envMapIntensity = look.envIntensity
    }
  }
  // O-13: the few surfaces that reflect less of the studio at dusk (same texture, so same program).
  for (const [name, level] of Object.entries(look.materialEnv)) {
    const material = materials.get(name)
    if (material) {
      material.envMap = environment
      material.envMapIntensity = level
    }
  }
  // V-2: sharper window bands at DPR 2 (anisotropic filtering of the façade emissive maps).
  const anisotropy = Math.min(FACADE_ANISOTROPY, renderer.capabilities.getMaxAnisotropy())
  for (const name of FACADE_MATERIALS) {
    const map = materials.get(name)?.emissiveMap
    if (map) {
      map.anisotropy = anisotropy
      map.needsUpdate = true
    }
  }
  for (const id of SYSTEM_IDS) {
    const glow = materials.get(`MAT_${id}_glow`)
    if (glow) {
      glow.visible = false
    }
  }
  if (tier === 'full') {
    for (const name of INTERIOR_MATERIALS) {
      const material = materials.get(name)
      if (material) {
        addInteriorMapping(material)
      }
    }
  }
  // O-15: the warm sheen of the key on the façade (after the interior mapping, which it extends).
  const keyToLight = key.position.clone().normalize()
  const keySheenDirection = { value: new Vector3() }
  const keySheenFull = new Color()
    .setRGB(...look.keySheen.color)
    .multiplyScalar(look.keySheen.strength)
  const keySheenLevel = { value: keySheenFull.clone() }
  for (const name of look.keySheen.materials) {
    const material = materials.get(name)
    if (material) {
      addKeySheen(material, keySheenDirection, keySheenLevel, look.keySheen.sharpness)
    }
  }

  // O-12: the material set-up above, the camera and canvas below, each in its own task.
  await pace()
  if (isDisposed()) {
    throw new ContractError('disposed while preparing')
  }

  // Camera: CAM_hero's exact pose and FOV, square aspect, cover crop of the card + lens shift.
  const heroCamera = findCamera(node('CAM_hero'))
  const camera = new PerspectiveCamera(heroCamera.fov, 1, CAMERA_NEAR, CAMERA_FAR)
  heroCamera.getWorldPosition(camera.position)
  const heroQuaternion = heroCamera.getWorldQuaternion(new Quaternion())
  camera.quaternion.copy(heroQuaternion)

  let cssWidth = 1
  let cssHeight = 1
  let lensShift = cameraLimits.heroShiftY
  const applyViewOffset = (): void => {
    const view = coverViewOffset(cssWidth, cssHeight, lensShift)
    camera.aspect = 1
    camera.setViewOffset(
      view.fullWidth,
      view.fullHeight,
      view.offsetX,
      view.offsetY,
      view.width,
      view.height,
    )
    camera.updateProjectionMatrix()
  }

  const useBloom = options.allowBloom && tier === 'full' && studio.bloom
  let composer: EffectComposer | null = null
  if (useBloom) {
    const target = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType,
      samples: COMPOSER_MSAA_SAMPLES,
    })
    composer = new EffectComposer(renderer, target)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(
      new UnrealBloomPass(new Vector2(256, 256), BLOOM.strength, BLOOM.radius, BLOOM.threshold),
    )
    composer.addPass(new OutputPass())
    disposables.push(target, composer)
  }

  /** The size the drawing buffer has: assigning `canvas.width` reallocates it even when equal. */
  let bufferSize = ''
  const resize = (): void => {
    const box = container.getBoundingClientRect()
    cssWidth = Math.max(1, Math.round(box.width))
    cssHeight = Math.max(1, Math.round(box.height))
    const size = `${String(cssWidth)}x${String(cssHeight)}@${String(renderer.getPixelRatio())}`
    if (size !== bufferSize) {
      bufferSize = size
      renderer.setSize(cssWidth, cssHeight, false)
      if (composer) {
        composer.setPixelRatio(1)
        composer.setSize(canvas.width, canvas.height)
      }
    }
    applyViewOffset()
  }
  await pace()
  if (isDisposed()) {
    throw new ContractError('disposed while preparing')
  }
  resize()
  await pace()
  if (isDisposed()) {
    throw new ContractError('disposed while preparing')
  }

  let lowTier = false
  const draw = (): void => {
    // O-15: the sheen's key direction in view space, for this frame's camera.
    camera.updateMatrixWorld()
    keySheenDirection.value.copy(keyToLight).transformDirection(camera.matrixWorldInverse)
    if (composer && !lowTier) {
      composer.render()
    } else {
      renderer.render(scene, camera)
    }
  }

  // Orbit controls: off until the visitor activates the card (no scroll hijack).
  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(worldPosition(node('PIVOT_hero')))
  controls.enableDamping = true
  controls.enablePan = false
  controls.autoRotate = false
  controls.minDistance = cameraLimits.minDistance
  controls.maxDistance = cameraLimits.maxDistance
  controls.minPolarAngle = cameraLimits.minPolar
  controls.maxPolarAngle = cameraLimits.maxPolar
  controls.enabled = false
  controls.update()
  camera.quaternion.copy(heroQuaternion)
  canvas.style.setProperty('touch-action', 'pan-y pinch-zoom')

  // Turntable (idle only) and on-demand rendering.
  const turntableNode = node(turntable.root)
  const turntableBase = turntableNode.quaternion.clone()
  const yAxis = new Vector3(0, 1, 0)
  const spin = new Quaternion()
  let turntableAngle = 0
  let lastInputAt = performance.now()
  let onScreen = true
  let started = false
  let frameHandle = 0
  let wakeTimer = 0
  let lastFrameAt: number | null = null

  let active = false
  const setTurntableAngle = (angle: number): void => {
    turntableAngle = angle
    spin.setFromAxisAngle(yAxis, turntableAngle)
    turntableNode.quaternion.copy(turntableBase).multiply(spin)
  }
  /**
   * Inside a system (k = 1) the key, fill and exposure are raised and the façade glass glow is
   * lowered, eased with the façade fade. The stage has just set the glass glow for this k.
   */
  const applySystemLight = (k: number): void => {
    const lights = 1 + (look.systemLightScale - 1) * k
    key.intensity = look.key.intensity * lights
    fill.intensity = look.fill.intensity * lights
    // O-15: the façade's sheen fades out with the façade.
    keySheenLevel.value.copy(keySheenFull).multiplyScalar(1 - k)
    renderer.toneMappingExposure = baseExposure * (1 + (look.systemExposureScale - 1) * k)
    const glass = 1 + (look.systemGlassScale - 1) * k
    for (const name of INTERIOR_MATERIALS) {
      const material = materials.get(name)
      if (material) {
        material.emissiveIntensity *= glass
        material.envMapIntensity = look.envIntensity * glass
      }
    }
  }
  const stage = createSystemStage({
    gltf,
    nodes,
    materials,
    extras,
    camera,
    controls,
    heroQuaternion,
    setShift: (shiftY) => {
      lensShift = shiftY
      applyViewOffset()
    },
    turntable: { getAngle: () => turntableAngle, setAngle: setTurntableAngle },
    reducedMotion: options.reducedMotion,
    compileObjects: (objects) => {
      const programs = objects.flatMap((object) => compileNow(renderer, object, camera, scene))
      startLinks(renderer)
      linkBudget.track(programs)
      return waitForLinks(programs, isDisposed)
    },
    compileRoom: () => linkBudget.room(isDisposed),
    compileFull: () => linkBudget.full,
    compileTaskMs: () => (shown ? 0 : COMPILE_TASK_MS),
    // The entered look's programs, then its textures (the variants' maps reach the GPU here, not
    // in the first frames of the flight). O-9b: once shown, one slice per frame.
    warm: async (materials, system) => {
      await warmPrograms(renderer, materials, isDisposed, async () => {
        await framePace()
        await warmupTurn(system)
      })
      await uploadMaterialTextures(renderer, materials, isDisposed, async () => {
        await uploadPause()
        await nextFrameWhenShown()
        await warmupTurn(system)
      })
    },
    pause: async (system) => {
      await pace()
      await warmupTurn(system)
    },
    onEnterMix: applySystemLight,
  })
  let labelsShown = false

  const mayTurn = (now: number): boolean =>
    turntableMayTurn({
      reducedMotion: options.reducedMotion,
      tabVisible: document.visibilityState === 'visible',
      onScreen,
      systemEntered: stage.entered !== null,
      moving: stage.moving,
      sinceInputS: (now - lastInputAt) / 1000,
      resumeAfterS: turntable.resumeAfterS,
    })

  // Run-time tier check (§8b) on rAF intervals between consecutive animating frames: they show
  // whether the device keeps up, also when a frame cap skips drawing.
  let intervals: number[] = []
  let warmupSkippedMs = 0
  // `dt` is measured from the last drawn frame, so a frame cap never slows the animation down.
  let lastDrawAt: number | null = null
  const minFrameMs = options.maxFps > 0 ? 1000 / options.maxFps - 1 : 0
  /**
   * O-9: a drop to low waits until nobody can see it (card off screen or tab hidden): never during a
   * flight in view, never a visible jump. O-14b (CTO 2026-11-05): a drop from low to stills also
   * applies in view, at the next rest (`frame`); the card crossfades from the last frame.
   */
  let pendingDrop: 'low' | 'stills' | null = null
  /** O-14b: the visitor holds the view (a drag or a pinch in progress), so it is not at rest. */
  let holding = false
  const checkFps = (): void => {
    const verdict = fpsVerdict(intervals, lowTier)
    if (verdict === 'stills' || (verdict === 'low' && pendingDrop === null)) {
      pendingDrop = verdict
    }
    if (intervals.length > FPS_WINDOW * 2) {
      intervals = intervals.slice(-FPS_WINDOW)
    }
  }
  const applyPendingDrop = (): void => {
    const drop = pendingDrop
    pendingDrop = null
    if (drop === 'low' && !lowTier) {
      lowTier = true
      intervals = []
      renderer.setPixelRatio(1)
      resize()
      options.onLowTier?.()
    } else if (drop === 'stills') {
      fail('too-slow')
    }
  }

  const frame = (now: number): void => {
    frameHandle = 0
    // After a failure the card shows the stills (crossfading from the last frame): nothing to draw.
    if (disposed || failed) {
      return
    }
    // Shader warm-up tasks lengthen frames on any GPU: those intervals say nothing about its speed,
    // up to a capped blind window (`warmupSample`).
    if (lastFrameAt !== null) {
      const interval = now - lastFrameAt
      const warmup = warmupSample(warmupSkippedMs, stage.preparing, interval)
      warmupSkippedMs = warmup.skippedMs
      if (warmup.sample) {
        intervals.push(interval)
        checkFps()
      }
    }
    lastFrameAt = now
    if (minFrameMs > 0 && lastDrawAt !== null && now - lastDrawAt < minFrameMs) {
      frameHandle = requestAnimationFrame(frame)
      return
    }
    const dt = lastDrawAt === null ? 0 : Math.min((now - lastDrawAt) / 1000, 0.1)
    lastDrawAt = now
    let again = stage.step(now, dt)
    controls.enabled = active && !stage.moving
    if (controls.enabled && controls.update(dt)) {
      again = true
    }
    if (camera.position.y < cameraLimits.minCameraHeight) {
      camera.position.y = cameraLimits.minCameraHeight
      camera.lookAt(controls.target)
    }
    if (mayTurn(now)) {
      setTurntableAngle(advanceTurntable(turntableAngle, turntable.rpm, dt))
      again = true
    }
    try {
      draw()
    } catch {
      fail('render-error')
      return
    }
    const labels = stage.labels(cssWidth, cssHeight)
    if (labels || labelsShown) {
      options.onLabels?.(labels)
      labelsShown = labels !== null
    }
    // O-14b: too slow while low (§8b): at rest (no flight, nothing held) the stills tier takes over
    // in view too. No frame follows; the card crossfades from this one. Round 12: the camera standing
    // still while a system's warm-up runs (a slow device waits there longest) is rest too.
    if (pendingDrop === 'stills' && !stage.flying && !holding) {
      applyPendingDrop()
      return
    }
    if (again) {
      invalidate()
    } else {
      lastFrameAt = null
      lastDrawAt = null
      intervals = []
      scheduleWake()
    }
  }

  function invalidate(): void {
    // No frame before the first one is presented: an observer firing while the programs still
    // compile would render with them and block the main thread on the link (KHR_parallel).
    if (started && !disposed && onScreen && frameHandle === 0) {
      frameHandle = requestAnimationFrame(frame)
    }
  }

  /** Re-checks the idle turntable once the resume delay has passed (no frames meanwhile). */
  function scheduleWake(): void {
    window.clearTimeout(wakeTimer)
    if (options.reducedMotion || disposed) {
      return
    }
    const waitMs = Math.max(0, turntable.resumeAfterS * 1000 - (performance.now() - lastInputAt))
    wakeTimer = window.setTimeout(invalidate, waitMs + 16)
  }

  const onInput = (): void => {
    lastInputAt = performance.now()
    holding = true
    invalidate()
  }
  const onInputEnd = (): void => {
    holding = false
    // A stills drop waiting for rest applies on the next frame.
    invalidate()
  }
  controls.addEventListener('start', onInput)
  controls.addEventListener('end', onInputEnd)
  controls.addEventListener('change', invalidate)

  // O-18: a deliberate wheel-out at the system's zoom-out limit exits the system (`wheelExit.ts`).
  // In the capture phase, so the camera is read before the controls apply this event's zoom.
  let wheelExit = WHEEL_EXIT_START
  const onWheel = (event: WheelEvent): void => {
    const eligible =
      active &&
      controls.enabled &&
      controls.enableZoom &&
      stage.entered !== null &&
      !stage.moving &&
      stage.wanted === stage.entered
    const step = wheelExitStep(wheelExit, {
      time: event.timeStamp,
      deltaPx: wheelDeltaPx(event.deltaY, event.deltaMode, window.innerHeight),
      atLimit: atZoomOutLimit(camera.position.distanceTo(controls.target), controls.maxDistance),
      eligible,
    })
    wheelExit = step.state
    if (step.exit) {
      options.onWheelExit?.()
    }
  }
  canvas.addEventListener('wheel', onWheel, { capture: true, passive: true })

  const intersection = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting)
    if (onScreen) {
      invalidate()
    } else if (started) {
      applyPendingDrop()
    }
  })
  // The canvas joins the page only when shown (O-9): the card's box is the same.
  intersection.observe(container)
  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      invalidate()
    } else if (started) {
      applyPendingDrop()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  const resizeObserver = new ResizeObserver(() => {
    resize()
    invalidate()
  })
  resizeObserver.observe(container)

  let failed = false
  function fail(reason: ViewerFailure): void {
    if (failed) {
      return
    }
    failed = true
    options.onFailure(reason)
  }
  const onContextLost = (event: Event): void => {
    event.preventDefault()
    fail('context-lost')
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  const dispose = (): void => {
    if (isDisposed()) {
      return
    }
    options.signal.removeEventListener('abort', dispose)
    cancelAnimationFrame(frameHandle)
    window.clearTimeout(wakeTimer)
    intersection.disconnect()
    resizeObserver.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    canvas.removeEventListener('wheel', onWheel, { capture: true })
    controls.dispose()
    cleanup()
  }

  options.signal.removeEventListener('abort', cleanup)
  options.signal.addEventListener('abort', dispose, { once: true })

  /**
   * O-9: GPU time of one hero frame at the size it will show: drawn, then a one-pixel read waits for
   * the GPU to finish it. Each frame is its own task, after the GPU has finished everything before
   * it, so the read never waits for other work.
   */
  const pixel = new Uint8Array(4)
  const probeFrames = async (): Promise<number[]> => {
    // One untimed frame first, waited for without blocking: it pays the first-use costs on the GPU.
    await pace()
    draw()
    const frameMs: number[] = []
    for (let i = 0; i < PROBE_FRAMES; i += 1) {
      // Nothing else queued on the GPU: the read waits for this frame only.
      await gpuSettled(gl)
      await pace()
      if (isDisposed()) {
        break
      }
      const start = performance.now()
      draw()
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
      frameMs.push(performance.now() - start)
    }
    return frameMs
  }

  /** The first visible frame is less than `SWAP_SETTLE_MS` old (or still to come). */
  function swapping(): boolean {
    return firstFrameAt === null || performance.now() - firstFrameAt < SWAP_SETTLE_MS
  }

  /** The camera flies, or has yet to reach the system the visitor asked for. */
  function visitorWaits(): boolean {
    return stage.moving || stage.wanted !== stage.entered
  }

  /**
   * Once shown, another system's warm-up has no turn while the camera moves or a system is entered
   * (O-9; round 11: as in round 9, see `SystemStage.mayWarm`).
   */
  function warmupBlocked(system: SystemId): boolean {
    return shown && !isDisposed() && !stage.mayWarm(system)
  }

  /**
   * O-9 (round 11, r12 O-12 and O-9b): the wait before a warm-up task of `system`. Another system's
   * waits until the camera is back at the overview at rest (also while the asked-for system's own
   * programs are made, O-12), then for the next frame; it resolves only if that still holds then,
   * so its task never lands in a flight that started in the meantime.
   */
  async function warmupTurn(system: SystemId): Promise<void> {
    for (;;) {
      while (warmupBlocked(system)) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, WARMUP_BUSY_WAIT_MS)
        })
      }
      await nextFrameWhenShown()
      if (!warmupBlocked(system)) {
        return
      }
    }
  }

  /**
   * O-9: each system's entered programs, after the hero's. Entering a system waits for its own; while
   * a system is entered (its look on screen) or the camera flies, the warm-up waits.
   */
  async function warmUpSystems(): Promise<void> {
    const done = new Set<SystemId>()
    while (done.size < SYSTEM_IDS.length) {
      for (;;) {
        await pace()
        if (isDisposed()) {
          return
        }
        // Never while the visitor waits for a flight on screen, nor during the swap to the live
        // view (O-12): their frames come first.
        if (stage.canPrepare && !(shown && (visitorWaits() || swapping()))) {
          break
        }
        await new Promise((resolve) => {
          window.setTimeout(resolve, WARMUP_BUSY_WAIT_MS)
        })
      }
      // The system the visitor asked for first (O-12), then the others in order.
      const wanted = stage.wanted ?? options.enteredSystem?.() ?? null
      const system =
        wanted !== null && !done.has(wanted)
          ? wanted
          : (SYSTEM_IDS.find((id) => !done.has(id)) ?? SYSTEM_IDS[0])
      done.add(system)
      await stage.prepare(system)
    }
  }

  const aborted = new Promise<never>((_resolve, reject) => {
    options.signal.addEventListener(
      'abort',
      () => {
        reject(new ContractError('aborted'))
      },
      { once: true },
    )
  })
  aborted.catch(() => undefined)

  // O-9: everything up to the first frame is prepared before the visitor asks for the model, in a
  // canvas that is not in the page: compile, first use and texture and buffer upload in idle slices,
  // then a timed rehearsal of the hero frame that fixes the tier. O-12: only a few programs link at
  // a time (`linkBudget`), and the systems' programs come after the rehearsal.
  try {
    // O-12: the textures go up while the programs are created (a few at a time) and link.
    const uploads = uploadTexturesInChunks(renderer, scene, isDisposed, uploadPause)
    uploads.catch(() => undefined)
    // O-9a: the bake needs only the studio's programs (`studioReady`), so it runs while the hero's
    // are created and link, not after them; then the real environment replaces the stand-in (the
    // same programs, so nothing compiles again).
    const environmentReady = baked
      ? Promise.resolve()
      : studioReady.then(async () => {
          const bakedTexture = (await bakeEnvironment()).texture
          for (const material of materials.values()) {
            if (material.envMap === environment) {
              material.envMap = bakedTexture
            }
          }
          environment = bakedTexture
          scene.environment = bakedTexture
          pmremWarmup.dispose()
        })
    environmentReady.catch(() => undefined)
    const heroPrograms = await compileInChunks(
      renderer,
      scene,
      camera,
      isDisposed,
      pace,
      linkBudget,
    )
    await uploads
    await waitForLinks(heroPrograms, isDisposed)
    // O-12: each program's first use, then the model's buffers, a part per task (no draw below
    // uploads them all at once).
    await firstUse(heroPrograms, isDisposed, pace)
    await uploadGeometryInChunks(renderer, scene, camera, isDisposed, uploadPause)
    await environmentReady
    if (isDisposed()) {
      throw new ContractError('disposed while compiling')
    }
    const frames = await probeFrames()
    let verdict = probeVerdict(frames, false)
    if (verdict === 'low') {
      // The low tier draws at pixel ratio 1 without bloom. O-12: when that is the frame just timed
      // and it already meets the stills rate, timing it again could only confirm it; otherwise the
      // low-tier frame is timed anew.
      const sameFrame = renderer.getPixelRatio() === 1 && composer === null
      lowTier = true
      renderer.setPixelRatio(1)
      resize()
      if (!sameFrame || probeVerdict(frames, true) !== 'ok') {
        verdict = probeVerdict(await probeFrames(), true)
      } else {
        verdict = 'ok'
      }
    }
    // O-17 (round 11): a stills verdict holds only if a second timing of the same frames agrees. One
    // busy moment of the GPU (another page or process drawing) must not send a device that runs the
    // model to the stills tier; a device that cannot fails both. The rates and the frame count are
    // those above, and the start-up deadline still bounds it all (O-14).
    if (verdict === 'stills') {
      verdict = probeVerdict(await probeFrames(), true)
    }
    if (verdict === 'stills') {
      throw new ViewerStartError('too-slow', 'the GPU probe is below the stills rate')
    }
    if (isDisposed()) {
      throw new ContractError('disposed while preparing')
    }
    // O-12: the systems' programs only after the timed frames (nothing compiles beside them, so the
    // tier reflects the hero frame alone), a few at a time; once shown they wait for the swap and
    // for any flight the visitor waits for.
    systemsWarming = true
    void warmUpSystems()
    await Promise.race([options.whenShown, aborted])
    shown = true
    // The canvas is in the page now: its size, then the first visible frame.
    await gpuSettled(gl)
    resize()
    draw()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  } catch (err) {
    dispose()
    throw err
  }
  if (isDisposed()) {
    throw new ContractError('disposed before the first frame')
  }
  started = true
  firstFrameAt = performance.now()
  options.onFirstFrame()
  scheduleWake()

  return {
    setActive(next: boolean) {
      active = next
      controls.enabled = next && !stage.moving
      canvas.style.setProperty('touch-action', next ? 'none' : 'pan-y pinch-zoom')
      lastInputAt = performance.now()
      invalidate()
    },
    setSystem(system: SystemId | null) {
      stage.request(system)
      lastInputAt = performance.now()
      invalidate()
    },
    resetView() {
      if (stage.moving) {
        return
      }
      // The view the flight lands on (or the hero view): its camera and the target it looks at.
      const cam = findCamera(node(stage.entered ? `CAM_${stage.entered}` : 'CAM_hero'))
      cam.getWorldPosition(camera.position)
      camera.quaternion.copy(cam.getWorldQuaternion(new Quaternion()))
      controls.target.copy(
        worldPosition(
          node(stage.entered ? extras.systems[stage.entered].enterMotion.targetTo : 'PIVOT_hero'),
        ),
      )
      lastInputAt = performance.now()
      invalidate()
    },
    zoomBy(factor: number) {
      if (stage.moving) {
        return
      }
      const offset = camera.position.clone().sub(controls.target)
      const distance = Math.min(
        controls.maxDistance,
        Math.max(controls.minDistance, offset.length() * factor),
      )
      camera.position.copy(controls.target).add(offset.setLength(distance))
      lastInputAt = performance.now()
      invalidate()
    },
    rotateBy(azimuth: number, polar: number) {
      if (stage.moving) {
        return
      }
      const offset = camera.position.clone().sub(controls.target)
      const spherical = new Spherical().setFromVector3(offset)
      spherical.theta += azimuth
      spherical.phi = Math.min(
        controls.maxPolarAngle,
        Math.max(controls.minPolarAngle, spherical.phi + polar),
      )
      camera.position.copy(controls.target).add(new Vector3().setFromSpherical(spherical))
      camera.lookAt(controls.target)
      lastInputAt = performance.now()
      invalidate()
    },
    stats() {
      return {
        tier,
        gpu,
        bloom: useBloom && !lowTier,
        lowTier,
        pixelRatio: renderer.getPixelRatio(),
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
      }
    },
    dispose,
  }
}
