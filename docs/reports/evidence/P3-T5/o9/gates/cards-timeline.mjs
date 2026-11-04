// CTO verifier: what the visitor sees when pressing the system cards (owner report 2026-11-02 "تعليق").
// Measured from outside the code: attribute changes, rAF gaps, long tasks, screencast. Usage (from the clone):
// node cards-timeline.mjs <baseUrl> <outDir> <spoofHw 0|1>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out, spoof] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } })
await ctx.addInitScript((sp) => {
  try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {}
  if (sp) { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }) }
  const t0 = performance.now(); const w = (window.__probe = { log: [], gaps: [], long: [] })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) w.long.push([Math.round(e.startTime), Math.round(e.duration)]) }).observe({ type: 'longtask', buffered: true })
  let last = performance.now(); const loop = (t) => { const g = t - last; if (g > 40) w.gaps.push([Math.round(t), Math.round(g)]); last = t; requestAnimationFrame(loop) }; requestAnimationFrame(loop)
  document.addEventListener('DOMContentLoaded', () => {
    const tick = () => { const c = document.querySelector('[data-interactive-3d-card]'); if (!c) return setTimeout(tick, 50)
      const snap = () => { const busy = !!document.querySelector('[data-interactive-3d-card] [role="status"]:not([hidden])'); const s = [c.getAttribute('data-viewer-state'), c.getAttribute('data-entered'), c.getAttribute('data-viewer-tier'), busy ? 'loading' : '', document.querySelector('[data-interactive-3d-card] canvas') ? 'canvas' : ''].join('/'); if (s !== w.last) { w.last = s; w.log.push([Math.round(performance.now()), s]) } }
      new MutationObserver(snap).observe(c, { attributes: true, subtree: true, childList: true }); snap() }
    tick()
  })
}, spoof === '1')
const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()) })
await page.goto(base + '/en'); const card = page.locator('[data-interactive-3d-card]'); await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(2000)
const hw = await page.evaluate(() => ({ cores: navigator.hardwareConcurrency, mem: navigator.deviceMemory }))
const marks = []
const press = async (name) => { const t = await page.evaluate(() => Math.round(performance.now())); marks.push([t, 'CLICK ' + name]); await page.locator('button', { hasText: name }).first().click(); await page.waitForTimeout(9000) }
await press('Fire Fighting')
await press('Plumbing')
await press('HVAC')
await press('Smart Systems')
const probe = await page.evaluate(() => window.__probe)
const res = { hw, marks, log: probe.log, longTasks: probe.long, gaps: probe.gaps, errors }
fs.writeFileSync(`${out}/timeline.json`, JSON.stringify(res, null, 1))
await ctx.close(); await browser.close()
const merged = [...marks.map((m) => [m[0], m[1]]), ...probe.log.map((l) => [l[0], 'state ' + l[1]]), ...probe.long.filter((l) => l[1] >= 100).map((l) => [l[0], 'LONGTASK ' + l[1] + 'ms']), ...probe.gaps.filter((g) => g[1] >= 100).map((g) => [g[0], 'FRAME GAP ' + g[1] + 'ms'])].sort((a, b) => a[0] - b[0])
console.log(JSON.stringify({ hw, errors: errors.slice(0, 10) }))
for (const m of merged) console.log(m[0], m[1])
