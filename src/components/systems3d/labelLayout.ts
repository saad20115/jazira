/** Label placement for the stills-tier hotspot labels (pure; no DOM). */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const GAP = 10
const MARGIN = 4

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/**
 * Where the label pill goes relative to its anchor: above, below, right or left, the first spot
 * that stays inside the card and clear of the obstacles (panel, buttons, earlier pills).
 */
export function choosePillSpot(
  x: number,
  y: number,
  w: number,
  h: number,
  cardWidth: number,
  cardHeight: number,
  obstacles: readonly Rect[],
): { dx: number; dy: number } | null {
  const candidates = [
    { dx: -w / 2, dy: -h - GAP },
    { dx: -w / 2, dy: GAP },
    { dx: GAP, dy: -h / 2 },
    { dx: -w - GAP, dy: -h / 2 },
  ]
  for (const spot of candidates) {
    const rect = { x: x + spot.dx, y: y + spot.dy, w, h }
    const fits =
      rect.x >= MARGIN &&
      rect.y >= MARGIN &&
      rect.x + w <= cardWidth - MARGIN &&
      rect.y + h <= cardHeight - MARGIN
    if (fits && !obstacles.some((o) => overlaps(rect, o))) {
      return spot
    }
  }
  return null
}

/**
 * Half of the 24 px circle that must stay clear around a hotspot dot (WCAG 2.5.8 target spacing).
 * The card's controls sit above the labels, so a dot under one could be seen but not tapped.
 */
export const DOT_CLEARANCE = 12

/** Whether a hotspot dot at (x, y) is clear of every visible obstacle (controls, panel). */
export function anchorClear(x: number, y: number, obstacles: readonly Rect[]): boolean {
  const target = {
    x: x - DOT_CLEARANCE,
    y: y - DOT_CLEARANCE,
    w: DOT_CLEARANCE * 2,
    h: DOT_CLEARANCE * 2,
  }
  return !obstacles.some((o) => o.w > 0 && o.h > 0 && overlaps(target, o))
}

/**
 * O-6 (owner review 2026-11-02): the smallest distance between two hotspot dot centres. Two dots this
 * far apart keep their 24 px target circles apart (WCAG 2.5.8), and the 44 px tap area of one never
 * covers the other dot, so every dot can be tapped (the Fire pumps under the jockey pump on phones).
 */
export const MIN_DOT_SPACING = 28

const SPREAD_PASSES = 8

/**
 * Moves dots that are closer than `MIN_DOT_SPACING` apart, each pair by half the shortfall along the
 * line between them (a few passes), kept inside the card. Dots already far enough apart stay where
 * they are; the order of the input is kept.
 */
export function spreadDots(
  points: readonly { x: number; y: number }[],
  cardWidth: number,
  cardHeight: number,
): { x: number; y: number }[] {
  const out = points.map(({ x, y }) => ({ x, y }))
  const clamp = (value: number, max: number): number =>
    Math.min(Math.max(value, MARGIN), Math.max(MARGIN, max - MARGIN))
  for (let pass = 0; pass < SPREAD_PASSES; pass += 1) {
    let moved = false
    for (let i = 0; i < out.length; i += 1) {
      for (let j = i + 1; j < out.length; j += 1) {
        const a = out[i]
        const b = out[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let distance = Math.hypot(dx, dy)
        if (distance >= MIN_DOT_SPACING) {
          continue
        }
        if (distance < 0.01) {
          // Same spot: split them vertically, the later one below.
          dx = 0
          dy = 1
          distance = 1
        }
        const push = (MIN_DOT_SPACING - distance) / 2
        const ux = dx / distance
        const uy = dy / distance
        a.x = clamp(a.x - ux * push, cardWidth)
        a.y = clamp(a.y - uy * push, cardHeight)
        b.x = clamp(b.x + ux * push, cardWidth)
        b.y = clamp(b.y + uy * push, cardHeight)
        moved = true
      }
    }
    if (!moved) {
      break
    }
  }
  return out
}
