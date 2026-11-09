// CTO verifier: P3-T5 O-9 / O-11 gates, measured from outside the code (DOM input events, attribute
// changes, rAF gaps, long tasks, card transform, screencast). One fresh browser per run, retries 0.
// Usage (from the clone): node cards-gates.mjs <baseUrl> <outDir> <mode>
//   mode onscreen3s : scroll to the card, wait 3 s, click Fire Fighting   (gate: live <= 1500 ms)
//   mode immediate  : scroll to the card, click Fire Fighting at once     (gate: live <= 3000 ms)
//   mode latest     : immediate, then Plumbing 300 ms later                (gate: ends in plumbing)
//   mode throttle10 : CPU throttled 10x (CDP), click Fire Fighting, wait 11 s     (gate O-14: live or stills <= 10 s)
//   mode held       : the model download never answers, click, wait 11 s     (gate O-14: stills, reason timeout, <= 10 s)
// Then (onscreen3s / immediate / latest) Plumbing, HVAC, Smart Systems while live, 6 s apart   (gate: flight starts <= 300 ms)
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out, mode] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } })
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {}
  const w = (window.__probe = { log: [], gaps: [], long: [], downs: [], scale: [] })
  addEventListener('pointerdown', () => w.downs.push(Math.round(performance.now())), true)
  new PerformanceObserver((l) => { for (const e of l.getEntries()) w.long.push([Math.round(e.startTime), Math.round(e.duration)]) }).observe({ type: 'longtask', buffered: true })
  let last = performance.now()
  const loop = (t) => {
    const g = t - last; if (g > 40) w.gaps.push([Math.round(t), Math.round(g)]); last = t
    const c = document.querySelector('[data-interactive-3d-card]')
    if (c) { const layers = [...c.querySelectorAll(':scope > [class*="poster"], :scope > [class*="enteredLayer"]')]; if (layers.length) { const a = Math.max(...layers.map((l) => { const tr = getComputedStyle(l).transform; return tr === 'none' ? 1 : new DOMMatrixReadOnly(tr).a })); w.scale.push([Math.round(t), +a.toFixed(4), c.getAttribute('data-viewer-state')]) } }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
  document.addEventListener('DOMContentLoaded', () => {
    const tick = () => { const c = document.querySelector('[data-interactive-3d-card]'); if (!c) return setTimeout(tick, 50)
      const snap = () => { const s = [c.getAttribute('data-viewer-state'), c.getAttribute('data-entered'), c.getAttribute('data-viewer-tier'), c.getAttribute('data-viewer-fallback'), document.querySelector('[data-interactive-3d-card] canvas') ? 'canvas' : ''].join('/'); if (s !== w.last) { w.last = s; w.log.push([Math.round(performance.now()), s]) } }
      new MutationObserver(snap).observe(c, { attributes: true, subtree: true, childList: true }); snap() }
    tick()
  })
})
const page = await ctx.newPage(); const errors = []
if (mode === 'held') await page.route('**/*.glb', () => new Promise(() => undefined))
const cdp = mode === 'throttle10' ? await ctx.newCDPSession(page) : null
page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('error: ' + m.text()) })
const reqs = []; page.on('request', (r) => { if (/\.(glb|ktx2)(\?|$)/.test(r.url())) reqs.push(r.url().split('/').pop()) })
await page.goto(base + '/en'); const card = page.locator('[data-interactive-3d-card]'); await card.scrollIntoViewIfNeeded()
const tScroll = await page.evaluate(() => Math.round(performance.now()))
if (mode === 'onscreen3s') await page.waitForTimeout(3000)
const btn = (n) => page.locator('button', { hasText: n }).first()
if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 10 })
await btn('Fire Fighting').click()
if (mode === 'latest') { await page.waitForTimeout(300); await btn('Plumbing').click() }
const short = mode === 'throttle10' || mode === 'held'
await page.waitForTimeout(short ? 11000 : 9000)
if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
const later = ['Plumbing', 'HVAC', 'Smart Systems'].filter((n) => !(mode === 'latest' && n === 'Plumbing'))
if (!short) for (const n of later) { await btn(n).click(); await page.waitForTimeout(6000) }
const p = await page.evaluate(() => window.__probe)
await ctx.close(); await browser.close()

// Derived results, all from the raw probe.
const first = p.downs[0]
const liveAt = (p.log.find((l) => l[0] >= first && l[1].startsWith('live/')) || [null])[0]
const liveMs = liveAt === null ? null : liveAt - first
const firstEnd = first + 9000
const settled = p.log.find((l) => l[0] >= first && (l[1].startsWith('live/') || l[1].startsWith('stills/'))) || null
const settledMs = settled ? settled[0] - first : null
const longFirst = p.long.filter((l) => l[0] >= first && l[0] < firstEnd).map((l) => l[1])
const tiers = [...new Set(p.log.filter((l) => l[0] >= (liveAt ?? Infinity)).map((l) => l[1].split('/')[2]))]
const laterDowns = p.downs.slice(mode === 'latest' ? 2 : 1)
const laterStarts = laterDowns.map((d, i) => { const want = ['plumbing', 'hvac', 'smart'].slice(mode === 'latest' ? 1 : 0)[i]; const e = p.log.find((l) => l[0] >= d && l[1].split('/')[1] === want); return e ? e[0] - d : null })
const flightWindows = [[liveAt ?? firstEnd, firstEnd], ...laterDowns.map((d) => [d, d + 3000])]
const flightGaps = p.gaps.filter((g) => flightWindows.some(([a, b]) => g[0] >= a && g[0] < b)).map((g) => g[1])
const loadScale = p.scale.filter((s) => s[2] === 'loading').map((s) => s[1])
const swap = p.scale.findIndex((s) => s[0] >= (liveAt ?? Infinity))
const scaleAround = swap > 0 ? [p.scale[swap - 1][1], p.scale[swap][1]] : null
const finalEntered = (p.log.filter((l) => l[0] < (laterDowns[0] ?? Infinity)).pop() || [0, ''])[1].split('/')[1]
const res = {
  mode, tScroll, settledMs, settledState: settled ? settled[1] : null, firstClick: first, liveMs, maxLongTaskFirstWindow: longFirst.length ? Math.max(...longFirst) : 0,
  maxFlightGap: flightGaps.length ? Math.max(...flightGaps) : 0, tiersAfterLive: tiers, laterStartMs: laterStarts,
  maxLoadScale: loadScale.length ? Math.max(...loadScale) : null, scaleAtSwap: scaleAround, enteredAfterFirstPhase: finalEntered,
  modelRequests: reqs, errors,
}
res.pass = short ? {
  settled: settledMs !== null && settledMs <= 10000,
  held: mode !== 'held' || (settled !== null && settled[1].startsWith('stills/') && settled[1].split('/')[3] === 'timeout'),
} : {
  settled: settledMs !== null && settledMs <= 10000,
  live: liveMs !== null && liveMs <= (mode === 'onscreen3s' ? 1500 : 3000),
  longTask: res.maxLongTaskFirstWindow < 200,
  flightGap: res.maxFlightGap < 100,
  tier: tiers.length === 1,
  later: laterStarts.every((v) => v !== null && v <= 300),
  latest: mode !== 'latest' || finalEntered === 'plumbing',
}
fs.writeFileSync(`${out}/probe.json`, JSON.stringify(p))
fs.writeFileSync(`${out}/result.json`, JSON.stringify(res, null, 1))
console.log(JSON.stringify(res))
