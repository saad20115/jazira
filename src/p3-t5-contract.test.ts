import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  clampedNumber,
  ContractError,
  NAME_PATTERNS,
  parseSceneExtras,
  SYSTEM_IDS,
  validateExtras,
  type ValidatedExtras,
} from '@/components/systems3d/contract'

interface GltfJson {
  scene?: number
  scenes: { extras?: unknown }[]
  nodes: { name?: string; extras?: unknown }[]
}

/** Reads the JSON chunk of a GLB, the way GLTFLoader exposes it (extras → userData). */
function readGlb(file: string): { sceneExtras: unknown; nodeExtras: Map<string, unknown> } {
  const buffer = fs.readFileSync(path.resolve(process.cwd(), '3d', 'web', file))
  const jsonLength = buffer.readUInt32LE(12)
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8')) as GltfJson
  const nodeExtras = new Map<string, unknown>()
  for (const node of json.nodes) {
    if (node.name) {
      nodeExtras.set(node.name, node.extras ?? {})
    }
  }
  return { sceneExtras: json.scenes[json.scene ?? 0]?.extras, nodeExtras }
}

const lite = readGlb('tower-lite.glb')
const full = readGlb('tower.glb')

/** Deep copy of plain data; functions, symbols and bigints injected by the fuzzer are kept by reference. */
function clone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => clone(item)) as T
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)])) as T
  }
  return value
}

/** Deterministic PRNG (mulberry32) so every fuzz case is reproducible from its seed. */
function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NASTY_VALUES: unknown[] = [
  null,
  undefined,
  NaN,
  Infinity,
  -Infinity,
  -1e308,
  1e308,
  0,
  -0,
  '',
  '1',
  'CAM_hero',
  '../../etc/passwd',
  '<img src=x onerror=alert(1)>',
  '__proto__',
  'constructor',
  'x'.repeat(10_000),
  true,
  false,
  [],
  [1, 2],
  [1, 2, 3, 4, 5],
  ['a', 'b', 'c'],
  {},
  { __proto__: { polluted: true } },
  () => 0,
  Symbol('s'),
  10n,
]

/** Collects every path (as key arrays) to a leaf or container inside `value`. */
function allPaths(value: unknown, prefix: (string | number)[] = []): (string | number)[][] {
  const out: (string | number)[][] = []
  if (Array.isArray(value)) {
    value.forEach((item, idx) => {
      out.push([...prefix, idx], ...allPaths(item, [...prefix, idx]))
    })
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      out.push([...prefix, key], ...allPaths(item, [...prefix, key]))
    }
  }
  return out
}

function setPath(root: unknown, keys: (string | number)[], next: unknown, remove: boolean): void {
  let node: unknown = root
  for (const key of keys.slice(0, -1)) {
    if (typeof node !== 'object' || node === null) {
      return
    }
    node = (node as Record<string | number, unknown>)[key]
  }
  if (keys.length === 0 || typeof node !== 'object' || node === null) {
    return
  }
  const last = keys[keys.length - 1]
  const target = node as Record<string | number, unknown>
  if (remove) {
    // Deletion is the mutation under test here.
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete target[last]
  } else {
    target[last] = next
  }
}

