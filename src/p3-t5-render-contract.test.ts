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
      full: '/systems/v022n/tower.glb',
      lite: '/systems/v022n/tower-lite.glb',
    })
    expect(BASIS_TRANSCODER_PATH).toBe('/systems/v022n/basis/')
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
