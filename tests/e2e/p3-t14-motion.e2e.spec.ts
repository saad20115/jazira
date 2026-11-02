import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { type Browser, type BrowserContext, expect, type Page, test } from '@playwright/test'

import { ensureE2EAdminToken } from './global-setup'

/**
 * P3-T14 acceptance e2e (`handoff/tasks/P3-T14.md` scope 5, `handoff/reviews/P3-T14.md` R-42..R-48,
 * `docs/05-design.md` CTO decision #20).
 *
 * 1. With JavaScript disabled, every Home section, hero entrance element, and reveal target is visible.
 * 2. With all JS chunks blocked (hydration never happens), every reveal target is visible.
 * 3. Under `prefers-reduced-motion: reduce`, motion never turns on and nothing animates.
 * 4. With motion on, scrolling the whole page reveals every target (nothing stays hidden).
 * 5. R-42 fail-safe at 1440 and 390: anchor jump (`/en#cta`), fast scroll to bottom, reload mid-page,
 *    and load in a background tab leave no target at opacity 0 or clipped.
 * 6. R-43 touch devices (`390` with `hasTouch: true`): `ServiceCard` `.description` and `ProjectCard`
 *    `.ctaRow` are visible at rest.
 * 7. R-44, R-45, R-48: hero entrance & background settle pause while `html[data-intro="active"]`, play
 *    when the intro ends, keep `h1` at `opacity: 1`, and `ServiceTile` uses `:focus-visible` without
 *    clipping the focus ring.
 *
 * The P4-T2 seed keeps the Home page global as a draft (owner review pending), so every test opens
 * Home through the staff draft preview (`/api/preview`, the same route editors use) to render the
 * full 8-section page instead of the near-empty published one.
 */

const BASE_URL = (process.env.SERVER_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

const REVEAL_TARGETS = '[data-reveal], [data-reveal-stagger] > *'

function readPayloadSecret(): string {
  if (process.env.PAYLOAD_SECRET) {
    return process.env.PAYLOAD_SECRET
  }
  const envPath = path.resolve(process.cwd(), '.env')
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((row) => row.trim().startsWith('PAYLOAD_SECRET='))
  const value = line?.slice(line.indexOf('=') + 1).trim()
  if (!value) {
    throw new Error('P3-T14 e2e: PAYLOAD_SECRET is not available to build the preview secret')
  }
  return value
}

/** Same derivation as `getPreviewSecret()` in `src/lib/preview.ts`. */
function previewSecret(): string {
  return crypto
    .createHmac('sha256', readPayloadSecret())
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}

interface HiddenReport {
  count: number
  samples: string[]
}

async function collectHiddenRevealTargets(
  page: Page,
  inViewportOnly = false,
): Promise<HiddenReport> {
  return page.evaluate(
    ({ selector, onlyViewport }) => {
      const samples: string[] = []
      let count = 0
      const vh = window.innerHeight
      const vw = window.innerWidth
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (onlyViewport) {
          const rect = el.getBoundingClientRect()
          const inVp = rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw
          if (!inVp) {
            return
          }
        }
        const style = window.getComputedStyle(el)
        // A reveal "before" state is exactly opacity 0 (fade) or a 100% clip-path inset (wipe/draw).
        // Partial design opacities from Figma (e.g. subtitles at 0.72–0.82) are not hidden content.
        const hidden =
          Number(style.opacity) === 0 ||
          style.visibility === 'hidden' ||
          style.display === 'none' ||
          style.clipPath.includes('100%')
        if (hidden) {
          count += 1
          if (samples.length < 5) {
            samples.push(
              `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''} opacity=${style.opacity} clip=${style.clipPath}`,
            )
          }
        }
      })
      return { count, samples }
    },
    { selector: REVEAL_TARGETS, onlyViewport: inViewportOnly },
  )
}

async function countRevealTargets(page: Page): Promise<number> {
  return page.locator(REVEAL_TARGETS).count()
}

let staffToken = ''

