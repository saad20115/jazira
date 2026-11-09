import { describe, expect, it } from 'vitest'

import {
  atZoomOutLimit,
  WHEEL_EXIT_DELTA_PX,
  WHEEL_EXIT_PAUSE_MS,
  WHEEL_EXIT_START,
  type WheelSample,
  wheelDeltaPx,
  wheelExitStep,
} from '@/components/systems3d/wheelExit'

/** Feeds the samples in order; returns the index of each sample that exits. */
function exitsOf(samples: readonly WheelSample[]): number[] {
  let state = WHEEL_EXIT_START
  const exits: number[] = []
  samples.forEach((sample, i) => {
    const step = wheelExitStep(state, sample)
    state = step.state
    if (step.exit) {
      exits.push(i)
    }
  })
  return exits
}

const sample = (time: number, deltaPx: number, atLimit: boolean, eligible = true): WheelSample => ({
  time,
  deltaPx,
  atLimit,
  eligible,
})

describe('P3-T5 O-18: a wheel-out past the limit exits the system, never by a slip', () => {
  it('mouse: the tick that reaches the limit stops there; a further tick after a pause exits', () => {
    // Ticks 100 ms apart: one gesture. The camera reaches the limit with the third.
    const reaching = [sample(0, 100, false), sample(100, 100, false), sample(200, 100, false)]
    const sameGesture = [sample(300, 100, true), sample(400, 100, true)]
    expect(exitsOf([...reaching, ...sameGesture])).toEqual([])
    // After a pause, one more tick out exits.
    const later = sample(400 + WHEEL_EXIT_PAUSE_MS, 100, true)
    expect(exitsOf([...reaching, ...sameGesture, later])).toEqual([5])
    // Just short of the pause it is still the same gesture.
    const tooSoon = sample(400 + WHEEL_EXIT_PAUSE_MS - 1, 100, true)
    expect(exitsOf([...reaching, ...sameGesture, tooSoon])).toEqual([])
  })

  it('trackpad: momentum that runs into the limit never exits by itself', () => {
    const momentum: WheelSample[] = []
    for (let i = 0; i < 200; i += 1) {
      // Every 16 ms, small deltas; the limit comes a third of the way in.
      momentum.push(sample(i * 16, 12, i > 60))
    }
    expect(exitsOf(momentum)).toEqual([])
  })

  it('a deliberate trackpad wheel-out that starts at the limit exits once it adds up', () => {
    const small = Math.ceil(WHEEL_EXIT_DELTA_PX / 5)
    const gesture: WheelSample[] = []
    for (let i = 0; i < 10; i += 1) {
      gesture.push(sample(1000 + i * 16, small, true))
    }
    // Before 5 small steps it has not added up; the fifth exits.
    expect(exitsOf(gesture)).toEqual([4])
  })

  it('a wheel-in, or the camera off the limit, cancels; a wheel-in never exits', () => {
    const half = WHEEL_EXIT_DELTA_PX / 2
    expect(
      exitsOf([sample(0, half, true), sample(16, -half, true), sample(32, half, true)]),
    ).toEqual([])
    expect(
      exitsOf([sample(0, half, true), sample(16, half, false), sample(32, half, true)]),
    ).toEqual([])
    expect(exitsOf([sample(0, -500, true), sample(1000, -500, true)])).toEqual([])
  })

  it('only while eligible: not during a flight, outside a system or with the card inactive', () => {
    expect(exitsOf([sample(0, 500, true, false), sample(1000, 500, true, false)])).toEqual([])
    // A gesture that starts ineligible stays unarmed, even if it becomes eligible.
    expect(exitsOf([sample(0, 100, true, false), sample(100, 100, true)])).toEqual([])
  })

  it('reads the limit and the wheel units', () => {
    expect(atZoomOutLimit(51.34, 51.34)).toBe(true)
    expect(atZoomOutLimit(50, 51.34)).toBe(false)
    expect(atZoomOutLimit(10, Infinity)).toBe(false)
    expect(wheelDeltaPx(3, 1, 900)).toBe(48)
    expect(wheelDeltaPx(1, 2, 900)).toBe(900)
    expect(wheelDeltaPx(100, 0, 900)).toBe(100)
  })
})
