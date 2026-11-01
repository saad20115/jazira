// P3-T5 evidence: screen recordings and network waterfalls of the live card (card "Evidence
// required"). Each flow runs in its own browser context with `recordVideo` (WebM) and `recordHar`
// (the waterfall: first load = the still only, then the viewer chunk + GLB after intent). Flows:
//   desktop-<locale>  1440×900: page scroll over the still card (no hijack) → hover (live) →
//                     click (active) → drag rotate, wheel zoom → open HVAC → orbit → exit → open
//                     Fire → reset → Done → page scroll;
//   keyboard-<locale> 1440×900: Tab to the card → arrows, +/−, 0 → 1…5 enter, Escape exits each →
//                     Escape deactivates;
//   phone-<locale>    390×844 touch: swipe over the still → "Explore in 3D" → tap (active) → drag →
//                     HVAC → exit → Done → swipe scrolls the page;
//   reduced-<locale>  1440×900, prefers-reduced-motion: the stills tier (no 3D download), a system
//                     shown from its end still.
// Nothing is measured here; the files are for the eye. Every flow is written, also on failure (its
// error is printed and the exit code is 1).
// Usage: node scripts/evidence/p3-t5-recordings.mjs <baseUrl> <outDir> [locales=en,ar]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outDir, localeList = 'en,ar'] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('usage: node scripts/evidence/p3-t5-recordings.mjs <baseUrl> <outDir> [locales]')
  process.exit(2)
}
const LOCALES = localeList.split(',').filter((l) => l === 'en' || l === 'ar')
const GPU_ARGS = process.platform === 'win32' ? ['--use-angle=d3d11'] : []
const LIVE_TIMEOUT = 60_000

fs.mkdirSync(outDir, { recursive: true })

const pause = (page, ms) => page.waitForTimeout(ms)

async function newContext(browser, name, options) {
  const dir = path.join(outDir, name)
  fs.mkdirSync(dir, { recursive: true })
  const context = await browser.newContext({
    baseURL: baseUrl,
    recordVideo: { dir, size: options.viewport },
    recordHar: { path: path.join(dir, `${name}.har`), content: 'omit' },
    ...options,
  })
  await context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    } catch {
      // about:blank has no storage.
    }
    // Capable-device hints, so the 3D path runs (the device rules read these before loading).
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
  return { context, dir }
}

async function openCard(page, locale) {
  await page.goto(`/${locale}`)
  await page.locator('html[data-intro="seen"]').waitFor()
  const card = page.locator('[data-interactive-3d-card]')
  return card
}

function rows(page) {
  return page.locator('[data-component="accordion-item"]')
}

async function center(card) {
  const box = await card.boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function drag(page, card, dx, dy = 0) {
  const { x, y } = await center(card)
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= 25; i += 1) {
    await page.mouse.move(x + (dx * i) / 25, y + (dy * i) / 25)
    await pause(page, 16)
  }
  await page.mouse.up()
}

async function scrollPast(page, card) {
  const { x, y } = await center(card)
  await page.mouse.move(x, y)
  for (let i = 0; i < 4; i += 1) {
    await page.mouse.wheel(0, 150)
    await pause(page, 250)
  }
  for (let i = 0; i < 4; i += 1) {
    await page.mouse.wheel(0, -150)
    await pause(page, 250)
  }
}

async function waitLabels(card) {
  await card
    .locator('[data-live-labels] li button')
    .filter({ visible: true })
    .first()
    .waitFor({ timeout: 15_000 })
}

/** Zoom in, zoom out and reset are the aria-labelled buttons beside the open/exit button. */
function viewControls(card) {
  return card
    .locator('[data-exit-system], [data-open-3d-model]')
    .locator('xpath=..')
    .locator('button[aria-label]')
}

