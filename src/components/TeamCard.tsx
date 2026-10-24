'use client'

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react'

import { CmsLink } from '@/components/CmsLink'
import { SocialIcon } from '@/components/icons'
import { Portrait } from '@/components/Portrait'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'
import type { Team } from '@/payload-types'

import styles from './TeamCard.module.css'

export type TeamCardState =
  | 'Default'
  | 'Hover'
  | 'Enter 1'
  | 'Enter 2'
  | 'Enter 3'
  | 'Enter 4'
  | 'Enter 5'

export interface TeamCardProps {
  animateOnScroll?: boolean
  className?: string
  enterDelayMs?: number
  fallbackImageUrl?: string
  locale?: SupportedLocale
  member: Pick<Team, 'name' | 'position' | 'photo' | 'linkedin' | 'bio'>
  state?: TeamCardState
}

const STATE_CLASS_MAP: Record<TeamCardState, string> = {
  Default: '',
  Hover: styles.stateHover,
  'Enter 1': styles.stateEnter1,
  'Enter 2': styles.stateEnter2,
  'Enter 3': styles.stateEnter3,
  'Enter 4': styles.stateEnter4,
  'Enter 5': styles.stateEnter5,
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  mql.addEventListener('change', onStoreChange)
  return () => { mql.removeEventListener('change', onStoreChange) }
}

function getReducedMotionSnapshot(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

function getReducedMotionServerSnapshot(): boolean {
  return false
}

/**
 * Figma component `TeamCard` (`150:596`, `design/context/components/team-card.md`).
 * Renders a `264×340` executive leadership portrait card with `Default`, `Hover`, and `Enter 1`..`Enter 5`
 * entrance states (plus `IntersectionObserver` scroll-triggered staggered entrance when `animateOnScroll` is enabled).
 */
export function TeamCard({
  member,
  locale = DEFAULT_LOCALE,
  state = 'Default',
  animateOnScroll = false,
  enterDelayMs = 0,
  fallbackImageUrl,
  className,
}: TeamCardProps): ReactElement {
  const dict = getDictionary(locale)
  const cardRef = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  )
  const [hasEntered, setHasEntered] = useState<boolean>(!animateOnScroll)

  useEffect(() => {
    if (!animateOnScroll || prefersReducedMotion || hasEntered) {
      return
    }

    const node = cardRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEntered(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.18 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
    }
  }, [animateOnScroll, prefersReducedMotion, hasEntered])

  const effectiveEntered = !animateOnScroll || prefersReducedMotion || hasEntered
  const stateClass = STATE_CLASS_MAP[state]
  const scrollClass = animateOnScroll
    ? effectiveEntered
      ? styles.scrollEntered
      : styles.scrollPending
    : ''

  const cardClasses = [styles.card, stateClass, scrollClass, className ?? '']
    .filter(Boolean)
    .join(' ')

  const linkedinLabel = `${member.name} — ${dict.cards.linkedinProfile}`

  return (
    <article
      ref={cardRef}
      className={cardClasses}
      data-component="team-card"
      data-state={state}
      data-enter-delay={animateOnScroll && enterDelayMs > 0 ? String(enterDelayMs) : undefined}
      data-scroll-entered={animateOnScroll ? String(effectiveEntered) : undefined}
    >
      <div className={styles.content} data-team-card-content="true">
        <Portrait
          member={member}
          fallbackImageUrl={fallbackImageUrl}
          className={styles.portraitLayer}
        />

        <div className={styles.bottomOverlay} aria-hidden="true" />

        <svg
          width={34}
          height={34}
          viewBox="0 0 34 34"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className={styles.cornerBracket}
        >
          <path d="M0 0H34L22 6H0V0Z" fill="currentColor" />
          <path d="M0 0V34L6 22V0H0Z" fill="currentColor" />
        </svg>

        {member.linkedin ? (
          <CmsLink
            href={member.linkedin}
            aria-label={linkedinLabel}
            className={styles.linkedinBadge}
          >
            <SocialIcon name="linkedin" size={16} />
          </CmsLink>
        ) : (
          <span className={styles.linkedinBadge} aria-hidden="true">
            <SocialIcon name="linkedin" size={16} />
          </span>
        )}

        <div className={styles.caption}>
          <h3 className={`${styles.name} t-h4`}>{member.name}</h3>
          <p className={`${styles.role} t-label-caps`}>{member.position}</p>
          <div className={styles.accentLine} aria-hidden="true" />
        </div>
      </div>
    </article>
  )
}
