// P3-T5 evidence: total CSS of /en, raw and gzip (zlib level 9), as the browser loads it. Records
// every text/css response during the page load and again after the 3D card intent (hover), so the
// same script measures the base build (no 3D card) and the P3-T5 build.
// Usage: node scripts/evidence/p3-t5-css-gzip.mjs <baseUrl> <out.json>
import fs from 'node:fs'
import { createRequire } from 'node:module'
import zlib from 'node:zlib'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')

const [baseUrl, outPath] = process.argv.slice(2)
if (!baseUrl || !outPath) {
  console.error('usage: node scripts/evidence/p3-t5-css-gzip.mjs <baseUrl> <out.json>')
  process.exit(2)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript(() => {
  try {
    window.sessionStorage.setItem('aljazira_intro_seen', '1')
  } catch {
    // about:blank has no storage
  }
})
const page = await context.newPage()
const sheets = new Map()
let phase = 'load'
page.on('response', async (response) => {
  const type = response.headers()['content-type'] ?? ''
  if (!type.includes('text/css')) {
    return
  }
  const url = new URL(response.url()).pathname
  if (sheets.has(url)) {
    return
  }
  const body = await response.body()
  sheets.set(url, {
    url,
    phase,
    rawBytes: body.length,
    gzipBytes: zlib.gzipSync(body, { level: 9 }).length,
  })
})
await page.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' })
phase = 'after-intent'
const card = page.locator('[data-interactive-3d-card]')
if ((await card.count()) > 0) {
  await card.scrollIntoViewIfNeeded()
  await card.hover()
  await page.waitForTimeout(5_000)
}
await browser.close()

const list = [...sheets.values()].sort((a, b) => a.url.localeCompare(b.url))
const total = (key, filter = () => true) => list.filter(filter).reduce((sum, s) => sum + s[key], 0)
const result = {
  baseUrl,
  sheets: list,
  load: {
    rawBytes: total('rawBytes', (s) => s.phase === 'load'),
    gzipBytes: total('gzipBytes', (s) => s.phase === 'load'),
  },
  all: { rawBytes: total('rawBytes'), gzipBytes: total('gzipBytes') },
}
fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify({ load: result.load, all: result.all, files: list.length }))
