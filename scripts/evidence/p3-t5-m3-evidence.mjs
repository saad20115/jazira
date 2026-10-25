import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Milestone M3 evidence for `P3-T5` (the viewer, H3a/H3b CSP, still→live swap, V-1..V-4).
 *
 * Usage:
 *   node scripts/evidence/p3-t5-m3-evidence.mjs prod <outDir> [baseUrl]   (a production build)
 *   node scripts/evidence/p3-t5-m3-evidence.mjs dev  <outDir> [baseUrl]   (next dev: before/after crops)
 *
 * Every number comes from screenshots of the real page (Chromium, ANGLE D3D11 on this machine's
 * GPU). Nothing is retried until it passes and nothing is filtered: all console lines, all CSP
 * violation events and all resource entries are written to the JSON. HEAD and the dirty state of
 * the tree are recorded first.
 */

const [mode, outArg, baseArg] = process.argv.slice(2)
const OUT = path.resolve(outArg ?? 'docs/reports/evidence/P3-T5/m3')
const BASE = (baseArg ?? 'http://localhost:3170').replace(/\/$/, '')
const CARD = '[data-interactive-3d-card]'
const SYSTEMS = ['hvac', 'fire', 'plumbing', 'power', 'smart']
const LAUNCH = { args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }

fs.mkdirSync(OUT, { recursive: true })
const log = []
function note(line) {
  const stamped = `${new Date().toISOString()} ${line}`
  log.push(stamped)
  process.stdout.write(`${stamped}\n`)
}
function writeJson(name, value) {
  fs.writeFileSync(path.join(OUT, name), `${JSON.stringify(value, null, 1)}\n`)
}

function provenance() {
  return {
    head: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
    dirty: execSync('git status --short', { encoding: 'utf8' }).trim().split('\n').filter(Boolean),
    mode,
    base: BASE,
    startedAt: new Date().toISOString(),
  }
}

async function readPixels(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

/** V-1 numbers: mean luma (Rec. 709) of the card, mean RGB of a top band and a floor band. */
async function toneStats(file) {
  const { data, w, h } = await readPixels(file)
  const region = (x0, y0, x1, y1) => {
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    for (let y = Math.floor(y0 * h); y < Math.floor(y1 * h); y += 1) {
      for (let x = Math.floor(x0 * w); x < Math.floor(x1 * w); x += 1) {
        const i = (y * w + x) * 3
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        n += 1
      }
    }
    return [r / n, g / n, b / n].map((v) => Math.round(v * 10) / 10)
  }
  const all = region(0, 0, 1, 1)
  return {
    size: [w, h],
    meanLuma: Math.round((0.2126 * all[0] + 0.7152 * all[1] + 0.0722 * all[2]) * 10) / 10,
    top: region(0.05, 0.02, 0.95, 0.08),
    floor: region(0.05, 0.92, 0.95, 0.98),
  }
}

function sobel({ data, w, h }) {
  const L = new Float32Array(w * h)
  for (let i = 0; i < L.length; i += 1) {
    L[i] = 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2]
  }
  const E = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x
      const gx =
        -L[i - w - 1] - 2 * L[i - 1] - L[i + w - 1] + L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1]
      const gy =
        -L[i - w - 1] - 2 * L[i - w] - L[i - w + 1] + L[i + w - 1] + 2 * L[i + w] + L[i + w + 1]
      E[i] = Math.hypot(gx, gy)
    }
  }
  return E
}

/** Best integer shift of live vs still by normalised edge correlation (overlays excluded). */
async function alignment(stillFile, liveFile, overlayFile) {
  const a = await readPixels(stillFile)
  const b = await readPixels(liveFile)
  const ea = sobel(a)
  const eb = sobel(b)
  const { w, h } = a
  const R = 8
  const m = Math.round(Math.min(w, h) * 0.14)
  let best = { dx: 0, dy: 0, score: -1 }
  for (let dy = -R; dy <= R; dy += 1) {
    for (let dx = -R; dx <= R; dx += 1) {
      let s = 0
      let na = 0
      let nb = 0
      for (let y = m; y < h - m; y += 1) {
        for (let x = m; x < w - m; x += 1) {
          const va = ea[y * w + x]
          const vb = eb[(y + dy) * w + (x + dx)]
          s += va * vb
          na += va * va
          nb += vb * vb
        }
      }
      const score = s / Math.sqrt(na * nb)
      if (score > best.score) {
        best = { dx, dy, score: Math.round(score * 10000) / 10000 }
      }
    }
  }
  // Edge overlay: still edges in red, live edges in cyan, overlap white.
  const out = Buffer.alloc(w * h * 3)
  const norm = (v) => Math.min(255, v * 1.2)
  for (let i = 0; i < w * h; i += 1) {
    const r = norm(ea[i])
    const c = norm(eb[i])
    out[i * 3] = r
    out[i * 3 + 1] = c
    out[i * 3 + 2] = c
  }
  await sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toFile(overlayFile)
  return best
}

