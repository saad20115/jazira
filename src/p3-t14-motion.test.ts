import fs from 'node:fs'
import path from 'node:path'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CountUp } from '@/components/CountUp'
import { CspSafeImage, DraftImageBypassProvider } from '@/components/CspSafeImage'
import { Reveal, revealAttributes } from '@/components/Reveal'
import {
  clampStaggerIndex,
  easeOutCubic,
  formatCountUpValue,
  hasReachedRevealThreshold,
  isIntroPending,
  isRectInViewport,
  parseCountUpValue,
  parseCssTimeToMs,
  shouldEnableMotion,
  VIEWPORT_FAILSAFE_MS,
} from '@/components/motion/motion'
import { type MotionWindow, startMotionController } from '@/components/motion/motion-controller'

/* ------------------------------------------------------------------------------------------ */
/* Minimal DOM fakes for the controller (the Vitest environment is `node`, no DOM library).    */
/* ------------------------------------------------------------------------------------------ */

class FakeElement {
  readonly attributes = new Map<string, string>()
  readonly children: FakeElement[] = []
  parentElement: FakeElement | null = null
  rect = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }
  textContent = ''
  readonly style = {
    props: new Map<string, string>(),
    setProperty(name: string, value: string): void {
      this.props.set(name, value)
    },
  }

  constructor(readonly tag: string) {}

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name)
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name)
  }

  matches(selector: string): boolean {
    return selector.split(',').some((part) => {
      const attr = /^\[([a-z-]+)\]$/.exec(part.trim())
      return attr?.[1] ? this.attributes.has(attr[1]) : false
    })
  }

  descendants(): FakeElement[] {
    return this.children.flatMap((child) => [child, ...child.descendants()])
  }

  querySelectorAll(selector: string): { forEach: (cb: (el: FakeElement) => void) => void } {
    const found = this.descendants().filter((el) => el.matches(selector))
    return {
      forEach: (cb) => {
        found.forEach(cb)
      },
    }
  }

  querySelector(selector: string): FakeElement | null {
    return this.descendants().find((el) => el.matches(selector)) ?? null
  }

  getBoundingClientRect(): FakeElement['rect'] {
    return this.rect
  }

  append(...els: FakeElement[]): this {
    for (const el of els) {
      el.parentElement = this
    }
    this.children.push(...els)
    return this
  }
}

interface FakeEnvOptions {
  hasIntersectionObserver: boolean
  prefersReducedMotion: boolean
  introAttribute?: string
}

