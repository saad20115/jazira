import { describe, expect, it } from 'vitest'

import {
  advanceTurntable,
  coverViewOffset,
  cubicBezier,
  easeBackAngle,
  shortestAngle,
  turntableMayTurn,
} from '@/components/systems3d/motion'

const HERO_SHIFT = 0.1475

describe('P3-T5 camera framing: the live camera crops like object-fit: cover on the square still', () => {
  it('a square card shows the whole shifted square frame', () => {
    expect(coverViewOffset(800, 800, HERO_SHIFT)).toEqual({
      fullWidth: 800,
      fullHeight: 800,
      offsetX: 0,
      offsetY: HERO_SHIFT * 800,
      width: 800,
      height: 800,
    })
  })

  it('a wide card (600×580 desktop) crops top and bottom equally, plus the lens shift', () => {
    const v = coverViewOffset(600, 580, HERO_SHIFT)
    expect(v.fullWidth).toBe(600)
    expect(v.fullHeight).toBe(600)
    expect(v.offsetX).toBe(0)
    expect(v.offsetY).toBeCloseTo(10 + HERO_SHIFT * 600, 10)
    expect([v.width, v.height]).toEqual([600, 580])
  })

  it('a tall card crops left and right equally', () => {
    const v = coverViewOffset(390, 520, 0)
    expect(v.fullWidth).toBe(520)
    expect(v.offsetX).toBe(65)
    expect(v.offsetY).toBe(0)
  })

  it('maps every still pixel to the same card pixel as CSS cover does', () => {
    for (const [w, h] of [
      [600, 580],
      [1200, 440],
      [390, 390],
      [360, 640],
    ] as const) {
      const v = coverViewOffset(w, h, HERO_SHIFT)
      const side = Math.max(w, h)
      for (const [u, vv] of [
        [0.5, 0.5],
        [0.1, 0.9],
        [0.73, 0.21],
      ] as const) {
        // CSS cover of the (already lens-shifted) square still, centred:
        const cssX = u * side - (side - w) / 2
        const cssY = vv * side - (side - h) / 2
        // The same point in the camera's full frame sits at (u, vv + shift) of the unshifted frame:
        const camX = u * side - v.offsetX
        const camY = (vv + HERO_SHIFT) * side - v.offsetY
        expect(camX).toBeCloseTo(cssX, 9)
        expect(camY).toBeCloseTo(cssY, 9)
      }
    }
  })

  it('never returns a zero or negative size', () => {
    const v = coverViewOffset(0, -5, 0)
    expect(v.width).toBe(1)
    expect(v.height).toBe(1)
  })
})

describe('P3-T5 easing and turntable maths', () => {
  it('cubicBezier matches CSS: endpoints, identity, symmetry and the "ease" curve', () => {
    const enter = cubicBezier([0.65, 0, 0.35, 1])
    expect(enter(0)).toBe(0)
    expect(enter(1)).toBeCloseTo(1, 12)
    expect(enter(0.5)).toBeCloseTo(0.5, 6)
    expect(enter(0.25) + enter(0.75)).toBeCloseTo(1, 6)
    expect(enter(-1)).toBe(0)
    expect(enter(2)).toBeCloseTo(1, 12)
    const linear = cubicBezier([0, 0, 1, 1])
    for (const x of [0.1, 0.33, 0.9]) {
      expect(linear(x)).toBeCloseTo(x, 6)
    }
    // CSS `ease` = cubic-bezier(.25, .1, .25, 1); its value at 50% is 0.8024 (to 4 places).
    expect(cubicBezier([0.25, 0.1, 0.25, 1])(0.5)).toBeCloseTo(0.8024, 3)
    let previous = -1
    for (let x = 0; x <= 1; x += 0.01) {
      const y = enter(x)
      expect(y).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = y
    }
  })

  it('shortestAngle takes the short way home', () => {
    expect(shortestAngle(0)).toBe(0)
    expect(shortestAngle((3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2, 12)
    expect(shortestAngle((-3 * Math.PI) / 2)).toBeCloseTo(Math.PI / 2, 12)
    expect(shortestAngle(Math.PI)).toBeCloseTo(Math.PI, 12)
    expect(shortestAngle(-Math.PI)).toBeCloseTo(Math.PI, 12)
    expect(shortestAngle(5 * Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1, 9)
  })

  it('advanceTurntable turns rpm/60 turns per second, wrapped to [0, 2π)', () => {
    expect(advanceTurntable(0, 0.6, 1)).toBeCloseTo((0.6 / 60) * 2 * Math.PI, 12)
    expect(advanceTurntable(0, 0.6, 100)).toBeCloseTo(0, 9)
    expect(advanceTurntable(1, 0.6, -5)).toBe(1)
    const a = advanceTurntable(6, 60, 0.5)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(2 * Math.PI)
  })

  it('easeBackAngle runs from the start angle to exactly 0 over the duration', () => {
    const ease = cubicBezier([0.65, 0, 0.35, 1])
    expect(easeBackAngle(1.2, 0, 0.7, ease)).toEqual({ angle: 1.2, done: false })
    expect(easeBackAngle(1.2, 0.35, 0.7, ease).angle).toBeCloseTo(0.6, 6)
    expect(easeBackAngle(1.2, 0.7, 0.7, ease)).toEqual({ angle: 0, done: true })
    expect(easeBackAngle(-0.4, 9, 0.7, ease)).toEqual({ angle: 0, done: true })
    expect(easeBackAngle(1, 0.1, 0, ease)).toEqual({ angle: 0, done: true })
  })

  it('the turntable turns only when every idle condition holds', () => {
    const idle = {
      reducedMotion: false,
      tabVisible: true,
      onScreen: true,
      systemEntered: false,
      moving: false,
      sinceInputS: 8,
      resumeAfterS: 8,
    }
    expect(turntableMayTurn(idle)).toBe(true)
    expect(turntableMayTurn({ ...idle, reducedMotion: true })).toBe(false)
    expect(turntableMayTurn({ ...idle, tabVisible: false })).toBe(false)
    expect(turntableMayTurn({ ...idle, onScreen: false })).toBe(false)
    expect(turntableMayTurn({ ...idle, systemEntered: true })).toBe(false)
    expect(turntableMayTurn({ ...idle, moving: true })).toBe(false)
    expect(turntableMayTurn({ ...idle, sinceInputS: 7.99 })).toBe(false)
  })
})
