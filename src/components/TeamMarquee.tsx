'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'

import type { AvatarFallbackMode } from '@/components/Avatar'
import { TeamMember } from '@/components/TeamMember'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'
import type { Team } from '@/payload-types'

import styles from './TeamMarquee.module.css'

export type TeamMarqueePosition = 'A' | 'B'
export type MarqueeTeamItem = Pick<Team, 'id' | 'name' | 'position' | 'photo'>

export interface TeamMarqueeProps {
  avatarFallbackMode?: AvatarFallbackMode
  className?: string
  locale?: SupportedLocale
  members?: readonly MarqueeTeamItem[]
  position?: TeamMarqueePosition
  row1Members?: readonly MarqueeTeamItem[]
  row2Members?: readonly MarqueeTeamItem[]
}

function splitIntoTwoRows<T>(items: readonly T[]): [readonly T[], readonly T[]] {
  if (items.length <= 1) {
    return [items, items]
  }
  const mid = Math.ceil(items.length / 2)
  return [items.slice(0, mid), items.slice(mid)]
}

/**
 * Figma component `TeamMarquee` (`151:964`, `design/context/components/team-marquee.md`).
 * Infinite 2-row engineering team marquee (`TeamMember` cards) with opposite scroll directions,
 * pause on hover/focus/offscreen, `aria-hidden` duplicated loop tracks, and `prefers-reduced-motion: reduce` fallback.
 */
export function TeamMarquee({
  members = [],
  row1Members,
  row2Members,
  locale = DEFAULT_LOCALE,
  position,
  avatarFallbackMode = 'silhouette',
  className,
}: TeamMarqueeProps): ReactElement | null {
  const dict = getDictionary(locale)
  const containerRef = useRef<HTMLElement | null>(null)
  const [isOffscreen, setIsOffscreen] = useState(false)
  const [isUserPaused, setIsUserPaused] = useState(false)

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

  const [defaultRow1, defaultRow2] = splitIntoTwoRows(members)
  const resolvedRow1 = row1Members ?? defaultRow1
  const resolvedRow2 = row2Members ?? defaultRow2

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
  const pauseLabel = isUserPaused ? dict.marquee.playMarquee : dict.marquee.pauseMarquee

  return (
    <section
      ref={containerRef}
      aria-label={dict.marquee.teamRegionLabel}
      className={rootClasses}
      data-component="team-marquee"
      data-position={position ?? 'live'}
      data-offscreen={isOffscreen ? 'true' : 'false'}
      data-paused={isUserPaused ? 'true' : 'false'}
    >
      {position === undefined ? (
        <div className={styles.controlsBar}>
          <button
            type="button"
            onClick={() => {
              setIsUserPaused((prev) => !prev)
            }}
            aria-pressed={isUserPaused}
            aria-label={pauseLabel}
            className={styles.pauseButton}
            data-marquee-action="toggle-pause"
          >
            {isUserPaused ? (
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3.5 2.5L11.5 7L3.5 11.5V2.5Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="3" y="2.5" width="2.75" height="9" rx="1" fill="currentColor" />
                <rect x="8.25" y="2.5" width="2.75" height="9" rx="1" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      ) : null}

      <div className={styles.rowViewport} data-row="1">
        <div className={row1TrackClass}>
          <div className={styles.group} data-marquee-group="primary">
            {resolvedRow1.map((member, idx) => (
              <TeamMember
                key={`r1-p-${String(member.id)}-${String(idx)}`}
                member={member}
                avatarFallbackMode={avatarFallbackMode}
              />
            ))}
          </div>
          <div
            className={`${styles.group} ${styles.duplicateGroup}`}
            data-marquee-group="duplicate"
            aria-hidden="true"
          >
            {resolvedRow1.map((member, idx) => (
              <TeamMember
                key={`r1-d-${String(member.id)}-${String(idx)}`}
                member={member}
                avatarFallbackMode={avatarFallbackMode}
              />
            ))}
          </div>
        </div>
      </div>

      {resolvedRow2.length > 0 ? (
        <div className={styles.rowViewport} data-row="2">
          <div className={row2TrackClass}>
            <div className={styles.group} data-marquee-group="primary">
              {resolvedRow2.map((member, idx) => (
                <TeamMember
                  key={`r2-p-${String(member.id)}-${String(idx)}`}
                  member={member}
                  avatarFallbackMode={avatarFallbackMode}
                />
              ))}
            </div>
            <div
              className={`${styles.group} ${styles.duplicateGroup}`}
              data-marquee-group="duplicate"
              aria-hidden="true"
            >
              {resolvedRow2.map((member, idx) => (
                <TeamMember
                  key={`r2-d-${String(member.id)}-${String(idx)}`}
                  member={member}
                  avatarFallbackMode={avatarFallbackMode}
                />
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
