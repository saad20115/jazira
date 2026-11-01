// Independent P3-T13 intro measurement (reviewer-owned, not executor code).
// Usage: node measure.mjs <baseUrl> <outDir> [--only=vp:mode:locale] [--runs=3] [--no-sampler] [--calib]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const req = createRequire('D:/jazira-verify/2026-11-01/p3/package.json')
const { chromium } = req('@playwright/test')
const sharp = req('sharp')

const args = process.argv.slice(2)
const baseUrl = args[0]
const outDir = args[1]
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7)
const runsN = Number((args.find((a) => a.startsWith('--runs=')) || '--runs=3').slice(7))
const noSampler = args.includes('--no-sampler')
const calib = args.includes('--calib')
const locales = (args.find((a) => a.startsWith('--locales=')) || '--locales=en,ar').slice(10).split(',')
fs.mkdirSync(outDir, { recursive: true })

const VIEWPORTS = {
  412: {
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
  },
  768: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
}
const MODES = {
  unthrottled: null,
  'mid-tier': { cpu: 2, latency: 40, down: (9 * 1024 * 1024) / 8, up: (9 * 1024 * 1024) / 8 },
  throttled: { cpu: 4, latency: 150, down: (1.6 * 1024 * 1024) / 8, up: (750 * 1024) / 8 },
}

// Installed via addInitScript: runs at document creation, before any page script.
const INIT = (useSampler) => `(() => {
  if (window.top !== window) return;
  const m = (window.__rv = { paints: [], introHist: [], samples: [], csp: [], anim: [], domAt: {}, errors: [] });
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) m.paints.push({ name: e.name, t: e.startTime }) })
      .observe({ type: 'paint', buffered: true });
  } catch (e) { m.errors.push('po:' + e.message) }
  document.addEventListener('securitypolicyviolation', (e) => {
    m.csp.push({ dir: e.violatedDirective, eff: e.effectiveDirective, uri: e.blockedURI, src: e.sourceFile, line: e.lineNumber, sample: e.sample, t: performance.now() })
  }, true);
  const ovSel = '[data-component="intro-splash"]:not([data-intro-forced="true"])';
  const snapDom = () => ({
    rs: document.readyState,
    hasHeader: !!document.querySelector('header'),
    hasMain: !!document.querySelector('main'),
    hasOverlay: !!document.querySelector(ovSel),
    hasFooter: !!document.querySelector('footer'),
    paints: performance.getEntriesByType('paint').length,
  });
  new MutationObserver((recs) => {
    for (const r of recs) {
      if (r.attributeName === 'data-intro' && r.target === document.documentElement) {
        m.introHist.push({ t: performance.now(), v: document.documentElement.getAttribute('data-intro'), old: r.oldValue, dom: snapDom() });
      }
    }
  }).observe(document, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['data-intro'] });
  // Record when key DOM nodes are first parsed.
  const mo2 = new MutationObserver(() => {
    const t = performance.now();
    for (const [k, s] of [['header', 'header'], ['main', 'main'], ['overlay', ovSel], ['footer', 'footer'], ['heroH1', 'main h1']]) {
      if (m.domAt[k] === undefined && document.querySelector(s)) m.domAt[k] = t;
    }
    if (m.domAt.footer !== undefined && m.domAt.overlay !== undefined) mo2.disconnect();
  });
  mo2.observe(document, { childList: true, subtree: true });
  for (const ev of ['animationstart', 'animationend']) {
    document.addEventListener(ev, (e) => {
      const tg = e.target;
      if (tg && tg.getAttribute && tg.getAttribute('data-component') === 'intro-splash') m.anim.push({ ev, name: e.animationName, t: performance.now() });
    }, true);
  }
  document.addEventListener('DOMContentLoaded', () => { m.dcl = performance.now() });
  if (!${useSampler}) return;
  const cs = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return { v: s.visibility, d: s.display, o: s.opacity, cv: s.contentVisibility, inert: el.hasAttribute('inert') };
  };
  let n = 0;
  const tick = (ts) => {
    n++;
    const ov = document.querySelector(ovSel);
    let ovs = null, logo = null, anStart = null;
    if (ov) {
      const s = getComputedStyle(ov);
      ovs = { d: s.display, v: s.visibility, o: Number(s.opacity) };
      const lw = ov.querySelector('[class*="logoWrap"]');
      if (lw) logo = Number(getComputedStyle(lw).opacity);
      try { const a = ov.getAnimations()[0]; if (a) anStart = a.startTime } catch (e) {}
    }
    m.samples.push({
      ts, now: performance.now(), intro: document.documentElement.getAttribute('data-intro'),
      rs: document.readyState, paints: performance.getEntriesByType('paint').length,
      ov: ovs, logo, anStart,
      body: cs(document.body), main: cs(document.querySelector('main')), header: cs(document.querySelector('header')), footer: cs(document.querySelector('footer')),
    });
    if (performance.now() < 6000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();`

