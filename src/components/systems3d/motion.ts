/**
 * Pure camera and motion maths for the live 3D card (`handoff/tasks/P3-T5.md`; contract:
 * `extras-schema.md` v021 `enter_motion`, v022 `turntable`, `hero_shift_y`). No three.js import.
 */

import type { CubicBezier } from './contract'

export interface ViewOffset {
  fullWidth: number
  fullHeight: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

/**
 * The live camera must show exactly what the square still shows under `object-fit: cover`
 * (`object-position: center`): the card (`width × height`) is a centred window of a virtual square
 * frame of side `max(width, height)`, and CAM_hero's lens shift moves that window down by
 * `shiftY × side` (`camera.setViewOffset`; the camera's aspect stays 1, as rendered).
 */
export function coverViewOffset(width: number, height: number, shiftY: number): ViewOffset {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const side = Math.max(w, h)
  return {
    fullWidth: side,
    fullHeight: side,
    offsetX: (side - w) / 2,
    offsetY: (side - h) / 2 + shiftY * side,
    width: w,
    height: h,
  }
}

/** CSS `cubic-bezier(x1, y1, x2, y2)` as a function of linear time (Newton on x, then y). */
export function cubicBezier([x1, y1, x2, y2]: CubicBezier): (x: number) => number {
  const bx = (t: number): number => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3
  const by = (t: number): number => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3
  const dx = (t: number): number =>
    3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t
  return (input: number): number => {
    const x = Math.min(1, Math.max(0, input))
    let t = x
    for (let i = 0; i < 8; i += 1) {
      const slope = dx(t)
      if (Math.abs(slope) < 1e-6) {
        break
      }
      t = Math.min(1, Math.max(0, t - (bx(t) - x) / slope))
    }
    return by(t)
  }
}

const TAU = Math.PI * 2

/** Wraps an angle to (−π, π], i.e. the shortest way back to 0. */
export function shortestAngle(angle: number): number {
  const wrapped = ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI
  return wrapped === -Math.PI ? Math.PI : wrapped
}

/** Turntable angle after `dtS` seconds at `rpm`, kept in [0, 2π). */
export function advanceTurntable(angle: number, rpm: number, dtS: number): number {
  const next = angle + (rpm / 60) * TAU * Math.max(0, dtS)
  return ((next % TAU) + TAU) % TAU
}

/**
 * Ease-back before a system entry: from `fromAngle` (already the shortest signed angle) to 0 over
 * `durationS` with the enter-motion easing. Returns the angle at `elapsedS` and whether it is done.
 */
export function easeBackAngle(
  fromAngle: number,
  elapsedS: number,
  durationS: number,
  ease: (x: number) => number,
): { angle: number; done: boolean } {
  if (durationS <= 0 || elapsedS >= durationS) {
    return { angle: 0, done: true }
  }
  const t = Math.max(0, elapsedS) / durationS
  return { angle: fromAngle * (1 - ease(t)), done: false }
}

/** Whether the idle turntable may turn (contract: idle only, motion allowed, no input for a while). */
export function turntableMayTurn(state: {
  reducedMotion: boolean
  tabVisible: boolean
  onScreen: boolean
  systemEntered: boolean
  moving: boolean
  sinceInputS: number
  resumeAfterS: number
}): boolean {
  return (
    !state.reducedMotion &&
    state.tabVisible &&
    state.onScreen &&
    !state.systemEntered &&
    !state.moving &&
    state.sinceInputS >= state.resumeAfterS
  )
}
