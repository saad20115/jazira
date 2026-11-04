// CTO verifier: O-13 still -> live swap after Q13. Gate: top band (0-15 %) within +-6 per channel of the poster.
// Whole-card luma change and floor band (85-100 %) change are information only. Measured from screenshots.
// Usage (from the clone): node sky-swap.mjs <baseUrl> <outDir> <locale>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out, locale = 'en'] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const cases = [
  { name: '1440-dpr1', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, touch: false },
  { name: '1440-dpr2', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, touch: false },
  { name: '390-dpr3', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, touch: true },
]
const stats = async (page, b64) => page.evaluate(async (src) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
  const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data
  const band = (y0, y1) => { let r = 0, g = 0, b = 0, n = 0; for (let y = Math.floor(y0 * c.height); y < Math.floor(y1 * c.height); y++) for (let i = 0; i < c.width; i++) { const k = (y * c.width + i) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; n++ } return [r / n, g / n, b / n] }
  const all = band(0, 1); const luma = 0.2126 * all[0] + 0.7152 * all[1] + 0.0722 * all[2]
  return { w: c.width, h: c.height, luma, top: band(0, 0.15), floor: band(0.85, 1) }
}, b64)
const rows = []
for (const cs of cases) {
  const ctx = await browser.newContext({ viewport: cs.viewport, deviceScaleFactor: cs.deviceScaleFactor, hasTouch: cs.touch, isMobile: cs.touch })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${base}/${locale}`); const card = page.locator('[data-interactive-3d-card]'); await card.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  const still = await card.screenshot(); fs.writeFileSync(`${out}/${locale}-${cs.name}-still.png`, still)
  const t0 = Date.now()
  if (cs.touch) await page.locator('[data-open-3d-model]').tap({ timeout: 10000 }); else await card.click({ position: { x: 200, y: 200 } })
  let state = null; for (let i = 0; i < 300; i++) { state = await card.getAttribute('data-viewer-state'); if (state === 'live' || state === 'stills') break; await page.waitForTimeout(100) }
  const liveMs = Date.now() - t0
  await page.waitForTimeout(1000)
  const live = await card.screenshot(); fs.writeFileSync(`${out}/${locale}-${cs.name}-live.png`, live)
  const tier = await card.getAttribute('data-viewer-tier')
  const s = await stats(page, still.toString('base64')), l = await stats(page, live.toString('base64'))
  const d = (a, b) => b.map((v, i) => +(v - a[i]).toFixed(1))
  const row = { case: `${locale}-${cs.name}`, state, tier, liveMs, size: `${s.w}x${s.h}`, topDelta: d(s.top, l.top), info_lumaDelta: +(l.luma - s.luma).toFixed(1), info_floorDelta: d(s.floor, l.floor), errors }
  row.pass = state === 'live' && row.topDelta.every((v) => Math.abs(v) <= 6)
  rows.push(row); console.log(JSON.stringify(row)); await ctx.close()
}
await browser.close(); fs.writeFileSync(`${out}/${locale}-swap-results.json`, JSON.stringify(rows, null, 2))
if (!rows.every((r) => r.pass)) process.exitCode = 1