/** Every number the viewer will use must be finite and inside the contract ranges. */
function expectWithinContract(v: ValidatedExtras): void {
  const { scene } = v
  const unit = (n: number): void => {
    expect(Number.isFinite(n) && n >= 0 && n <= 1).toBe(true)
  }
  Object.entries(scene.enter).forEach(([key, n]) => {
    if (key !== 'transparentDepthWrite') {
      unit(n as number)
    }
  })
  const c = scene.cameraLimits
  expect(c.maxDistance).toBeGreaterThanOrEqual(c.minDistance)
  expect(c.minDistance).toBeGreaterThanOrEqual(1)
  expect(c.maxDistance).toBeLessThanOrEqual(2000)
  expect(c.maxPolar).toBeGreaterThan(c.minPolar)
  expect(c.maxPolar).toBeLessThanOrEqual(Math.PI)
  expect(Math.abs(c.heroShiftY)).toBeLessThanOrEqual(0.5)
  expect(c.fovY).toBeGreaterThanOrEqual(0.05)
  expect(c.fovY).toBeLessThanOrEqual(2.5)
  for (const n of [...c.target, ...c.panCenter, c.panRadius, c.minCameraHeight]) {
    expect(Number.isFinite(n)).toBe(true)
  }
  expect(scene.turntable.rpm).toBeLessThanOrEqual(6)
  expect(scene.studio.exposureStops).toBeLessThanOrEqual(4)
  expect(scene.studio.exposureStops).toBeGreaterThanOrEqual(-4)
  for (const id of SYSTEM_IDS) {
    const s = v.systems[id]
    expect(s.enterMotion.path[0]).toBe('CAM_hero')
    expect(s.enterMotion.path[s.enterMotion.path.length - 1]).toBe(`CAM_${id}`)
    expect(s.enterMotion.fadeEnd).toBeGreaterThanOrEqual(s.enterMotion.fadeStart)
    expect(Math.hypot(...s.section.normal)).toBeCloseTo(1, 6)
    for (const name of s.floorSlabs) {
      expect(NAME_PATTERNS.floorSlab.test(name)).toBe(true)
    }
  }
  for (const h of v.hotspots) {
    expect(NAME_PATTERNS.hotspot.test(h.name)).toBe(true)
    expect(NAME_PATTERNS.hotspotLabel.test(h.label)).toBe(true)
  }
}

