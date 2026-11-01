// Re-measure saved V-1 pairs on bands that exclude the card's controls row. Usage: node v1-bands.mjs <dir>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json')); const { chromium } = require('@playwright/test')
const dir = process.argv[2]; const browser = await chromium.launch(); const page = await browser.newPage()
const bands = { top: [0, 0.15], ground: [0.62, 0.78], aboveControls: [0, 0.78], bottomStrip: [0.955, 0.985] }
const m = (f) => page.evaluate(async ({ src, bands }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data; const o = {}
  for (const [k, [a, b]] of Object.entries(bands)) { let r = 0, g = 0, bl = 0, n = 0
    for (let y = Math.floor(a * c.height); y < Math.floor(b * c.height); y++) for (let i = 0; i < c.width; i++) { const q = (y * c.width + i) * 4; r += d[q]; g += d[q + 1]; bl += d[q + 2]; n++ }
    o[k] = [r / n, g / n, bl / n] }
  return o }, { src: fs.readFileSync(f).toString('base64'), bands })
const rows = []
for (const cs of ['1440-dpr1-hover', '1440-dpr2-hover', '390-dpr3-tap']) {
  const s = await m(`${dir}/${cs}-still.png`), l = await m(`${dir}/${cs}-live.png`)
  const luma = (v) => 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; const d = (k) => l[k].map((v, i) => +(v - s[k][i]).toFixed(1))
  const row = { case: cs, lumaDeltaAboveControls: +(luma(l.aboveControls) - luma(s.aboveControls)).toFixed(1), topDelta: d('top'), groundDelta: d('ground'), bottomStripDelta: d('bottomStrip') }
  row.pass = Math.abs(row.lumaDeltaAboveControls) <= 5 && [...row.topDelta, ...row.groundDelta].every((v) => Math.abs(v) <= 6)
  rows.push(row); console.log(JSON.stringify(row)) }
fs.writeFileSync(`${dir}/v1-bands.json`, JSON.stringify({ bands, rows }, null, 2)); await browser.close()
