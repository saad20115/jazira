'use client'

import type { AnimationEvent, ReactElement } from 'react'

import styles from './InteractiveSystemsSection.module.css'

/**
 * An index-finger hand in a 64 × 64 box, as one outline (fingertip at 30, 6): the index finger up,
 * the thumb on the left, three folded knuckles on the right.
 */
const HAND_PATH =
  'M30 6c-2.2 0-4 1.8-4 4v20l-3.2-3.2c-1.6-1.6-4.1-1.6-5.7 0s-1.6 4.1 0 5.7L28 44c3 3 7 4.7 11.3 4.7H42' +
  'c7.7 0 14-6.3 14-14V26c0-2.2-1.8-4-4-4s-4 1.8-4 4v-2c0-2.2-1.8-4-4-4s-4 1.8-4 4v-2' +
  'c0-2.2-1.8-4-4-4c-0.8 0-1.5 0.2-2 0.6V10c0-2.2-1.8-4-4-4z'

export interface TapHintProps {
  /** Reduced motion: drawn in full and still, then it fades (no animation). */
  still: boolean
  /** Off screen: the animation waits. */
  paused: boolean
  /** Fading out (the still version). */
  leaving: boolean
  /** One cycle is over (the animated version). */
  onEnd: () => void
}

/**
 * O-7 (owner, 2026-11-02, `docs/05-design.md` §21): a hand drawn in neon-white light that draws
 * itself, taps the image twice (a press and a ring of light) and fades. A hint only: it is never a
 * target (`pointer-events: none`, `aria-hidden`) and starts nothing.
 */
export function TapHint({ still, paused, leaving, onEnd }: TapHintProps): ReactElement {
  const onAnimationEnd = (event: AnimationEvent<SVGSVGElement>): void => {
    if (event.target === event.currentTarget) {
      onEnd()
    }
  }
  return (
    <svg
      aria-hidden="true"
      className={styles.tapHint}
      data-leaving={leaving ? 'true' : 'false'}
      data-paused={paused ? 'true' : 'false'}
      data-tap-hint={still ? 'still' : 'play'}
      focusable="false"
      onAnimationEnd={onAnimationEnd}
      viewBox="0 0 64 64"
    >
      <circle className={styles.tapHintRing} cx="30" cy="6" r="9" />
      <g className={styles.tapHintHand}>
        <path className={styles.tapHintStroke} d={HAND_PATH} pathLength={1} />
      </g>
    </svg>
  )
}
