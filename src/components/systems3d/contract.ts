/**
 * Untrusted-input validation for the v022n 3D release (`handoff/tasks/P3-T5.md` E4; contract:
 * `extras-schema.md` + brief A-1 §17). The GLB `extras` (three.js `userData`) are parsed into typed,
 * clamped values here; anything structurally wrong throws `ContractError`, and the caller falls back
 * to the stills tier. Names are matched against allowlists; numbers must be finite and are clamped to
 * the contract ranges. Pure TypeScript: no three.js import, so it is unit-testable in Node.
 */

export const SYSTEM_IDS = ['hvac', 'fire', 'plumbing', 'power', 'smart'] as const
export type SystemId = (typeof SYSTEM_IDS)[number]

export type Vec3 = readonly [number, number, number]
export type CubicBezier = readonly [number, number, number, number]

export class ContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContractError'
  }
}

const SYSTEM_GROUP = SYSTEM_IDS.join('|')

/** Allowlists for every node or material name the viewer looks up from the GLB. */
export const NAME_PATTERNS = {
  camera: new RegExp(`^CAM_(?:hero|${SYSTEM_GROUP})$`),
  pivot: new RegExp(`^PIVOT_(?:hero|${SYSTEM_GROUP})$`),
  path: new RegExp(`^PATH_(?:${SYSTEM_GROUP})_[1-9]$`),
  hotspot: new RegExp(`^HOT_(?:${SYSTEM_GROUP})_[1-9]$`),
  system: new RegExp(`^SYS_(?:${SYSTEM_GROUP})$`),
  floorSlab: /^CORE_slab_[A-Z0-9]{1,6}$/,
  studioNode: /^MAQ_[a-z_]{1,32}$/,
  turntableRoot: /^TURNTABLE$/,
  fanMaterial: new RegExp(`^MAT_(?:${SYSTEM_GROUP})_fans$`),
  hotspotLabel: /^[a-z][A-Za-z0-9_]{0,39}$/,
} as const

const MAX_PATH_POINTS = 8
const MAX_ENV_ONLY = 8
const MAX_FLOOR_SLABS = 8
const MAX_STRING = 64

export interface EnterExtras {
  facadeOpacity: number
  interiorOpacity: number
  glassEmissiveScale: number
  transparentDepthWrite: boolean
  floorSlabOpacity: number
  otherSystemsOpacity: number
  siteEmissiveScale: number
  siteOcclusionScale: number
}

export interface CameraLimits {
  target: Vec3
  panCenter: Vec3
  panRadius: number
  minDistance: number
  maxDistance: number
  minPolar: number
  maxPolar: number
  minCameraHeight: number
  fovY: number
  heroShiftY: number
}

export interface TurntableExtras {
  root: string
  rpm: number
  easeBackS: number
  resumeAfterS: number
}

export interface MoonExtras {
  directionToLight: Vec3
  color: Vec3
  intensity: number
}

export interface NightGlowExtras {
  color: Vec3
  gain: number
  min: number
  heightFrom: number
  heightTo: number
  radius: number
  centre: Vec3
}

export interface StudioExtras {
  mode: 'day' | 'night'
  room: string
  envOnly: readonly string[]
  envPosition: Vec3
  exposureStops: number
  bloom: boolean
  moon: MoonExtras | null
  nightGlow: NightGlowExtras | null
}

export interface SceneExtras {
  enter: EnterExtras
  cameraLimits: CameraLimits
  turntable: TurntableExtras
  studio: StudioExtras
}

export interface EnterMotion {
  durationS: number
  easing: CubicBezier
  /** `CAM_hero`, then `PATH_<s>_*`, then `CAM_<s>`. */
  path: readonly string[]
  targetFrom: string
  targetTo: string
  fovFrom: number
  fovTo: number
  shiftYFrom: number
  shiftYTo: number
  fadeStart: number
  fadeEnd: number
}

export interface SectionPlane {
  normal: Vec3
  constant: number
}

export interface OrbitLimits {
  target: Vec3
  minDistance: number
  maxDistance: number
  minPolar: number
  maxPolar: number
  panRadius: number
}

