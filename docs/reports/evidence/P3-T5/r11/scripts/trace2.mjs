// Executor diagnosis (non-authoritative): trace from scroll to click+9 s ("onscreen3s": the card on
// screen for 3 s before the click), then every main-thread task >= 30 ms with the sampled JS inside
// it, relative to the click; and the time the card went live.
// Usage (cwd = the worktree): node trace2.mjs <baseUrl> <outDir> [waitBeforeClickMs]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out, waitMs = '3000'] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {}
  document.addEventListener('DOMContentLoaded', () => {
    const tick = () => {
      const c = document.querySelector('[data-interactive-3d-card]')
      if (!c) return setTimeout(tick, 50)
      let last = ''
      new MutationObserver(() => {
        const s = c.getAttribute('data-viewer-state')
        if (s !== last) { last = s; performance.mark('state-' + s) }
      }).observe(c, { attributes: true })
    }
    tick()
  })
})
const page = await ctx.newPage()
await browser.startTracing(page, {
  path: `${out}/trace.json`,
  categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'disabled-by-default-v8.cpu_profiler', 'blink.user_timing', 'toplevel'],
})
await page.goto(base + '/en')
await page.locator('[data-interactive-3d-card]').scrollIntoViewIfNeeded()
await page.evaluate(() => performance.mark('scrolled'))
await page.waitForTimeout(Number(waitMs))
await page.evaluate(() => performance.mark('click'))
await page.locator('button', { hasText: 'Fire Fighting' }).first().click()
await page.waitForTimeout(9000)
await browser.stopTracing()
await ctx.close(); await browser.close()

const { traceEvents: ev } = JSON.parse(fs.readFileSync(`${out}/trace.json`, 'utf8'))
const count = new Map()
for (const e of ev) if (e.name === 'FunctionCall') count.set(`${e.pid}:${e.tid}`, (count.get(`${e.pid}:${e.tid}`) ?? 0) + 1)
const main = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]
const mark = (name) => ev.find((e) => e.name === name && e.cat?.includes('blink.user_timing'))?.ts ?? null
const tClick = mark('click'), tScroll = mark('scrolled'), tLive = mark('state-live'), tStills = mark('state-stills')
const onMain = ev.filter((e) => `${e.pid}:${e.tid}` === main && e.ph === 'X')
const nodes = new Map(); const chunks = []
for (const e of ev) {
  if (e.name !== 'ProfileChunk' || `${e.pid}:${e.tid}` !== main) continue
  const cp = e.args?.data?.cpuProfile; if (!cp) continue
  for (const n of cp.nodes ?? []) nodes.set(n.id, n)
  chunks.push({ ids: cp.samples ?? [], deltas: e.args.data.timeDeltas ?? [] })
}
const prof = ev.find((e) => e.name === 'Profile' && `${e.pid}:${e.tid}` === main)
let t = prof?.args?.data?.startTime ?? 0
const timed = []
for (const c of chunks) for (let i = 0; i < c.ids.length; i += 1) { t += c.deltas[i] ?? 0; timed.push([t, c.ids[i]]) }
const label = (cf) => cf ? `${cf.functionName || '(anon)'}@${(cf.url || '').split('/').pop()}:${cf.lineNumber}:${cf.columnNumber}` : '?'
const stack = (id) => { const s = []; let n = nodes.get(id); while (n) { s.push(label(n.callFrame)); n = n.parent !== undefined ? nodes.get(n.parent) : null } return s }
const rel = (ts) => `${Math.round((ts - tClick) / 1000)}`
const lines = [`scroll ${rel(tScroll)} click 0 live ${tLive ? rel(tLive) : null} stills ${tStills ? rel(tStills) : null}`]
const tasks = onMain.filter((e) => e.name === 'RunTask' && e.dur >= 30_000 && e.ts >= tScroll).sort((a, b) => a.ts - b.ts)
for (const task of tasks) {
  const incl = new Map()
  for (const [ts, id] of timed) {
    if (ts < task.ts || ts > task.ts + task.dur) continue
    for (const f of new Set(stack(id))) incl.set(f, (incl.get(f) ?? 0) + 1)
  }
  const top = [...incl.entries()].filter(([k]) => !/^\((root|program|idle)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const kids = onMain.filter((e) => e !== task && e.ts >= task.ts && e.ts + e.dur <= task.ts + task.dur && e.dur >= 15_000 && !/RunTask|ThreadController|v8\.|V8\./.test(e.name)).map((e) => `${e.name} ${Math.round(e.dur / 1000)}`).slice(0, 6)
  lines.push(`${rel(task.ts).padStart(6)} ${String(Math.round(task.dur / 1000)).padStart(4)} ms | ${kids.join(', ')} | ${top.map(([k, v]) => `${k}:${v}`).join(' ')}`)
}
fs.writeFileSync(`${out}/tasks.txt`, lines.join('\n'))
fs.rmSync(`${out}/trace.json`)
console.log(lines.join('\n'))