const FLOWS = {
  async desktop(browser, locale) {
    const { context } = await newContext(browser, `desktop-${locale}`, {
      viewport: { width: 1440, height: 900 },
      locale: locale === 'ar' ? 'ar' : 'en-US',
    })
    const page = await context.newPage()
    try {
      const card = await openCard(page, locale)
      await card.scrollIntoViewIfNeeded()
      await pause(page, 1500)
      await scrollPast(page, card)
      await card.hover()
      await page
        .locator('[data-interactive-3d-card][data-viewer-state="live"]')
        .waitFor({ timeout: LIVE_TIMEOUT })
      await pause(page, 1500)
      await card.click()
      await drag(page, card, 220)
      await drag(page, card, -120, -60)
      const { x, y } = await center(card)
      await page.mouse.move(x, y)
      await page.mouse.wheel(0, -300)
      await pause(page, 800)
      await page.mouse.wheel(0, 300)
      await pause(page, 800)
      // HVAC is the pre-expanded first row: its "Show in 3D" button enters it.
      await rows(page).first().locator('[data-show-in-3d]').click()
      await waitLabels(card)
      await pause(page, 1000)
      await card.click({ position: { x: 40, y: 40 } })
      await drag(page, card, 160)
      await pause(page, 1000)
      await card.locator('[data-exit-system]').click()
      await page.locator('[data-interactive-3d-card][data-entered="none"]').waitFor()
      await pause(page, 2500)
      await rows(page).nth(1).locator(':scope > button').click()
      await waitLabels(card)
      await pause(page, 2000)
      await rows(page).nth(1).locator(':scope > button').click()
      await pause(page, 2500)
      await viewControls(card).nth(2).click()
      await pause(page, 1500)
      const done = card.locator('[data-done]')
      if (await done.isVisible()) {
        await done.click()
      }
      await scrollPast(page, card)
    } finally {
      await context.close()
    }
  },

  async keyboard(browser, locale) {
    const { context } = await newContext(browser, `keyboard-${locale}`, {
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    try {
      const card = await openCard(page, locale)
      await card.scrollIntoViewIfNeeded()
      await card.hover()
      await page
        .locator('[data-interactive-3d-card][data-viewer-state="live"]')
        .waitFor({ timeout: LIVE_TIMEOUT })
      await page.mouse.move(0, 0)
      await card.focus()
      for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowUp', '+', '+', '-', '0']) {
        await page.keyboard.press(key)
        await pause(page, 400)
      }
      for (let i = 1; i <= 5; i += 1) {
        await page.keyboard.press(String(i))
        await waitLabels(card)
        await pause(page, 1200)
        await page.keyboard.press('Escape')
        await page.locator('[data-interactive-3d-card][data-entered="none"]').waitFor()
        await pause(page, 2000)
      }
      await page.keyboard.press('Escape')
      await pause(page, 1000)
    } finally {
      await context.close()
    }
  },

  async phone(browser, locale) {
    const { context } = await newContext(browser, `phone-${locale}`, {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()
    try {
      const cdp = await context.newCDPSession(page)
      const card = await openCard(page, locale)
      await card.scrollIntoViewIfNeeded()
      const swipe = async (dy) => {
        const { x, y } = await center(card)
        const sx = Math.round(x)
        const sy = Math.round(y)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: sx, y: sy }],
        })
        for (let i = 1; i <= 10; i += 1) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: sx, y: sy - (i * dy) / 10 }],
          })
          await pause(page, 16)
        }
        await pause(page, 150)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await pause(page, 600)
      }
      await swipe(200)
      await card.scrollIntoViewIfNeeded()
      await page.locator('[data-open-3d-model]').tap()
      await page
        .locator('[data-interactive-3d-card][data-viewer-state="live"]')
        .waitFor({ timeout: LIVE_TIMEOUT })
      await pause(page, 1000)
      const box = await card.boundingBox()
      await page.touchscreen.tap(box.x + 40, box.y + 40)
      await swipe(-120)
      await rows(page).first().locator('[data-show-in-3d]').tap()
      await card.scrollIntoViewIfNeeded()
      await waitLabels(card)
      await pause(page, 1500)
      await card.locator('[data-exit-system]').tap()
      await page.locator('[data-interactive-3d-card][data-entered="none"]').waitFor()
      await pause(page, 2000)
      const done = card.locator('[data-done]')
      if (await done.isVisible()) {
        await done.tap()
      }
      await swipe(250)
      await pause(page, 1000)
    } finally {
      await context.close()
    }
  },

  async reduced(browser, locale) {
    const { context } = await newContext(browser, `reduced-${locale}`, {
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      const card = await openCard(page, locale)
      await card.scrollIntoViewIfNeeded()
      await card.hover()
      await page.locator('[data-interactive-3d-card][data-viewer-state="stills"]').waitFor()
      await pause(page, 800)
      await rows(page).first().locator('[data-show-in-3d]').click()
      await pause(page, 2000)
      await rows(page).nth(1).locator(':scope > button').click()
      await pause(page, 2000)
    } finally {
      await context.close()
    }
  },
}

const browser = await chromium.launch({ channel: 'chrome', args: GPU_ARGS })
let failed = false
try {
  for (const locale of LOCALES) {
    for (const [name, flow] of Object.entries(FLOWS)) {
      try {
        await flow(browser, locale)
        console.log(`${name}-${locale}: written`)
      } catch (err) {
        failed = true
        console.error(`${name}-${locale}: FAILED ${err instanceof Error ? err.message : err}`)
      }
    }
  }
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
