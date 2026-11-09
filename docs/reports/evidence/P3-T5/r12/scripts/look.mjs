// Executor tuning aid (non-authoritative): the live card's overview, HVAC and Fire at 1440 (en).
// Usage (cwd = worktree): node look.mjs <baseUrl> <outPrefix>
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {}
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
})
const page = await ctx.newPage()
await page.goto(base + '/en')
const card = page.locator('[data-interactive-3d-card]')
await card.scrollIntoViewIfNeeded()
await page.locator('[data-open-3d-model]').click()
await page.locator('[data-interactive-3d-card][data-viewer-state="live"]').waitFor({ timeout: 120000 })
await page.waitForTimeout(4000)
await card.screenshot({ path: `${out}-overview.png` })
for (const [key, name] of [['1', 'hvac'], ['2', 'fire']]) {
  await card.focus(); await page.keyboard.press(key)
  await page.locator('[data-interactive-3d-card] [data-live-labels] li button').filter({ visible: true }).first().waitFor({ timeout: 30000 })
  await page.waitForTimeout(3500)
  await card.screenshot({ path: `${out}-${name}.png` })
  await card.focus(); await page.keyboard.press('Escape')
  await page.locator('[data-interactive-3d-card][data-entered="none"]').waitFor()
  await page.waitForTimeout(3500)
}
await browser.close()
