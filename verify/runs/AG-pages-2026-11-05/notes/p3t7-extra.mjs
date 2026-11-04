// Read-only extra measurements for P3-T7 round 2 (About page). Run from the ag-pages2 clone:
//   node ../notes/p3t7-extra.mjs http://localhost:3323 ../notes/p3t7-extra.json
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, outFile] = process.argv.slice(2)
const browser = await chromium.launch()
const res = {}
for (const v of [{ n: '1440', viewport: { width: 1440, height: 900 } }, { n: '390', viewport: { width: 390, height: 844 }, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: 1, hasTouch: !!v.mobile, isMobile: !!v.mobile, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
  const page = await ctx.newPage()
  const resp = await page.goto(`${base}/en/about`, { waitUntil: 'networkidle' })
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } scrollTo(0, 0) })
  await page.waitForTimeout(400)
  res[`en-${v.n}`] = await page.evaluate(() => {
    const R = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)] }
    const out = { scrollW: document.documentElement.scrollWidth, docH: document.body.scrollHeight, sections: [], els: [] }
    const secs = [...document.querySelectorAll('main section, main > div > section, header, footer')]
    for (const s of secs) out.sections.push({ id: s.id || s.getAttribute('data-about-section') || s.tagName, cls: String(s.className).slice(0, 60), r: R(s) })
    const want = /(Eyebrow|eyebrow|Divider|divider|Title|title|Intro|intro|Badge|badge|Paragraph|Quote|quote|Photo|Visual|visual|Image|image|Card|card|Num|Bracket|Row|Head|head|Grid|grid|Marquee|staff|Staff|leader|Leader)/
    for (const e of document.querySelectorAll('main [class]')) {
      const cls = typeof e.className === 'string' ? e.className : e.getAttribute('class') || ''
      if (!want.test(cls)) continue
      const b = e.getBoundingClientRect(); if (b.width === 0 || b.height === 0) continue
      const s = getComputedStyle(e)
      out.els.push({ c: cls.split(' ').map((x) => x.replace(/^.*?_(\w+)__.*$/, '$1')).join(' ').slice(0, 70), r: R(e), fs: s.fontSize + '/' + s.lineHeight, col: s.color, bg: s.backgroundColor, op: s.opacity, t: (e.innerText || '').trim().slice(0, 40), sw: e.tagName === 'svg' ? (e.getAttribute('stroke-width') + ' ' + s.strokeWidth) : undefined, ov: b.right > innerWidth + 1 || b.left < -1 ? 'OVERFLOW' : undefined })
    }
    const badge = document.querySelector('[data-story-badge-stat]')
    out.badgeHTML = badge ? badge.outerHTML.slice(0, 900) : null
    return out
  })
  res[`en-${v.n}`].status = resp?.status()
  await page.screenshot({ path: outFile.replace(/\.json$/, `-en-${v.n}.png`), fullPage: true })
  await ctx.close()
}
fs.writeFileSync(outFile, JSON.stringify(res, null, 1))
await browser.close()
console.log('done')
