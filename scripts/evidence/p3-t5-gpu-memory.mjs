// P3-T5 evidence: GPU memory of the live card, measured outside the app by Windows ("GPU Process
// Memory" performance counters of Chrome's GPU process, found through CDP SystemInfo). Chrome's
// memory-infra tracing does not report WebGL resources under ANGLE's passthrough decoder (its
// gpu/gl allocators are absent), so the OS counters are the measure. Samples: "still" (before
// intent), "live" (the hero, first frame + 3 s) and each of the five systems entered in turn
// (flight done). The tier is whatever the device rules pick; the requested GLB names it. `query`
// (dev server only) can force a tier with `?gfx=high`.
// Windows only. Usage: node scripts/evidence/p3-t5-gpu-memory.mjs <baseUrl> <out.json> [query]
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outPath, query = ''] = process.argv.slice(2)
if (!baseUrl || !outPath || process.platform !== 'win32') {
  console.error('usage (Windows): node scripts/evidence/p3-t5-gpu-memory.mjs <baseUrl> <out.json>')
  process.exit(2)
}

const COUNTERS = ['Dedicated Usage', 'Shared Usage', 'Total Committed']

/** Sums each counter over the GPU process's adapter instances, in bytes. */
function sampleGpuProcess(pid) {
  const paths = COUNTERS.map((c) => `'\\GPU Process Memory(pid_${pid}_*)\\${c}'`).join(',')
  const script = `(Get-Counter -Counter ${paths}).CounterSamples | ForEach-Object { $_.Path + '=' + [int64]$_.CookedValue }`
  const out = execFileSync('powershell', ['-NoProfile', '-Command', script], { encoding: 'utf8' })
  const sums = Object.fromEntries(COUNTERS.map((c) => [c, 0]))
  for (const line of out.split(/\r?\n/)) {
    const match = /\\([^\\]+)=(\d+)$/.exec(line.trim())
    const counter = COUNTERS.find((c) => c.toLowerCase() === match?.[1]?.toLowerCase())
    if (match && counter) {
      sums[counter] += Number(match[2])
    }
  }
  return sums
}

const mib = (bytes) => Math.round((bytes / 2 ** 20) * 10) / 10

const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
let result
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
  const models = []
  page.on('request', (request) => {
    const name = new URL(request.url()).pathname
    if (name.endsWith('.glb')) {
      models.push(name)
    }
  })
  const cdp = await browser.newBrowserCDPSession()
  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2')
    const info = gl?.getExtension('WEBGL_debug_renderer_info')
    return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'none'
  })
  const { processInfo } = await cdp.send('SystemInfo.getProcessInfo')
  const gpuPid = processInfo.find((p) => p.type === 'GPU')?.id
  if (!gpuPid) {
    throw new Error('no GPU process')
  }
  const samples = {}
  const sample = async (label) => {
    await page.waitForTimeout(1_000)
    samples[label] = sampleGpuProcess(gpuPid)
  }

  await page.goto(`${baseUrl}/en${query}`, { waitUntil: 'networkidle' })
  const card = page.locator('[data-interactive-3d-card]')
  await card.scrollIntoViewIfNeeded()
  await sample('still')
  await card.hover()
  await page.waitForFunction(
    () =>
      document.querySelector('[data-interactive-3d-card]')?.getAttribute('data-viewer-state') ===
      'live',
    null,
    { timeout: 60_000 },
  )
  await page.waitForTimeout(3_000)
  await sample('live')
  // Each system in turn through its shareable hash (the explorer enters it on hashchange).
  for (const system of ['hvac', 'fire', 'plumbing', 'power', 'smart']) {
    await page.evaluate((id) => {
      window.location.hash = `systems-${id}`
    }, system)
    await page.waitForTimeout(5_000)
    await sample(`entered-${system}`)
  }

  const deltas = Object.fromEntries(
    Object.keys(samples)
      .filter((label) => label !== 'still')
      .map((label) => [
        label,
        Object.fromEntries(COUNTERS.map((c) => [c, mib(samples[label][c] - samples.still[c])])),
      ]),
  )
  result = {
    baseUrl,
    query,
    renderer,
    models,
    gpuPid,
    samplesBytes: samples,
    minusStillMiB: deltas,
    peakTotalCommittedMinusStillMiB: Math.max(
      ...Object.values(deltas).map((d) => d['Total Committed']),
    ),
  }
} finally {
  await browser.close()
}
fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
