'use client'

import { type AnimationEvent, type ReactElement, useCallback, useEffect, useRef } from 'react'

import { Logo } from '@/components/Logo'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'

import styles from './IntroSplash.module.css'

export const INTRO_SPLASH_STORAGE_KEY = 'aljazira_intro_seen'
export const INTRO_MAX_FIRST_PAINT_MS = 1200
export const INTRO_TOTAL_DURATION_MS = 1200
export const INTRO_HARD_CAP_MS = 2400

/**
 * Synchronous pre-paint script injected with the per-request CSP nonce (`R-4`, `R-14`, `R-22`, `R-23`).
 * - Pure CSS timeline: this inline script only decides `'seen'` or `'active'` and sets `data-intro`
 *   plus the CSS `--intro-delay` cap computed from `performance.now()`.
 * - No branches on viewport, timing, connection, user agent, or automation (`R-22`).
 * - If `prefers-reduced-motion: reduce` is active, `sessionStorage` already has `aljazira_intro_seen='1'`,
 *   or first paint occurs later than `1200ms` (`1.2 s`), sets `data-intro="seen"` and skips the intro.
 * - Otherwise sets `data-intro="active"` and `--intro-delay: Math.min(0, Math.round(2400 - (now + 1200)))ms`
 *   so the pure-CSS keyframe animation (`1200ms <= 1.6s`, with logo at `opacity: 1` for `600ms >= 300ms`)
 *   is guaranteed to end in `opacity: 0; visibility: hidden; pointer-events: none` (`forwards`) before `2.5s`
 *   from `navigationStart`, without any `setTimeout`.
 */
export const INTRO_PREPAINT_INLINE_SCRIPT = `(function(){try{var d=document.documentElement;var rm=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var seen=false;try{seen=window.sessionStorage.getItem('${INTRO_SPLASH_STORAGE_KEY}')==='1';}catch(e){}var now=typeof performance==='object'&&typeof performance.now==='function'?performance.now():0;var nowRounded=Math.round(now);if(rm||seen||now>${String(INTRO_MAX_FIRST_PAINT_MS)}){if(!seen&&!rm){try{window.sessionStorage.setItem('${INTRO_SPLASH_STORAGE_KEY}','1');}catch(e){}}window.__aljaziraIntroDecision={action:rm?'skipped_reduced_motion':seen?'skipped_seen':'skipped_late_first_paint',nowMs:nowRounded,delayMs:0};d.setAttribute('data-intro','seen');return;}try{window.sessionStorage.setItem('${INTRO_SPLASH_STORAGE_KEY}','1');}catch(e){}var delayMs=Math.min(0,Math.round(${String(INTRO_HARD_CAP_MS)}-(now+${String(INTRO_TOTAL_DURATION_MS)})));d.style.setProperty('--intro-delay',delayMs+'ms');window.__aljaziraIntroDecision={action:'active',nowMs:nowRounded,delayMs:delayMs};d.setAttribute('data-intro','active');}catch(e){document.documentElement.setAttribute('data-intro','seen');}})();`

export interface IntroSplashProps {
  className?: string
  forceState?: 'start' | 'reveal'
  locale?: SupportedLocale
  siteName?: string | null
  tagline?: string | null
}

const INERT_TARGET_SELECTORS = [
  'header',
  '[data-home-content="true"]',
  'footer',
  '[data-component="whatsapp-fab"]',
] as const

function setBackgroundInert(inert: boolean): void {
  if (typeof document === 'undefined') {
    return
  }
  for (const selector of INERT_TARGET_SELECTORS) {
    const nodes = document.querySelectorAll<HTMLElement>(selector)
    nodes.forEach((node) => {
      if (inert) {
        node.setAttribute('inert', '')
      } else {
        node.removeAttribute('inert')
      }
    })
  }
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
 * - Hidden by default (`display: none`) so without JavaScript the page is immediately usable (`R-14`).
 * - Pre-paint inline script opts in (`data-intro="active"`) on a fresh visit when `performance.now() <= 1200ms`
 *   and sets `--intro-delay` so the overlay is never visible after `2.5s` from `navigationStart` (`R-22`).
 * - One pure-CSS keyframe timeline (`1200ms <= 1.6s`) drives the logo reveal (`0%..25%`), holds the
 *   revealed logo at `opacity: 1` for `600ms` (`25%..75%`, `>= 300ms`), and fades out (`75%..100%`)
 *   ending in `opacity: 0; visibility: hidden; pointer-events: none` with `animation-fill-mode: forwards`.
 * - React does zero timing or phase re-renders (`R-23`): it handles only Skip, `Escape`, and click,
 *   and removes `inert` on `animationend`.
 */
export function IntroSplash({
  locale = DEFAULT_LOCALE,
  tagline,
  siteName,
  forceState,
  className,
}: IntroSplashProps): ReactElement {
  const dict = getDictionary(locale)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const skipButtonRef = useRef<HTMLButtonElement | null>(null)

  const dismissImmediately = useCallback((): void => {
    if (forceState) {
      return
    }
    setBackgroundInert(false)
    if (typeof window !== 'undefined') {
      markIntroSplashSeen(window)
      document.documentElement.setAttribute('data-intro', 'seen')
    }
  }, [forceState])

  const handleAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLDivElement>): void => {
      if (event.target === event.currentTarget) {
        dismissImmediately()
      }
    },
    [dismissImmediately],
  )

  useEffect(() => {
    if (forceState || typeof window === 'undefined') {
      return
    }
    const currentIntroAttr = document.documentElement.getAttribute('data-intro')
    const overlayEl = overlayRef.current
    if (
      currentIntroAttr !== 'active' ||
      (overlayEl && window.getComputedStyle(overlayEl).visibility === 'hidden')
    ) {
      setBackgroundInert(false)
      if (currentIntroAttr === 'active') {
        document.documentElement.setAttribute('data-intro', 'seen')
      }
      return
    }

    markIntroSplashSeen(window)
    setBackgroundInert(true)
    skipButtonRef.current?.focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dismissImmediately()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      setBackgroundInert(false)
    }
  }, [forceState, dismissImmediately])

  const stateAttr = forceState ?? 'start'
  const overlayClasses = [
    styles.overlay,
    forceState === 'reveal' ? styles.stateReveal : styles.stateStart,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={overlayRef}
      aria-label={siteName ?? dict.nav.brandName}
      className={overlayClasses}
      data-component="intro-splash"
      data-intro-forced={forceState ? 'true' : undefined}
      data-intro-state={stateAttr}
      onAnimationEnd={handleAnimationEnd}
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
        ref={skipButtonRef}
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
