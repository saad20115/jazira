// R-34: aljazira_intro_seen must only be written on home with the overlay present.
import { createRequire } from 'node:module'
const req = createRequire('D:/ctoreview47-p3t13/package.json')
const { chromium } = req('@playwright/test')
const base = process.argv[2]
const browser = await chromium.launch({ headless: true })
const out = []
async function ctxWith({ throttle = false, reducedMotion } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75, reducedMotion })
  // record every sessionStorage.setItem call
  await ctx.addInitScript(() => {
    window.__ssWrites = []
    const o = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) { window.__ssWrites.push({ k, v, path: location.pathname, t: performance.now() }); return o.call(this, k, v) }
  })
  const page = await ctx.newPage()
  if (throttle) {
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
  }
  return { ctx, page }
}
const state = (page) => page.evaluate(() => ({
  path: location.pathname, status: document.title, seen: sessionStorage.getItem('aljazira_intro_seen'), dataIntro: document.documentElement.getAttribute('data-intro'),
  writes: window.__ssWrites, fp: performance.getEntriesByType('paint').find((p) => p.name === 'first-paint')?.startTime ?? null, hasOverlay: !!document.querySelector('[data-component="intro-splash"]'),
}))
try {
  // 1. Non-home pages, slow first paint (throttled x6), one session; then home in the same session
  {
    const { ctx, page } = await ctxWith({ throttle: true })
    for (const p of ['/en/privacy', '/en/services', '/ar/projects', '/en/does-not-exist', '/en/styleguide', '/ar/about']) {
      const r = await page.goto(base + p, { waitUntil: 'load', timeout: 90000 })
      await page.waitForTimeout(2600)
      out.push({ case: 'non-home throttled', http: r.status(), ...(await state(page)) })
    }
    await page.goto(base + '/en', { waitUntil: 'load', timeout: 90000 })
    await page.waitForTimeout(300)
    out.push({ case: 'home after non-home (same session, throttled)', ...(await state(page)) })
    await ctx.close()
  }
  // 2. Home without overlay (overlay attribute stripped from HTML)
  for (const loc of ['en', 'ar']) {
    const { ctx, page } = await ctxWith()
    await page.route(`${base}/${loc}`, async (route) => {
      const res = await route.fetch()
      const html = (await res.text()).replace(/(<div[^>]*?)data-component="intro-splash"/g, '$1data-component="x-removed"')
      await route.fulfill({ status: res.status(), headers: res.headers(), body: html })
    })
    await page.goto(`${base}/${loc}`, { waitUntil: 'load' })
    await page.waitForTimeout(2600)
    out.push({ case: `home /${loc} without overlay`, ...(await state(page)) })
    await ctx.close()
  }
  // 3. Home with reduced motion
  {
    const { ctx, page } = await ctxWith({ reducedMotion: 'reduce' })
    await page.goto(`${base}/en`, { waitUntil: 'load' })
    await page.waitForTimeout(2000)
    out.push({ case: 'home /en reduced motion', ...(await state(page)) })
    await ctx.close()
  }
  // 4. Normal home (control: key must be written)
  for (const p of ['/en', '/ar', '/']) {
    const { ctx, page } = await ctxWith()
    await page.goto(base + p, { waitUntil: 'load' })
    await page.waitForTimeout(2600)
    out.push({ case: `home ${p} normal`, ...(await state(page)) })
    await ctx.close()
  }
} finally {
  await browser.close()
}
for (const o of out) console.log(JSON.stringify(o))