const NAVY = [1, 16, 37]
async function classify(jpegB64) {
  const buf = Buffer.from(jpegB64, 'base64')
  const { data, info } = await sharp(buf).resize({ width: 72 }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height
  let navy = 0, white = 0, tot = 0, topNavy = 0, topTot = 0, topWhite = 0
  let topLumSum = 0, topLumSq = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const dn = Math.abs(r - NAVY[0]) + Math.abs(g - NAVY[1]) + Math.abs(b - NAVY[2])
      const isNavy = dn < 36
      const isWhite = r > 240 && g > 240 && b > 240
      tot++; if (isNavy) navy++; if (isWhite) white++
      if (y < H * 0.12) {
        topTot++; if (isNavy) topNavy++; if (isWhite) topWhite++
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        topLumSum += lum; topLumSq += lum * lum
      }
    }
  }
  const topMean = topLumSum / topTot
  const topStd = Math.sqrt(Math.max(0, topLumSq / topTot - topMean * topMean))
  const fNavy = navy / tot, fWhite = white / tot, fTopNavy = topNavy / topTot, fTopWhite = topWhite / topTot
  // overlay: full-viewport navy with a uniform top band (no navbar content); blank: all white
  let cls
  if (fWhite > 0.97 && topStd < 3) cls = 'blank'
  else if (fTopNavy > 0.97 && topStd < 6 && fNavy > 0.6) cls = 'overlay'
  else cls = 'page'
  return { cls, fNavy: +fNavy.toFixed(3), fWhite: +fWhite.toFixed(3), fTopNavy: +fTopNavy.toFixed(3), topStd: +topStd.toFixed(1), buf }
}

function parseTrace(buf, url) {
  const tr = JSON.parse(buf.toString('utf8'))
  const ev = tr.traceEvents || tr
  const fpEv = ev.find((e) => e.name === 'firstPaint')
  const nav = fpEv ? ev.find((e) => e.name === 'navigationStart' && e.args?.data?.navigationId === fpEv.args?.data?.navigationId) : null
  if (!nav) return { error: 'no navigationStart' }
  const t0 = nav.ts
  const frame = nav.args.frame
  const fp = fpEv
  const fcp = ev.find((e) => e.name === 'firstContentfulPaint' && e.args?.frame === frame)
  const shots = ev.filter((e) => e.name === 'Screenshot' && e.ts >= t0).map((e) => ({ t: (e.ts - t0) / 1000, snap: e.args.snapshot }))
  shots.sort((a, b) => a.t - b.t)
  return { t0, fpTrace: fp ? (fp.ts - t0) / 1000 : null, fcpTrace: fcp ? (fcp.ts - t0) / 1000 : null, shots }
}