describe('P3-T5 GLB extras contract (E4: untrusted input)', () => {
  it('accepts the real v023b lite and full extras with the documented values', () => {
    const v = validateExtras(lite.sceneExtras, lite.nodeExtras)
    expect(v.scene.cameraLimits.maxDistance).toBe(420)
    // v023 moved the hero framing (`RELEASE_v023.md`: 225 m / 0.2135); v022n had 0.1475.
    expect(v.scene.cameraLimits.heroShiftY).toBe(0.2135)
    // v023b glass extras (`3d/web/build/v023b/extras-v023b-delta.md`).
    expect(v.scene.windowViewFalloff).toEqual({
      materials: ['MAT_glass_cw', 'MAT_glass_wing', 'MAT_glass_side', 'MAT_glass_terrace'],
      min: 0.06,
      lo: 0.25,
      hi: 0.7,
    })
    expect(v.scene.litGlassClarity?.lo).toBe(0.03)
    expect(v.scene.litGlassClarity?.hi).toBe(0.3)
    expect([...(v.scene.litGlassClarity?.materials ?? [])]).toEqual([
      ['MAT_glass_cw', 0.85],
      ['MAT_glass_wing', 0.85],
      ['MAT_glass_side', 0.85],
      ['MAT_glass_terrace', 0.85],
      ['MAT_podium_glass', 0.9],
    ])
    expect(v.scene.turntable).toEqual({
      root: 'TURNTABLE',
      rpm: 0.6,
      easeBackS: 0.7,
      resumeAfterS: 8,
    })
    expect(v.scene.studio.mode).toBe('night')
    expect(v.scene.studio.bloom).toBe(true)
    // v023 adds the env-only dusk dome (`RELEASE_v023.md`: hide every `studio.env_only` node).
    expect(v.scene.studio.envOnly).toEqual([
      'MAQ_glow_dusk',
      'MAQ_softbox_fill',
      'MAQ_softbox_key',
      'MAQ_softbox_sky',
    ])
    expect(v.scene.studio.moon?.intensity).toBeCloseTo(2.6, 5)
    expect(v.scene.studio.nightGlow?.radius).toBe(776)
    expect(v.systems.smart.enterMotion.path).toEqual([
      'CAM_hero',
      'PATH_smart_1',
      'PATH_smart_2',
      'PATH_smart_3',
      'PATH_smart_4',
      'CAM_smart',
    ])
    expect(v.systems.hvac.floorSlabs).toEqual(['CORE_slab_RF', 'CORE_slab_L22'])
    expect(v.systems.hvac.fanSpin).toEqual({
      material: 'MAT_hvac_fans',
      rpm: 45,
      play: 'entered',
      rampS: 1,
    })
    expect(v.systems.fire.fanSpin).toBeNull()
    expect(v.hotspots).toHaveLength(25)
    expect(v.hotspots.find((h) => h.name === 'HOT_hvac_1')?.label).toBe('chillers')
    expectWithinContract(v)
    expect(validateExtras(full.sceneExtras, full.nodeExtras)).toEqual(v)
  })

  it('clamps out-of-range numbers to the contract ranges instead of using them', () => {
    const scene = clone(lite.sceneExtras) as Record<string, Record<string, unknown>>
    const limits = scene.camera_limits
    limits.max_distance = 1e9
    limits.hero_shift_y = 7
    scene.enter.facade_opacity = -3
    scene.turntable.rpm = 1000
    const parsed = parseSceneExtras(scene)
    expect(parsed.cameraLimits.maxDistance).toBe(2000)
    expect(parsed.cameraLimits.heroShiftY).toBe(0.5)
    expect(parsed.enter.facadeOpacity).toBe(0)
    expect(parsed.turntable.rpm).toBe(6)
    expect(clampedNumber(-5, 0, 1, 'x')).toBe(0)
  })

  it('rejects non-finite numbers, wrong types and missing required nodes with ContractError', () => {
    const cases: [string, (scene: Record<string, Record<string, unknown>>) => void][] = [
      ['NaN distance', (s) => (s.camera_limits.min_distance = NaN)],
      ['Infinity fov', (s) => (s.camera_limits.fov_y = Infinity)],
      ['string number', (s) => (s.enter.facade_opacity = '0.5')],
      ['inverted polar', (s) => (s.camera_limits.max_polar = 0.1)],
      ['bad mode', (s) => (s.studio.mode = 'dusk')],
      ['bad play', (s) => (s.turntable.play = 'always')],
      ['studio missing', (s) => delete (s as Record<string, unknown>).studio],
    ]
    for (const [label, mutate] of cases) {
      const scene = clone(lite.sceneExtras) as Record<string, Record<string, unknown>>
      mutate(scene)
      expect(() => validateExtras(scene, lite.nodeExtras), label).toThrow(ContractError)
    }
    const nodes = new Map(lite.nodeExtras)
    nodes.delete('CAM_hero')
    expect(() => validateExtras(lite.sceneExtras, nodes)).toThrow(/node CAM_hero: missing/)
    const noPath = new Map(lite.nodeExtras)
    noPath.delete('PATH_smart_2')
    expect(() => validateExtras(lite.sceneExtras, noPath)).toThrow(/node PATH_smart_2: missing/)
  })

  it('v023b glass extras: optional, clamped, and rejected when malformed or naming foreign materials', () => {
    const without = clone(lite.sceneExtras) as Record<string, unknown>
    delete without.window_view_falloff
    delete without.lit_glass_clarity
    const plain = parseSceneExtras(without)
    expect(plain.windowViewFalloff).toBeNull()
    expect(plain.litGlassClarity).toBeNull()

    const loud = clone(lite.sceneExtras) as Record<string, Record<string, unknown>>
    loud.window_view_falloff.min = 9
    ;(loud.lit_glass_clarity.materials as Record<string, unknown>).MAT_glass_cw = -2
    const clamped = parseSceneExtras(loud)
    expect(clamped.windowViewFalloff?.min).toBe(1)
    expect(clamped.litGlassClarity?.materials.get('MAT_glass_cw')).toBe(0)

    const bad: [string, (scene: Record<string, Record<string, unknown>>) => void][] = [
      ['falloff lo >= hi', (s) => (s.window_view_falloff.lo = 0.9)],
      ['falloff foreign material', (s) => (s.window_view_falloff.materials = ['MAT_concrete'])],
      ['falloff not a list', (s) => (s.window_view_falloff.materials = 'MAT_glass_cw')],
      ['clarity NaN', (s) => (s.lit_glass_clarity.hi = NaN)],
      [
        'clarity foreign material',
        (s) => (s.lit_glass_clarity.materials = { __proto__x: 0.5, '<script>': 1 }),
      ],
      ['clarity not an object', (s) => (s.lit_glass_clarity = 'clear' as never)],
    ]
    for (const [label, mutate] of bad) {
      const scene = clone(lite.sceneExtras) as Record<string, Record<string, unknown>>
      mutate(scene)
      expect(() => parseSceneExtras(scene), label).toThrow(ContractError)
    }
  })

  it('matches names against the allowlists (no foreign node, material or path names)', () => {
    const bad: [string, (scene: Record<string, Record<string, unknown>>) => void][] = [
      ['room outside MAQ_', (s) => (s.studio.room = 'ARCH_facade')],
      ['env_only injection', (s) => (s.studio.env_only = ['MAQ_x', '<script>'])],
      ['turntable root', (s) => (s.turntable.root = '__proto__')],
    ]
    for (const [label, mutate] of bad) {
      const scene = clone(lite.sceneExtras) as Record<string, Record<string, unknown>>
      mutate(scene)
      expect(() => validateExtras(scene, lite.nodeExtras), label).toThrow(/name not allowed/)
    }

    const sysCases: [string, (sys: Record<string, Record<string, unknown>>) => void, RegExp][] = [
      [
        'path through another system',
        (sys) => (sys.enter_motion.path = ['CAM_hero', 'PATH_fire_1', 'CAM_smart']),
        /name not allowed|waypoints must belong/,
      ],
      [
        'path ends elsewhere',
        (sys) => (sys.enter_motion.path = ['CAM_hero', 'CAM_hvac']),
        /must run from CAM_hero to CAM_smart/,
      ],
      [
        'fan material',
        (sys) => (sys.fan_spin = { material: 'MAT_glass_cw', rpm: 1, play: 'entered' }),
        /name not allowed/,
      ],
      [
        'slab name',
        (sys) => ((sys as Record<string, unknown>).floor_slabs = 'CORE_slab_L01,ARCH_facade'),
        /name not allowed/,
      ],
      [
        'target pivot',
        (sys) => (sys.enter_motion.target_to = 'PIVOT_hvac'),
        /targets must be PIVOT_hero → PIVOT_smart/,
      ],
    ]
    for (const [label, mutate, message] of sysCases) {
      const nodes = new Map(lite.nodeExtras)
      const sys = clone(nodes.get('SYS_smart')) as Record<string, Record<string, unknown>>
      mutate(sys)
      nodes.set('SYS_smart', sys)
      expect(() => validateExtras(lite.sceneExtras, nodes), label).toThrow(message)
    }

    const label = new Map(lite.nodeExtras)
    label.set('HOT_hvac_1', { label: 'Chillers <b>' })
    expect(() => validateExtras(lite.sceneExtras, label)).toThrow(
      /HOT_hvac_1\.label: name not allowed/,
    )
    const ignored = new Map(lite.nodeExtras)
    ignored.set('EVIL_node', { label: '<script>' })
    expect(validateExtras(lite.sceneExtras, ignored).hotspots).toHaveLength(25)
  })

  it('fuzz: 4000 seeded mutations of the real extras either validate within range or throw ContractError', () => {
    const scenePaths = allPaths(lite.sceneExtras)
    const systemNames = SYSTEM_IDS.map((id) => `SYS_${id}`)
    let accepted = 0
    let rejected = 0
    for (let seed = 1; seed <= 4000; seed += 1) {
      const random = prng(seed)
      const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]
      const scene = clone(lite.sceneExtras)
      const nodes = new Map(lite.nodeExtras)
      const mutations = 1 + Math.floor(random() * 3)
      for (let m = 0; m < mutations; m += 1) {
        const remove = random() < 0.2
        const value = pick(NASTY_VALUES)
        if (random() < 0.6) {
          setPath(scene, pick(scenePaths), value, remove)
        } else {
          const name = pick(systemNames)
          const sys = clone(nodes.get(name))
          const paths = allPaths(sys)
          if (paths.length > 0) {
            setPath(sys, pick(paths), value, remove)
          }
          nodes.set(name, sys)
        }
      }
      let result: ValidatedExtras | null = null
      try {
        result = validateExtras(scene, nodes)
      } catch (err) {
        expect(err, `seed ${String(seed)} threw a non-contract error`).toBeInstanceOf(ContractError)
        rejected += 1
        continue
      }
      expectWithinContract(result)
      accepted += 1
    }
    expect(rejected).toBeGreaterThan(1000)
    expect(accepted).toBeGreaterThan(100)
  })

  it('rejects non-object top-level input', () => {
    for (const value of [null, undefined, 42, 'extras', [], true]) {
      expect(() => validateExtras(value, lite.nodeExtras)).toThrow(ContractError)
    }
  })
})
