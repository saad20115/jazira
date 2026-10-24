'use client'

import { type ReactElement, useCallback, useEffect, useState } from 'react'

import { Logo } from '@/components/Logo'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'

import styles from './IntroSplash.module.css'

export const INTRO_SPLASH_STORAGE_KEY = 'aljazira_intro_seen'
export const INTRO_REVEAL_DELAY_MS = 120
export const INTRO_EXIT_DELAY_MS = 1150
export const INTRO_TOTAL_DURATION_MS = 1450

export type IntroSplashPhase = 'hidden' | 'start' | 'reveal' | 'exiting'

export interface IntroSplashProps {
  className?: string
  forceState?: 'start' | 'reveal'
  locale?: SupportedLocale
  siteName?: string | null
  tagline?: string | null
}

/**
 * Checks whether the intro splash should be suppressed because either
 * `prefers-reduced-motion: reduce` is active or `sessionStorage` already records
 * `aljazira_intro_seen === '1'`.
 */
export function shouldSkipIntroSplash(win: Window | undefined): boolean {
  if (!win) {
    return true
  }
  try {
    if (
      typeof win.matchMedia === 'function' &&
      win.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return true
    }
  } catch {
    // Ignore matchMedia errors in non-browser test environments
  }

  try {
    if (win.sessionStorage.getItem(INTRO_SPLASH_STORAGE_KEY) === '1') {
      return true
    }
  } catch {
    // Ignore storage access errors (e.g. strict privacy mode)
  }

  return false
}

/**
 * Records that the intro splash has been shown or skipped in `sessionStorage`.
 */
export function markIntroSplashSeen(win: Window | undefined): void {
  if (!win) {
    return
  }
  try {
    win.sessionStorage.setItem(INTRO_SPLASH_STORAGE_KEY, '1')
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Figma Intro Splash (`28:1609` Start -> `28:1615` Reveal, `docs/05-design.md` §"CTO decisions" #3).
 *
 * - Plays once per browser session (`sessionStorage` key `aljazira_intro_seen`).
 * - Total duration `1450ms` (`<= 1.6s`).
 * - Click anywhere or press `Escape` (or activate the `>= 44×44px` skip button) to dismiss immediately.
 * - Never shown when `prefers-reduced-motion: reduce` is enabled.
 * - Non-blocking fixed overlay (`z-index: 60`) over the already-rendered Hero so the LCP `<h1>` / hero
 *   image is in the DOM and painting from `t = 0`.
 */
export function IntroSplash({
  locale = DEFAULT_LOCALE,
  tagline,
  siteName,
  forceState,
  className,
}: IntroSplashProps): ReactElement | null {
  const dict = getDictionary(locale)
  const [phase, setPhase] = useState<IntroSplashPhase>(() => (forceState ? forceState : 'hidden'))

  const dismissImmediately = useCallback((): void => {
    if (forceState) {
      return
    }
    if (typeof window !== 'undefined') {
      markIntroSplashSeen(window)
    }
    setPhase('hidden')
  }, [forceState])

  useEffect(() => {
    if (forceState || typeof window === 'undefined') {
      return
    }
    if (shouldSkipIntroSplash(window)) {
      return
    }

    markIntroSplashSeen(window)
    const startTimer = window.setTimeout(() => {
      setPhase('start')
    }, 0)

    const revealTimer = window.setTimeout(() => {
      setPhase('reveal')
    }, INTRO_REVEAL_DELAY_MS)

    const exitTimer = window.setTimeout(() => {
      setPhase('exiting')
    }, INTRO_EXIT_DELAY_MS)

    const hideTimer = window.setTimeout(() => {
      setPhase('hidden')
    }, INTRO_TOTAL_DURATION_MS)

    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(revealTimer)
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
    }
  }, [forceState])

  useEffect(() => {
    if (phase === 'hidden' || forceState) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dismissImmediately()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [phase, forceState, dismissImmediately])

  const effectivePhase: IntroSplashPhase = forceState ?? phase
  if (effectivePhase === 'hidden') {
    return null
  }

  const isRevealed = effectivePhase === 'reveal' || effectivePhase === 'exiting'
  const overlayClasses = [
    styles.overlay,
    isRevealed ? styles.stateReveal : styles.stateStart,
    effectivePhase === 'exiting' ? styles.overlayExiting : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      aria-label={siteName ?? dict.nav.brandName}
      className={overlayClasses}
      data-component="intro-splash"
      data-intro-state={effectivePhase}
      onClick={dismissImmediately}
      role="region"
    >
      <div aria-hidden="true" className={styles.glow} />

      <div className={styles.centerStack}>
        <div className={styles.logoWrap}>
          <Logo alt={siteName ?? dict.nav.brandName} color="Reversed" size="default" type="Full" />
        </div>
        <div aria-hidden="true" className={styles.goldRule} />
        {tagline ? <p className={`${styles.tagline} t-label-link`}>{tagline}</p> : null}
      </div>

      <button
        className={`${styles.skipButton} t-label-button`}
        data-intro-skip="true"
        onClick={(event) => {
          event.stopPropagation()
          dismissImmediately()
        }}
        type="button"
      >
        {dict.actions.skipIntro}
      </button>
    </div>
  )
}