export interface FanSpin {
  material: string
  rpm: number
  play: 'entered' | 'always'
  rampS: number
}

export interface SystemExtras {
  id: SystemId
  floorSlabs: readonly string[]
  enterMotion: EnterMotion
  section: SectionPlane
  orbitLimits: OrbitLimits
  fanSpin: FanSpin | null
}

export interface HotspotExtras {
  name: string
  system: SystemId
  label: string
}

export interface ValidatedExtras {
  scene: SceneExtras
  systems: Readonly<Record<SystemId, SystemExtras>>
  hotspots: readonly HotspotExtras[]
}

type Rec = Record<string, unknown>

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown, where: string): Rec {
  if (!isRecord(value)) {
    throw new ContractError(`${where}: expected an object`)
  }
  return value
}

/** A finite number, clamped to [min, max]. Non-numbers, NaN and ±Infinity are rejected. */
export function clampedNumber(value: unknown, min: number, max: number, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ContractError(`${where}: expected a finite number`)
  }
  return Math.min(max, Math.max(min, value))
}

function optionalNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
  where: string,
): number {
  return value === undefined ? fallback : clampedNumber(value, min, max, where)
}

function bool(value: unknown, where: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ContractError(`${where}: expected a boolean`)
  }
  return value
}

function vec3(value: unknown, min: number, max: number, where: string): Vec3 {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new ContractError(`${where}: expected [x, y, z]`)
  }
  return [
    clampedNumber(value[0], min, max, `${where}[0]`),
    clampedNumber(value[1], min, max, `${where}[1]`),
    clampedNumber(value[2], min, max, `${where}[2]`),
  ]
}

function unitVec3(value: unknown, where: string): Vec3 {
  const [x, y, z] = vec3(value, -1, 1, where)
  const length = Math.hypot(x, y, z)
  if (length < 0.5) {
    throw new ContractError(`${where}: expected a unit direction`)
  }
  return [x / length, y / length, z / length]
}

export function allowedName(value: unknown, pattern: RegExp, where: string): string {
  if (typeof value !== 'string' || value.length > MAX_STRING || !pattern.test(value)) {
    throw new ContractError(`${where}: name not allowed`)
  }
  return value
}

function nameList(value: unknown, pattern: RegExp, maxItems: number, where: string): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ContractError(`${where}: expected at most ${String(maxItems)} names`)
  }
  return value.map((item, idx) => allowedName(item, pattern, `${where}[${String(idx)}]`))
}

const WORLD = 5000
const ANGLE_MAX = Math.PI

function parseEnter(value: unknown): EnterExtras {
  const e = record(value, 'enter')
  const unit = (key: string): number => clampedNumber(e[key], 0, 1, `enter.${key}`)
  return {
    facadeOpacity: unit('facade_opacity'),
    interiorOpacity: unit('interior_opacity'),
    glassEmissiveScale: unit('glass_emissive_scale'),
    transparentDepthWrite: bool(e.transparent_depth_write, 'enter.transparent_depth_write'),
    floorSlabOpacity: unit('floor_slab_opacity'),
    otherSystemsOpacity: unit('other_systems_opacity'),
    siteEmissiveScale: unit('site_emissive_scale'),
    siteOcclusionScale: unit('site_occlusion_scale'),
  }
}

function parsePolarPair(
  minValue: unknown,
  maxValue: unknown,
  where: string,
): { minPolar: number; maxPolar: number } {
  const minPolar = clampedNumber(minValue, 0, ANGLE_MAX, `${where}.min_polar`)
  const maxPolar = clampedNumber(maxValue, 0, ANGLE_MAX, `${where}.max_polar`)
  if (maxPolar <= minPolar) {
    throw new ContractError(`${where}: max_polar must exceed min_polar`)
  }
  return { minPolar, maxPolar }
}

function parseDistancePair(
  minValue: unknown,
  maxValue: unknown,
  where: string,
): { minDistance: number; maxDistance: number } {
  const minDistance = clampedNumber(minValue, 1, 2000, `${where}.min_distance`)
  const maxDistance = clampedNumber(maxValue, 1, 2000, `${where}.max_distance`)
  if (maxDistance < minDistance) {
    throw new ContractError(`${where}: max_distance must not be below min_distance`)
  }
  return { minDistance, maxDistance }
}