function createFakeEnv(options: FakeEnvOptions) {
  const html = new FakeElement('html')
  const body = new FakeElement('body')
  html.append(body)
  if (options.introAttribute) {
    html.setAttribute('data-intro', options.introAttribute)
  }
  const observed = new Set<FakeElement>()

  class FakeIntersectionObserver {
    constructor(readonly callback: unknown) {}
    observe(el: FakeElement): void {
      observed.add(el)
    }
    unobserve(el: FakeElement): void {
      observed.delete(el)
    }
    disconnect(): void {
      observed.clear()
    }
  }

  class FakeMutationObserver {
    observe(): void {
      /* no-op */
    }
    disconnect(): void {
      /* no-op */
    }
  }

  const doc = {
    documentElement: html,
    body,
    querySelectorAll: (selector: string) => html.querySelectorAll(selector),
  }
  const win: Record<string, unknown> = {
    innerWidth: 1440,
    innerHeight: 900,
    Element: FakeElement,
    MutationObserver: FakeMutationObserver,
    matchMedia: () => ({
      matches: options.prefersReducedMotion,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
    getComputedStyle: () => ({ getPropertyValue: () => '1200ms' }),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    performance: { now: () => 0 },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => undefined,
  }
  if (options.hasIntersectionObserver) {
    win.IntersectionObserver = FakeIntersectionObserver
  }
  return {
    html,
    body,
    observed,
    doc: doc as unknown as Document,
    win: win as unknown as MotionWindow,
  }
}

function revealTarget(top: number, height = 200): FakeElement {
  const el = new FakeElement('div')
  el.setAttribute('data-reveal', 'fade')
  el.rect = { top, bottom: top + height, left: 0, right: 1440, width: 1440, height }
  return el
}

/* ------------------------------------------------------------------------------------------ */

describe('P3-T14 motion system (docs/05-design.md CTO decision #20)', () => {
  describe('MotionRoot gating: motion turns on only with IntersectionObserver and no reduced motion', () => {
    it('shouldEnableMotion is true only when IO exists and reduced motion is off', () => {
      expect(
        shouldEnableMotion({ hasIntersectionObserver: true, prefersReducedMotion: false }),
      ).toBe(true)
      expect(
        shouldEnableMotion({ hasIntersectionObserver: false, prefersReducedMotion: false }),
      ).toBe(false)
      expect(
        shouldEnableMotion({ hasIntersectionObserver: true, prefersReducedMotion: true }),
      ).toBe(false)
      expect(
        shouldEnableMotion({ hasIntersectionObserver: false, prefersReducedMotion: true }),
      ).toBe(false)
    })

    it('without IntersectionObserver the controller never sets data-motion, so nothing is hidden', () => {
      const env = createFakeEnv({ hasIntersectionObserver: false, prefersReducedMotion: false })
      env.body.append(revealTarget(2000))
      const handle = startMotionController(env.doc, env.win)
      expect(handle).toBeNull()
      expect(env.html.hasAttribute('data-motion')).toBe(false)
      expect(env.observed.size).toBe(0)
    })

    it('with prefers-reduced-motion the controller never sets data-motion and pauses looping videos', () => {
      const env = createFakeEnv({ hasIntersectionObserver: true, prefersReducedMotion: true })
      const video = new FakeElement('video')
      let paused = false
      Object.assign(video, {
        pause: () => {
          paused = true
        },
      })
      video.setAttribute('autoplay', '')
      video.setAttribute('loop', '')
      env.body.append(revealTarget(2000), video)
      const fakeDoc = {
        ...(env.doc as unknown as Record<string, unknown>),
        querySelectorAll: (selector: string) =>
          selector === 'video[autoplay][loop]'
            ? {
                forEach: (cb: (el: FakeElement) => void) => {
                  cb(video)
                },
              }
            : env.html.querySelectorAll(selector),
      } as unknown as Document
      const handle = startMotionController(fakeDoc, env.win)
      expect(handle).toBeNull()
      expect(env.html.hasAttribute('data-motion')).toBe(false)
      expect(paused).toBe(true)
      expect(video.hasAttribute('autoplay')).toBe(false)
    })

    it('when enabled without an intro, on-screen targets are revealed instantly and off-screen ones are observed', () => {
      const env = createFakeEnv({ hasIntersectionObserver: true, prefersReducedMotion: false })
      const onScreen = revealTarget(100)
      const offScreen = revealTarget(2400)
      env.body.append(onScreen, offScreen)
      const handle = startMotionController(env.doc, env.win)
      expect(handle).not.toBeNull()
      expect(env.html.getAttribute('data-motion')).toBe('on')
      expect(onScreen.getAttribute('data-revealed')).toBe('instant')
      expect(offScreen.hasAttribute('data-revealed')).toBe(false)
      expect(env.observed.has(offScreen)).toBe(true)
      expect(env.observed.has(onScreen)).toBe(false)
      handle?.dispose()
      // Disposing drops the attribute, which removes every hidden "before reveal" state.
      expect(env.html.hasAttribute('data-motion')).toBe(false)
    })

    it('fully clipped wipe/draw targets are observed through their parent (a clipped element never intersects)', () => {
      const env = createFakeEnv({ hasIntersectionObserver: true, prefersReducedMotion: false })
      const wrapper = new FakeElement('div')
      wrapper.rect = { top: 2400, bottom: 2800, left: 0, right: 1440, width: 1440, height: 400 }
      const photo = revealTarget(2400, 400)
      photo.setAttribute('data-reveal', 'wipe')
      wrapper.append(photo)
      env.body.append(wrapper)
      const handle = startMotionController(env.doc, env.win)
      expect(env.observed.has(wrapper)).toBe(true)
      expect(env.observed.has(photo)).toBe(false)
      expect(photo.hasAttribute('data-revealed')).toBe(false)
      handle?.dispose()
    })

    it('while the intro is active, motion stays off (nothing hidden behind the intro, P3-T4 R-26)', () => {
      const env = createFakeEnv({
        hasIntersectionObserver: true,
        prefersReducedMotion: false,
        introAttribute: 'active',
      })
      const hero = revealTarget(100)
      env.body.append(hero)
      const handle = startMotionController(env.doc, env.win)
      expect(handle).not.toBeNull()
      expect(env.html.hasAttribute('data-motion')).toBe(false)
      expect(env.observed.size).toBe(0)
      expect(hero.hasAttribute('data-revealed')).toBe(false)
      handle?.dispose()
      expect(env.html.hasAttribute('data-motion')).toBe(false)
    })

    it('isIntroPending is true only for data-intro="active"', () => {
      expect(isIntroPending('active')).toBe(true)
      expect(isIntroPending('seen')).toBe(false)
      expect(isIntroPending(null)).toBe(false)
      expect(isIntroPending(undefined)).toBe(false)
    })

    it('R-42 fail-safe: any exception in the observer removes data-motion and reveals every target', () => {
      let ioCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null
      const env = createFakeEnv({ hasIntersectionObserver: true, prefersReducedMotion: false })
      ;(env.win as unknown as Record<string, unknown>).IntersectionObserver = class {
        constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
          ioCallback = cb
        }
        observe(el: FakeElement): void {
          env.observed.add(el)
        }
        unobserve(el: FakeElement): void {
          env.observed.delete(el)
        }
        disconnect(): void {
          env.observed.clear()
        }
      }
      const offScreen = revealTarget(2400)
      env.body.append(offScreen)
      startMotionController(env.doc, env.win)
      expect(env.html.getAttribute('data-motion')).toBe('on')
      expect(offScreen.hasAttribute('data-revealed')).toBe(false)

      // Trigger an exception inside handleEntries by passing an entry whose target.matches throws
      const throwingEntry = {
        target: {
          matches: () => {
            throw new Error('simulated observer error')
          },
        },
        isIntersecting: true,
        intersectionRatio: 1,
        intersectionRect: { height: 200 },
      } as unknown as IntersectionObserverEntry
      const invokeIo = ioCallback as ((entries: IntersectionObserverEntry[]) => void) | null
      if (invokeIo) {
        invokeIo([throwingEntry])
      }

      expect(env.html.hasAttribute('data-motion')).toBe(false)
      expect(offScreen.getAttribute('data-revealed')).toBe('instant')
    })

    it('R-42 fail-safe: a target in the viewport for 1 s without reaching threshold is revealed automatically', () => {
      let nowMs = 0
      const scrollHandlers: Array<() => void> = []
      const env = createFakeEnv({ hasIntersectionObserver: true, prefersReducedMotion: false })
      ;(env.win as unknown as Record<string, unknown>).performance = { now: () => nowMs }
      ;(env.win as unknown as Record<string, unknown>).addEventListener = (
        ev: string,
        cb: () => void,
      ) => {
        if (ev === 'scroll') {
          scrollHandlers.push(cb)
        }
      }
      const target = revealTarget(2400)
      env.body.append(target)
      const handle = startMotionController(env.doc, env.win)
      expect(target.hasAttribute('data-revealed')).toBe(false)

      // Target scrolls into the viewport (e.g. 10 px overlap, below 15% IO threshold)
      target.rect = { top: 890, bottom: 1090, left: 0, right: 1440, width: 1440, height: 200 }
      nowMs = 100
      scrollHandlers.forEach((cb) => {
        cb()
      })
      expect(target.hasAttribute('data-revealed')).toBe(false)

      // After VIEWPORT_FAILSAFE_MS (1000 ms) in the viewport, the fail-safe reveals it
      nowMs = 100 + VIEWPORT_FAILSAFE_MS
      scrollHandlers.forEach((cb) => {
        cb()
      })
      expect(target.getAttribute('data-revealed')).toBe('true')
      handle?.dispose()
    })

    it('R-42 fail-safe: in a background tab (visibilityState="hidden"), in-viewport targets reveal immediately', () => {
      const scrollHandlers: Array<() => void> = []
      const env = createFakeEnv({ hasIntersectionObserver: true, prefersReducedMotion: false })
      ;(env.doc as unknown as Record<string, unknown>).visibilityState = 'hidden'
      ;(env.win as unknown as Record<string, unknown>).addEventListener = (
        ev: string,
        cb: () => void,
      ) => {
        if (ev === 'scroll') {
          scrollHandlers.push(cb)
        }
      }
      const target = revealTarget(2400)
      env.body.append(target)
      const handle = startMotionController(env.doc, env.win)
      target.rect = { top: 200, bottom: 400, left: 0, right: 1440, width: 1440, height: 200 }
      scrollHandlers.forEach((cb) => {
        cb()
      })
      expect(target.getAttribute('data-revealed')).toBe('instant')
      handle?.dispose()
    })
  })

  describe('CountUp parsing keeps the CMS prefix/suffix and leaves non-numeric values static', () => {
    it('parses integers, suffixes, grouping, decimals and Arabic-Indic digits', () => {
      expect(parseCountUpValue('45+')).toEqual({
        prefix: '',
        value: 45,
        decimals: 0,
        suffix: '+',
        grouped: false,
        digits: 'latin',
      })
      expect(parseCountUpValue('85%')?.suffix).toBe('%')
      expect(parseCountUpValue(' 100+ ')?.value).toBe(100)
      expect(parseCountUpValue('1,200+')).toMatchObject({ value: 1200, grouped: true, suffix: '+' })
      expect(parseCountUpValue('4.5')).toMatchObject({ value: 4.5, decimals: 1 })
      expect(parseCountUpValue('SAR 3M')).toMatchObject({ prefix: 'SAR ', value: 3, suffix: 'M' })
      expect(parseCountUpValue('٤٥+')).toMatchObject({
        value: 45,
        suffix: '+',
        digits: 'arabic-indic',
      })
    })

    it('returns null for values that are not exactly one number', () => {
      expect(parseCountUpValue('24/7')).toBeNull()
      expect(parseCountUpValue('ISO 9001:2015')).toBeNull()
      expect(parseCountUpValue('')).toBeNull()
      expect(parseCountUpValue('   ')).toBeNull()
      expect(parseCountUpValue('Riyadh')).toBeNull()
      expect(parseCountUpValue(null)).toBeNull()
    })

    it('formatCountUpValue reproduces the CMS text at the end and keeps the suffix while counting', () => {
      for (const raw of ['45+', '100+', '85%', '3', '1,200+', '4.5', '٤٥+', 'SAR 3M']) {
        const parts = parseCountUpValue(raw)
        expect(parts).not.toBeNull()
        if (parts) {
          expect(formatCountUpValue(parts, parts.value)).toBe(raw)
        }
      }
      const plus = parseCountUpValue('45+')
      expect(plus && formatCountUpValue(plus, 0)).toBe('0+')
      expect(plus && formatCountUpValue(plus, 22.6)).toBe('23+')
      expect(plus && formatCountUpValue(plus, 999)).toBe('45+')
      const grouped = parseCountUpValue('1,200+')
      expect(grouped && formatCountUpValue(grouped, 1000)).toBe('1,000+')
      const arabic = parseCountUpValue('٤٥+')
      expect(arabic && formatCountUpValue(arabic, 12)).toBe('١٢+')
    })

    it('easeOutCubic is clamped to 0..1 and lands exactly on 1', () => {
      expect(easeOutCubic(-1)).toBe(0)
      expect(easeOutCubic(0)).toBe(0)
      expect(easeOutCubic(1)).toBe(1)
      expect(easeOutCubic(2)).toBe(1)
      expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
    })

    it('parseCssTimeToMs reads ms and s tokens and falls back otherwise', () => {
      expect(parseCssTimeToMs('1200ms', 1)).toBe(1200)
      expect(parseCssTimeToMs(' 1.2s ', 1)).toBe(1200)
      expect(parseCssTimeToMs('', 1200)).toBe(1200)
      expect(parseCssTimeToMs('fast', 1200)).toBe(1200)
      expect(parseCssTimeToMs(null, 1200)).toBe(1200)
    })
  })

  describe('Reveal and CountUp server markup is visible and final without JavaScript', () => {
    it('Reveal renders only data attributes (no inline style) and clamps the stagger step to 0..5', () => {
      const html = renderToStaticMarkup(
        React.createElement(Reveal, { className: 'box', step: 9 }, 'Hello'),
      )
      expect(html).toBe('<div class="box" data-reveal="fade" data-reveal-step="5">Hello</div>')
      expect(html).not.toContain('style=')
      expect(revealAttributes({ stagger: true })).toEqual({ 'data-reveal-stagger': '' })
      expect(revealAttributes({ variant: 'rise', step: 1 })).toEqual({
        'data-reveal': 'rise',
        'data-reveal-step': '1',
      })
      expect(revealAttributes({ step: 0 })).toEqual({ 'data-reveal': 'fade' })
      expect(clampStaggerIndex(-3)).toBe(0)
      expect(clampStaggerIndex(2.7)).toBe(2)
      expect(clampStaggerIndex(Number.NaN)).toBe(0)
    })

    it('CountUp server-renders the final CMS value (visible copy and screen-reader copy)', () => {
      const html = renderToStaticMarkup(React.createElement(CountUp, { value: '45+' }))
      expect(html).toBe(
        '<span data-countup="45+"><span aria-hidden="true" data-countup-display="">45+</span><span class="sr-only">45+</span></span>',
      )
      const staticHtml = renderToStaticMarkup(React.createElement(CountUp, { value: '24/7' }))
      expect(staticHtml).toBe('<span>24/7</span>')
    })
  })

  describe('Viewport and threshold helpers', () => {
    it('isRectInViewport detects any overlap with the viewport', () => {
      const vp = { width: 1440, height: 900 }
      expect(isRectInViewport({ top: 100, bottom: 300, left: 0, right: 100 }, vp)).toBe(true)
      expect(isRectInViewport({ top: 900, bottom: 1100, left: 0, right: 100 }, vp)).toBe(false)
      expect(isRectInViewport({ top: -300, bottom: 0, left: 0, right: 100 }, vp)).toBe(false)
      expect(isRectInViewport({ top: -300, bottom: 1, left: 0, right: 100 }, vp)).toBe(true)
    })

    it('hasReachedRevealThreshold fires at 15% of the target or 15% of the viewport height', () => {
      expect(hasReachedRevealThreshold(0.15, 30, 900)).toBe(true)
      expect(hasReachedRevealThreshold(0.1, 30, 900)).toBe(false)
      expect(hasReachedRevealThreshold(0.05, 135, 900)).toBe(true)
      expect(hasReachedRevealThreshold(0.05, 134, 900)).toBe(false)
    })
  })

  describe('R-50 & R-51: draft-only image optimisation bypass and touch rest-state rules', () => {
    it('R-50: CspSafeImage keeps Next.js image optimisation on public renders and bypasses only when DraftImageBypassProvider is enabled', () => {
      const publicHtml = renderToStaticMarkup(
        React.createElement(
          DraftImageBypassProvider,
          { enabled: false },
          React.createElement(CspSafeImage, {
            alt: 'Hero',
            height: 600,
            sizes: '100vw',
            src: '/api/media/file/hero-city.webp',
            width: 800,
          }),
        ),
      )
      expect(publicHtml).toContain('/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fhero-city.webp')
      expect(publicHtml).toContain('srcSet=')

      const draftHtml = renderToStaticMarkup(
        React.createElement(
          DraftImageBypassProvider,
          { enabled: true },
          React.createElement(CspSafeImage, {
            alt: 'Hero',
            height: 600,
            sizes: '100vw',
            src: '/api/media/file/hero-city.webp',
            width: 800,
          }),
        ),
      )
      expect(draftHtml).toContain('src="/api/media/file/hero-city.webp"')
      expect(draftHtml).not.toContain('/_next/image')
    })

    it('R-43 / R-51: ServiceCard.module.css and ProjectCard.module.css keep .description and .ctaRow visible at rest under @media (hover: none), (pointer: coarse)', () => {
      const serviceCardCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/ServiceCard.module.css'),
        'utf8',
      )
      expect(serviceCardCss).toMatch(
        /@media\s*\(hover:\s*none\),\s*\(pointer:\s*coarse\)\s*\{[\s\S]*?\.title\s*\{\s*transform:\s*translateY\(0\);\s*\}[\s\S]*?\.description\s*\{\s*opacity:\s*0\.75;\s*transform:\s*translateY\(0\);\s*\}/,
      )

      const projectCardCss = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/ProjectCard.module.css'),
        'utf8',
      )
      expect(projectCardCss).toMatch(
        /@media\s*\(hover:\s*none\),\s*\(pointer:\s*coarse\)\s*\{[\s\S]*?\.infoBlock\s*\{\s*transform:\s*translateY\(0\);\s*\}[\s\S]*?\.ctaRow\s*\{\s*opacity:\s*1;\s*transform:\s*translateY\(0\);\s*\}/,
      )
    })
  })
})
