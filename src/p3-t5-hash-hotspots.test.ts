import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { ContractError, parseStillHotspots, SYSTEM_IDS } from '@/components/systems3d/contract'
import { hashForSystem, systemFromHash } from '@/components/systems3d/hash'

function readHotspots(system: string): unknown {
  return JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), '3d', 'web', 'stills', `${system}_hotspots.json`),
      'utf8',
    ),
  )
}

describe('P3-T5 URL hash (allowlist only)', () => {
  it('recognises exactly the five system hashes', () => {
    for (const id of SYSTEM_IDS) {
      expect(systemFromHash(`#systems-${id}`)).toBe(id)
      expect(hashForSystem(id)).toBe(`#systems-${id}`)
    }
    expect(hashForSystem(null)).toBe('')
  })

  it('ignores everything else', () => {
    for (const hash of [
      '',
      '#',
      '#systems-',
      '#systems-HVAC',
      '#systems-hvac ',
      '#systems-hvacx',
      '#systems-hvac&x=1',
      '#systems-hvac/../fire',
      '#interactive-systems',
      'systems-hvac',
      '#systems-<script>',
      '#systems-__proto__',
      `#systems-${'a'.repeat(5000)}`,
    ]) {
      expect(systemFromHash(hash), hash).toBeNull()
    }
  })
})

describe('P3-T5 stills hotspots (untrusted JSON)', () => {
  it('parses the five real files: in-frame points only, within 0–1, matching ids', () => {
    for (const id of SYSTEM_IDS) {
      const points = parseStillHotspots(readHotspots(id), id)
      expect(points.length).toBeGreaterThan(0)
      expect(points.length).toBeLessThanOrEqual(5)
      for (const p of points) {
        expect(p.name.startsWith(`HOT_${id}_`)).toBe(true)
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(1)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThanOrEqual(1)
      }
    }
    const hvac = parseStillHotspots(readHotspots('hvac'), 'hvac')
    expect(hvac[0]).toEqual({ name: 'HOT_hvac_1', label: 'chillers', x: 0.6582, y: 0.1578 })
  })

  it('drops out-of-frame points and rejects foreign or malformed ones', () => {
    const base = readHotspots('fire') as { points: Record<string, unknown>[] }
    const outOfFrame = structuredClone(base)
    outOfFrame.points[0] = { ...outOfFrame.points[0], in_frame: false }
    expect(parseStillHotspots(outOfFrame, 'fire').map((p) => p.name)).not.toContain(
      String(base.points[0]?.id),
    )

    const cases: [string, (doc: { shot?: unknown; points: Record<string, unknown>[] }) => void][] =
      [
        ['wrong shot', (d) => (d.shot = 'hvac')],
        ['other system id', (d) => (d.points[0] = { ...d.points[0], id: 'HOT_hvac_1' })],
        ['bad label', (d) => (d.points[0] = { ...d.points[0], label: '<img onerror=x>' })],
        ['NaN x', (d) => (d.points[0] = { ...d.points[0], x: NaN })],
        ['string y', (d) => (d.points[0] = { ...d.points[0], y: '0.5' })],
        ['too many', (d) => (d.points = Array.from({ length: 17 }, () => d.points[0] ?? {}))],
      ]
    for (const [label, mutate] of cases) {
      const doc = structuredClone(base) as { shot?: unknown; points: Record<string, unknown>[] }
      mutate(doc)
      expect(() => parseStillHotspots(doc, 'fire'), label).toThrow(ContractError)
    }
    const clamped = structuredClone(base)
    clamped.points[0] = { ...clamped.points[0], x: 7, y: -2 }
    expect(parseStillHotspots(clamped, 'fire')[0]).toMatchObject({ x: 1, y: 0 })
    for (const bad of [null, 'x', 42, []]) {
      expect(() => parseStillHotspots(bad, 'fire')).toThrow(ContractError)
    }
  })
})
