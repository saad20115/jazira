// CTO verifier: measure the P3-T6..T8 round 2 open findings (R-61, R-66, R-74, R-78, R-81) on next start.
// Usage (from the clone): node measure-r3.mjs <baseUrl> <outDir>. Writes measure-r3.json and section crops.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const res = {}
const targets = {
  about: { r: '/about', names: ['storySection', 'storyContainer', 'storyHead', 'storyContentCol', 'storyVisualCol', 'storyPhotoWrap', 'storyTitle', 'goldDivider', 'storyParagraph', 'mvSection', 'mvContainer', 'mvSectionHead', 'mvRow'], crops: ['storySection', 'mvSection'] },
  services: { r: '/services', names: ['section', 'tableCard', 'td', 'th'], crops: ['section'], rows: true },
  projects: { r: '/projects', names: ['ctaSection', 'ctaSecondaryButton', 'ctaButtonsRow'], crops: ['ctaSection'] },
  detail: { r: '/projects/sofitel-makkah-hotel', names: ['ctaSection', 'ctaSectionCompact', 'ctaSecondaryButton', 'ctaButtonsRow'], crops: ['ctaSection'], csp: true },
}
const dump = (names) => {
  const out = {}
  for (const n of names) {
    const r = new RegExp('(^|_)' + n + '(_|$)')
    const els = [...document.querySelectorAll('[class]')].filter((e) => [...e.classList].some((c) => r.test(c))).slice(0, 8)
    out[n] = els.map((e) => {
      const b = e.getBoundingClientRect(); const s = getComputedStyle(e)
      return { x: Math.round(b.x), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height), pt: s.paddingTop, pb: s.paddingBottom, mt: s.marginTop, gap: s.rowGap, bg: s.backgroundColor, border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor, align: s.alignItems, text: (e.innerText || '').trim().slice(0, 40) }
    })
  }
  return out
}
for (const loc of ['en', 'ar']) for (const v of [{ n: '1440', viewport: { width: 1440, height: 900 } }, { n: '390', viewport: { width: 390, height: 844 }, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: 1, hasTouch: !!v.mobile, isMobile: !!v.mobile, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} ; window.__v = []; document.addEventListener('securitypolicyviolation', (e) => { window.__v.push({ dir: e.violatedDirective, sample: e.sample, tag: e.target && e.target.tagName }) }, true) })
  const page = await ctx.newPage()
  for (const [name, t] of Object.entries(targets)) {
    const key = `${loc}-${v.n}-${name}`
    const resp = await page.goto(`${base}/${loc}${t.r}`, { waitUntil: 'networkidle' })
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } scrollTo(0, 0) })
    await page.waitForTimeout(400)
    res[key] = { status: resp?.status(), m: await page.evaluate(dump, t.names) }
    if (t.rows) res[key].rows = await page.evaluate(() => [...document.querySelectorAll('tbody tr')].filter((r) => r.getBoundingClientRect().height > 0).map((r) => Math.round(r.getBoundingClientRect().height)))
    if (t.csp) { res[key].csp = await page.evaluate(() => window.__v); res[key].imgStyle = await page.locator('img[style]').count() }
    for (const c of t.crops) {
      try {
        const h = await page.evaluateHandle((n) => { const r = new RegExp('(^|_)' + n + '(_|$)'); return [...document.querySelectorAll('section[class], div[class]')].find((e) => [...e.classList].some((x) => r.test(x)) && e.getBoundingClientRect().height > 100) || null }, c)
        const el = h.asElement()
        if (el) await el.screenshot({ path: path.join(out, `${key}-${c}.png`), animations: 'disabled' }); else console.log('crop missing', key, c)
      } catch (e) { console.log('crop fail', key, c, String(e).slice(0, 80)) }
    }
  }
  await ctx.close()
}
fs.writeFileSync(path.join(out, 'measure-r3.json'), JSON.stringify(res, null, 1))
await browser.close()
console.log('done', Object.keys(res).length)
