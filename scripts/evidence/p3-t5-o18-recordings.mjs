// P3-T5 O-18 evidence (owner addendum 5): a recording of leaving a system with the mouse wheel, at
// 1440 × 900 (en), for the owner to judge by hand. Nothing is measured here.
//
// The live card goes into Fire Fighting. Then, with the pointer on the card:
// 1. two wheel ticks out: the view zooms, the system stays;
// 2. one run of wheel ticks into the zoom-out limit and on: the view stops at the limit;
// 3. a pause, then one more tick out: the system exits (the flight out, the row closes).
// The card's state is printed after each step.
//
// Usage: node scripts/evidence/p3-t5-o18-recordings.mjs <baseUrl> <outDir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outDir] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('usage: node scripts/evidence/p3-t5-o18-recordings.mjs <baseUrl> <outDir>')
  process.exit(2)
}
const GPU_ARGS = process.platform === 'win32' ? ['--use-angle=d3d11'] : []
const VIEWPORT = { width: 1440, height: 900 }
const dir = path.join(outDir, 'wheel-exit-fire-1440-en')
fs.mkdirSync(dir, { recursive: true })

const browser = await chromium.launch({ args: GPU_ARGS })
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
let ok = true
try {
  await page.goto('/en')
  const card = page.locator('[data-interactive-3d-card]')
  await card.scrollIntoViewIfNeeded()
  await page.locator('[data-open-3d-model]').click()
  await page
    .locator('[data-interactive-3d-card][data-viewer-state="live"]')
    .waitFor({ timeout: 60_000 })
  const rows = page.locator('[data-component="accordion-item"]')
  const fire = (await rows.allInnerTexts()).findIndex((t) => t.includes('Fire Fighting'))
  await card.focus()
  await page.keyboard.press(String(fire + 1))
  await page
    .locator('[data-interactive-3d-card] [data-live-labels] li button')
    .filter({ visible: true })
    .first()
    .waitFor({ timeout: 30_000 })
  await page.waitForTimeout(1_500)
  const box = await card.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  const state = async (step) =>
    console.log(
      `${step}: entered=${String(await card.getAttribute('data-entered'))} hash=${new URL(page.url()).hash}`,
    )
  const gesture = async (ticks) => {
    for (let i = 0; i < ticks; i += 1) {
      await page.mouse.wheel(0, 100)
      await page.waitForTimeout(30)
    }
  }
  await state('inside')
  await gesture(2)
  await page.waitForTimeout(1_200)
  await state('after two ticks')
  await gesture(14)
  await page.waitForTimeout(1_500)
  await state('after the run into the limit')
  await page.mouse.wheel(0, 100)
  await page.waitForTimeout(4_000)
  await state('after a pause and one more tick')
} catch (err) {
  ok = false
  console.error(err instanceof Error ? err.message : String(err))
} finally {
  await context.close()
  await browser.close()
}
process.exit(ok ? 0 : 1)
