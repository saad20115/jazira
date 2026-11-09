// P3-T5 phone evidence: one-finger swipes over the systems card at 390x844 (touch, isMobile) in
// each state. The page must scroll unless the card is active (then the drag rotates the model).
// Swipes end with the finger held still for 150 ms so no fling starts: a tap during a fling only
// stops the fling and never becomes a click (Chrome on real phones behaves the same).
// Usage: node scripts/evidence/p3-t5-phone-scroll.mjs [baseUrl]   (default http://localhost:3170)
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const base = process.argv[2] ?? 'http://localhost:3170'
const { chromium } = require('@playwright/test')
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
const page = await ctx.newPage()
page.on('console', (m) => {
  const t = m.text()
  if (!t.includes('Content Security Policy') && !t.includes('preloaded') && !t.includes('X4122'))
    console.log('[console]', m.type(), t.slice(0, 200))
})
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
const cdp = await ctx.newCDPSession(page)
await page.goto(`${base}/en`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => document.documentElement.dataset.intro === 'seen', null, {
  timeout: 30000,
})
const card = page.locator('[data-interactive-3d-card]')
await card.scrollIntoViewIfNeeded()
async function swipeAt(x, y, label) {
  const y0 = await page.evaluate(() => scrollY)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: Math.round(x), y: Math.round(y) }],
  })
  for (let i = 1; i <= 10; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: Math.round(x), y: Math.round(y - i * 25) }],
    })
    await page.waitForTimeout(16)
  }
  await page.waitForTimeout(150)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(600)
  const y1 = await page.evaluate(() => scrollY)
  const r = {
    label,
    scrolledBy: Math.round(y1 - y0),
    state: await card.getAttribute('data-viewer-state'),
    active: await card.getAttribute('data-viewer-active'),
  }
  await page.evaluate((y) => window.scrollTo(0, y), y0)
  await page.waitForTimeout(200)
  return r
}
const out = []
const push = (r) => {
  out.push(r)
  console.log(JSON.stringify(r))
}
let b = await card.boundingBox()
push(await swipeAt(195, b.y - 120, 'outside card (heading), still'))
push(await swipeAt(b.x + b.width / 2, b.y + b.height / 2, 'over card, still'))
await page.waitForTimeout(1000)
await page.locator('[data-open-3d-model]').tap()
await page.waitForTimeout(500)
push({ afterOpenTap: await card.getAttribute('data-viewer-state') })
for (let i = 0; i < 18; i += 1) {
  const st = await card.getAttribute('data-viewer-state')
  if (st === 'live' || st === 'stills') break
  await page.waitForTimeout(5000)
}
push({ stateAfterWait: await card.getAttribute('data-viewer-state') })
if ((await card.getAttribute('data-viewer-state')) !== 'live') {
  await browser.close()
  process.exit(2)
}
await page.waitForTimeout(800)
b = await card.boundingBox()
push(await swipeAt(b.x + b.width / 2, b.y + b.height / 2, 'over card, live inactive'))
await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2)
await page.waitForTimeout(300)
push({ afterCardTap: await card.getAttribute('data-viewer-active') })
b = await card.boundingBox()
push(
  await swipeAt(
    b.x + b.width / 2,
    b.y + b.height / 2,
    'over card, live ACTIVE (should not scroll)',
  ),
)
push({ doneVisible: await page.locator('[data-done]').isVisible() })
if (await page.locator('[data-done]').isVisible()) await page.locator('[data-done]').tap()
await page.waitForTimeout(300)
b = await card.boundingBox()
push(await swipeAt(b.x + b.width / 2, b.y + b.height / 2, 'over card, after Done'))
await browser.close()
