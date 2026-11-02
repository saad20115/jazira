// P3-T5 round 3 evidence (owner finding O-5): screenshots of the live card for the owner to judge
// the lighting by eye — the overview and each of the five systems, at 1440×900 and 390×844 (touch),
// in each locale. Nothing is measured here.
//
// The same steps run on the r2 build ("before") and on round 3 ("after"): "Open the live 3D model"
// starts the model; on the focused card the keys 1–5 enter the systems and Escape exits. Each shot
// is the card element only, taken once the camera flight has landed and the labels are placed.
// A flow that fails is printed, its shots so far are kept, and the exit code is 1.
//
// Usage: node scripts/evidence/p3-t5-lighting-shots.mjs <baseUrl> <outDir> [locales=en,ar] [widths=1440,390]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outDir, localeList = 'en,ar', widthList = '1440,390'] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error(
    'usage: node scripts/evidence/p3-t5-lighting-shots.mjs <baseUrl> <outDir> [locales]',
  )
  process.exit(2)
}
const LOCALES = localeList.split(',').filter((l) => l === 'en' || l === 'ar')
const WIDTHS = widthList
  .split(',')
  .map(Number)
  .filter((w) => w === 1440 || w === 390)
const GPU_ARGS = process.platform === 'win32' ? ['--use-angle=d3d11'] : []
const LIVE_TIMEOUT = 60_000
/** Camera flights and label placement settle well within this. */
const SETTLE_MS = 4_000
const VIEWPORTS = {
  1440: { viewport: { width: 1440, height: 900 } },
  390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
}

fs.mkdirSync(outDir, { recursive: true })

async function shoot(browser, width, locale) {
  const context = await browser.newContext({ baseURL: baseUrl, ...VIEWPORTS[width] })
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
  const name = (view) => path.join(outDir, `${String(width)}-${locale}-${view}.png`)
  try {
    await page.goto(`/${locale}`)
    await page.locator('html[data-intro="seen"]').waitFor()
    const card = page.locator('[data-interactive-3d-card]')
    await card.scrollIntoViewIfNeeded()
    await page.locator('[data-open-3d-model]').click()
    await page
      .locator('[data-interactive-3d-card][data-viewer-state="live"]')
      .waitFor({ timeout: LIVE_TIMEOUT })
    await page.waitForTimeout(SETTLE_MS)
    await card.screenshot({ path: name('0-overview') })
    const count = await page.locator('[data-component="accordion-item"]').count()
    for (let i = 0; i < count; i += 1) {
      await card.focus()
      await page.keyboard.press(String(i + 1))
      const system = await card.getAttribute('data-entered')
      await card.scrollIntoViewIfNeeded()
      await page
        .locator('[data-interactive-3d-card] [data-live-labels] li button')
        .filter({ visible: true })
        .first()
        .waitFor({ timeout: 15_000 })
      await page.waitForTimeout(SETTLE_MS)
      await card.screenshot({ path: name(`${String(i + 1)}-${system ?? 'none'}`) })
      await card.focus()
      await page.keyboard.press('Escape')
      await page.locator('[data-interactive-3d-card][data-entered="none"]').waitFor()
    }
    console.log(`${String(width)}-${locale}: done`)
    return true
  } catch (err) {
    console.error(`${String(width)}-${locale}: ${err instanceof Error ? err.message : String(err)}`)
    return false
  } finally {
    await context.close()
  }
}

const browser = await chromium.launch({ args: GPU_ARGS })
let ok = true
try {
  for (const width of WIDTHS) {
    for (const locale of LOCALES) {
      ok = (await shoot(browser, width, locale)) && ok
    }
  }
} finally {
  await browser.close()
}
process.exit(ok ? 0 : 1)
