import type { ReactElement, ReactNode } from 'react'

import styles from './Eyebrow.module.css'

export const EYEBROW_TONES = ['Light', 'Dark'] as const
export type EyebrowTone = (typeof EYEBROW_TONES)[number]

export interface EyebrowProps {
  children?: ReactNode
  className?: string
  label?: string
  tone?: EyebrowTone
}

export function Eyebrow({
  tone = 'Light',
  label,
  children,
  className,
}: EyebrowProps): ReactElement {
  const classes = [
    styles.eyebrow,
    tone === 'Dark' ? styles.toneDark : styles.toneLight,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} data-component="eyebrow" data-eyebrow-tone={tone}>
      <span aria-hidden="true" className={styles.dot} />
      <span className={styles.text}>{children ?? label}</span>
    </span>
  )
}
