import { describe, expect, it } from 'vitest'

import { choosePillSpot } from '@/components/systems3d/labelLayout'

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
})
