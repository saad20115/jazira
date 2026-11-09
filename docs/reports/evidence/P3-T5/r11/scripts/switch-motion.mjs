// Executor check (non-authoritative): does a direct switch (O-16) stop on the way? Pictures of the
// card's middle every ~100 ms from the click; the change between neighbours is printed (a stop shows
// as a run of near-zero changes before arrival). Usage (cwd = worktree): node switch-motion.mjs <baseUrl> <out>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
await page.goto(base + '/en')
const card = page.locator('[data-interactive-3d-card]')
await card.scrollIntoViewIfNeeded()
const box = await card.boundingBox()
const clip = { x: box.x + box.width * 0.3, y: box.y + box.height * 0.3, width: box.width * 0.4, height: box.height * 0.4 }
const shot = async () => (await page.screenshot({ clip })).toString('base64')
const btn = (n) => page.locator('button', { hasText: n }).first()
await btn('HVAC').click()
await page.waitForFunction(() => document.querySelector('[data-interactive-3d-card]')?.getAttribute('data-viewer-state') === 'live', null, { timeout: 30000 })
await page.waitForTimeout(6000)
const lines = []
for (const [from, to] of [['hvac', 'Fire Fighting'], ['fire', 'Plumbing'], ['plumbing', 'Smart Systems']]) {
  const shots = [[0, await shot()]]
  const t0 = Date.now()
  await btn(to).click()
  while (Date.now() - t0 < 4500) shots.push([Date.now() - t0, await shot()])
  const diffs = await page.evaluate(async (list) => {
    const px = async (src) => { const img = new Image(); img.src = `data:image/png;base64,${src}`; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data }
    const all = []; for (const s of list) all.push(await px(s))
    const out = []; for (let i = 1; i < all.length; i += 1) { let s = 0; const a = all[i - 1], b = all[i]; for (let j = 0; j < a.length; j += 4) s += Math.abs(a[j] - b[j]) + Math.abs(a[j + 1] - b[j + 1]) + Math.abs(a[j + 2] - b[j + 2]); out.push(+(s / (a.length / 4) / 3).toFixed(1)) }
    return out
  }, shots.map((s) => s[1]))
  lines.push(`${from} -> ${to}: ` + diffs.map((d, i) => `${shots[i + 1][0]}:${d}`).join(' '))
  await page.waitForTimeout(4000)
}
fs.writeFileSync(`${out}/switch-motion.txt`, lines.join('\n'))
console.log(lines.join('\n'))
await browser.close()
