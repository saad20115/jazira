// P3-T5 round 3 evidence (owner finding O-7): short screen recordings of the tap hint for the owner
// to judge by eye, at 1440×900 and 390×844 (touch), in each locale. Each flow scrolls the card into
// view, lets the hint play its first cycle, waits for the one repeat, then clicks (or taps) the image
// so the hint stops and the model starts. Nothing is measured here.
// Each flow is written, also on failure (its error is printed and the exit code is 1).
// Usage: node scripts/evidence/p3-t5-hint-recordings.mjs <baseUrl> <outDir> [locales=en,ar]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outDir, localeList = 'en,ar'] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error(
    'usage: node scripts/evidence/p3-t5-hint-recordings.mjs <baseUrl> <outDir> [locales]',
  )
  process.exit(2)
}
const LOCALES = localeList.split(',').filter((l) => l === 'en' || l === 'ar')
const GPU_ARGS = process.platform === 'win32' ? ['--use-angle=d3d11'] : []
const LIVE_TIMEOUT = 60_000
const VIEWPORTS = {
  1440: { viewport: { width: 1440, height: 900 } },
  390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
}

fs.mkdirSync(outDir, { recursive: true })

async function record(browser, width, locale) {
  const name = `hint-${String(width)}-${locale}`
  const dir = path.join(outDir, name)
  fs.mkdirSync(dir, { recursive: true })
  const context = await browser.newContext({
    baseURL: baseUrl,
    recordVideo: { dir, size: VIEWPORTS[width].viewport },
    ...VIEWPORTS[width],
  })
  await context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    } catch {
      // about:blank has no storage.
    }
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
  })
  const page = await context.newPage()
  try {
    await page.goto(`/${locale}`)
    await page.locator('html[data-intro="seen"]').waitFor()
    const card = page.locator('[data-interactive-3d-card]')
    await page.locator('[data-interactive-3d-card][tabindex="0"]').waitFor()
    await page.waitForTimeout(800)
    await card.evaluate((el) => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    // The first cycle, the 8 s wait, and the repeat.
    await page.locator('[data-tap-hint]').waitFor({ timeout: 5_000 })
    await page.waitForTimeout(14_500)
    const box = await card.boundingBox()
    if (width === 390) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    } else {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    }
    await page
      .locator('[data-interactive-3d-card][data-viewer-state="live"]')
      .waitFor({ timeout: LIVE_TIMEOUT })
    await page.waitForTimeout(2_000)
    console.log(`${name}: written`)
    return true
  } catch (err) {
    console.error(`${name}: FAILED ${err instanceof Error ? err.message : String(err)}`)
    return false
  } finally {
    await context.close()
  }
}

const browser = await chromium.launch({ args: GPU_ARGS })
let ok = true
try {
  for (const width of [1440, 390]) {
    for (const locale of LOCALES) {
      ok = (await record(browser, width, locale)) && ok
    }
  }
} finally {
  await browser.close()
}
process.exit(ok ? 0 : 1)
