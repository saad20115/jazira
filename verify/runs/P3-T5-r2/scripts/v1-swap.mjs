// CTO verifier: V-1 still→live swap gate (luma ±5, top/floor bands ±6 per channel), measured from outside the code.
// Usage (from the clone, for its playwright): node v1-swap.mjs <baseUrl> <outDir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const cases = [
  { name: '1440-dpr1-hover', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, touch: false },
  { name: '1440-dpr2-hover', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, touch: false },
  { name: '390-dpr3-tap', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, touch: true },
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
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {}
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }) })
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(base + '/en'); const card = page.locator('[data-interactive-3d-card]'); await card.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  const still = await card.screenshot(); fs.writeFileSync(`${out}/${cs.name}-still.png`, still)
  const t0 = Date.now()
  if (cs.touch) await page.locator('[data-open-3d-model]').tap({ timeout: 10000 }); else await card.hover({ position: { x: 30, y: 30 } })
  let state = null; for (let i = 0; i < 300; i++) { state = await card.getAttribute('data-viewer-state'); if (state === 'live') break; await page.waitForTimeout(100) }
  const liveMs = Date.now() - t0
  await page.waitForTimeout(400)
  const live = await card.screenshot(); fs.writeFileSync(`${out}/${cs.name}-live.png`, live)
  const tier = await card.getAttribute('data-viewer-tier')
  const s = await stats(page, still.toString('base64')), l = await stats(page, live.toString('base64'))
  const d = (a, b) => b.map((v, i) => +(v - a[i]).toFixed(1))
  const row = { case: cs.name, state, tier, liveMs, size: `${s.w}x${s.h}`, stillLuma: +s.luma.toFixed(1), lumaDelta: +(l.luma - s.luma).toFixed(1), topDelta: d(s.top, l.top), floorDelta: d(s.floor, l.floor), errors }
  row.pass = state === 'live' && Math.abs(row.lumaDelta) <= 5 && [...row.topDelta, ...row.floorDelta].every((v) => Math.abs(v) <= 6)
  rows.push(row); console.log(JSON.stringify(row)); await ctx.close()
}
await browser.close(); fs.writeFileSync(`${out}/v1-results.json`, JSON.stringify(rows, null, 2))