function parseCameraLimits(value: unknown): CameraLimits {
  const c = record(value, 'camera_limits')
  return {
    target: vec3(c.target, -WORLD, WORLD, 'camera_limits.target'),
    panCenter: vec3(c.pan_center ?? c.target, -WORLD, WORLD, 'camera_limits.pan_center'),
    panRadius: clampedNumber(c.pan_radius, 0, 200, 'camera_limits.pan_radius'),
    ...parseDistancePair(c.min_distance, c.max_distance, 'camera_limits'),
    ...parsePolarPair(c.min_polar, c.max_polar, 'camera_limits'),
    minCameraHeight: clampedNumber(
      c.min_camera_height,
      -100,
      500,
      'camera_limits.min_camera_height',
    ),
    fovY: clampedNumber(c.fov_y, 0.05, 2.5, 'camera_limits.fov_y'),
    heroShiftY: clampedNumber(c.hero_shift_y, -0.5, 0.5, 'camera_limits.hero_shift_y'),
  }
}

function parseTurntable(value: unknown): TurntableExtras {
  const t = record(value, 'turntable')
  if (t.play !== 'idle') {
    throw new ContractError('turntable.play: expected "idle"')
  }
  return {
    root: allowedName(t.root, NAME_PATTERNS.turntableRoot, 'turntable.root'),
    rpm: clampedNumber(t.rpm, 0, 6, 'turntable.rpm'),
    easeBackS: clampedNumber(t.ease_back_s, 0, 5, 'turntable.ease_back_s'),
    resumeAfterS: clampedNumber(t.resume_after_s, 0, 120, 'turntable.resume_after_s'),
  }
}

function parseMoon(value: unknown): MoonExtras | null {
  if (value === undefined) {
    return null
  }
  const m = record(value, 'studio.moon')
  return {
    directionToLight: unitVec3(m.direction_to_light, 'studio.moon.direction_to_light'),
    color: vec3(m.color, 0, 4, 'studio.moon.color'),
    intensity: clampedNumber(m.intensity, 0, 20, 'studio.moon.intensity'),
  }
}

function parseNightGlow(value: unknown): NightGlowExtras | null {
  if (value === undefined) {
    return null
  }
  const g = record(value, 'studio.night_glow')
  const heightFrom = clampedNumber(g.height_from, -WORLD, WORLD, 'studio.night_glow.height_from')
  const heightTo = clampedNumber(g.height_to, -WORLD, WORLD, 'studio.night_glow.height_to')
  if (heightTo <= heightFrom) {
    throw new ContractError('studio.night_glow: height_to must exceed height_from')
  }
  return {
    color: vec3(g.color, 0, 4, 'studio.night_glow.color'),
    gain: clampedNumber(g.gain, 0, 10, 'studio.night_glow.gain'),
    min: clampedNumber(g.min, 0, 1, 'studio.night_glow.min'),
    heightFrom,
    heightTo,
    radius: clampedNumber(g.radius, 1, WORLD, 'studio.night_glow.radius'),
    centre: vec3(g.centre, -WORLD, WORLD, 'studio.night_glow.centre'),
  }
}

function parseStudio(value: unknown): StudioExtras {
  const s = record(value, 'studio')
  if (s.mode !== 'day' && s.mode !== 'night') {
    throw new ContractError('studio.mode: expected "day" or "night"')
  }
  return {
    mode: s.mode,
    room: allowedName(s.room, NAME_PATTERNS.studioNode, 'studio.room'),
    envOnly: nameList(s.env_only, NAME_PATTERNS.studioNode, MAX_ENV_ONLY, 'studio.env_only'),
    envPosition: vec3(s.env_position, -WORLD, WORLD, 'studio.env_position'),
    exposureStops: clampedNumber(s.exposure_stops, -4, 4, 'studio.exposure_stops'),
    bloom: bool(s.bloom, 'studio.bloom'),
    moon: parseMoon(s.moon),
    nightGlow: parseNightGlow(s.night_glow),
  }
}

