// P3-T5 evidence: every main-thread task over 50 ms from the 3D intent until 6 s after the first
// live frame (which covers the background shader warm-up), from a Chrome timeline trace, with the
// CPU-profile samples inside each task grouped by the nearest known three.js step.
// Usage: node scripts/evidence/p3-t5-long-tasks.mjs <baseUrl> <out.json> [runs]
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outPath, runsArg] = process.argv.slice(2)
if (!baseUrl || !outPath) {
  console.error('usage: node scripts/evidence/p3-t5-long-tasks.mjs <baseUrl> <out.json> [runs]')
  process.exit(2)
}
const runs = Number(runsArg ?? 3)
const STEPS = [
  'initTexture',
  'compileAsync',
  'acquireProgram',
  'getUniforms',
  'fromScene',
  'render',
  'parse',
]

/** Whole-machine CPU load (%) on Windows: other processes skew main-thread timings. */
function cpuLoad() {
  if (process.platform !== 'win32') {
    return null
  }
  const out = execFileSync(
    'powershell',
    ['-NoProfile', '-Command', '(Get-CimInstance Win32_Processor).LoadPercentage'],
    { encoding: 'utf8' },
  )
  return Number(out.trim())
}

async function oneRun() {
  const browser = await chromium.launch({
    args: process.platform === 'win32' ? ['--use-angle=d3d11'] : [],
  })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await context.addInitScript(() => {
      try {
        window.sessionStorage.setItem('aljazira_intro_seen', '1')
      } catch {
        // about:blank has no storage
      }
    })
    const page = await context.newPage()
    await page.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
    const card = page.locator('[data-interactive-3d-card]')
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    const cdp = await context.newCDPSession(page)
    await cdp.send('Profiler.enable')
    await cdp.send('Profiler.setSamplingInterval', { interval: 250 })
    await cdp.send('Profiler.start')
    await browser.startTracing(page, {
      categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8'],
    })
    await card.hover()
    await page.waitForFunction(
      () =>
        document.querySelector('[data-interactive-3d-card]')?.getAttribute('data-viewer-state') ===
        'live',
      null,
      { timeout: 60_000 },
    )
    await page.waitForTimeout(6_000)
    const trace = JSON.parse((await browser.stopTracing()).toString()).traceEvents
    const { profile } = await cdp.send('Profiler.stop')
    const threads = new Map(
      trace
        .filter((e) => e.ph === 'M' && e.name === 'thread_name')
        .map((e) => [`${e.pid}:${e.tid}`, e.args.name]),
    )
    const main = trace.filter((e) => threads.get(`${e.pid}:${e.tid}`) === 'CrRendererMain')
    const tasks = main
      .filter((e) => e.name === 'RunTask' && e.ph === 'X' && e.dur > 50_000)
      .sort((a, b) => a.ts - b.ts)
    const byId = new Map(profile.nodes.map((n) => [n.id, n]))
    const parent = new Map()
    for (const n of profile.nodes) {
      for (const c of n.children ?? []) {
        parent.set(c, n.id)
      }
    }
    const t0 = tasks[0]?.ts ?? 0
    return tasks.map((task) => {
      const kinds = main
        .filter(
          (e) =>
            e.ph === 'X' &&
            e !== task &&
            e.ts >= task.ts &&
            e.ts + (e.dur ?? 0) <= task.ts + task.dur &&
            e.dur > 5_000 &&
            ['EvaluateScript', 'TimerFire', 'HandlePostMessage', 'MinorGC', 'MajorGC'].includes(
              e.name,
            ),
        )
        .map((e) => e.name)
      const steps = new Map()
      let t = profile.startTime
      profile.samples.forEach((id, i) => {
        t += profile.timeDeltas[i] ?? 0
        if (t < task.ts || t > task.ts + task.dur) {
          return
        }
        const names = []
        let cur = id
        while (cur) {
          names.push(byId.get(cur).callFrame.functionName || '(anon)')
          cur = parent.get(cur)
        }
        const step = STEPS.find((s) => names.includes(s)) ?? names[0]
        steps.set(step, (steps.get(step) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000)
      })
      return {
        atMs: Math.round((task.ts - t0) / 1000),
        durationMs: Math.round(task.dur / 1000),
        kinds: [...new Set(kinds)],
        topStepsMs: Object.fromEntries(
          [...steps]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([k, v]) => [k, Math.round(v)]),
        ),
      }
    })
  } finally {
    await browser.close()
  }
}

const results = []
for (let r = 1; r <= runs; r += 1) {
  const loadBefore = cpuLoad()
  const tasks = await oneRun()
  const loadAfter = cpuLoad()
  results.push({ run: r, cpuLoadPercent: [loadBefore, loadAfter], tasks })
  console.log(
    `run ${r} (cpu load ${String(loadBefore)}%/${String(loadAfter)}%):`,
    tasks.map((t) => `${t.durationMs}ms ${t.kinds.join('+') || '?'}`).join(', ') || 'none',
  )
}
fs.writeFileSync(outPath, `${JSON.stringify({ baseUrl, results }, null, 2)}\n`)
