// C3-2 ground band exactly as fixed before tuning (x 10-90 %, y 62-74 % of the card). Usage: node v1-ground.mjs <dir>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json')); const { chromium } = require('@playwright/test')
const dir = process.argv[2]; const browser = await chromium.launch(); const page = await browser.newPage(); const rows = []
const m = (f) => page.evaluate(async (src) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data; let r = 0, g = 0, b = 0, n = 0
  for (let y = Math.floor(0.62 * c.height); y < Math.floor(0.74 * c.height); y++) for (let i = Math.floor(0.1 * c.width); i < Math.floor(0.9 * c.width); i++) { const q = (y * c.width + i) * 4; r += d[q]; g += d[q + 1]; b += d[q + 2]; n++ }
  return [r / n, g / n, b / n] }, fs.readFileSync(f).toString('base64'))
for (const cs of ['1440-dpr1-hover', '1440-dpr2-hover', '390-dpr3-tap']) {
  const s = await m(`${dir}/${cs}-still.png`), l = await m(`${dir}/${cs}-live.png`); const d = l.map((v, i) => +(v - s[i]).toFixed(1))
  const row = { case: cs, groundBandDelta: d, within8: d.every((v) => Math.abs(v) <= 8) }; rows.push(row); console.log(JSON.stringify(row)) }
fs.writeFileSync(`${dir}/v1-ground-c3-2.json`, JSON.stringify(rows, null, 2)); await browser.close()
