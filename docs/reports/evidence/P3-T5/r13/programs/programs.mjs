// Executor diagnosis (non-authoritative): WebGL programs linked by the page, counted from outside the
// code (WebGL2RenderingContext.prototype is wrapped by an init script). Scenario: scroll to the card,
// wait, click Fire Fighting, wait; then, live, click HVAC and wait. Prints when each program was
// linked relative to the click and to live, and the linking time on the main thread.
// Usage (cwd = worktree): node programs.mjs <baseUrl> <out.json> [waitBeforeClickMs]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('@playwright/test')
const [base, out, waitMs = '3000'] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=d3d11'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('aljazira_intro_seen', '1') } catch {}
  const w = (window.__gl = { links: [], compiles: 0, live: null, click: null })
  const P = WebGL2RenderingContext.prototype
  const link = P.linkProgram
  w.sigs = []
  P.linkProgram = function (program) {
    const t = performance.now()
    let sig = ""
    try {
      const fs2 = this.getAttachedShaders(program).map((sh) => this.getShaderSource(sh) || "").find((src) => src.includes("gl_FragColor") || src.includes("pc_fragColor") || src.includes("out highp vec4")) || ""
      const defs = (fs2.match(/#define [A-Z_]+/g) || []).map((d) => d.slice(8)).filter((d) => !/^(HIGH_PRECISION|SHADER_TYPE|SHADER_NAME|STANDARD|PHYSICAL|gl_FragColor|texture2D|varying|precision)/.test(d))
      const name = (fs2.match(/#define SHADER_NAME ([A-Za-z]+)/) || [])[1] || ""
      sig = name + (fs2.includes("uKeySheen") ? "+SHEEN" : "") + (fs2.includes("imDepth") ? "+INTERIOR" : "") + (fs2.includes("uDiscCentre") ? "+ROOM" : "") + " " + defs.sort().join(",")
    } catch (e) { sig = "?" }
    const r = link.call(this, program)
    w.links.push([Math.round(t), +(performance.now() - t).toFixed(2)])
    w.sigs.push(sig)
    return r
  }
  const compile = P.compileShader
  P.compileShader = function (s) { w.compiles += 1; return compile.call(this, s) }
  document.addEventListener('DOMContentLoaded', () => {
    const tick = () => {
      const c = document.querySelector('[data-interactive-3d-card]')
      if (!c) return setTimeout(tick, 50)
      new MutationObserver(() => {
        if (w.live === null && c.getAttribute('data-viewer-state') === 'live') w.live = Math.round(performance.now())
      }).observe(c, { attributes: true })
    }
    tick()
  })
})
const page = await ctx.newPage()
await page.goto(base + '/en')
await page.locator('[data-interactive-3d-card]').scrollIntoViewIfNeeded()
await page.waitForTimeout(Number(waitMs))
await page.evaluate(() => { window.__gl.click = Math.round(performance.now()) })
await page.locator('button', { hasText: 'Fire Fighting' }).first().click()
await page.waitForTimeout(9000)
const hvacAt = await page.evaluate(() => Math.round(performance.now()))
await page.locator('button', { hasText: 'HVAC' }).first().click()
await page.waitForTimeout(6000)
const gl = await page.evaluate(() => window.__gl)
await browser.close()
const before = gl.links.filter((l) => l[0] < gl.click).length
const toLive = gl.links.filter((l) => l[0] >= gl.click && (gl.live === null || l[0] < gl.live)).length
const firstWindow = gl.links.filter((l) => gl.live !== null && l[0] >= gl.live && l[0] < hvacAt).length
const later = gl.links.filter((l) => l[0] >= hvacAt).length
const res = { liveMs: gl.live === null ? null : gl.live - gl.click, programs: gl.links.length, compiles: gl.compiles, beforeClick: before, clickToLive: toLive, liveToHvacClick: firstWindow, afterHvacClick: later, linkMsMax: Math.max(0, ...gl.links.map((l) => l[1])) }
fs.writeFileSync(out, JSON.stringify({ res, links: gl.links.map((l, i) => [l[0] - gl.click, l[1], gl.sigs[i]]) }))
console.log(JSON.stringify(res))
