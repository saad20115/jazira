import type { ReactElement } from 'react'

import { parseCountUpValue } from '@/components/motion/motion'

export interface CountUpProps {
  className?: string
  /** The CMS text, e.g. `45+`, `85%`, `1,200+`. Rendered verbatim on the server. */
  value: string
}

/**
 * Count-up number (§20 catalogue 6 and 9). A server component: the server always renders the
 * final CMS text, so without JavaScript, under reduced motion, or for non-numeric values the
 * number is static and final. When motion is on, the shared controller counts the visible copy
 * from 0 to the value once, on first view, keeping the CMS prefix and suffix. Screen readers
 * always get the final value from the visually hidden copy.
 */
export function CountUp({ value, className }: CountUpProps): ReactElement {
  const parts = parseCountUpValue(value)
  if (!parts) {
    return <span className={className}>{value}</span>
  }
  return (
    <span className={className} data-countup={value}>
      <span aria-hidden="true" data-countup-display="">
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
