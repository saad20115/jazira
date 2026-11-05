import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, sys] = process.argv.slice(2)
const ROWS = { hvac: 'HVAC', fire: 'Fire Fighting', plumbing: 'Plumbing', smart: 'Smart Systems' }
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
const page = await ctx.newPage()
await page.goto(base + '/en'); const card = page.locator('[data-interactive-3d-card]'); await card.scrollIntoViewIfNeeded()
await page.locator('[data-interactive-3d-card][tabindex="0"]').waitFor()
const box = await card.boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
await page.locator('[data-interactive-3d-card][data-viewer-state="live"]').waitFor({ timeout: 60000 })
console.log('tier', await card.getAttribute('data-viewer-tier'))
await page.locator('[data-component="accordion-item"]', { hasText: ROWS[sys] }).locator(':scope > button').click(); await page.mouse.move(0, 0)
await page.waitForTimeout(8000)
const iv = await page.evaluate(() => new Promise((res) => { const a = []; let last = performance.now(); const t0 = last; const f = (t) => { a.push(t - last); last = t; if (t - t0 < 5000) requestAnimationFrame(f); else res(a) }; requestAnimationFrame(f) }))
const s = [...iv].sort((x, y) => x - y); const mean = iv.reduce((x, y) => x + Math.min(y, 250), 0) / iv.length
console.log(sys, 'frames', iv.length, 'mean', mean.toFixed(1), 'fps', (1000 / mean).toFixed(1), 'p50', s[s.length >> 1].toFixed(1), 'p90', s[Math.floor(s.length * 0.9)].toFixed(1), 'state', await card.getAttribute('data-viewer-state'))
await browser.close()
