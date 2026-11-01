// Verifier-only: R-43 on Home at 390 touch, and how public images are served.
import { createRequire } from 'node:module'
const req = createRequire('D:/jazira-verify/2026-11-01/r2/package.json')
const { chromium, devices } = req('@playwright/test')
const base = process.argv[2]
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(base + '/en', { waitUntil: 'networkidle' })
const r = await p.evaluate(async () => {
  const cards = [...document.querySelectorAll('[data-component="project-card"]')]
  const out = []
  for (const c of cards.slice(0, 3)) {
    c.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 1500))
    const cta = c.querySelector('[class*="ctaRow"]')
    out.push(cta ? getComputedStyle(cta).opacity : 'no ctaRow')
  }
  const imgs = [...document.querySelectorAll('main img')].map((i) => i.getAttribute('src') || '')
  return { cards: cards.length, ctaOpacity: out, imgTotal: imgs.length, nextImage: imgs.filter((s) => s.startsWith('/_next/image')).length, directMedia: imgs.filter((s) => s.startsWith('/api/media/file/')).length, sample: imgs.slice(0, 3) }
})
console.log(JSON.stringify(r, null, 1))
await b.close()