async function newContext(browser, options) {
  const context = await browser.newContext(options)
  const page = await context.newPage()
  const consoleLines = []
  page.on('console', (m) => consoleLines.push(`[page:${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => consoleLines.push(`[page:pageerror] ${e.message}`))
  page.on('worker', (worker) => {
    consoleLines.push(`[worker:start] ${worker.url().replace(BASE, '')}`)
    worker.on('console', (m) => consoleLines.push(`[worker:${m.type()}] ${m.text()}`))
  })
  await page.addInitScript(() => {
    window.__cspViolations = []
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`)
    })
  })
  return { context, page, consoleLines }
}

async function openHome(page, locale = 'en', query = '') {
  await page.goto(`${BASE}/${locale}${query}`, { waitUntil: 'networkidle' })
  // The intro splash covers the page on a first visit; wait for its own end signal.
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'seen', null, {
    timeout: 30000,
  })
  const card = page.locator(CARD)
  await card.scrollIntoViewIfNeeded()
  await page.waitForFunction((sel) => {
    const img = document.querySelector(`${sel} img`)
    return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0
  }, CARD)
  return card
}

const hideOverlays = (sel) => {
  for (const el of document.querySelectorAll(`${sel} button, ${sel} span`)) {
    el.style.setProperty('visibility', 'hidden')
  }
}

async function waitForOutcome(page, timeout = 90000) {
  await page.waitForFunction(
    (sel) => ['live', 'stills'].includes(document.querySelector(sel)?.dataset.viewerState ?? ''),
    CARD,
    { timeout },
  )
  return page.locator(CARD).getAttribute('data-viewer-state')
}

async function headersRun() {
  const out = {}
  for (const p of ['/systems/v022n/basis/ktx2-worker.js', '/en', '/ar', '/en/projects', '/admin']) {
    const res = await fetch(`${BASE}${p}`, { redirect: 'manual' })
    const headers = {}
    for (const [k, v] of res.headers) {
      if (/content-security-policy|cross-origin|x-content-type|content-type/i.test(k)) {
        headers[k] = v.replace(/nonce-[A-Za-z0-9+/=]+/g, 'nonce-<per-request>')
      }
    }
    out[p] = { status: res.status, headers }
  }
  writeJson('headers.json', out)
  note(`headers: ${Object.keys(out).length} URLs recorded`)
}

async function swapRun(browser, name, contextOptions, trigger) {
  const videoDir = path.join(OUT, 'video', name)
  const { context, page, consoleLines } = await newContext(browser, {
    ...contextOptions,
    recordVideo: { dir: videoDir, size: contextOptions.viewport },
  })
  const card = await openHome(page)
  const before = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((e) => e.name.replace(location.origin, '')),
  )
  await page.evaluate(hideOverlays, CARD)
  const stillFile = path.join(OUT, `${name}-still.png`)
  await card.screenshot({ path: stillFile })
  await page.evaluate((sel) => {
    for (const el of document.querySelectorAll(`${sel} button, ${sel} span`)) {
      el.style.removeProperty('visibility')
    }
  }, CARD)
  const t0 = Date.now()
  if (trigger === 'tap') {
    await page.locator('[data-open-3d-model]').tap()
  } else {
    await card.hover()
  }
  const state = await waitForOutcome(page)
  const ms = Date.now() - t0
  await page.waitForTimeout(900)
  await page.evaluate(hideOverlays, CARD)
  const liveFile = path.join(OUT, `${name}-live.png`)
  await card.screenshot({ path: liveFile })
  const after = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((e) => e.name.replace(location.origin, '')),
  )
  const still = await toneStats(stillFile)
  const live = await toneStats(liveFile)
  const diff = (a, b) => a.map((v, i) => Math.round((v - b[i]) * 10) / 10)
  const result = {
    name,
    trigger,
    state,
    msToOutcome: ms,
    still,
    live,
    v1: {
      dLuma: Math.round((live.meanLuma - still.meanLuma) * 10) / 10,
      dTop: diff(live.top, still.top),
      dFloor: diff(live.floor, still.floor),
    },
    alignment: await alignment(stillFile, liveFile, path.join(OUT, `${name}-edges.png`)),
    requests3dBeforeIntent: before.filter((r) => /\/systems\/v022n\/(?!stills)/.test(r)),
    requestsAfterIntent: after.filter((r) => !before.includes(r)),
    cspViolations: await page.evaluate(() => window.__cspViolations),
    console: consoleLines,
  }
  await context.close()
  note(
    `swap ${name}: ${state} in ${String(ms)} ms, dLuma ${String(result.v1.dLuma)}, align ${JSON.stringify(result.alignment)}`,
  )
  return result
}

