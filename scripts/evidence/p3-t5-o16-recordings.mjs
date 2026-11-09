// P3-T5 round 10 evidence (owner addendum 4, O-16): screen recordings of a direct switch from one
// system to another in the live model, for three pairs, at 1440×900 in English. Each flow opens the
// page, goes live, enters the first system, waits until the camera is there, then clicks the second
// system's row and waits until the camera has arrived. Nothing is measured here (the e2e test checks
// the overview is never reached).
// Each flow is written, also on failure (its error is printed and the exit code is 1).
// Usage: node scripts/evidence/p3-t5-o16-recordings.mjs <baseUrl> <outDir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outDir] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('usage: node scripts/evidence/p3-t5-o16-recordings.mjs <baseUrl> <outDir>')
  process.exit(2)
}
const GPU_ARGS = process.platform === 'win32' ? ['--use-angle=d3d11'] : []
const LIVE_TIMEOUT = 60_000
const ARRIVE_TIMEOUT = 30_000
const VIEWPORT = { width: 1440, height: 900 }
const ROWS = { hvac: 'HVAC', fire: 'Fire Fighting', plumbing: 'Plumbing', smart: 'Smart Systems' }
const PAIRS = [
  ['hvac', 'fire'],
  ['fire', 'plumbing'],
  ['plumbing', 'smart'],
]

fs.mkdirSync(outDir, { recursive: true })

async function record(browser, [from, to]) {
  const name = `switch-${from}-to-${to}-1440-en`
  const dir = path.join(outDir, name)
  fs.mkdirSync(dir, { recursive: true })
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: VIEWPORT,
    recordVideo: { dir, size: VIEWPORT },
  })
  await context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    } catch {
      // about:blank has no storage.
    }
  })
  const page = await context.newPage()
  const card = page.locator('[data-interactive-3d-card]')
  const arrived = (system) =>
    page
      .locator(
        `[data-interactive-3d-card][data-entered="${system}"] [data-live-labels] li button:visible`,
      )
      .first()
      .waitFor({ timeout: ARRIVE_TIMEOUT })
  const enter = async (system) => {
    await page
      .locator('[data-component="accordion-item"]', { hasText: ROWS[system] })
      .locator(':scope > button')
      .click()
    await page.mouse.move(0, 0)
  }
  try {
    await page.goto('/en')
    await card.scrollIntoViewIfNeeded()
    await page.locator('[data-interactive-3d-card][tabindex="0"]').waitFor()
    const box = await card.boundingBox()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await page
      .locator('[data-interactive-3d-card][data-viewer-state="live"]')
      .waitFor({ timeout: LIVE_TIMEOUT })
    await enter(from)
    await arrived(from)
    await page.waitForTimeout(1_500)
    await enter(to)
    await arrived(to)
    await page.waitForTimeout(1_500)
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
  for (const pair of PAIRS) {
    ok = (await record(browser, pair)) && ok
  }
} finally {
  await browser.close()
}
process.exit(ok ? 0 : 1)