async function runOne(browser, { vp, mode, locale, run, useSampler, tag }) {
  const url = `${baseUrl}/${locale}`
  const ctx = await browser.newContext({ ...VIEWPORTS[vp] })
  await ctx.addInitScript({ content: INIT(useSampler) })
  const page = await ctx.newPage()
  const consoleMsgs = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push(`${m.type()}: ${m.text()}`) })
  page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${e.message}`))
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  const th = MODES[mode]
  if (th) {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: th.latency, downloadThroughput: th.down, uploadThroughput: th.up })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: th.cpu })
  }
  let docReq = null, docWall = null, docTs = null
  const chunks = []
  cdp.on('Network.requestWillBeSent', (e) => {
    if (!docReq && e.type === 'Document' && e.request.url.startsWith(url)) { docReq = e.requestId; docWall = e.wallTime; docTs = e.timestamp }
  })
  cdp.on('Network.dataReceived', (e) => { if (e.requestId === docReq) chunks.push({ ts: e.timestamp, len: e.dataLength }) })
  await browser.startTracing(page, {
    screenshots: true,
    categories: ['-*', 'devtools.timeline', 'disabled-by-default-devtools.screenshot', 'blink.user_timing', 'loading', 'rail'],
  })
  const navT = Date.now()
  await page.goto(url, { waitUntil: 'load', timeout: 90000 })
  // observe until 5.5 s after navigationStart
  await page.waitForFunction(() => performance.now() > 5500, null, { timeout: 30000, polling: 100 })
  const traceBuf = await browser.stopTracing()
  const rv = await page.evaluate(() => {
    const r = window.__rv
    r.timeOrigin = performance.timeOrigin
    r.decision = window.__aljaziraIntroDecision || null
    r.finalIntro = document.documentElement.getAttribute('data-intro')
    let ss = null
    try { ss = sessionStorage.getItem('aljazira_intro_seen') } catch (e) {}
    r.seen = ss
    return r
  })
  await ctx.close()

  if (calib) fs.writeFileSync(path.join(outDir, tag + '.trace.json'), traceBuf)
  const tr = parseTrace(traceBuf, url)
  const frames = []
  for (const s of tr.shots || []) {
    const c = await classify(s.snap)
    frames.push({ t: +s.t.toFixed(1), cls: c.cls, fNavy: c.fNavy, fWhite: c.fWhite, fTopNavy: c.fTopNavy, topStd: c.topStd, buf: c.buf })
  }
  const timeOrigin = rv.timeOrigin
  const chunkTimes = chunks.map((c) => ({ t: +((docWall + (c.ts - docTs)) * 1000 - timeOrigin).toFixed(1), len: c.len }))

  // ---- derive metrics ----
  const fp = rv.paints.find((p) => p.name === 'first-paint')?.t ?? null
  const fcp = rv.paints.find((p) => p.name === 'first-contentful-paint')?.t ?? null
  const firstIntro = rv.introHist[0] || null
  const everActive = rv.introHist.some((h) => h.v === 'active')
  const skipped = !everActive
  // paint-level
  const firstNonBlank = frames.find((f) => f.cls !== 'blank') || null
  const firstOverlayIdx = frames.findIndex((f) => f.cls === 'overlay')
  const firstOverlayPaint = firstOverlayIdx >= 0 ? frames[firstOverlayIdx].t : null
  const pageFramesBeforeOverlay = firstOverlayIdx >= 0 ? frames.slice(0, firstOverlayIdx).filter((f) => f.cls === 'page').length : null
  let lastOverlayIdx = -1
  for (let i = 0; i < frames.length; i++) if (frames[i].cls === 'overlay') lastOverlayIdx = i
  const firstPageAfterOverlay = lastOverlayIdx >= 0 ? frames.slice(lastOverlayIdx + 1).find((f) => f.cls === 'page' && f.fNavy < 0.5) : null
  // dom-level from samples
  const S = rv.samples
  const visS = S.filter((s) => s.ov && s.ov.d !== 'none' && s.ov.v === 'visible' && s.ov.o > 0)
  const domFirstVisible = visS[0]?.ts ?? null
  const fullS = S.filter((s) => s.ov && s.ov.d !== 'none' && s.ov.v === 'visible' && s.ov.o >= 0.999 && s.logo !== null && s.logo >= 0.999)
  const logoStart = fullS[0]?.ts ?? null, logoEnd = fullS.length ? fullS[fullS.length - 1].ts : null
  let domHidden = null
  if (domFirstVisible !== null) {
    const h = S.find((s) => s.ts > domFirstVisible && (!s.ov || s.ov.d === 'none' || s.ov.v === 'hidden'))
    domHidden = h ? h.ts : null
  }
  const animEnd = rv.anim.find((a) => a.ev === 'animationend' && a.name.includes('introOverlayTimeline'))?.t ?? null
  const animStart = rv.anim.find((a) => a.ev === 'animationstart' && a.name.includes('introOverlayTimeline'))?.t ?? null
  const anStartTimeline = S.find((s) => s.anStart !== null && s.anStart !== undefined)?.anStart ?? null
  const seenAt = rv.introHist.find((h) => h.v === 'seen' && everActive)?.t ?? null
  const hidden = everActive ? Math.min(...[domHidden, animEnd, seenAt].filter((x) => x !== null)) : null
  const firstVisible = firstOverlayPaint ?? domFirstVisible
  // content never hidden
  const hiddenSamples = S.filter((s) => ['body', 'main', 'header', 'footer'].some((k) => s[k] && (s[k].v !== 'visible' || s[k].d === 'none' || Number(s[k].o) < 1 || (s[k].cv && s[k].cv !== 'visible'))))
  const res = {
    tag, vp, mode, locale, run,
    fp: fp && +fp.toFixed(1), fcp: fcp && +fcp.toFixed(1), fpTrace: tr.fpTrace && +tr.fpTrace.toFixed(1),
    firstNonBlankShot: firstNonBlank?.t ?? null,
    decisionT: firstIntro ? +firstIntro.t.toFixed(1) : null, decisionV: firstIntro?.v ?? null, decisionDom: firstIntro?.dom ?? null,
    introHist: rv.introHist.map((h) => `${h.v}@${h.t.toFixed(0)}`).join(','),
    implDecision: rv.decision,
    dcl: rv.dcl && +rv.dcl.toFixed(1), domAt: Object.fromEntries(Object.entries(rv.domAt).map(([k, v]) => [k, +v.toFixed(1)])),
    skipped,
    firstOverlayPaint, domFirstVisible: domFirstVisible && +domFirstVisible.toFixed(1),
    firstVisible,
    animStart: animStart && +animStart.toFixed(1), anStartTimeline: anStartTimeline && +anStartTimeline.toFixed(1),
    logoStart: logoStart && +logoStart.toFixed(1), logoEnd: logoEnd && +logoEnd.toFixed(1), logoDur: logoStart !== null ? +(logoEnd - logoStart).toFixed(1) : null,
    hidden: hidden !== null && Number.isFinite(hidden) ? +hidden.toFixed(1) : null,
    domHidden: domHidden && +domHidden.toFixed(1), animEnd: animEnd && +animEnd.toFixed(1),
    firstPageAfterOverlayShot: firstPageAfterOverlay?.t ?? null,
    span: firstVisible !== null && hidden !== null && Number.isFinite(hidden) ? +(hidden - firstVisible).toFixed(1) : null,
    shots: frames.length,
    pageFramesBeforeOverlay,
    frameSeq: frames.slice(0, 40).map((f) => `${f.t.toFixed(0)}:${f.cls[0]}`).join(' '),
    samples: S.length, hiddenSampleCount: hiddenSamples.length,
    hiddenSampleExample: hiddenSamples[0] || null,
    inertSamples: S.filter((s) => s.main?.inert || s.header?.inert).length,
    csp: rv.csp, console: consoleMsgs,
    seenStorage: rv.seen, finalIntro: rv.finalIntro,
    docChunks: chunkTimes,
  }
  if (calib || (pageFramesBeforeOverlay ?? 0) > 0 || run === 1) {
    const d = path.join(outDir, 'frames', tag)
    fs.mkdirSync(d, { recursive: true })
    for (const f of (calib ? frames : frames.slice(0, 30))) fs.writeFileSync(path.join(d, `${String(Math.round(f.t)).padStart(5, '0')}-${f.cls}.jpg`), f.buf)
  }
  fs.mkdirSync(path.join(outDir, 'raw'), { recursive: true })
  fs.writeFileSync(path.join(outDir, 'raw', tag + '.json'), JSON.stringify({ samples: S, introHist: rv.introHist, paints: rv.paints, anim: rv.anim, frames: frames.map(({ buf, ...f }) => f) }))
  return res
}

const browser = await chromium.launch({ headless: true })
const results = []
const vps = [412, 768, 1440], modes = ['unthrottled', 'mid-tier', 'throttled']
try {
  for (const locale of locales) {
    for (const vp of vps) for (const mode of modes) {
      if (only && !only.split(',').includes(`${vp}:${mode}:${locale}`)) continue
      for (let run = 1; run <= runsN; run++) {
        const tag = `${vp}-${mode}-${locale}-r${run}${noSampler ? '-nosampler' : ''}`
        try {
          const r = await runOne(browser, { vp, mode, locale, run, useSampler: !noSampler, tag })
          results.push(r)
          console.log(`${tag} fp=${r.fp} dec=${r.decisionV}@${r.decisionT} firstVis=${r.firstVisible} logo=${r.logoDur} hidden=${r.hidden} span=${r.span} skipped=${r.skipped} pageBeforeOv=${r.pageFramesBeforeOverlay} hiddenSamples=${r.hiddenSampleCount} csp=${r.csp.length} console=${r.console.length}`)
        } catch (e) {
          console.log(`${tag} ERROR ${e.message}`)
          results.push({ tag, error: e.message })
        }
        fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1))
      }
    }
  }
} finally {
  await browser.close()
}
