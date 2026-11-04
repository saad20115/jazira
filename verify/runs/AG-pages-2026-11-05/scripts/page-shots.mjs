// CTO verifier: full-page screenshots of the P3-T6..T9 pages for the Figma comparison. en/ar, 1440 and 390.
// Usage (from the clone): node page-shots.mjs <baseUrl> <outDir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const probe = await browser.newPage()
const firstLink = async (from, prefix) => { await probe.goto(base + from); const hrefs = await probe.locator(`a[href^="${prefix}"]`).evaluateAll((as) => as.map((a) => a.getAttribute('href'))); return hrefs.find((h) => h.length > prefix.length) }
const svc = await firstLink('/en/services', '/en/services/'), prj = await firstLink('/en/projects', '/en/projects/')
console.log('service detail', svc, 'project detail', prj)
const routes = { services: '/services', 'service-detail': svc?.slice(3), about: '/about', projects: '/projects', 'project-detail': prj?.slice(3), contact: '/contact', privacy: '/privacy' }
const report = []
for (const loc of ['en', 'ar']) for (const v of [{ n: '1440', viewport: { width: 1440, height: 900 } }, { n: '390', viewport: { width: 390, height: 844 }, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: 1, hasTouch: !!v.mobile, isMobile: !!v.mobile })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
  for (const [name, r] of Object.entries(routes)) {
    if (!r) { report.push({ loc, v: v.n, name, status: 'no link found' }); continue }
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    const res = await page.goto(`${base}/${loc}${r}`, { waitUntil: 'networkidle' })
    // scroll through so reveal-on-scroll content is in its end state, then back to the top
    const h = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < h; y += 600) { await page.evaluate((yy) => scrollTo(0, yy), y); await page.waitForTimeout(150) }
    await page.waitForTimeout(800); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400)
    await page.screenshot({ path: `${out}/${loc}-${v.n}-${name}.png`, fullPage: true })
    const dir = await page.evaluate(() => document.documentElement.dir); const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    report.push({ loc, v: v.n, name, url: r, status: res?.status(), dir, horizontalScroll: hScroll, errors })
    await page.close()
  }
  await ctx.close()
}
await browser.close(); fs.writeFileSync(`${out}/pages.json`, JSON.stringify(report, null, 1)); for (const r of report) console.log(JSON.stringify(r))
