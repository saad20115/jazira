'use client'

import { type AnimationEvent, type ReactElement, useCallback, useEffect, useRef } from 'react'

import { Logo } from '@/components/Logo'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'

import styles from './IntroSplash.module.css'

export const INTRO_SPLASH_STORAGE_KEY = 'aljazira_intro_seen'
export const INTRO_MAX_FIRST_PAINT_MS = 1200
export const INTRO_TOTAL_DURATION_MS = 1200

export const INERT_TARGET_SELECTORS = [
  'body > a[href="#main-content"]',
  'header',
  '[data-home-content="true"]',
  'footer',
  '[data-component="whatsapp-fab"]',
] as const

/**
 * First-frame intro script injected with the per-request CSP nonce (`R-4`, `R-14`, `R-22`, `R-23`, `R-27`, `R-29`, `R-31`..`R-34`).
 * - Restricted to the home page (`/`, `/en`, `/ar`) with `[data-component="intro-splash"]` present (`R-34`):
 *   other pages never read or write `aljazira_intro_seen`.
 * - Registers a single `requestAnimationFrame` callback (`R-31`, `R-32`) whose callback runs before the first
 *   frame is painted (render-blocking CSS holds the first `rAF` until styles apply).
 * - Inside that single `rAF`, reads the `rAF` timestamp `rafTs` (ms since `navigationStart`):
 *   - `<= 1200`: writes `aljazira_intro_seen='1'`, sets `data-intro="active"` and `inert` on background
 *     landmarks (`R-29`), and starts the `1200ms` CSS keyframe timeline from `0` (`0%..18%` reveal,
 *     `18%..82%` hold at `opacity: 1` for `768ms >= 300ms`, `82%..100%` fade out, ending at `<= 2400ms <= 2.5s`).
 *   - `> 1200`: writes `aljazira_intro_seen='1'` and sets `data-intro="seen"` (`R-27`, `R-32`).
 * - No branches on viewport, UA, connection, or environment (`R-22`).
 */
export const INTRO_PREPAINT_INLINE_SCRIPT = `(function(){try{var d=document.documentElement;var p=(window.location&&window.location.pathname)||'';if(p&&!/^\\/(en|ar)?\\/?$/.test(p)){return;}var sels=['body > a[href="#main-content"]','header','[data-home-content="true"]','footer','[data-component="whatsapp-fab"]'];function setInert(v){for(var i=0;i<sels.length;i++){var nodes=document.querySelectorAll(sels[i]);for(var j=0;j<nodes.length;j++){if(v)nodes[j].setAttribute('inert','');else nodes[j].removeAttribute('inert');}}}function finishIntro(){setInert(false);d.setAttribute('data-intro','seen');var m=document.getElementById('main-content');if(m&&typeof m.focus==='function'){m.focus({preventScroll:true});}}var rm=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var seen=false;try{seen=window.sessionStorage.getItem('${INTRO_SPLASH_STORAGE_KEY}')==='1';}catch(e){}var scriptNow=typeof performance==='object'&&typeof performance.now==='function'?Math.round(performance.now()):0;if(rm||seen){window.__aljaziraIntroDecision={action:rm?'skipped_reduced_motion':'skipped_seen',scriptMs:scriptNow,rafMs:scriptNow,nowMs:scriptNow,delayMs:0};d.setAttribute('data-intro','seen');return;}window.requestAnimationFrame(function(rafTs){var decide=function(useRafTs){var ov=document.querySelector('[data-component="intro-splash"]:not([data-intro-forced="true"])');if(!ov){return;}var rawTs=useRafTs&&typeof rafTs==='number'&&rafTs>0?rafTs:(typeof performance==='object'&&typeof performance.now==='function'?performance.now():0);var now=Math.round(rawTs);try{window.sessionStorage.setItem('${INTRO_SPLASH_STORAGE_KEY}','1');}catch(e){}if(rawTs>${String(INTRO_MAX_FIRST_PAINT_MS)}){setInert(false);d.setAttribute('data-intro','seen');window.__aljaziraIntroDecision={action:'skipped_late_first_paint',scriptMs:scriptNow,rafMs:now,nowMs:now,delayMs:0};return;}d.style.setProperty('--intro-delay','0ms');d.setAttribute('data-intro','active');setInert(true);var skipBtn=document.querySelector('[data-intro-skip="true"]');if(skipBtn&&typeof skipBtn.focus==='function'){skipBtn.focus({preventScroll:true});}var bindOverlay=function(){if(d.getAttribute('data-intro')!=='active')return;setInert(true);var splash=document.querySelector('[data-component="intro-splash"]');if(splash&&!splash.__introBound){splash.__introBound=true;splash.addEventListener('animationend',function(ev){if(ev.target===splash)finishIntro();});splash.addEventListener('click',finishIntro);window.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&d.getAttribute('data-intro')==='active'){ev.preventDefault();finishIntro();}});}};bindOverlay();if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',bindOverlay,{once:true});}window.__aljaziraIntroDecision={action:'active',scriptMs:scriptNow,rafMs:now,nowMs:now,delayMs:0};};if(document.querySelector('[data-component="intro-splash"]:not([data-intro-forced="true"])')){decide(true);}else if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){decide(false);},{once:true});}});}catch(e){document.documentElement.setAttribute('data-intro','seen');}})();`

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
 * - Hidden by default (`display: none`) so without JavaScript or `requestAnimationFrame` the page is immediately usable (`R-14`).
 * - Single-rAF inline script (`R-31`, `R-32`) runs before the first frame is painted on the home page (`R-34`):
 *   when `rafTs <= 1200ms`, it sets `data-intro="active"` and `inert` (`R-29`) and starts the `1200ms` timeline from `0ms`;
 *   when `rafTs > 1200ms`, it sets `data-intro="seen"` and skips the intro (`R-27`, `R-32`).
 * - One pure-CSS keyframe timeline (`1200ms <= 1.6s`) drives the logo reveal (`0%..18%` = `216ms`), holds the
 *   revealed logo and overlay at `opacity: 1` for `768ms` (`18%..82%`, `>= 300ms`), and fades out (`82%..100%` = `216ms`,
 *   completing at `rafTs + 1200ms <= 2400ms <= 2.5s`) ending in `opacity: 0; visibility: hidden; pointer-events: none`
 *   with `animation-fill-mode: forwards`.
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
