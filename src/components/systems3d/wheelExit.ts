/**
 * O-18 (owner 2026-11-05, addendum 5): inside a system, with the card active, zooming out with the
 * wheel past that system's zoom-out limit exits the system (the same exit as Escape or the header).
 *
 * Guard against a slip: the exit needs a deliberate wheel-out that starts at the limit.
 * - A wheel gesture is a run of wheel events with less than `WHEEL_EXIT_PAUSE_MS` between them. A
 *   trackpad's momentum is one gesture, however long it runs.
 * - Only a gesture that starts with the camera already at the limit can exit, and only once it has
 *   zoomed out by `WHEEL_EXIT_DELTA_PX` there. So the tick (or the flick) that reaches the limit stops
 *   there; a further wheel-out after a pause exits.
 * - A wheel-in in the gesture, or the camera leaving the limit, cancels it.
 * Pure: the caller reads the wheel event and the camera.
 */

/** A new wheel gesture starts after this long without a wheel event (ms). */
export const WHEEL_EXIT_PAUSE_MS = 300
/** The wheel-out (in CSS pixels) a gesture that starts at the limit needs before it exits. */
export const WHEEL_EXIT_DELTA_PX = 50
/** The camera is at the zoom-out limit when its distance is at least this share of it. */
export const WHEEL_LIMIT_SHARE = 0.995

export interface WheelExitState {
  /** When the last wheel event came (ms), or null before the first. */
  lastWheelAt: number | null
  /** The current gesture started with the camera at the limit (and is still there, zooming out). */
  armed: boolean
  /** Wheel-out in the current gesture so far, while armed (px). */
  outPx: number
}

export const WHEEL_EXIT_START: WheelExitState = { lastWheelAt: null, armed: false, outPx: 0 }

export interface WheelSample {
  /** `event.timeStamp` (ms). */
  time: number
  /** Positive = zoom out (the wheel's `deltaY`), in CSS pixels. */
  deltaPx: number
  /** The camera is at the zoom-out limit before this event is applied. */
  atLimit: boolean
  /** A system is entered, at rest, and the card is active: the only state where an exit counts. */
  eligible: boolean
}

/** The wheel's `deltaY` in CSS pixels (lines and pages as the browsers scroll them). */
export function wheelDeltaPx(deltaY: number, deltaMode: number, pageHeight: number): number {
  if (deltaMode === 1) {
    return deltaY * 16
  }
  if (deltaMode === 2) {
    return deltaY * pageHeight
  }
  return deltaY
}

/** Whether the camera is at the zoom-out limit (`distance` from the orbit target). */
export function atZoomOutLimit(distance: number, maxDistance: number): boolean {
  return Number.isFinite(maxDistance) && distance >= maxDistance * WHEEL_LIMIT_SHARE
}

export function wheelExitStep(
  state: WheelExitState,
  sample: WheelSample,
): { state: WheelExitState; exit: boolean } {
  const newGesture =
    state.lastWheelAt === null || sample.time - state.lastWheelAt >= WHEEL_EXIT_PAUSE_MS
  let armed = newGesture ? sample.eligible && sample.atLimit : state.armed
  let outPx = newGesture ? 0 : state.outPx
  if (!sample.eligible || !sample.atLimit || sample.deltaPx <= 0) {
    armed = false
    outPx = 0
  } else if (armed) {
    outPx += sample.deltaPx
  }
  if (armed && outPx >= WHEEL_EXIT_DELTA_PX) {
    return { state: { lastWheelAt: sample.time, armed: false, outPx: 0 }, exit: true }
  }
  return { state: { lastWheelAt: sample.time, armed, outPx }, exit: false }
}
