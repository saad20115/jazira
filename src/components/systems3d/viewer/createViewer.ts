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
  InterleavedBufferAttribute,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
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
import { FPS_WINDOW, fpsVerdict, isSoftwareRenderer } from '../tier'
import {
  AGX_LOOK,
  BASIS_TRANSCODER_PATH,
  BLOOM,
  CAMERA_FAR,
  CAMERA_NEAR,
  CLEAR_COLOR,
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
  collectMaterials,
  compileInChunks,
  precompilePmrem,
  uploadTexturesInChunks,
  warmPrograms,
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
  /** V-1 live look calibration (`LIVE_LOOK`). */
  look: LiveLook
  /** C3-2 ground tint, applied to the lite model only (`LITE_GROUND_TINT`). */
  groundTint: LiteGroundTint
  /** Aborting disposes the viewer, also while the model is still loading. */
  signal: AbortSignal
  /** Called once the live canvas holds a rendered, presented frame. */
  onFirstFrame: () => void
  /** Called on a failure after the first frame (the caller falls back to the stills tier). */
  onFailure: (reason: ViewerFailure) => void
  /** Called once when the run-time FPS check drops to the low tier (§8b). */
  onLowTier?: () => void
  /** Projected hotspot labels of the entered system after each frame (null when none). */
  onLabels?: (labels: ProjectedLabel[] | null) => void
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

/**
 * V-4: the room floor's inner disc (around the plinth) is lit flat in live and ends in a hard pale
 * ellipse at its edge. Its emissive is eased from 1 at the plinth edge to `edgeLevel` at the disc
 * edge, on floor fragments inside the disc only. Radii and height come from the geometry.
 */
interface FloorDisc {
  centreX: number
  centreZ: number
  floorY: number
  plinthRadius: number
  discRadius: number
}

function addFloorDiscFade(
  material: MeshStandardMaterial,
  disc: FloorDisc,
  edgeLevel: number,
): void {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uDiscCentre = { value: new Vector2(disc.centreX, disc.centreZ) }
    shader.uniforms.uDiscFloorY = { value: disc.floorY }
    shader.uniforms.uDiscInner = { value: disc.plinthRadius }
    shader.uniforms.uDiscOuter = { value: disc.discRadius }
    shader.uniforms.uDiscEdgeLevel = { value: edgeLevel }
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
        ].join('\n'),
      )
  }
  material.customProgramCacheKey = () => `aljazira-floor-disc-${edgeLevel.toFixed(3)}`
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