/** Parses `gltf.scene.userData` (the GLB scene extras). */
export function parseSceneExtras(value: unknown): SceneExtras {
  const scene = record(value, 'scene extras')
  return {
    enter: parseEnter(scene.enter),
    cameraLimits: parseCameraLimits(scene.camera_limits),
    turntable: parseTurntable(scene.turntable),
    studio: parseStudio(scene.studio),
  }
}

function parseBezier(value: unknown, where: string): CubicBezier {
  if (!Array.isArray(value) || value.length !== 4) {
    throw new ContractError(`${where}: expected [x1, y1, x2, y2]`)
  }
  return [
    clampedNumber(value[0], 0, 1, `${where}[0]`),
    clampedNumber(value[1], -2, 3, `${where}[1]`),
    clampedNumber(value[2], 0, 1, `${where}[2]`),
    clampedNumber(value[3], -2, 3, `${where}[3]`),
  ]
}

function parseEnterMotion(value: unknown, id: SystemId): EnterMotion {
  const where = `SYS_${id}.enter_motion`
  const m = record(value, where)
  if (!Array.isArray(m.path) || m.path.length < 2 || m.path.length > MAX_PATH_POINTS) {
    throw new ContractError(`${where}.path: expected 2–${String(MAX_PATH_POINTS)} node names`)
  }
  const path = m.path.map((name, idx) => {
    const isFirst = idx === 0
    const isLast = idx === (m.path as unknown[]).length - 1
    const pattern = isFirst || isLast ? NAME_PATTERNS.camera : NAME_PATTERNS.path
    return allowedName(name, pattern, `${where}.path[${String(idx)}]`)
  })
  if (path[0] !== 'CAM_hero' || path[path.length - 1] !== `CAM_${id}`) {
    throw new ContractError(`${where}.path: must run from CAM_hero to CAM_${id}`)
  }
  if (path.slice(1, -1).some((name) => !name.startsWith(`PATH_${id}_`))) {
    throw new ContractError(`${where}.path: waypoints must belong to ${id}`)
  }
  const fadeStart = clampedNumber(m.fade_start, 0, 1, `${where}.fade_start`)
  const fadeEnd = clampedNumber(m.fade_end, 0, 1, `${where}.fade_end`)
  if (fadeEnd < fadeStart) {
    throw new ContractError(`${where}: fade_end must not be below fade_start`)
  }
  const targetFrom = allowedName(m.target_from, NAME_PATTERNS.pivot, `${where}.target_from`)
  const targetTo = allowedName(m.target_to, NAME_PATTERNS.pivot, `${where}.target_to`)
  if (targetFrom !== 'PIVOT_hero' || targetTo !== `PIVOT_${id}`) {
    throw new ContractError(`${where}: targets must be PIVOT_hero → PIVOT_${id}`)
  }
  return {
    durationS: clampedNumber(m.duration_s, 0.2, 10, `${where}.duration_s`),
    easing: parseBezier(m.easing_cubic_bezier, `${where}.easing_cubic_bezier`),
    path,
    targetFrom,
    targetTo,
    fovFrom: clampedNumber(m.fov_from, 0.05, 2.5, `${where}.fov_from`),
    fovTo: clampedNumber(m.fov_to, 0.05, 2.5, `${where}.fov_to`),
    shiftYFrom: clampedNumber(m.shift_y_from, -0.5, 0.5, `${where}.shift_y_from`),
    shiftYTo: clampedNumber(m.shift_y_to, -0.5, 0.5, `${where}.shift_y_to`),
    fadeStart,
    fadeEnd,
  }
}

function parseFanSpin(value: unknown, id: SystemId): FanSpin | null {
  if (value === undefined) {
    return null
  }
  const where = `SYS_${id}.fan_spin`
  const f = record(value, where)
  if (f.play !== 'entered' && f.play !== 'always') {
    throw new ContractError(`${where}.play: expected "entered" or "always"`)
  }
  return {
    material: allowedName(f.material, NAME_PATTERNS.fanMaterial, `${where}.material`),
    rpm: clampedNumber(f.rpm, 0, 600, `${where}.rpm`),
    play: f.play,
    rampS: optionalNumber(f.ramp_s, 0, 10, 1, `${where}.ramp_s`),
  }
}

