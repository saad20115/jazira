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
