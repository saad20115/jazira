'use client'

import { type AnimationEvent, type ReactElement, useCallback, useEffect, useRef } from 'react'

import { Logo } from '@/components/Logo'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'

import styles from './IntroSplash.module.css'

export const INTRO_SPLASH_STORAGE_KEY = 'aljazira_intro_seen'
export const INTRO_MAX_FIRST_PAINT_MS = 1200
export const INTRO_TOTAL_DURATION_MS = 1200
export const INTRO_HARD_CAP_MS = 2400

export const INERT_TARGET_SELECTORS = [
  'body > a[href="#main-content"]',
  'header',
  '[data-home-content="true"]',
  'footer',
  '[data-component="whatsapp-fab"]',
] as const

/**
 * First-frame intro script injected with the per-request CSP nonce (`R-4`, `R-14`, `R-22`, `R-23`, `R-27`, `R-29`).
 * - Pure CSS timeline: registers a `requestAnimationFrame` callback and makes the `'seen'` vs `'active'`
 *   decision inside it using the rAF timestamp as the real first frame (`R-27`).
 * - No branches on viewport, timing, connection, user agent, or automation (`R-22`).
 * - If `prefers-reduced-motion: reduce` is active, `sessionStorage` already has `aljazira_intro_seen='1'`,
 *   or the first frame (`rafTs`) arrives later than `1200ms` after `navigationStart`, sets `data-intro="seen"`
 *   and skips the intro (`R-27`).
 * - Otherwise starts the timeline from `0` (`--intro-delay: 0ms`, `1200ms <= 1.6s` total, with both
 *   `logoOpacity === 1` and `overlayOpacity === 1` for `648ms >= 300ms`, ending before `2400ms <= 2.5s`),
 *   sets `inert` on background landmarks (including the skip link) from the inline script (`R-29`),
 *   and moves focus to `#main-content` upon dismiss (`R-29`).
 */
export const INTRO_PREPAINT_INLINE_SCRIPT = `(function(){try{var d=document.documentElement;var sels=['body > a[href="#main-content"]','header','[data-home-content="true"]','footer','[data-component="whatsapp-fab"]'];function setInert(v){for(var i=0;i<sels.length;i++){var nodes=document.querySelectorAll(sels[i]);for(var j=0;j<nodes.length;j++){if(v)nodes[j].setAttribute('inert','');else nodes[j].removeAttribute('inert');}}}function finishIntro(){setInert(false);d.setAttribute('data-intro','seen');var m=document.getElementById('main-content');if(m&&typeof m.focus==='function'){m.focus({preventScroll:true});}}var rm=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var seen=false;try{seen=window.sessionStorage.getItem('${INTRO_SPLASH_STORAGE_KEY}')==='1';}catch(e){}var scriptNow=typeof performance==='object'&&typeof performance.now==='function'?Math.round(performance.now()):0;if(rm||seen){window.__aljaziraIntroDecision={action:rm?'skipped_reduced_motion':seen?'skipped_seen':'skipped_late_first_paint',scriptMs:scriptNow,nowMs:scriptNow,delayMs:0};d.setAttribute('data-intro','seen');return;}var painted=false;var decide=function(rafTs){var now=typeof rafTs==='number'&&rafTs>0?rafTs:(typeof performance==='object'&&typeof performance.now==='function'?performance.now():0);var nowRounded=Math.round(now);if(now>${String(INTRO_MAX_FIRST_PAINT_MS)}){try{window.sessionStorage.setItem('${INTRO_SPLASH_STORAGE_KEY}','1');}catch(e){}setInert(false);window.__aljaziraIntroDecision={action:'skipped_late_first_paint',scriptMs:scriptNow,nowMs:nowRounded,delayMs:0};d.setAttribute('data-intro','seen');return;}var ov=document.querySelector('[data-component="intro-splash"]');if(!ov){if(document.readyState==='loading'){window.requestAnimationFrame(decide);return;}d.setAttribute('data-intro','seen');return;}if(window.getComputedStyle(ov).position!=='fixed'){window.requestAnimationFrame(decide);return;}if(!painted){painted=true;window.requestAnimationFrame(decide);return;}try{window.sessionStorage.setItem('${INTRO_SPLASH_STORAGE_KEY}','1');}catch(e){}d.style.setProperty('--intro-delay','0ms');d.setAttribute('data-intro','active');setInert(true);var bindOverlay=function(){if(d.getAttribute('data-intro')!=='active')return;setInert(true);var splash=document.querySelector('[data-component="intro-splash"]');var skipBtn=document.querySelector('[data-intro-skip="true"]');if(skipBtn&&typeof skipBtn.focus==='function'){skipBtn.focus({preventScroll:true});}if(splash&&!splash.dataset.introBound){splash.dataset.introBound='1';splash.addEventListener('animationend',function(ev){if(ev.target===splash)finishIntro();});splash.addEventListener('click',finishIntro);window.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&d.getAttribute('data-intro')==='active'){ev.preventDefault();finishIntro();}});}};bindOverlay();if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',bindOverlay,{once:true});}window.__aljaziraIntroDecision={action:'active',scriptMs:scriptNow,nowMs:nowRounded,delayMs:0};};window.requestAnimationFrame(decide);}catch(e){document.documentElement.setAttribute('data-intro','seen');}})();`

export interface IntroSplashProps {
  className?: string
  forceState?: 'start' | 'reveal'
  locale?: SupportedLocale
  siteName?: string | null
  tagline?: string | null
}

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
      const mainEl = document.getElementById('main-content')
      mainEl?.focus({ preventScroll: true })
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
    let rafId: number | null = null

    const syncActiveState = (): void => {
      const currentIntroAttr = document.documentElement.getAttribute('data-intro')
      if (currentIntroAttr === 'seen') {
        setBackgroundInert(false)
        return
      }
      if (currentIntroAttr !== 'active') {
        rafId = window.requestAnimationFrame(syncActiveState)
        return
      }
      const overlayEl = overlayRef.current
      if (overlayEl && window.getComputedStyle(overlayEl).visibility === 'hidden') {
        dismissImmediately()
        return
      }
      markIntroSplashSeen(window)
      setBackgroundInert(true)
      skipButtonRef.current?.focus({ preventScroll: true })
    }

    syncActiveState()

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.key === 'Escape' &&
        document.documentElement.getAttribute('data-intro') === 'active'
      ) {
        event.preventDefault()
        dismissImmediately()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
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
