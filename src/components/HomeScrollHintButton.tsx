'use client'

import type { ReactElement } from 'react'

import { ChevronDownIcon } from '@/components/icons'

export interface HomeScrollHintButtonProps {
  className?: string
  iconClassName?: string
  label: string
  labelClassName?: string
  targetId?: string
}

export function HomeScrollHintButton({
  label,
  targetId = 'who-we-are',
  className,
  labelClassName,
  iconClassName,
}: HomeScrollHintButtonProps): ReactElement {
  const handleClick = (): void => {
    if (typeof document === 'undefined') {
      return
    }
    const target =
      document.getElementById(targetId) ??
      document.querySelector('[data-home-section]:not([data-home-section="hero"])')
    if (target && typeof target.scrollIntoView === 'function') {
      const reducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }

  return (
    <button
      aria-label={label}
      className={className}
      data-home-scroll-hint="true"
      onClick={handleClick}
      type="button"
    >
      <span className={labelClassName}>{label}</span>
      <span aria-hidden="true" className={iconClassName}>
        <ChevronDownIcon size={18} />
      </span>
    </button>
  )
}