/** Parses the `SYS_<s>` node extras of one system. */
export function parseSystemExtras(value: unknown, id: SystemId): SystemExtras {
  const where = `SYS_${id}`
  const s = record(value, where)
  if (typeof s.floor_slabs !== 'string' || s.floor_slabs.length > 256) {
    throw new ContractError(`${where}.floor_slabs: expected a comma-separated string`)
  }
  const slabs = s.floor_slabs === '' ? [] : s.floor_slabs.split(',').map((name) => name.trim())
  const section = record(s.section, `${where}.section`)
  const orbit = record(s.orbit_limits, `${where}.orbit_limits`)
  return {
    id,
    floorSlabs: nameList(slabs, NAME_PATTERNS.floorSlab, MAX_FLOOR_SLABS, `${where}.floor_slabs`),
    enterMotion: parseEnterMotion(s.enter_motion, id),
    section: {
      normal: unitVec3(section.normal, `${where}.section.normal`),
      constant: clampedNumber(section.constant, -WORLD, WORLD, `${where}.section.constant`),
    },
    orbitLimits: {
      target: vec3(orbit.target, -WORLD, WORLD, `${where}.orbit_limits.target`),
      ...parseDistancePair(orbit.min_distance, orbit.max_distance, `${where}.orbit_limits`),
      ...parsePolarPair(orbit.min_polar, orbit.max_polar, `${where}.orbit_limits`),
      panRadius: clampedNumber(orbit.pan_radius, 0, 200, `${where}.orbit_limits.pan_radius`),
    },
    fanSpin: parseFanSpin(s.fan_spin, id),
  }
}

/** Parses a `HOT_<s>_<n>` node's extras. */
export function parseHotspot(name: unknown, extras: unknown): HotspotExtras {
  const nodeName = allowedName(name, NAME_PATTERNS.hotspot, 'hotspot name')
  const h = record(extras, nodeName)
  const system = nodeName.split('_')[1]
  if (!isSystemId(system)) {
    throw new ContractError(`${nodeName}: unknown system`)
  }
  return {
    name: nodeName,
    system,
    label: allowedName(h.label, NAME_PATTERNS.hotspotLabel, `${nodeName}.label`),
  }
}

export function isSystemId(value: unknown): value is SystemId {
  return typeof value === 'string' && (SYSTEM_IDS as readonly string[]).includes(value)
}

/**
 * Validates the scene extras and the per-node extras of a loaded GLB.
 * `nodeExtras` maps node names to their `userData`; names outside the allowlists are ignored, and
 * every node the viewer needs (cameras, pivots, path points, systems, turntable, studio) must exist.
 */
export function validateExtras(
  sceneUserData: unknown,
  nodeExtras: ReadonlyMap<string, unknown>,
): ValidatedExtras {
  const scene = parseSceneExtras(sceneUserData)
  const need = (name: string): unknown => {
    if (!nodeExtras.has(name)) {
      throw new ContractError(`node ${name}: missing`)
    }
    return nodeExtras.get(name)
  }
  need('CAM_hero')
  need('PIVOT_hero')
  need(scene.turntable.root)
  need(scene.studio.room)
  for (const name of scene.studio.envOnly) {
    need(name)
  }

  const systems = {} as Record<SystemId, SystemExtras>
  for (const id of SYSTEM_IDS) {
    const system = parseSystemExtras(need(`SYS_${id}`), id)
    for (const name of [...system.enterMotion.path, system.enterMotion.targetTo]) {
      need(name)
    }
    systems[id] = system
  }

  const hotspots: HotspotExtras[] = []
  for (const [name, extras] of nodeExtras) {
    if (NAME_PATTERNS.hotspot.test(name)) {
      hotspots.push(parseHotspot(name, extras))
    }
  }
  hotspots.sort((a, b) => a.name.localeCompare(b.name))
  return { scene, systems, hotspots }
}
