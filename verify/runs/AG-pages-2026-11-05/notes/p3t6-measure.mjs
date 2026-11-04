// Read-only measurement of /en/services on the verifier's next start server (port 3323).
// Run from D:\jazira-verify\2026-11-05\ag-pages2 so @playwright/test resolves.
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(process.cwd() + '/package.json')
const { chromium } = require('@playwright/test')

const BASE = 'http://localhost:3323'
const out = {}

async function measure(page) {
  return page.evaluate(() => {
    const r = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return { x: Math.round(b.left + scrollX), y: Math.round(b.top + scrollY), w: Math.round(b.width), h: Math.round(b.height) }
    }
    const textRect = (el) => {
      if (!el) return null
      const range = document.createRange()
      range.selectNodeContents(el)
      const rects = [...range.getClientRects()].filter((q) => q.width > 0)
      if (!rects.length) return null
      const left = Math.min(...rects.map((q) => q.left)), right = Math.max(...rects.map((q) => q.right))
      const top = Math.min(...rects.map((q) => q.top)), bottom = Math.max(...rects.map((q) => q.bottom))
      const lines = new Set(rects.map((q) => Math.round(q.top))).size
      return { x: Math.round(left + scrollX), r: Math.round(right + scrollX), y: Math.round(top + scrollY), b: Math.round(bottom + scrollY), lines }
    }
    const q = (s) => document.querySelector(s)
    const qa = (s) => [...document.querySelectorAll(s)]
    const table = q('table')
    const res = { docW: document.documentElement.scrollWidth, vw: innerWidth, dir: document.documentElement.dir }
    if (table) {
      res.table = r(table)
      res.thead = r(table.querySelector('thead tr'))
      res.theadBg = getComputedStyle(table.querySelector('thead tr') || table).backgroundColor
      res.thText = qa('thead th').map((th) => ({ cell: r(th), text: textRect(th), t: th.textContent.trim() }))
      const rows = qa('tbody tr')
      res.rowCount = rows.length
      res.rows = rows.slice(0, 2).concat(rows.slice(-1)).map((tr) => ({
        row: r(tr),
        cells: [...tr.children].map((td) => ({ cell: r(td), text: textRect(td.querySelector('bdi') || td), t: td.textContent.trim() })),
      }))
      res.originLast = textRect(rows.at(-1)?.lastElementChild)
    }
    // footer button
    const btn = qa('button, a').find((b) => /View all|عرض/.test(b.textContent))
    if (btn) {
      const cs = getComputedStyle(btn)
      res.viewAllBtn = { ...r(btn), text: btn.textContent.trim(), border: cs.border, radius: cs.borderRadius, bg: cs.backgroundColor, color: cs.color, fs: cs.fontSize, svg: !!btn.querySelector('svg'), svgRect: r(btn.querySelector('svg')) }
    }
    const fc = [...document.querySelectorAll('p')].find((p) => /Showing|عرض/.test(p.textContent))
    if (fc) res.footerCount = { ...r(fc), text: textRect(fc), t: fc.textContent.trim() }
    // sections: find section ancestors of known nodes
    const secOf = (el) => el && el.closest('section')
    const tile = q('[class*="specialistTile"]')
    res.specialistSection = r(secOf(tile))
    res.specialistHeading = r([...document.querySelectorAll('h2')].find((h) => /Specialist|التخصص/.test(h.textContent)))
    const row = q('[class*="serviceRow"]')
    res.mainSection = r(secOf(row))
    res.materialsSection = r(secOf(table))
    // CTA buttons in service rows
    res.ctaBtns = qa('[class*="serviceCtaWrap"] a, [class*="serviceCtaWrap"] button').map((b) => ({ ...r(b), t: b.textContent.trim() }))
    // overflow check: elements wider than viewport or extending past it
    const over = []
    for (const el of document.querySelectorAll('main *')) {
      const b = el.getBoundingClientRect()
      if (b.width === 0) continue
      if (b.right > innerWidth + 1 || b.left < -1) {
        const cs = getComputedStyle(el)
        if (cs.position === 'fixed') continue
        over.push({ cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 60), tag: el.tagName, l: Math.round(b.left), r: Math.round(b.right) })
      }
      if (over.length > 15) break
    }
    res.overflow = over
    return res
  })
}

const browser = await chromium.launch()
try {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/en/services`, { waitUntil: 'networkidle' })
    out[`en-${w}`] = await measure(page)
    // client-only state: expand the table (no server request changes data)
    const btn = page.getByRole('button', { name: /View all/ })
    if (await btn.count()) {
      await btn.first().click()
      await page.waitForTimeout(300)
      const after = await page.evaluate(() => ({
        rows: document.querySelectorAll('tbody tr').length,
        footer: [...document.querySelectorAll('p')].find((p) => /Showing/.test(p.textContent))?.textContent.trim(),
        btn: [...document.querySelectorAll('button')].find((b) => /View all/.test(b.textContent))?.textContent.trim() ?? null,
      }))
      out[`en-${w}-afterViewAll`] = after
    }
    await ctx.close()
  }
} finally {
  await browser.close()
}
writeFileSync(new URL('./p3t6-measure.json', import.meta.url), JSON.stringify(out, null, 1))
console.log('ok')
