// CTO verifier, R-1 visual check: full-page screenshots of /en and /ar at 1440 and 390, reduced motion, intro skipped,
// from the base server (34f3597) and the R-1 server (df4ecdc), plus a second R-1 shot as the noise floor.
// Counts differing pixels with sharp (raw RGBA equality). Usage (from the R-1 clone):
//   node r1-visual.mjs shoot <url> <outDir> <tag>   |   node r1-visual.mjs diff <outDir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const sharp = require('sharp')
const [mode, a1, a2, a3] = process.argv.slice(2)
const out = mode === "shoot" ? a2 : a1; fs.mkdirSync(out, { recursive: true })
const browser = mode === "shoot" ? await chromium.launch() : null
const shot = async (url, file, width) => {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {} })
  const page = await ctx.newPage()
  const res = await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) } window.scrollTo(0, 0) })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' })
  const finalUrl = page.url(); await ctx.close(); return { status: res?.status() ?? null, finalUrl }
}
const diff = async (a, b) => {
  const [ia, ib] = await Promise.all([sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true })])
  if (ia.info.width !== ib.info.width || ia.info.height !== ib.info.height) return { sizeA: [ia.info.width, ia.info.height], sizeB: [ib.info.width, ib.info.height], diffPixels: null }
  let n = 0; for (let i = 0; i < ia.data.length; i += 4) if (ia.data[i] !== ib.data[i] || ia.data[i + 1] !== ib.data[i + 1] || ia.data[i + 2] !== ib.data[i + 2]) n++
  return { size: [ia.info.width, ia.info.height], diffPixels: n }
}
const pages = []; for (const loc of ["en", "ar"]) for (const w of [1440, 390]) pages.push([loc, w])
if (mode === "shoot") {
  const meta = {}
  for (const [loc, w] of pages) meta[`${loc}-${w}`] = await shot(`${a1}/${loc}`, `${out}/${loc}-${w}-${a3}.png`, w)
  fs.writeFileSync(`${out}/shoot-${a3}.json`, JSON.stringify(meta, null, 1)); console.log(a3, JSON.stringify(meta)); await browser.close()
} else {
  const rows = []
  for (const [loc, w] of pages) { const k = `${loc}-${w}`; const row = { page: k, baseVsFix: await diff(`${out}/${k}-base.png`, `${out}/${k}-fix.png`), fixVsFix2: await diff(`${out}/${k}-fix.png`, `${out}/${k}-fix2.png`) }; rows.push(row); console.log(JSON.stringify(row)) }
  fs.writeFileSync(`${out}/visual.json`, JSON.stringify(rows, null, 1))
}