async function systemsRun(browser) {
  const { context, page, consoleLines } = await newContext(browser, {
    viewport: { width: 1440, height: 900 },
  })
  const card = await openHome(page)
  await card.hover()
  const state = await waitForOutcome(page)
  const visits = []
  for (const id of SYSTEMS) {
    const button = page.locator(`[data-show-in-3d="${id}"]`)
    if ((await button.count()) === 0 || !(await button.isVisible())) {
      const idx = SYSTEMS.indexOf(id)
      // Header buttons only: an expanded item also contains its "Show in 3D" button.
      await page.locator('[data-component="accordion-item"] > button').nth(idx).click()
    } else {
      await button.click()
    }
    await page.waitForTimeout(1200)
    visits.push({
      id,
      entered: await page.locator('[data-entered-system]').getAttribute('data-entered-system'),
      hash: await page.evaluate(() => location.hash),
      labels: await page.locator('[data-entered-system] li').count(),
    })
    await card.screenshot({ path: path.join(OUT, `system-${id}.png`) })
  }
  const result = {
    viewerState: state,
    visits,
    cspViolations: await page.evaluate(() => window.__cspViolations),
    console: consoleLines,
  }
  await context.close()
  note(`systems: viewer ${state}, ${String(result.cspViolations.length)} CSP violations`)
  return result
}

async function negativeRun(browser) {
  const { context, page, consoleLines } = await newContext(browser, {
    viewport: { width: 1440, height: 900 },
  })
  await page.route('**/basis/ktx2-worker.js', async (route) => {
    const response = await route.fetch()
    const headers = { ...response.headers() }
    headers['content-security-policy'] =
      "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'"
    await route.fulfill({ response, headers })
  })
  const card = await openHome(page)
  const t0 = Date.now()
  await card.hover()
  const state = await waitForOutcome(page)
  const result = {
    workerCsp: "broken on purpose: no 'unsafe-eval' in the worker's own policy",
    state,
    msToOutcome: Date.now() - t0,
    canvasesLeft: await page.locator(`${CARD} canvas`).count(),
    posterVisible: await page.locator(`${CARD} img`).first().isVisible(),
    cspViolationsOnPage: await page.evaluate(() => window.__cspViolations),
    console: consoleLines,
  }
  await card.screenshot({ path: path.join(OUT, 'negative-broken-worker-csp.png') })
  await context.close()
  note(
    `negative: ${state} after ${String(result.msToOutcome)} ms, canvases ${String(result.canvasesLeft)}`,
  )
  return result
}

async function devCrops(browser) {
  // Development build only: ?fixes / ?look are ignored in production.
  const shots = [
    { name: 'v2-facade-before', query: '?fixes=-aniso', clip: { x: 205, y: 120, w: 200, h: 140 } },
    { name: 'v2-facade-after', query: '', clip: { x: 205, y: 120, w: 200, h: 140 } },
    { name: 'v2-crown-before', query: '?fixes=-aniso', clip: { x: 210, y: 125, w: 190, h: 50 } },
    { name: 'v2-crown-after', query: '', clip: { x: 210, y: 125, w: 190, h: 50 } },
    { name: 'v3-palms-before', query: '?fixes=-a2c', clip: { x: 60, y: 320, w: 200, h: 110 } },
    { name: 'v3-palms-after', query: '', clip: { x: 60, y: 320, w: 200, h: 110 } },
    {
      name: 'v4-plinth-before',
      query: '?look=0.84,1,0.78,0.4,1',
      clip: { x: 0, y: 360, w: 600, h: 120 },
    },
    { name: 'v4-plinth-after', query: '', clip: { x: 0, y: 360, w: 600, h: 120 } },
  ]
  const out = []
  for (const shot of shots) {
    const { context, page } = await newContext(browser, {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    })
    const card = await openHome(page, 'en', shot.query)
    await page.evaluate(hideOverlays, CARD)
    await card.hover()
    const state = await waitForOutcome(page)
    await page.waitForTimeout(900)
    await page.evaluate(hideOverlays, CARD)
    const box = await card.boundingBox()
    if (box) {
      await page.screenshot({
        path: path.join(OUT, `${shot.name}.png`),
        clip: {
          x: box.x + shot.clip.x,
          y: box.y + shot.clip.y,
          width: shot.clip.w,
          height: shot.clip.h,
        },
      })
    }
    out.push({ name: shot.name, query: shot.query, state })
    await context.close()
  }
  note(`dev crops: ${String(out.length)} images`)
  return out
}

const result = { provenance: provenance() }
const browser = await chromium.launch(LAUNCH)
try {
  if (mode === 'prod') {
    await headersRun()
    result.swaps = [
      await swapRun(
        browser,
        'swap-1440-dpr1',
        { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
        'hover',
      ),
      await swapRun(
        browser,
        'swap-1440-dpr2',
        { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
        'hover',
      ),
      await swapRun(
        browser,
        'swap-390-phone',
        {
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
        },
        'tap',
      ),
    ]
    result.systems = await systemsRun(browser)
    result.negative = await negativeRun(browser)
  } else if (mode === 'dev') {
    result.crops = await devCrops(browser)
  } else {
    throw new Error('usage: prod|dev <outDir> [baseUrl]')
  }
} finally {
  await browser.close()
  result.provenance.endedAt = new Date().toISOString()
  writeJson(`m3-${String(mode)}.json`, result)
  fs.writeFileSync(path.join(OUT, `m3-${String(mode)}.log`), `${log.join('\n')}\n`)
}
