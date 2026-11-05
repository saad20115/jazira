// CTO verifier: O-13 sky look for the owner's eye review. Poster, live hero, Fire Fighting, HVAC at 1440 and 390,
// en and ar, plus a screen recording of each run (the swap and the flights). Usage: node owner-shots.mjs <baseUrl> <outDir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
let order = null // indices of the system buttons in the section, taken from en (same order in ar)
for (const loc of ['en', 'ar']) for (const v of [{ n: 'desktop', viewport: { width: 1440, height: 900 }, touch: false }, { n: 'phone', viewport: { width: 390, height: 844 }, touch: true }]) {
  const dir = `${out}/${loc}-${v.n}`; fs.mkdirSync(dir, { recursive: true })
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.touch ? 3 : 1, hasTouch: v.touch, isMobile: v.touch, recordVideo: { dir, size: v.viewport } })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
  const page = await ctx.newPage(); await page.goto(`${base}/${loc}`)
  const card = page.locator('[data-interactive-3d-card]'); const section = page.locator('section', { has: card }).first()
  const systems = section.locator('button')
  await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(1600)
  await section.screenshot({ path: `${dir}/1-poster.png` })
  if (v.touch) await page.locator('[data-open-3d-model]').tap(); else await card.click({ position: { x: 200, y: 200 } })
  await page.waitForFunction(() => document.querySelector('[data-interactive-3d-card]')?.getAttribute('data-viewer-state') === 'live', null, { timeout: 30000 })
  await page.waitForTimeout(2500); await section.screenshot({ path: `${dir}/2-live.png` })
  if (!order) { const t = await systems.allInnerTexts(); order = { fire: t.findIndex((x) => x.includes('Fire Fighting')), hvac: t.findIndex((x) => x.includes('HVAC')) }; console.log('order', JSON.stringify(order)); if (order.fire < 0 || order.hvac < 0) throw new Error('system buttons not found: ' + JSON.stringify(t)) }
  await systems.nth(order.fire).click(); await page.waitForTimeout(4000); await section.screenshot({ path: `${dir}/3-fire.png` })
  await systems.nth(order.hvac).click(); await page.waitForTimeout(4000); await section.screenshot({ path: `${dir}/4-hvac.png` })
  console.log(loc, v.n, await card.getAttribute('data-viewer-state'), await card.getAttribute('data-viewer-tier'), await card.getAttribute('data-entered'))
  await ctx.close()
}
await browser.close()
