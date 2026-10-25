// P3-T5 evidence: main-thread cost of the live card in a real Chrome on this machine's GPU.
// Observed in the page with the standard PerformanceObservers (longtask, event timing, layout-shift,
// largest-contentful-paint), split into phases: "page" (load until intent), "loading" (intent until
// the first live frame) and "orbit" (active card: mouse drags, wheel zoom, arrow keys, a system
// entered and exited). INP is estimated as the longest event-timing duration of an interaction
// (interactionId > 0) in the orbit phase. Every number comes from the browser's own entries.
// Usage: node scripts/evidence/p3-t5-interaction-perf.mjs <baseUrl> <out.json> [width] [height]
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outPath, widthArg, heightArg] = process.argv.slice(2)
if (!baseUrl || !outPath) {
  console.error('usage: node scripts/evidence/p3-t5-interaction-perf.mjs <baseUrl> <out.json>')
  process.exit(2)
}
const width = Number(widthArg ?? 1440)
const height = Number(heightArg ?? 900)

const browser = await chromium.launch({
  args: process.platform === 'win32' ? ['--use-angle=d3d11'] : [],
})
let result
try {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('aljazira_intro_seen', '1')
    } catch {
      // about:blank has no storage
    }
    const store = { longtasks: [], events: [], shifts: [], lcp: [] }
    window.__p3t5Perf = store
    const observe = (type, push, extra = {}) => {
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            push(entry)
          }
        }).observe({ type, buffered: true, ...extra })
      } catch {
        // unsupported entry type
      }
    }
    observe('longtask', (e) => store.longtasks.push({ start: e.startTime, duration: e.duration }))
    observe(
      'event',
      (e) =>
        store.events.push({
          name: e.name,
          start: e.startTime,
          duration: e.duration,
          interactionId: e.interactionId ?? 0,
        }),
      { durationThreshold: 16 },
    )
    observe('layout-shift', (e) =>
      store.shifts.push({ start: e.startTime, value: e.value, hadRecentInput: e.hadRecentInput }),
    )
    observe('largest-contentful-paint', (e) => {
      const el = e.element
      store.lcp.push({
        start: e.startTime,
        size: e.size,
        element: el
          ? `${el.tagName.toLowerCase()}${el.closest('[data-interactive-3d-card]') ? ' (in 3D card)' : ''} ${el.getAttribute('src') ?? el.currentSrc ?? ''}`.trim()
          : null,
      })
    })
  })
  const page = await context.newPage()
  const now = () => page.evaluate(() => performance.now())
  await page.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
  const card = page.locator('[data-interactive-3d-card]')
  await card.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1_000)

  const tIntent = await now()
  await card.hover()
  await page.waitForFunction(
    () =>
      document.querySelector('[data-interactive-3d-card]')?.getAttribute('data-viewer-state') ===
      'live',
    null,
    { timeout: 60_000 },
  )
  const tLive = await now()
  await page.waitForTimeout(1_500)

  const tOrbit = await now()
  await card.click()
  const box = await card.boundingBox()
  const cx = (box?.x ?? 0) + (box?.width ?? 0) / 2
  const cy = (box?.y ?? 0) + (box?.height ?? 0) / 2
  for (let drag = 0; drag < 5; drag += 1) {
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    for (let i = 1; i <= 30; i += 1) {
      await page.mouse.move(cx + (drag % 2 ? -1 : 1) * i * 6, cy + Math.sin(i / 5) * 20)
      await page.waitForTimeout(16)
    }
    await page.mouse.up()
    await page.waitForTimeout(300)
  }
  for (let i = 0; i < 5; i += 1) {
    await page.mouse.wheel(0, i % 2 ? 120 : -120)
    await page.waitForTimeout(200)
  }
  await card.focus()
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowUp')
    await page.waitForTimeout(100)
  }
  await page.keyboard.press('2')
  await page.waitForTimeout(4_000)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(3_000)
  const tEnd = await now()

  const store = await page.evaluate(() => window.__p3t5Perf)
  const inPhase = (start, from, to) => start >= from && start < to
  const phase = (from, to) => {
    const tasks = store.longtasks.filter((t) => inPhase(t.start, from, to))
    const events = store.events.filter((e) => inPhase(e.start, from, to))
    const interactions = events.filter((e) => e.interactionId > 0)
    return {
      fromMs: Math.round(from),
      toMs: Math.round(to),
      longTasks: tasks.length,
      longTasksOver50Ms: tasks.filter((t) => t.duration > 50).length,
      maxLongTaskMs: Math.round(Math.max(0, ...tasks.map((t) => t.duration))),
      longTaskDurationsMs: tasks.map((t) => Math.round(t.duration)),
      interactions: interactions.length,
      inpEstimateMs: Math.round(Math.max(0, ...interactions.map((e) => e.duration))),
      slowestEvents: [...events]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map((e) => `${e.name} ${Math.round(e.duration)}ms`),
    }
  }
  result = {
    baseUrl,
    viewport: `${width}x${height}`,
    renderer: await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2')
      const info = gl?.getExtension('WEBGL_debug_renderer_info')
      return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'none'
    }),
    page: phase(0, tIntent),
    loading: phase(tIntent, tLive),
    orbit: phase(tOrbit, tEnd),
    intentToLiveMs: Math.round(tLive - tIntent),
    cls: {
      total: store.shifts.reduce((sum, s) => sum + (s.hadRecentInput ? 0 : s.value), 0),
      afterIntent: store.shifts
        .filter((s) => s.start >= tIntent && !s.hadRecentInput)
        .reduce((sum, s) => sum + s.value, 0),
    },
    lcp: store.lcp.at(-1) ?? null,
  }
} finally {
  await browser.close()
}
fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
