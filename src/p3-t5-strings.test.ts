import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { HOTSPOT_LABEL_IDS, showIn3dLabel, SYSTEMS3D_STRINGS } from '@/components/systems3d/strings'

function flatten(value: unknown, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>()
  if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      const name = prefix ? `${prefix}.${key}` : key
      if (typeof item === 'object' && item !== null) {
        for (const [k, v] of flatten(item, name)) {
          out.set(k, v)
        }
      } else {
        out.set(name, item)
      }
    }
  }
  return out
}

/** Hotspot label ids exactly as the release GLB carries them (`HOT_<s>_<n>.label`). */
function glbHotspotLabels(): string[] {
  const buffer = fs.readFileSync(path.resolve(process.cwd(), '3d', 'web', 'tower-lite.glb'))
  const json = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString('utf8')) as {
    nodes: { name?: string; extras?: { label?: unknown } }[]
  }
  return json.nodes
    .filter((node) => node.name?.startsWith('HOT_'))
    .map((node) => String(node.extras?.label))
    .sort()
}

describe('P3-T5 systems3d strings', () => {
  it('en and ar have identical keys and no empty values', () => {
    const en = flatten(SYSTEMS3D_STRINGS.en)
    const ar = flatten(SYSTEMS3D_STRINGS.ar)
    expect([...ar.keys()].sort()).toEqual([...en.keys()].sort())
    for (const [locale, map] of [
      ['en', en],
      ['ar', ar],
    ] as const) {
      for (const [key, value] of map) {
        expect(typeof value === 'string' && value.trim().length > 0, `${locale}.${key}`).toBe(true)
      }
    }
  })

  it('the Arabic strings are Arabic and the English ones are not', () => {
    for (const [key, value] of flatten(SYSTEMS3D_STRINGS.ar)) {
      expect(/[؀-ۿ]/.test(String(value)), `ar.${key}`).toBe(true)
    }
    for (const [key, value] of flatten(SYSTEMS3D_STRINGS.en)) {
      expect(/[؀-ۿ]/.test(String(value)), `en.${key}`).toBe(false)
    }
  })

  it('has a label for exactly the 25 hotspot ids of the release, with no numbers or brands', () => {
    expect([...HOTSPOT_LABEL_IDS].sort()).toEqual(glbHotspotLabels())
    for (const locale of ['en', 'ar'] as const) {
      const labels = SYSTEMS3D_STRINGS[locale].hotspots
      expect(Object.keys(labels).sort()).toEqual([...HOTSPOT_LABEL_IDS].sort())
      for (const label of Object.values(labels)) {
        expect(/[0-9٠-٩]/.test(label), `${locale}: ${label}`).toBe(false)
      }
    }
  })

  it('the "Show in 3D" accessible name includes the system title in both locales', () => {
    expect(showIn3dLabel(SYSTEMS3D_STRINGS.en, 'HVAC & Chilled Water')).toBe(
      'Show HVAC & Chilled Water in 3D',
    )
    const ar = showIn3dLabel(SYSTEMS3D_STRINGS.ar, 'التكييف والمياه المبردة')
    expect(ar).toContain('التكييف والمياه المبردة')
    expect(ar).not.toContain('{system}')
  })
})
