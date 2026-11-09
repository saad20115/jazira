import { describe, expect, it } from 'vitest'

import {
  anchorClear,
  choosePillSpot,
  DOT_CLEARANCE,
  MIN_DOT_SPACING,
  spreadDots,
} from '@/components/systems3d/labelLayout'

describe('P3-T5 hotspot label placement', () => {
  it('puts the pill above its anchor when there is room', () => {
    expect(choosePillSpot(300, 300, 100, 24, 600, 580, [])).toEqual({ dx: -50, dy: -34 })
  })

  it('falls back to below, right, then left, and never leaves the card', () => {
    expect(choosePillSpot(300, 20, 100, 24, 600, 580, [])).toEqual({ dx: -50, dy: 10 })
    expect(choosePillSpot(30, 300, 100, 24, 600, 580, [{ x: 0, y: 0, w: 600, h: 280 }])).toEqual({
      dx: 10,
      dy: -12,
    })
    const rightBlocked = choosePillSpot(570, 300, 100, 24, 600, 580, [
      { x: 0, y: 0, w: 600, h: 285 },
      { x: 0, y: 315, w: 600, h: 265 },
    ])
    expect(rightBlocked).toEqual({ dx: -110, dy: -12 })
  })

  it('avoids obstacles (the panel, buttons, earlier pills) and gives up rather than overlap', () => {
    const panel = { x: 250, y: 250, w: 200, h: 200 }
    // Anchor just above the panel: the pill must not end up over it.
    const spot = choosePillSpot(300, 240, 100, 24, 600, 580, [panel])
    expect(spot).not.toBeNull()
    const rect = { x: 300 + (spot?.dx ?? 0), y: 240 + (spot?.dy ?? 0), w: 100, h: 24 }
    expect(
      rect.x < panel.x + panel.w &&
        panel.x < rect.x + rect.w &&
        rect.y < panel.y + panel.h &&
        panel.y < rect.y + rect.h,
    ).toBe(false)
    expect(choosePillSpot(300, 300, 100, 24, 600, 580, [{ x: 0, y: 0, w: 600, h: 580 }])).toBeNull()
    expect(choosePillSpot(5, 5, 700, 24, 600, 580, [])).toBeNull()
  })

  it('hides a dot whose 24 px spacing circle meets a control, and ignores zero-size obstacles', () => {
    const controls = { x: 16, y: 300, w: 200, h: 44 }
    expect(anchorClear(100, 320, [controls])).toBe(false)
    expect(anchorClear(100, 300 - DOT_CLEARANCE + 1, [controls])).toBe(false)
    expect(anchorClear(100, 300 - DOT_CLEARANCE, [controls])).toBe(true)
    expect(anchorClear(300, 320, [controls])).toBe(true)
    expect(anchorClear(5, 5, [{ x: -10, y: -10, w: 0, h: 0 }])).toBe(true)
  })
})

describe('P3-T5 O-6: hotspot dots far enough apart to tap each one', () => {
  const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
    Math.hypot(a.x - b.x, a.y - b.y)

  it('separates the Fire pumps and jockey pump dots on a phone card (the owner case)', () => {
    // fire_hotspots.json anchors on a 358 px square card: about 10 px apart before.
    const side = 358
    const pumps = { x: 0.4698 * side, y: 0.6311 * side }
    const jockey = { x: 0.4606 * side, y: 0.6591 * side }
    expect(distance(pumps, jockey)).toBeLessThan(MIN_DOT_SPACING)
    const [a, b] = spreadDots([pumps, jockey], side, side)
    expect(distance(a, b)).toBeGreaterThanOrEqual(MIN_DOT_SPACING - 0.01)
    // Each dot moves only by half of the shortfall, along the line between them.
    expect(distance(a, pumps)).toBeLessThan(MIN_DOT_SPACING / 2)
    // The tap area of one dot (44 px, centred) never covers the other dot (10 px).
    expect(MIN_DOT_SPACING).toBeGreaterThanOrEqual(22 + 5)
    expect(MIN_DOT_SPACING).toBeGreaterThanOrEqual(DOT_CLEARANCE * 2)
  })

  it('leaves dots that are already far enough apart where they are, in order', () => {
    const points = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 100, y: 100 + MIN_DOT_SPACING },
    ]
    expect(spreadDots(points, 600, 580)).toEqual(points)
  })

  it('splits dots on the same spot and clusters of three, keeping them inside the card', () => {
    const same = spreadDots(
      [
        { x: 50, y: 50 },
        { x: 50, y: 50 },
      ],
      600,
      580,
    )
    expect(distance(same[0] ?? { x: 0, y: 0 }, same[1] ?? { x: 0, y: 0 })).toBeGreaterThanOrEqual(
      MIN_DOT_SPACING - 0.01,
    )
    const cluster = spreadDots(
      [
        { x: 300, y: 300 },
        { x: 306, y: 302 },
        { x: 301, y: 308 },
      ],
      600,
      580,
    )
    for (let i = 0; i < cluster.length; i += 1) {
      for (let j = i + 1; j < cluster.length; j += 1) {
        const a = cluster[i] ?? { x: 0, y: 0 }
        const b = cluster[j] ?? { x: 0, y: 0 }
        expect(distance(a, b)).toBeGreaterThanOrEqual(MIN_DOT_SPACING - 0.5)
      }
    }
    const corner = spreadDots(
      [
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ],
      600,
      580,
    )
    for (const dot of corner) {
      expect(dot.x).toBeGreaterThanOrEqual(0)
      expect(dot.y).toBeGreaterThanOrEqual(0)
    }
  })
})