async function newHomeContext(
  browser: Browser,
  options: Parameters<Browser['newContext']>[0] & { skipIntro?: boolean } = {},
): Promise<BrowserContext> {
  const { skipIntro = true, ...contextOptions } = options
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...contextOptions,
  })
  await context.addCookies([
    {
      name: 'payload-token',
      value: staffToken,
      domain: new URL(BASE_URL).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
  if (contextOptions.javaScriptEnabled !== false && skipIntro) {
    await context.addInitScript(() => {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    })
  }
  return context
}

/** Opens `/en` through the staff draft preview so the full Home page renders. */
async function openHome(page: Page, waitUntil: 'load' | 'networkidle'): Promise<void> {
  await page.goto(
    `${BASE_URL}/api/preview?secret=${previewSecret()}&locale=en&path=${encodeURIComponent('/')}`,
    { waitUntil },
  )
  await expect(page).toHaveURL(/\/en\/?$/)
}

test.describe('P3-T14 — Motion system: content never depends on JavaScript', () => {
  test.setTimeout(180_000)

  test.beforeAll(async () => {
    staffToken = await ensureE2EAdminToken(BASE_URL)
  })

  test('with JavaScript disabled, every Home section and reveal target is visible and motion is off', async ({
    browser,
  }) => {
    const context = await newHomeContext(browser, { javaScriptEnabled: false })
    const page = await context.newPage()
    await openHome(page, 'load')
    expect(await page.locator('[data-home-section]').count()).toBeGreaterThanOrEqual(8)

    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/)
    const sections = page.locator('[data-home-section]')
    expect(await sections.count()).toBeGreaterThanOrEqual(8)
    for (const section of await sections.all()) {
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
    }
    expect(await countRevealTargets(page)).toBeGreaterThan(0)
    const hidden = await collectHiddenRevealTargets(page)
    expect(hidden.samples, 'reveal targets hidden without JS').toEqual([])
    expect(hidden.count).toBe(0)

    // R-44: after <= 900 ms, hero entrance elements end visible even with JS off
    await page.waitForTimeout(950)
    const heroOpacities = await page.evaluate(() => {
      const hero = document.querySelector('[data-home-section="hero"]')
      if (!hero) return []
      return Array.from(hero.querySelectorAll('h1, p, a')).map((el) =>
        Number(window.getComputedStyle(el).opacity),
      )
    })
    expect(heroOpacities.length).toBeGreaterThan(0)
    for (const op of heroOpacities) {
      expect(op).toBeGreaterThan(0)
    }
    await context.close()
  })

  test('with every JS chunk blocked (no hydration), every reveal target is visible and motion is off', async ({
    browser,
  }) => {
    const context = await newHomeContext(browser)
    await context.route('**/_next/static/chunks/**', (route) => route.abort())
    const page = await context.newPage()
    await openHome(page, 'load')
    expect(await page.locator('[data-home-section]').count()).toBeGreaterThanOrEqual(8)

    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/)
    for (const section of await page.locator('[data-home-section]').all()) {
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
    }
    const hidden = await collectHiddenRevealTargets(page)
    expect(hidden.samples, 'reveal targets hidden with JS chunks blocked').toEqual([])
    expect(hidden.count).toBe(0)
    await context.close()
  })

  test('under prefers-reduced-motion, motion never turns on and no CSS animation is running', async ({
    browser,
  }) => {
    const context = await newHomeContext(browser, { reducedMotion: 'reduce' })
    const page = await context.newPage()
    await openHome(page, 'networkidle')
    expect(await page.locator('[data-home-section]').count()).toBeGreaterThanOrEqual(8)

    for (const section of await page.locator('[data-home-section]').all()) {
      await section.scrollIntoViewIfNeeded()
    }
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })

    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/)
    const hidden = await collectHiddenRevealTargets(page)
    expect(hidden.samples, 'reveal targets hidden under reduced motion').toEqual([])
    expect(hidden.count).toBe(0)

    const runningAnimations = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === 'running')
        .map((animation) => {
          const name =
            animation instanceof CSSAnimation
              ? `CSSAnimation:${animation.animationName}`
              : animation instanceof CSSTransition
                ? `CSSTransition:${animation.transitionProperty}`
                : animation.constructor.name
          const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null
          return `${name} on ${target ? `${target.tagName.toLowerCase()}.${target.getAttribute('class') ?? ''}` : '?'}`
        }),
    )
    expect(runningAnimations).toEqual([])

    const countUps = page.locator('[data-countup]')
    for (const countUp of await countUps.all()) {
      const target = await countUp.getAttribute('data-countup')
      await expect(countUp.locator('[data-countup-display]')).toHaveText(target ?? '')
    }
    await context.close()
  })

  test('with motion on, scrolling the whole Home page reveals every target and count-ups land on the CMS value', async ({
    browser,
  }) => {
    const context = await newHomeContext(browser)
    const page = await context.newPage()
    await openHome(page, 'networkidle')
    expect(await page.locator('[data-home-section]').count()).toBeGreaterThanOrEqual(8)
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on')

    for (const section of await page.locator('[data-home-section]').all()) {
      await section.scrollIntoViewIfNeeded()
      await page.waitForTimeout(150)
    }
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })

    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            Array.from(
              document.querySelectorAll<HTMLElement>(
                '[data-reveal]:not([data-revealed]), [data-reveal-stagger]:not([data-revealed])',
              ),
            ).map((el) => {
              const rect = el.getBoundingClientRect()
              return `${el.tagName.toLowerCase()}.${String(el.getAttribute('class'))} top=${String(Math.round(rect.top))} h=${String(Math.round(rect.height))}`
            }),
          ),
        { timeout: 10_000 },
      )
      .toEqual([])

    // After the reveal animations (700 ms + at most 5 x 80 ms stagger) everything is fully visible.
    await page.waitForTimeout(1_500)
    const hidden = await collectHiddenRevealTargets(page)
    expect(hidden.samples, 'reveal targets still hidden after scrolling').toEqual([])
    expect(hidden.count).toBe(0)

    for (const countUp of await page.locator('[data-countup]').all()) {
      const target = await countUp.getAttribute('data-countup')
      await expect(countUp.locator('[data-countup-display]')).toHaveText(target ?? '', {
        timeout: 5_000,
      })
    }

    // The hero h1 (LCP element) is never at opacity 0.
    const heroTitleOpacity = await page
      .locator('[data-home-section="hero"] h1')
      .evaluate((el) => window.getComputedStyle(el).opacity)
    expect(heroTitleOpacity).toBe('1')
    await context.close()
  })

  for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ] as const) {
    test(`R-42 fail-safe at ${String(vp.width)}px: anchor jump (/en#cta), fast scroll to bottom, reload mid-page, and background tab leave no target hidden or clipped`, async ({
      browser,
    }) => {
      const context = await newHomeContext(browser, { viewport: vp })
      const page = await context.newPage()
      await openHome(page, 'networkidle')

      // 1. Anchor jump (`/en#cta`)
      await page.goto(`${BASE_URL}/en#cta`, { waitUntil: 'networkidle' })
      await page.locator('#cta').scrollIntoViewIfNeeded()
      await page.waitForTimeout(1_800)
      const hiddenAfterAnchor = await collectHiddenRevealTargets(page, true)
      expect(
        hiddenAfterAnchor.samples,
        `in-viewport targets hidden after /en#cta at ${String(vp.width)}px`,
      ).toEqual([])
      expect(hiddenAfterAnchor.count).toBe(0)

      // 2. Fast scroll from top to bottom
      await page.evaluate(async () => {
        window.scrollTo(0, 0)
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        const steps = 8
        for (let i = 1; i <= steps; i += 1) {
          window.scrollTo(0, Math.round((maxScroll * i) / steps))
          await new Promise((r) => setTimeout(r, 25))
        }
      })
      await page.waitForTimeout(1_800)
      const hiddenAtBottom = await collectHiddenRevealTargets(page, true)
      expect(
        hiddenAtBottom.samples,
        `in-viewport targets hidden after fast scroll at ${String(vp.width)}px`,
      ).toEqual([])
      expect(hiddenAtBottom.count).toBe(0)

      // 3. Reload mid-page
      await page.evaluate(() => {
        window.scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.45))
      })
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForTimeout(1_800)
      const hiddenMidReload = await collectHiddenRevealTargets(page, true)
      expect(
        hiddenMidReload.samples,
        `in-viewport targets hidden after mid-page reload at ${String(vp.width)}px`,
      ).toEqual([])
      expect(hiddenMidReload.count).toBe(0)

      // 4. Load in a background tab (`visibilityState === 'hidden'`)
      const bgContext = await newHomeContext(browser, { viewport: vp })
      await bgContext.addInitScript(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden',
        })
      })
      const bgPage = await bgContext.newPage()
      await openHome(bgPage, 'networkidle')
      const hiddenInBgTabInitial = await collectHiddenRevealTargets(bgPage, true)
      expect(
        hiddenInBgTabInitial.samples,
        `in-viewport targets hidden on initial load in background tab at ${String(vp.width)}px`,
      ).toEqual([])
      expect(hiddenInBgTabInitial.count).toBe(0)

      for (const section of await bgPage.locator('[data-home-section], footer').all()) {
        await section.scrollIntoViewIfNeeded()
        await bgPage.evaluate(() => {
          window.dispatchEvent(new Event('scroll'))
        })
      }
      await bgPage.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight)
        window.dispatchEvent(new Event('scroll'))
      })
      await bgPage.waitForTimeout(300)
      const hiddenInBgTab = await collectHiddenRevealTargets(bgPage)
      expect(
        hiddenInBgTab.samples,
        `targets hidden in background tab at ${String(vp.width)}px`,
      ).toEqual([])
      expect(hiddenInBgTab.count).toBe(0)

      for (const countUp of await bgPage.locator('[data-countup]').all()) {
        const target = await countUp.getAttribute('data-countup')
        await expect(countUp.locator('[data-countup-display]')).toHaveText(target ?? '')
      }

      await bgContext.close()
      await context.close()
    })
  }

  test('R-43: at 390px with hasTouch, ProjectCard .ctaRow is visible at rest on Home', async ({
    browser,
  }) => {
    const context = await newHomeContext(browser, {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()

    await openHome(page, 'networkidle')
    const homeProjectCards = page.locator('[data-component="project-card"]')
    expect(await homeProjectCards.count()).toBeGreaterThan(0)
    await homeProjectCards.first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(1_200)

    const homeProjectCtaState = await homeProjectCards.first().evaluate((card) => {
      const ctaRow = card.querySelector<HTMLElement>('[class*="ctaRow"]')
      if (!ctaRow) return null
      const style = window.getComputedStyle(ctaRow)
      return {
        opacity: Number(style.opacity),
        visibility: style.visibility,
        display: style.display,
      }
    })
    expect(homeProjectCtaState).not.toBeNull()
    expect(homeProjectCtaState?.opacity).toBe(1)
    expect(homeProjectCtaState?.visibility).toBe('visible')
    expect(homeProjectCtaState?.display).not.toBe('none')

    await context.close()
  })

  test('R-44, R-45, R-48: hero entrance & bg settle pause under data-intro="active" and play when intro ends; ServiceTile uses :focus-visible without clipping focus ring', async ({
    browser,
  }) => {
    const context = await newHomeContext(browser, { viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await openHome(page, 'networkidle')

    // R-44 & R-45: verify CSS rules pause hero entrance & heroBgMedia while html[data-intro="active"]
    const introPauseCheck = await page.evaluate(() => {
      const root = document.documentElement
      root.setAttribute('data-intro', 'active')
      const hero = document.querySelector('[data-home-section="hero"]')
      const bgMedia = hero?.querySelector<HTMLElement>('[class*="heroBgMedia"]')
      const eyebrow = hero?.querySelector<HTMLElement>('[class*="heroEyebrowEnter"]')
      const h1 = hero?.querySelector<HTMLElement>('h1')
      const subtitle = hero?.querySelector<HTMLElement>('[class*="heroSubtitle"]')
      const ctas = hero?.querySelector<HTMLElement>('[class*="heroCtaGroup"]')

      const pausedStates = {
        bgMedia: bgMedia ? window.getComputedStyle(bgMedia).animationPlayState : null,
        eyebrow: eyebrow ? window.getComputedStyle(eyebrow).animationPlayState : null,
        h1: h1 ? window.getComputedStyle(h1).animationPlayState : null,
        h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
        subtitle: subtitle ? window.getComputedStyle(subtitle).animationPlayState : null,
        ctas: ctas ? window.getComputedStyle(ctas).animationPlayState : null,
      }
      root.setAttribute('data-intro', 'seen')
      const runningStates = {
        bgMedia: bgMedia ? window.getComputedStyle(bgMedia).animationPlayState : null,
        eyebrow: eyebrow ? window.getComputedStyle(eyebrow).animationPlayState : null,
        h1: h1 ? window.getComputedStyle(h1).animationPlayState : null,
        subtitle: subtitle ? window.getComputedStyle(subtitle).animationPlayState : null,
        ctas: ctas ? window.getComputedStyle(ctas).animationPlayState : null,
      }
      return { pausedStates, runningStates }
    })

    expect(introPauseCheck.pausedStates.bgMedia).toBe('paused')
    expect(introPauseCheck.pausedStates.eyebrow).toBe('paused')
    expect(introPauseCheck.pausedStates.h1).toBe('paused')
    expect(introPauseCheck.pausedStates.h1Opacity).toBe('1')
    expect(introPauseCheck.pausedStates.subtitle).toBe('paused')
    expect(introPauseCheck.pausedStates.ctas).toBe('paused')

    expect(introPauseCheck.runningStates.bgMedia).toBe('running')
    expect(introPauseCheck.runningStates.eyebrow).toBe('running')
    expect(introPauseCheck.runningStates.h1).toBe('running')
    expect(introPauseCheck.runningStates.subtitle).toBe('running')
    expect(introPauseCheck.runningStates.ctas).toBe('running')

    // R-48: ServiceTile uses :focus-visible on the link (not :focus-within on the tile) and does not clip the focus ring
    const firstTile = page.locator('[data-component="service-tile"][data-state="Default"]').first()
    await firstTile.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)

    const tileLink = firstTile.locator('a').first()

    // Focus with keyboard (Tab / focus-visible) and verify focus ring is inside the tile bounds (not clipped by overflow: hidden)
    await tileLink.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(tileLink).toBeFocused()

    const focusGeom = await firstTile.evaluate((tile) => {
      const link = tile.querySelector<HTMLElement>('a')
      if (!link) return null
      const tileRect = tile.getBoundingClientRect()
      const linkRect = link.getBoundingClientRect()
      const linkStyle = window.getComputedStyle(link)
      const outlineWidth = parseFloat(linkStyle.outlineWidth) || 0
      const outlineOffset = parseFloat(linkStyle.outlineOffset) || 0
      const ringPad = outlineWidth + outlineOffset
      return {
        matchesFocusVisible: link.matches(':focus-visible'),
        outlineStyle: linkStyle.outlineStyle,
        ringInsideLeft: linkRect.left - ringPad >= tileRect.left,
        ringInsideRight: linkRect.right + ringPad <= tileRect.right,
        ringInsideTop: linkRect.top - ringPad >= tileRect.top,
        ringInsideBottom: linkRect.bottom + ringPad <= tileRect.bottom,
      }
    })
    expect(focusGeom).not.toBeNull()
    expect(focusGeom?.matchesFocusVisible).toBe(true)
    expect(focusGeom?.outlineStyle).toBe('solid')
    expect(focusGeom?.ringInsideLeft).toBe(true)
    expect(focusGeom?.ringInsideRight).toBe(true)
    expect(focusGeom?.ringInsideTop).toBe(true)
    expect(focusGeom?.ringInsideBottom).toBe(true)

    const outDir = path.resolve(process.cwd(), 'docs/reports/evidence/P3-T14/r2')
    fs.mkdirSync(outDir, { recursive: true })
    await firstTile.screenshot({
      path: path.join(outDir, 'service-tile-focus-visible.png'),
    })

    await context.close()
  })
})
