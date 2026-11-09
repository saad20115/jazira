// P3-T5 round 4 evidence (owner addendum O-11): short screen recordings of the slow push-in while the
// model loads, for the owner to judge by eye, at 1440×900 and 390×844 (touch), in English. Each flow
// opens the page, jumps to the card and clicks (or taps) the image at once, while the model is still
// being prepared (O-9), so the push-in and the cross-fade to the live model show; then it waits.
// Nothing is measured here.
// Each flow is written, also on failure (its error is printed and the exit code is 1).
// Usage: node scripts/evidence/p3-t5-pushin-recordings.mjs <baseUrl> <outDir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outDir] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('usage: node scripts/evidence/p3-t5-pushin-recordings.mjs <baseUrl> <outDir>')
  process.exit(2)
}
const GPU_ARGS = process.platform === 'win32' ? ['--use-angle=d3d11'] : []
const LIVE_TIMEOUT = 60_000
const VIEWPORTS = {
  1440: { viewport: { width: 1440, height: 900 } },
  390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
}

fs.mkdirSync(outDir, { recursive: true })

async function record(browser, width) {
  const name = `pushin-${String(width)}-en`
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
    await page.goto('/en')
    await page.locator('html[data-intro="seen"]').waitFor()
    const card = page.locator('[data-interactive-3d-card]')
    await card.scrollIntoViewIfNeeded()
    await page.locator('[data-interactive-3d-card][tabindex="0"]').waitFor()
    const box = await card.boundingBox()
    if (width === 390) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    } else {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    }
    await page
      .locator('[data-interactive-3d-card][data-viewer-state="live"]')
      .waitFor({ timeout: LIVE_TIMEOUT })
    await page.waitForTimeout(2_500)
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
    ok = (await record(browser, width)) && ok
  }
} finally {
  await browser.close()
}
process.exit(ok ? 0 : 1)
