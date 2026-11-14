import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  AGX_LOOK,
  BASIS_TRANSCODER_PATH,
  BLOOM,
  CLEAR_COLOR,
  INTERIOR,
  INTERIOR_MATERIALS,
  LIVE_LOOK,
  MODEL_FILES,
  RELEASE,
} from '@/components/systems3d/renderContract'

interface ReleaseManifest {
  files: { file: string }[]
  render: {
    bloom: { threshold: number; strength: number; radius: number }
    tone_mapping: { live: string }
    interior_mapping: {
      materials: string[]
      window_band: [number, number]
      room: { depth_m: number }
      grid: string
    }
  }
}

const manifest = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), '3d', 'web', 'manifest.json'), 'utf8'),
) as ReleaseManifest
const stillsManifest = JSON.parse(
  fs.readFileSync(
    path.resolve(process.cwd(), '3d', 'web', 'stills', 'stills_manifest.json'),
    'utf8',
  ),
) as { release: string }

describe('P3-T5 render contract constants equal the pinned release manifest', () => {
  it('release, model files and transcoder path', () => {
    expect(RELEASE).toBe(stillsManifest.release)
    expect(manifest.files.map((f) => f.file).sort()).toEqual(['tower-lite.glb', 'tower.glb'])
    expect(MODEL_FILES).toEqual({
      full: '/systems/v023b/tower.glb',
      lite: '/systems/v023b/tower-lite.glb',
    })
    expect(BASIS_TRANSCODER_PATH).toBe('/systems/v023b/basis/')
  })

  it('bloom, AgX look and interior mapping', () => {
    expect(BLOOM).toEqual({
      threshold: manifest.render.bloom.threshold,
      strength: manifest.render.bloom.strength,
      radius: manifest.render.bloom.radius,
    })
    expect(manifest.render.tone_mapping.live).toContain(
      `contrast ${String(AGX_LOOK.contrast)} about pivot ${String(AGX_LOOK.pivot)}`,
    )
    expect([...INTERIOR_MATERIALS]).toEqual(manifest.render.interior_mapping.materials)
    expect([...INTERIOR.windowBand]).toEqual(manifest.render.interior_mapping.window_band)
    expect(INTERIOR.depthM).toBe(manifest.render.interior_mapping.room.depth_m)
    expect(manifest.render.interior_mapping.grid).toMatch(
      new RegExp(`^${String(INTERIOR.grid[0])} x ${String(INTERIOR.grid[1])} `),
    )
  })

  it('night clear colour is #1b2130 (brief A-1 §17)', () => {
    expect(CLEAR_COLOR.night.toString(16)).toBe('1b2130')
  })
})

describe('P3-T5 O-5: the live look names only materials of the release', () => {
  function materialNames(file: string): string[] {
    const buffer = fs.readFileSync(path.resolve(process.cwd(), '3d', 'web', file))
    const json = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString('utf8')) as {
      materials: { name?: string }[]
    }
    return json.materials.map((m) => m.name ?? '')
  }

  it('every per-material emissive scale names a material of both models, and scales are sane', () => {
    const names = Object.keys(LIVE_LOOK.materialEmissive)
    // v023b (owner 2026-11-14, "اذا كنت انت وضعت اضاءه اضافية احذفها"): no per-material lift; every
    // baked emission is at the model's own level.
    expect(names).toEqual([])
    expect(LIVE_LOOK.emissiveScale).toBe(1)
    expect(LIVE_LOOK.exposureScale).toBe(1)
    for (const file of ['tower.glb', 'tower-lite.glb']) {
      const inModel = materialNames(file)
      for (const name of names) {
        expect(inModel, `${file}: ${name}`).toContain(name)
      }
    }
    for (const scale of [
      ...Object.values(LIVE_LOOK.materialEmissive),
      LIVE_LOOK.emissiveScale,
      LIVE_LOOK.exposureScale,
      LIVE_LOOK.systemLightScale,
    ]) {
      expect(scale).toBeGreaterThan(0)
      expect(scale).toBeLessThanOrEqual(4)
    }
    expect(LIVE_LOOK.systemGlassScale).toBeGreaterThan(0)
    expect(LIVE_LOOK.systemGlassScale).toBeLessThanOrEqual(1)
  })

  it('O-15: the key comes from the right of the hero view and above, at 45°; the façade catches it', () => {
    // Positive azimuth: to the hero camera's right, the poster's warm side.
    expect(LIVE_LOOK.key.azimuthDeg).toBe(45)
    expect(LIVE_LOOK.key.elevationDeg).toBe(45)
    // The sheen is on the façade glass and the pilasters, all of them in both models.
    expect(LIVE_LOOK.keySheen.materials).toEqual(expect.arrayContaining([...INTERIOR_MATERIALS]))
    expect(LIVE_LOOK.keySheen.materials).toContain('MAT_gold_fin')
    for (const file of ['tower.glb', 'tower-lite.glb']) {
      const inModel = materialNames(file)
      for (const name of LIVE_LOOK.keySheen.materials) {
        expect(inModel, `${file}: ${name}`).toContain(name)
      }
    }
    // Warm (as the key), and a sheen, not a second light.
    const [r, g, b] = LIVE_LOOK.keySheen.color
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
    // v023b (owner 2026-11-14): no sheen and no key or fill on the model at rest; the key and fill
    // light the equipment inside a system only.
    expect(LIVE_LOOK.keySheen.strength).toBe(0)
    expect(LIVE_LOOK.restLightScale).toBe(0)
    expect(LIVE_LOOK.systemLightScale).toBeGreaterThan(LIVE_LOOK.restLightScale)
    expect(LIVE_LOOK.keySheen.sharpness).toBeGreaterThanOrEqual(1)
  })
})
