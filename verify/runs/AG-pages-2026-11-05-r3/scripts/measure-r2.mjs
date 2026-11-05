// CTO verifier: measure the P3-T6..T9 round 1 findings on next start (rects + computed styles), en/ar at 1440 and 390.
// Usage (from the clone): node measure-r2.mjs <baseUrl> <outDir>. Writes measure.json and section crops.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const res = {}
const pages = {
  services: { r: '/services', names: ['section', 'tabButton', 'tabButtonActive', 'tableCard', 'tableFooter', 'footerCount', 'th', 'colNo', 'colMaterial', 'colBrand', 'colOrigin', 'originText', 'headerRow', 'headerCopy', 'specialistTile', 'linkRow', 'serviceRow', 'highlightItem', 'serviceCtaWrap', 'brandChip', 'mobileCard', 'materialDesc'] },
  about: { r: '/about', names: ['mvSection', 'mvIntro', 'mvRowText', 'mvContentCol', 'mvRow', 'pillarItem', 'pillarText', 'pillarTitle', 'pillarCheckBox', 'strengthsSection', 'strengthCard', 'strengthsIntro', 'strengthNum', 'strengthCardText', 'storyCornerBracket', 'storyPhotoWrap', 'storyPhoto', 'storyBadgeCard', 'storyBadgeNumber', 'storyBadgeLabel', 'teamHeaderRow', 'teamIntro', 'teamIntroSecondary'] },
  projects: { r: '/projects', names: ['portfolioVisual', 'portfolioPhotoFrame', 'portfolioPhoto', 'portfolioBadge', 'portfolioBadgeValue', 'portfolioBadgeLabel', 'portfolioCornerBracket', 'impactSection', 'impactHead', 'goldDivider', 'headingGoldLine', 'impactStatsGrid', 'impactStatItem', 'impactStatValue', 'filterTabActive', 'filterTabCountActive', 'card', 'topBadges', 'categoryPill', 'statusPillCompleted', 'pinIcon', 'ctaRow', 'pageButton', 'pageButtonActive', 'ctaSection', 'ctaButtonsRow', 'ctaSecondaryButton'] },
  contact: { r: '/contact', names: ['getInTouchIntro', 'channelsBlock', 'channelCard', 'fieldLabel', 'fieldset', 'chipsRow', 'selectControl', 'inputControl', 'actionsRow', 'findOfficeSection', 'mapFrame', 'officeCard', 'staticMapSvg', 'replyNoteText'] },
}
const dump = (names) => {
  const re = (n) => new RegExp('(^|_)' + n + '(_|$)')
  const out = {}
  for (const n of names) {
    const r = re(n)
    const els = [...document.querySelectorAll('[class]')].filter((e) => [...e.classList].some((c) => r.test(c))).slice(0, 12)
    out[n] = els.map((e) => {
      const b = e.getBoundingClientRect(); const s = getComputedStyle(e)
      return { x: Math.round(b.x), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height), fs: s.fontSize, lh: s.lineHeight, color: s.color, bg: s.backgroundColor, border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor, radius: s.borderTopLeftRadius, shadow: s.boxShadow === 'none' ? 'none' : s.boxShadow.slice(0, 60), opacity: s.opacity, display: s.display, flexDir: s.flexDirection, maxW: s.maxWidth, visibility: s.visibility, text: (e.innerText || '').trim().slice(0, 60), bdi: e.querySelectorAll('bdi').length }
    })
  }
  return out
}
for (const loc of ['en', 'ar']) for (const v of [{ n: '1440', viewport: { width: 1440, height: 900 } }, { n: '390', viewport: { width: 390, height: 844 }, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: 1, hasTouch: !!v.mobile, isMobile: !!v.mobile, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
  const page = await ctx.newPage()
  for (const [name, p] of Object.entries(pages)) {
    const key = `${loc}-${v.n}-${name}`
    const resp = await page.goto(`${base}/${loc}${p.r}`, { waitUntil: 'networkidle' })
    // scroll through so in-view effects settle
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } scrollTo(0, 0) })
    await page.waitForTimeout(400)
    res[key] = { status: resp?.status(), docH: await page.evaluate(() => document.body.scrollHeight), m: await page.evaluate(dump, p.names) }
    const crops = { services: ['specialistSection', 'section', 'mainServicesSection'], about: ['storySection', 'strengthsSection', 'mvSection', 'teamSection'], projects: ['portfolioSection', 'impactSection', 'exploreSection', 'ctaSection'], contact: ['getInTouchSection', 'findOfficeSection'] }[name]
    for (const c of crops) {
      try {
        const h = await page.evaluateHandle((n) => { const r = new RegExp('(^|_)' + n + '(_|$)'); return [...document.querySelectorAll('section[class], div[class]')].find((e) => [...e.classList].some((x) => r.test(x)) && e.getBoundingClientRect().height > 100) || null }, c)
        const el = h.asElement()
        if (el) await el.screenshot({ path: path.join(out, `${key}-${c}.png`), animations: 'disabled' }); else console.log('crop missing', key, c)
      } catch (e) { console.log('crop fail', key, c, String(e).slice(0, 80)) }
    }
    if (name === 'contact') {
      const steps = {}
      try {
        await page.locator('[data-quote-next="step-1"]').click()
        await page.locator('[data-quote-step="2"]').waitFor()
        steps.step2 = await page.evaluate(dump, ['fieldLabel', 'fieldset', 'chipsRow', 'chipBtn', 'selectControl', 'inputControl', 'phoneInputWrap', 'actionsRow'])
        steps.step2buttons = await page.locator('[data-quote-step="2"] button, [data-quote-next="step-2"]').evaluateAll((bs) => bs.map((b) => ({ t: b.innerText.trim().slice(0, 30), h: Math.round(b.getBoundingClientRect().height) })))
        await page.locator('[data-quote-step="2"]').screenshot({ path: path.join(out, `${key}-step2.png`) })
        await page.locator('#quote-name').fill('Test Name'); await page.locator('#quote-company').fill('Test Co'); await page.locator('#quote-phone').fill('57 353 4185'); await page.locator('#quote-email').fill('test@example.com')
        await page.locator('[data-quote-next="step-2"]').click()
        await page.locator('[data-quote-step="3"]').waitFor()
        steps.step3text = (await page.locator('[data-quote-step="3"]').innerText()).slice(0, 600)
        steps.step3buttons = await page.locator('[data-quote-step="3"] button, [data-quote-submit]').evaluateAll((bs) => bs.map((b) => ({ t: b.innerText.trim().slice(0, 30), h: Math.round(b.getBoundingClientRect().height) })))
        await page.locator('[data-quote-step="3"]').screenshot({ path: path.join(out, `${key}-step3.png`) })
      } catch (e) { steps.error = String(e).slice(0, 200) }
      res[key].steps = steps
      await page.goto(`${base}/${loc}${p.r}`, { waitUntil: 'networkidle' })
      res[key].step1buttons = await page.locator('[data-quote-step="1"] button, [data-quote-next="step-1"], a[data-component="button"]').evaluateAll((bs) => bs.map((b) => ({ t: b.innerText.trim().slice(0, 30), h: Math.round(b.getBoundingClientRect().height) })))
    }
    if (name === 'contact') {
      const ft = await page.evaluate(() => { const f = document.querySelector('footer'); if (!f) return null; const s = getComputedStyle(f); const b = f.getBoundingClientRect(); return { y: Math.round(b.y + scrollY), borderTop: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor, pin: [...document.querySelectorAll('[class]')].filter((e) => [...e.classList].some((c) => /(^|_)staticMapPinGroup(_|$)/.test(c))).map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) } }) } })
      res[key].footer = ft
    }
    if (name === 'services') {
      res[key].visibleRows = await page.evaluate(() => [...document.querySelectorAll('tbody tr')].filter((t) => t.getBoundingClientRect().height > 0).length)
      const va = page.getByRole('button', { name: /view all|عرض الكل/i }).first()
      res[key].viewAll = (await va.count()) ? await va.innerText() : null
    }
  }
  // detail routes
  for (const [label, r] of [['service-unknown', '/services/no-such-service-xyz'], ['project-unknown', '/projects/no-such-project-xyz'], ['project-draft', '/projects/princess-noura-university-pnu'], ['project-published', '/projects/sofitel-makkah-hotel']]) {
    const resp = await page.goto(`${base}/${loc}${r}`, { waitUntil: 'domcontentloaded' })
    res[`${loc}-${v.n}-${label}`] = { status: resp?.status() }
  }
  await page.goto(`${base}/${loc}/services`, { waitUntil: 'networkidle' })
  const svc = await page.locator(`a[href^="/${loc}/services/"]`).evaluateAll((as) => as.map((a) => a.getAttribute('href')).filter(Boolean))
  if (svc[0]) { const resp = await page.goto(base + svc[0], { waitUntil: 'domcontentloaded' }); res[`${loc}-${v.n}-service-published`] = { href: svc[0], status: resp?.status() } }
  await ctx.close()
}
fs.writeFileSync(path.join(out, 'measure.json'), JSON.stringify(res, null, 1))
await browser.close()
console.log('done', Object.keys(res).length)
