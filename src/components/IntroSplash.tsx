'use client'

import { type AnimationEvent, type ReactElement, useCallback, useEffect, useRef } from 'react'

import { Logo } from '@/components/Logo'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'

import styles from './IntroSplash.module.css'

export const INTRO_SPLASH_STORAGE_KEY = 'aljazira_intro_seen'
export const INTRO_MAX_FIRST_PAINT_MS = 1100
export const INTRO_TOTAL_DURATION_MS = 1200

export const INERT_TARGET_SELECTORS = [
  'body > a[href="#main-content"]',
  'header',
  '[data-home-content="true"]',
  'footer',
  '[data-component="whatsapp-fab"]',
] as const

/**
 * Synchronous inline script placed immediately after `<IntroSplash>` as the first element of the
 * home `<body>` output (`R-4`, `R-14`, `R-22`, `R-23`, `R-27`, `R-29`, `R-31`..`R-34`, `R-36`, `R-37`).
 * - Restricted to the home page (`/`, `/en`, `/ar`) with `[data-component="intro-splash"]` present (`R-34`):
 *   other pages never read or write `aljazira_intro_seen`.
 * - Sets `data-intro="active"` provisionally right after the overlay node (before `<header>` and all
 *   page content exist in the DOM, eliminating any pre-overlay flash without a `DOMContentLoaded`
 *   decision fallback, `R-37`) and registers a single `requestAnimationFrame` callback (`R-31`, `R-32`).
 * - Re-applies `inert` to background landmarks at `DOMContentLoaded` once they are parsed (`R-29`, `R-37`).
 * - Inside that single `rAF` callback, reads `performance.now()` there (not the callback's stale
 *   `rafTs` frame-begin argument, `R-36`) and writes `aljazira_intro_seen='1'` only there (`R-34`):
 *   - `> 1100`: clears `inert` and sets `data-intro="seen"` before that frame paints so the overlay
 *     never shows (`R-27`, `R-32`, `R-36`).
 *   - `<= 1100`: keeps `data-intro="active"`, applies `inert` to background landmarks (`R-29`), and
 *     starts the `1200ms` CSS keyframe timeline from `0` at that frame (`0%..18%` = `216ms` reveal,
 *     `18%..82%` = `768ms >= 300ms` hold at `opacity: 1`, `82%..100%` = `216ms` fade out).
 * - No branches on viewport, UA, connection, or environment (`R-22`).
 */
export const INTRO_PREPAINT_INLINE_SCRIPT = `(function(){try{var d=document.documentElement;var p=(window.location&&window.location.pathname)||'';if(p&&!/^\\/(en|ar)?\\/?$/.test(p)){return;}var ov=document.querySelector('[data-component="intro-splash"]:not([data-intro-forced="true"])');if(!ov){return;}var sels=['body > a[href="#main-content"]','header','[data-home-content="true"]','footer','[data-component="whatsapp-fab"]'];function setInert(v){for(var i=0;i<sels.length;i++){var nodes=document.querySelectorAll(sels[i]);for(var j=0;j<nodes.length;j++){if(v)nodes[j].setAttribute('inert','');else nodes[j].removeAttribute('inert');}}}function finishIntro(){setInert(false);d.setAttribute('data-intro','seen');var m=document.getElementById('main-content');if(m&&typeof m.focus==='function'){m.focus({preventScroll:true});}}var rm=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var seen=false;try{seen=window.sessionStorage.getItem('${INTRO_SPLASH_STORAGE_KEY}')==='1';}catch(e){}var scriptNow=typeof performance==='object'&&typeof performance.now==='function'?Math.round(performance.now()):0;if(rm||seen){window.__aljaziraIntroDecision={action:rm?'skipped_reduced_motion':'skipped_seen',scriptMs:scriptNow,rafMs:scriptNow,nowMs:scriptNow,delayMs:0};d.setAttribute('data-intro','seen');return;}d.style.setProperty('--intro-delay','0ms');d.setAttribute('data-intro','active');setInert(true);var skipBtn=document.querySelector('[data-intro-skip="true"]');if(!ov.__introBound){ov.__introBound=true;ov.addEventListener('animationend',function(ev){if(ev.target===ov)finishIntro();});ov.addEventListener('click',finishIntro);window.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&d.getAttribute('data-intro')==='active'){ev.preventDefault();finishIntro();}});}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){if(d.getAttribute('data-intro')==='active'){setInert(true);}},{once:true});}window.requestAnimationFrame(function(rafTs){var rawNow=typeof performance==='object'&&typeof performance.now==='function'?performance.now():0;var now=Math.round(rawNow);var rafMs=typeof rafTs==='number'&&rafTs>0?Math.round(rafTs):now;try{window.sessionStorage.setItem('${INTRO_SPLASH_STORAGE_KEY}','1');}catch(e){}if(rawNow>${String(INTRO_MAX_FIRST_PAINT_MS)}){setInert(false);d.setAttribute('data-intro','seen');window.__aljaziraIntroDecision={action:'skipped_late_first_paint',scriptMs:scriptNow,rafMs:rafMs,nowMs:now,delayMs:0};return;}if(d.getAttribute('data-intro')!=='active'){return;}d.style.setProperty('--intro-delay','0ms');setInert(true);if(typeof ov.getAnimations==='function'){var anims=ov.getAnimations({subtree:true});for(var k=0;k<anims.length;k++){try{anims[k].currentTime=0;}catch(e){}}}if(skipBtn&&typeof skipBtn.focus==='function'){skipBtn.focus({preventScroll:true});}window.__aljaziraIntroDecision={action:'active',scriptMs:scriptNow,rafMs:rafMs,nowMs:now,delayMs:0};});}catch(e){document.documentElement.setAttribute('data-intro','seen');}})();`

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
 * - Rendered as the first element of the home `<body>` output (`R-37`), before the skip link and `<header>`.
 * - Hidden by default (`display: none`) so without JavaScript or `requestAnimationFrame` the page is immediately usable (`R-14`).
 * - Synchronous inline script right after the overlay sets `data-intro="active"` provisionally, re-applies `inert` at
 *   `DOMContentLoaded` (`R-29`, `R-37`), and registers one `requestAnimationFrame` callback (`R-31`, `R-32`).
 * - Inside that `rAF` callback, reads `performance.now()` (`R-36`) and writes `aljazira_intro_seen='1'` (`R-34`):
 *   when `performance.now() > 1100ms`, it sets `data-intro="seen"` and clears `inert` before the frame paints (`R-27`, `R-36`);
 *   when `performance.now() <= 1100ms`, it keeps `data-intro="active"` and starts the `1200ms` timeline from that frame.
 * - One pure-CSS keyframe timeline (`1200ms <= 1.6s`) drives the logo reveal (`0%..18%` = `216ms`), holds the
 *   revealed logo and overlay at `opacity: 1` for `768ms` (`18%..82%`, `>= 300ms`), and fades out (`82%..100%` = `216ms`)
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
