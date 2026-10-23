'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'

import { BrandTile } from '@/components/BrandTile'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'
import type { Brand } from '@/payload-types'

import styles from './LogoMarquee.module.css'

export type LogoMarqueePosition = 'A' | 'B'
export type MarqueeBrandItem = Pick<Brand, 'id' | 'name' | 'origin' | 'logo' | 'website'>

export interface LogoMarqueeProps {
  brands?: readonly MarqueeBrandItem[]
  className?: string
  locale?: SupportedLocale
  position?: LogoMarqueePosition
  row1Brands?: readonly MarqueeBrandItem[]
  row2Brands?: readonly MarqueeBrandItem[]
}

function splitIntoTwoRows<T>(items: readonly T[]): [readonly T[], readonly T[]] {
  if (items.length <= 1) {
    return [items, items]
  }
  const mid = Math.ceil(items.length / 2)
  return [items.slice(0, mid), items.slice(mid)]
}

/**
 * Figma component `LogoMarquee` (`18:576`, `design/context/components/logo-marquee.md`).
 * Infinite 2-row partner brand marquee with opposite scroll directions, pause on hover/focus/offscreen,
 * `aria-hidden` duplicated loop tracks, and `prefers-reduced-motion: reduce` static fallback.
 */
export function LogoMarquee({
  brands = [],
  row1Brands,
  row2Brands,
  locale = DEFAULT_LOCALE,
  position,
  className,
}: LogoMarqueeProps): ReactElement | null {
  const dict = getDictionary(locale)
  const containerRef = useRef<HTMLElement | null>(null)
  const [isOffscreen, setIsOffscreen] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsOffscreen(!entry.isIntersecting)
        }
      },
      { threshold: 0.01 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
    }
  }, [])

  const [defaultRow1, defaultRow2] = splitIntoTwoRows(brands)
  const resolvedRow1 = row1Brands ?? defaultRow1
  const resolvedRow2 = row2Brands ?? defaultRow2

  if (resolvedRow1.length === 0 && resolvedRow2.length === 0) {
    return null
  }

  const row1TrackClass = [
    styles.track,
    position === 'A'
      ? styles.posARow1
      : position === 'B'
        ? styles.posBRow1
        : styles.trackRow1Live,
  ]
    .filter(Boolean)
    .join(' ')

  const row2TrackClass = [
    styles.track,
    position === 'A'
      ? styles.posARow2
      : position === 'B'
        ? styles.posBRow2
        : styles.trackRow2Live,
  ]
    .filter(Boolean)
    .join(' ')

  const rootClasses = [styles.marquee, className ?? ''].filter(Boolean).join(' ')

  return (
    <section
      ref={containerRef}
      aria-label={dict.marquee.partnersRegionLabel}
      className={rootClasses}
      data-component="logo-marquee"
      data-position={position ?? 'live'}
      data-offscreen={isOffscreen ? 'true' : 'false'}
    >
      <div className={styles.rowViewport} data-row="1">
        <div className={row1TrackClass}>
          <div className={styles.group} data-marquee-group="primary">
            {resolvedRow1.map((brand, idx) => (
              <BrandTile key={`r1-p-${String(brand.id)}-${String(idx)}`} brand={brand} />
            ))}
          </div>
          <div
            className={`${styles.group} ${styles.duplicateGroup}`}
            data-marquee-group="duplicate"
            aria-hidden="true"
          >
            {resolvedRow1.map((brand, idx) => (
              <BrandTile key={`r1-d-${String(brand.id)}-${String(idx)}`} brand={brand} />
            ))}
          </div>
        </div>
      </div>

      {resolvedRow2.length > 0 ? (
        <div className={styles.rowViewport} data-row="2">
          <div className={row2TrackClass}>
            <div className={styles.group} data-marquee-group="primary">
              {resolvedRow2.map((brand, idx) => (
                <BrandTile key={`r2-p-${String(brand.id)}-${String(idx)}`} brand={brand} />
              ))}
            </div>
            <div
              className={`${styles.group} ${styles.duplicateGroup}`}
              data-marquee-group="duplicate"
              aria-hidden="true"
            >
              {resolvedRow2.map((brand, idx) => (
                <BrandTile key={`r2-d-${String(brand.id)}-${String(idx)}`} brand={brand} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.edgeFadeStart} aria-hidden="true" />
      <div className={styles.edgeFadeEnd} aria-hidden="true" />
    </section>
  )
}
