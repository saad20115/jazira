// Executor diagnosis (non-authoritative): a Chrome trace of the "immediate" start (scroll, click Fire
// Fighting, 9 s), then the long main-thread tasks with the JS functions sampled inside them.
// Usage (cwd = the worktree): node trace.mjs <baseUrl> <outDir> [waitBeforeClickMs]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out, waitMs = '0'] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {}
})
const page = await ctx.newPage()
await page.goto(base + '/en')
await page.locator('[data-interactive-3d-card]').scrollIntoViewIfNeeded()
await browser.startTracing(page, {
  path: `${out}/trace.json`,
  categories: [
    'devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'v8',
    'disabled-by-default-v8.cpu_profiler', 'blink.user_timing', 'gpu', 'toplevel',
  ],
})
await page.waitForTimeout(Number(waitMs))
await page.locator('button', { hasText: 'Fire Fighting' }).first().click()
await page.waitForTimeout(9000)
await browser.stopTracing()
await ctx.close(); await browser.close()

const { traceEvents: ev } = JSON.parse(fs.readFileSync(`${out}/trace.json`, 'utf8'))
// The renderer main thread of the page: the thread with the most FunctionCall events.
const count = new Map()
for (const e of ev) if (e.name === 'FunctionCall') count.set(`${e.pid}:${e.tid}`, (count.get(`${e.pid}:${e.tid}`) ?? 0) + 1)
const main = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]
const onMain = ev.filter((e) => `${e.pid}:${e.tid}` === main && e.ph === 'X')
const tasks = onMain.filter((e) => e.name === 'RunTask' && e.dur >= 100_000).sort((a, b) => a.ts - b.ts)
// CPU profile samples (the same pid/tid), with their stacks.
const nodes = new Map()
const samples = []
for (const e of ev) {
  if (e.name !== 'ProfileChunk' || `${e.pid}:${e.tid}` !== main) continue
  const cp = e.args?.data?.cpuProfile
  if (!cp) continue
  for (const n of cp.nodes ?? []) nodes.set(n.id, n)
  let t = e.args.data._ts ?? null
  samples.push({ chunk: e, cp, deltas: e.args.data.timeDeltas ?? [] })
}
// Rebuild sample times: chunks carry deltas from the previous sample of the profile.
const profileStart = ev.find((e) => e.name === 'Profile' && `${e.pid}:${e.tid}` === main)
let t = profileStart?.args?.data?.startTime ?? 0
const timed = []
for (const s of samples) {
  const ids = s.cp.samples ?? []
  for (let i = 0; i < ids.length; i += 1) { t += s.deltas[i] ?? 0; timed.push([t, ids[i]]) }
}
const frameOf = (id) => { const n = nodes.get(id); return n ? n.callFrame : null }
const stackOf = (id) => { const st = []; let n = nodes.get(id); while (n) { st.push(n.callFrame); n = n.parent !== undefined ? nodes.get(n.parent) : null } return st }
const label = (cf) => cf ? `${cf.functionName || '(anon)'}@${(cf.url || '').split('/').pop()}:${cf.lineNumber}` : '?'
const lines = []
for (const task of tasks) {
  const kids = onMain.filter((e) => e.ts >= task.ts && e.ts + e.dur <= task.ts + task.dur && e !== task && e.dur >= 20_000)
    .map((e) => `${e.name}${e.args?.data?.functionName ? ' ' + e.args.data.functionName : ''}${e.args?.data?.url ? ' ' + e.args.data.url.split('/').pop() + ':' + e.args.data.lineNumber : ''} ${Math.round(e.dur / 1000)}`)
  const self = new Map()
  const incl = new Map()
  for (const [ts, id] of timed) {
    if (ts < task.ts || ts > task.ts + task.dur) continue
    const top = label(frameOf(id))
    self.set(top, (self.get(top) ?? 0) + 1)
    for (const cf of new Set(stackOf(id).map(label))) incl.set(cf, (incl.get(cf) ?? 0) + 1)
  }
  const topSelf = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const topIncl = [...incl.entries()].filter(([k]) => !/^\(root\)|^\(program\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 14)
  lines.push(`TASK ${Math.round(task.dur / 1000)} ms at +${Math.round((task.ts - tasks[0].ts) / 1000)}`)
  lines.push('  events: ' + kids.slice(0, 12).join(' | '))
  lines.push('  self: ' + topSelf.map(([k, v]) => `${k} ${v}`).join(' | '))
  lines.push('  incl: ' + topIncl.map(([k, v]) => `${k} ${v}`).join(' | '))
}
fs.writeFileSync(`${out}/long-tasks.txt`, lines.join('\n'))
fs.rmSync(`${out}/trace.json`)
console.log(lines.join('\n'))
