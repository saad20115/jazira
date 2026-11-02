// CTO verifier: screenshots of the 3D card for the owner's eye review (O-5 lighting, O-7 hand, O-11 push-in).
// Usage (from the clone): node owner-shots.mjs <baseUrl> <outDir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
for (const v of [{ n: 'desktop', viewport: { width: 1440, height: 900 }, touch: false }, { n: 'phone', viewport: { width: 390, height: 844 }, touch: true }]) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.touch ? 3 : 1, hasTouch: v.touch, isMobile: v.touch })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
  const page = await ctx.newPage(); await page.goto(base + '/en')
  const card = page.locator('[data-interactive-3d-card]'); const section = page.locator('section', { has: card }).first()
  await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(1600)
  await section.screenshot({ path: `${out}/${v.n}-1-before-hand.png` })
  await page.waitForTimeout(3000)
  if (v.touch) await page.locator('[data-open-3d-model]').tap(); else await card.click({ position: { x: 200, y: 200 } })
  await page.waitForTimeout(250); await section.screenshot({ path: `${out}/${v.n}-2-after-click.png` })
  await page.waitForFunction(() => document.querySelector('[data-interactive-3d-card]')?.getAttribute('data-viewer-state') === 'live', null, { timeout: 30000 })
  await page.waitForTimeout(2500); await section.screenshot({ path: `${out}/${v.n}-3-live.png` })
  await page.locator('button', { hasText: 'HVAC' }).first().click(); await page.waitForTimeout(4000)
  await section.screenshot({ path: `${out}/${v.n}-4-hvac.png` })
  console.log(v.n, await card.getAttribute('data-viewer-state'), await card.getAttribute('data-viewer-tier'), await card.getAttribute('data-entered'))
  await ctx.close()
}
await browser.close()