async function loadWithTranscodeWatchdog(loader: GLTFLoader, url: string): Promise<GLTF> {
  // The download is bounded by the card's start timeout; parse + transcode by the watchdog.
  const fileLoader = new FileLoader(loader.manager)
  fileLoader.setResponseType('arraybuffer')
  const data = await fileLoader.loadAsync(url)
  if (!(data instanceof ArrayBuffer)) {
    throw new ContractError('model: not binary')
  }
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
function readGpuRenderer(renderer: WebGLRenderer): string | null {
  const gl = renderer.getContext()
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const value: unknown = gl.getParameter(
    debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER,
  )
  return typeof value === 'string' ? value : null
}

export async function createViewer(options: ViewerOptions): Promise<ViewerHandle> {
  const { canvas, container } = options
  patchAgxLook()

  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
  } catch {
    throw new ViewerStartError('no-webgl', 'WebGL context unavailable')
  }
  if (!renderer.capabilities.isWebGL2) {
    renderer.dispose()
    throw new ViewerStartError('no-webgl', 'WebGL2 unavailable')
  }
  const gpu = readGpuRenderer(renderer)
  if (isSoftwareRenderer(gpu)) {
    renderer.dispose()
    throw new ViewerStartError('software', 'software WebGL renderer')
  }
  const tier = options.selectTier(gpu)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.pixelRatioCap))
  renderer.toneMapping = AgXToneMapping
  renderer.outputColorSpace = SRGBColorSpace
  renderer.localClippingEnabled = true

  if (options.signal.aborted) {
    renderer.dispose()
    throw new ContractError('aborted')
  }
  const ktx2 = new UrlWorkerKTX2Loader(KTX2_WORKER_URL, KTX2_WORKER_CSP)
    .setTranscoderPath(BASIS_TRANSCODER_PATH)
    .detectSupport(renderer)
  const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder)
  loader.register(inlineBasisuPlugin(ktx2))
  const pmrem = new PMREMGenerator(renderer)
  const scene = new Scene()
  const disposables: { dispose: () => void }[] = [ktx2, pmrem]
  let disposed = false
  // Read through a function: `disposed` changes while this function awaits (abort, dispose).
  const isDisposed = (): boolean => disposed

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
    gltf = await loadWithTranscodeWatchdog(loader, MODEL_FILES[tier])
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
    await yieldToMain()
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

  // Studio environment: PMREM of the lit room + env-only panels (+ the night glow shell).
  const { studio, cameraLimits, turntable } = extras.scene
  const envScene = new Scene()
  for (const name of [studio.room, ...studio.envOnly]) {
    const source = node(name)
    const copy = source.clone()
    copy.matrixAutoUpdate = false
    copy.matrix.copy(source.matrixWorld)
    copy.visible = !(studio.nightGlow && name === studio.room)
    envScene.add(copy)
  }
  let glowShell: Mesh | null = null
  if (studio.nightGlow) {
    glowShell = nightGlowShell(studio.nightGlow)
    envScene.add(glowShell)
  }
  try {
    await precompilePmrem(renderer, pmrem, envScene, PMREM.size)
    if (isDisposed()) {
      throw new ContractError('disposed while compiling the environment')
    }
  } catch (err) {
    cleanup()
    throw err
  }
  const envTarget: WebGLRenderTarget = pmrem.fromScene(envScene, 0, PMREM.near, PMREM.far, {
    position: new Vector3(...studio.envPosition),
    size: PMREM.size,
  })
  disposables.push(envTarget)
  if (glowShell) {
    disposeObject(glowShell)
  }
  // The bake is one task; the scene setup below starts in the next one.
  await yieldToMain()
  if (isDisposed()) {
    throw new ContractError('disposed after the environment')
  }
  scene.environment = envTarget.texture
  scene.background = null
  renderer.setClearColor(CLEAR_COLOR[studio.mode])
  renderer.toneMappingExposure = 2 ** studio.exposureStops * options.look.exposureScale
  scene.environmentIntensity = options.look.envIntensity
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
  for (const material of materials.values()) {
    material.emissiveIntensity *= options.look.emissiveScale
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
  const room = materials.get('MAT_room')
  if (room && options.look.floorEdgeLevel !== 1) {
    const disc = measureFloorDisc(node(studio.room), node('MAQ_plinth'))
    if (disc) {
      addFloorDiscFade(room, disc, options.look.floorEdgeLevel)
    }
  }
  if (room) {
    // three ignores envMapIntensity on materials without their own envMap (it uses
    // scene.environmentIntensity), so the room gets the same PMREM texture explicitly.
    room.envMap = envTarget.texture
    room.envMapIntensity = options.look.roomEnvIntensity
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

  const resize = (): void => {
    const box = container.getBoundingClientRect()
    cssWidth = Math.max(1, Math.round(box.width))
    cssHeight = Math.max(1, Math.round(box.height))
    renderer.setSize(cssWidth, cssHeight, false)
    applyViewOffset()
    if (composer) {
      composer.setPixelRatio(1)
      composer.setSize(canvas.width, canvas.height)
    }
  }
  resize()

  let lowTier = false
  const draw = (): void => {
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
    compileObjects: (objects) =>
      Promise.all(objects.map((object) => renderer.compileAsync(object, camera, scene))),
    warm: (materials) => warmPrograms(renderer, materials, isDisposed),
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
  // `dt` is measured from the last drawn frame, so a frame cap never slows the animation down.
  let lastDrawAt: number | null = null
  const minFrameMs = options.maxFps > 0 ? 1000 / options.maxFps - 1 : 0
  const checkFps = (): boolean => {
    const verdict = fpsVerdict(intervals, lowTier)
    if (verdict === 'low') {
      lowTier = true
      intervals = []
      renderer.setPixelRatio(1)
      resize()
      options.onLowTier?.()
    } else if (verdict === 'stills') {
      fail('too-slow')
      return false
    }
    if (intervals.length > FPS_WINDOW * 2) {
      intervals = intervals.slice(-FPS_WINDOW)
    }
    return true
  }

  const frame = (now: number): void => {
    frameHandle = 0
    if (disposed) {
      return
    }
    // Shader warm-up tasks lengthen frames on any GPU: those intervals say nothing about its speed.
    if (lastFrameAt !== null && !stage.preparing) {
      intervals.push(now - lastFrameAt)
      if (!checkFps()) {
        return
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
    invalidate()
  }
  controls.addEventListener('start', onInput)
  controls.addEventListener('change', invalidate)

  const intersection = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting)
    if (onScreen) {
      invalidate()
    }
  })
  intersection.observe(canvas)
  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      invalidate()
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
    controls.dispose()
    cleanup()
  }

  options.signal.removeEventListener('abort', cleanup)
  options.signal.addEventListener('abort', dispose, { once: true })

  // After the first frame, each system's entered programs compile in idle time, one system at a
  // time, so a later entry neither blocks nor waits (the stage waits for any that is unfinished).
  const idle = (): Promise<void> =>
    new Promise((resolve) => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => {
          resolve()
        })
      } else {
        window.setTimeout(resolve, 50)
      }
    })
  async function warmUpSystems(): Promise<void> {
    for (const system of SYSTEM_IDS) {
      await idle()
      if (isDisposed()) {
        return
      }
      await stage.prepare(system)
    }
  }

  // First frame: compile in parallel where supported, draw at CAM_hero, wait until presented.
  // Compile and upload in tasks under ~50 ms (no long task), then draw.
  try {
    await compileInChunks(renderer, scene, camera, isDisposed)
    await warmPrograms(renderer, collectMaterials(scene), isDisposed)
    await uploadTexturesInChunks(renderer, scene, isDisposed)
    await yieldToMain()
    if (isDisposed()) {
      throw new ContractError('disposed while compiling')
    }
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
  options.onFirstFrame()
  scheduleWake()
  void warmUpSystems()

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
      const limits = stage.entered ? extras.systems[stage.entered].orbitLimits : null
      const cam = findCamera(node(stage.entered ? `CAM_${stage.entered}` : 'CAM_hero'))
      cam.getWorldPosition(camera.position)
      camera.quaternion.copy(cam.getWorldQuaternion(new Quaternion()))
      controls.target.copy(
        limits ? new Vector3(...limits.target) : worldPosition(node('PIVOT_hero')),
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
