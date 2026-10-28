import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { type Browser, type BrowserContext, expect, type Page, test } from '@playwright/test'

import { ensureE2EAdminToken } from './global-setup'

/**
 * P3-T14 acceptance e2e (`handoff/tasks/P3-T14.md` scope 5, `docs/05-design.md` CTO decision #20).
 *
 * 1. With JavaScript disabled, every Home section and every reveal target is visible.
 * 2. With all JS chunks blocked (hydration never happens), every reveal target is visible.
 * 3. Under `prefers-reduced-motion: reduce`, motion never turns on and nothing animates.
 * 4. With motion on, scrolling the whole page reveals every target (nothing stays hidden).
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

async function collectHiddenRevealTargets(page: Page): Promise<HiddenReport> {
  return page.evaluate((selector) => {
    const samples: string[] = []
    let count = 0
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
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
  }, REVEAL_TARGETS)
}

async function countRevealTargets(page: Page): Promise<number> {
  return page.locator(REVEAL_TARGETS).count()
}

let staffToken = ''

async function newHomeContext(
  browser: Browser,
  options: Parameters<Browser['newContext']>[0] = {},
): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
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
  if (options.javaScriptEnabled !== false) {
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
  test.setTimeout(120_000)

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
})
