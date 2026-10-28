import type { ElementType, ReactElement, ReactNode } from 'react'

import { clampStaggerIndex } from '@/components/motion/motion'

export const REVEAL_VARIANTS = ['fade', 'rise', 'wipe', 'draw'] as const
export type RevealVariant = (typeof REVEAL_VARIANTS)[number]

export interface RevealProps {
  /** Element to render (defaults to `div`). */
  as?: ElementType
  children?: ReactNode
  className?: string
  id?: string
  /**
   * When true, the element's direct children reveal one after another (`--stagger`, at most 6
   * steps). Otherwise the element reveals as one block.
   */
  stagger?: boolean
  /** 0-based delay step for single reveals in a row (clamped to 0..5). */
  step?: number
  /**
   * `fade` (default): fade + rise by `--reveal-distance`.
   * `rise`: translate only, opacity never changes (used for the hero h1, the LCP element).
   * `wipe`: `clip-path` wipe from inline-start (photos).
   * `draw`: `clip-path` draw-in from the top inline-start corner (decorative brackets).
   */
  variant?: RevealVariant
}

/**
 * Builds the data attributes for a reveal target. Use it directly on elements that cannot be
 * wrapped (e.g. a `<section>` you already render, or a component that spreads extra props).
 */
export function revealAttributes({
  stagger = false,
  step,
  variant = 'fade',
}: Pick<RevealProps, 'stagger' | 'step' | 'variant'> = {}): Record<string, string> {
  const attrs: Record<string, string> = {}
  if (stagger) {
    attrs['data-reveal-stagger'] = ''
  } else {
    attrs['data-reveal'] = variant
  }
  const clampedStep = typeof step === 'number' ? clampStaggerIndex(step) : 0
  if (clampedStep > 0) {
    attrs['data-reveal-step'] = String(clampedStep)
  }
  return attrs
}

/**
 * Section / card-group reveal primitive (§20 catalogue 1). A server component: it only renders
 * data attributes. The hidden "before reveal" state exists only under `html[data-motion="on"]`
 * (see `src/styles/motion.css`), so without JavaScript the content is simply visible.
 */
export function Reveal({
  as: Tag = 'div',
  children,
  className,
  id,
  stagger = false,
  step,
  variant = 'fade',
}: RevealProps): ReactElement {
  return (
    <Tag className={className} id={id} {...revealAttributes({ stagger, step, variant })}>
      {children}
    </Tag>
  )
}
