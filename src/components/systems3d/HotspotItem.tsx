'use client'

import { type ReactElement, useState } from 'react'

import styles from './InteractiveSystemsSection.module.css'

export interface HotspotItemProps {
  text: string
  anchorRef: (el: HTMLLIElement | null) => void
  pillRef: (el: HTMLSpanElement | null) => void
}

/**
 * One hotspot: a dot at the anchor and its label pill. The dot is a button (accessible name = the
 * label): on phones only the dot shows and a tap expands the label (§8c); on larger screens the
 * label is always shown, so the toggle has no visible effect there.
 */
export function HotspotItem({ text, anchorRef, pillRef }: HotspotItemProps): ReactElement {
  const [expanded, setExpanded] = useState(false)
  return (
    <li className={styles.hotspot} data-expanded={expanded ? 'true' : 'false'} ref={anchorRef}>
      <button
        aria-expanded={expanded}
        aria-label={text}
        className={styles.hotspotDot}
        onClick={(event) => {
          event.stopPropagation()
          setExpanded((value) => !value)
        }}
        type="button"
      />
      <span aria-hidden="true" className={`${styles.hotspotLabel} t-caption`} ref={pillRef}>
        {text}
      </span>
    </li>
  )
}
