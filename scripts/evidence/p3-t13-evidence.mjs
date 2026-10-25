import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

import { runP3T4Evidence } from './p3-t4-evidence.mjs'
import { runLighthouseAudit } from './run-lighthouse.mjs'

/**
 * Self-contained machine-captured evidence generator for `P3-T13`
 * ("Intro splash: first-frame decision", `handoff/tasks/P3-T13.md`, `R-31`..`R-35`).
 *
 * Usage:
 *   node scripts/evidence/p3-t13-evidence.mjs [--mode=all|dev-styleguide|prod-intro] [baseUrl] [evidenceDir] [phase3Dir]
 */

function getRepoHeaderBlock() {
  const cwd = process.cwd()
  let head = 'unknown'
  let statusPorcelain = 'unknown'
  let diffSha256 = 'unknown'
  try {
    head = execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim()
    const rawStatus = execSync('git status --porcelain', { cwd, encoding: 'utf8' }).trim()
    statusPorcelain = rawStatus.length > 0 ? rawStatus : '(clean)'
    const rawDiff = execSync('git diff HEAD', { cwd, maxBuffer: 32 * 1024 * 1024 })
    diffSha256 =
      rawDiff.length > 0
        ? `${crypto.createHash('sha256').update(rawDiff).digest('hex')} (${rawDiff.length} bytes)`
        : 'clean (0 bytes)'
  } catch {
    // ignore
  }
  return [
    `$ pwd`,
    cwd,
    `$ git rev-parse HEAD`,
    head,
    `$ git status --porcelain`,
    statusPorcelain,
    `$ git diff HEAD | sha256`,
    diffSha256,
    '',
  ].join('\n')
}

async function saveCompressedPng(inputBuffer, outPath, maxWidth = 1440) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp(inputBuffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 85 })
    .toFile(outPath)
}

async function ensureAdminAuthToken(baseUrl) {
  const email = process.env.EVIDENCE_ADMIN_EMAIL || 'admin@aljazira.local'
  const password = process.env.EVIDENCE_ADMIN_PASSWORD || 'Passw0rd!StrongAdmin2026'

  const loginRes = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (loginRes.ok) {
    const json = await loginRes.json()
    if (json.token) return json.token
  }

  const regRes = await fetch(`${baseUrl}/api/users/first-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Admin' }),
  })
  if (regRes.ok) {
    const json = await regRes.json()
    if (json.token) return json.token
  }

  const retryRes = await fetch(`${baseUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!retryRes.ok) {
    throw new Error(`Failed to authenticate admin user (${retryRes.status})`)
  }
  const retryJson = await retryRes.json()
  return retryJson.token
}

async function apiRequest(baseUrl, token, endpoint, { method = 'GET', body, locale } = {}) {
  const sep = endpoint.includes('?') ? '&' : '?'
  const url = locale
    ? `${baseUrl}${endpoint}${sep}locale=${locale}&depth=0`
    : `${baseUrl}${endpoint}`
  const headers = {
    Authorization: `JWT ${token}`,
  }
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${method} ${url} failed (${res.status}): ${errText.slice(0, 400)}`)
  }
  return res.json()
}

export async function runP3T13Evidence({
  baseUrl = process.env.EVIDENCE_BASE_URL || 'http://localhost:3000',
  reportsEvidenceDir = path.resolve(process.cwd(), 'docs/reports/evidence/P3-T13/r1'),
  reportsPhase3Dir = path.resolve(process.cwd(), 'docs/reports/phase-3/P3-T13/r1'),
  mode = 'all',
  skipBrands = false,
} = {}) {
  fs.mkdirSync(reportsEvidenceDir, { recursive: true })
  fs.mkdirSync(reportsPhase3Dir, { recursive: true })
  const headerBlock = getRepoHeaderBlock()

  const token = await ensureAdminAuthToken(baseUrl)

  if (mode === 'all' || mode === 'prod-intro' || mode === 'seed-only') {
    await runP3T4Evidence({
      baseUrl,
      reportsEvidenceDir,
      reportsPhase3Dir,
      mode: 'seed-only',
      skipBrands,
    })
    if (mode === 'seed-only') {
      return
    }
  }

  // Ensure arabicEnabled = true so /ar and /ar/styleguide serve 200 OK RTL
  await apiRequest(baseUrl, token, '/api/globals/site-settings', {
    method: 'POST',
    locale: 'en',
    body: { arabicEnabled: true },
  })

  const browser = await chromium.launch({ headless: true })

  try {
    // =========================================================================
    // 1. R-35: Recapture distinct ar/en TeamCard hover PNGs on /en/styleguide and /ar/styleguide
    // =========================================================================
    if (mode === 'all' || mode === 'dev-styleguide') {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await ctx.newPage()

      await page.goto(`${baseUrl}/en/styleguide`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const enDir = await page.evaluate(() => document.documentElement.dir)
      const enter2Locator = page
        .locator(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Enter 2"]',
        )
        .first()
      await enter2Locator.scrollIntoViewIfNeeded()
      const enter2Path = path.join(reportsPhase3Dir, 'team-card-enter-2-clipped.png')
      await saveCompressedPng(await enter2Locator.screenshot(), enter2Path)

      const hoverEnLocator = page
        .locator(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Hover"]',
        )
        .first()
      await hoverEnLocator.scrollIntoViewIfNeeded()
      const enCardText = ((await hoverEnLocator.textContent()) || '').trim()
      const hoverEnPath = path.join(reportsPhase3Dir, 'team-card-hover-shadow-en.png')
      await saveCompressedPng(await hoverEnLocator.screenshot(), hoverEnPath)

      await page.goto(`${baseUrl}/ar/styleguide`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const arDir = await page.evaluate(() => document.documentElement.dir)
      const hoverArLocator = page
        .locator(
          '[data-styleguide-subsection="team-card-states"] [data-component="team-card"][data-state="Hover"]',
        )
        .first()
      await hoverArLocator.scrollIntoViewIfNeeded()
      const arCardText = ((await hoverArLocator.textContent()) || '').trim()
      const hoverArPath = path.join(reportsPhase3Dir, 'team-card-hover-shadow-ar.png')
      await saveCompressedPng(await hoverArLocator.screenshot(), hoverArPath)

      const enBuf = fs.readFileSync(hoverEnPath)
      const arBuf = fs.readFileSync(hoverArPath)
      const enSha256 = crypto.createHash('sha256').update(enBuf).digest('hex')
      const arSha256 = crypto.createHash('sha256').update(arBuf).digest('hex')
      const distinctBytes = Buffer.compare(enBuf, arBuf) !== 0

      const r35GatePassed =
        enDir === 'ltr' &&
        arDir === 'rtl' &&
        distinctBytes &&
        enSha256 !== arSha256 &&
        enCardText !== arCardText

      const r35TeamCardAudit = {
        enUrl: `${baseUrl}/en/styleguide`,
        arUrl: `${baseUrl}/ar/styleguide`,
        enDir,
        arDir,
        enCardText,
        arCardText,
        enBytes: enBuf.length,
        arBytes: arBuf.length,
        enSha256,
        arSha256,
        distinctBytes,
        gatePassed: r35GatePassed,
      }
      const r35Log = [
        headerBlock,
        '=== R-35 Distinct AR / EN TeamCard Hover Shadow PNG Verification ===',
        JSON.stringify(r35TeamCardAudit, null, 2),
        r35GatePassed ? 'GATE: PASS' : 'GATE: FAIL',
        '',
      ].join('\n')
      fs.writeFileSync(path.join(reportsEvidenceDir, 'r35-team-card.log'), r35Log, 'utf8')
      await ctx.close()

      if (!r35GatePassed) {
        throw new Error(`R-35 verification failed: ${JSON.stringify(r35TeamCardAudit)}`)
      }

      if (mode === 'dev-styleguide') {
        console.log(
          `[P3-T13 Evidence] dev-styleguide artifacts generated in ${reportsEvidenceDir} and ${reportsPhase3Dir}`,
        )
        return
      }
    }

    // =========================================================================
    // 2. R-34: Only the home page with the overlay present may write `aljazira_intro_seen`
    // =========================================================================
    const r34Verification = {}
    {
      // 2a. Visit a non-home page (/en/privacy and /en/styleguide) with a slow first paint (> 1300ms CSS delay)
      //     and verify `aljazira_intro_seen` is NEVER written; then navigate in the same session to `/en`
      //     and verify the home intro plays normally.
      const r34Ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const r34Page = await r34Ctx.newPage()
      let delayNonHomeCss = true
      await r34Page.route('**/*.css*', async (route) => {
        if (delayNonHomeCss) {
          delayNonHomeCss = false
          await new Promise((r) => setTimeout(r, 1350))
        }
        try {
          await route.continue()
        } catch {
          // Ignore if unroute/navigation already handled the route
        }
      })
      await r34Page.goto(`${baseUrl}/en/privacy`, { waitUntil: 'load' })
      await r34Page.waitForTimeout(200)
      const afterSlowNonHomePage = await r34Page.evaluate(() => {
        const paints = performance.getEntriesByType('paint')
        const fp = paints.find((p) => p.name === 'first-paint')
        return {
          pathname: window.location.pathname,
          fpMs: fp ? Math.round(fp.startTime) : null,
          seenInSessionStorage: window.sessionStorage.getItem('aljazira_intro_seen'),
          htmlDataIntro: document.documentElement.getAttribute('data-intro'),
          introDecision: window.__aljaziraIntroDecision ?? null,
        }
      })

      // Now navigate to /en in the SAME session — intro must play!
      await r34Page.unroute('**/*.css*')
      await r34Page.goto(`${baseUrl}/en`, { waitUntil: 'domcontentloaded' })
      const homeIntroLocator = r34Page.locator('[data-component="intro-splash"]')
      await homeIntroLocator.waitFor({ state: 'visible', timeout: 1500 })
      const onSubsequentHomeVisit = await r34Page.evaluate(() => ({
        pathname: window.location.pathname,
        seenInSessionStorage: window.sessionStorage.getItem('aljazira_intro_seen'),
        htmlDataIntro: document.documentElement.getAttribute('data-intro'),
        introDecision: window.__aljaziraIntroDecision ?? null,
      }))
      await r34Ctx.close()

      // 2b. Visit `/en` when `[data-component="intro-splash"]` is absent from the DOM
      //     and verify `aljazira_intro_seen` is NOT written.
      const noOvCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const noOvPage = await noOvCtx.newPage()
      await noOvPage.route(`${baseUrl}/en`, async (route) => {
        const res = await route.fetch()
        const html = await res.text()
        const strippedHtml = html.replace(
          /<div([^>]*?)data-component="intro-splash"/g,
          '<div$1data-component="removed-splash"',
        )
        await route.fulfill({
          status: res.status(),
          headers: res.headers(),
          body: strippedHtml,
        })
      })
      await noOvPage.goto(`${baseUrl}/en`, { waitUntil: 'load' })
      await noOvPage.waitForTimeout(200)
      const homeWithoutOverlay = await noOvPage.evaluate(() => ({
        pathname: window.location.pathname,
        seenInSessionStorage: window.sessionStorage.getItem('aljazira_intro_seen'),
        htmlDataIntro: document.documentElement.getAttribute('data-intro'),
        introDecision: window.__aljaziraIntroDecision ?? null,
      }))
      await noOvCtx.close()

      r34Verification.afterSlowNonHomePage = afterSlowNonHomePage
      r34Verification.onSubsequentHomeVisit = onSubsequentHomeVisit
      r34Verification.homeWithoutOverlay = homeWithoutOverlay

      if (
        afterSlowNonHomePage.seenInSessionStorage !== null ||
        afterSlowNonHomePage.htmlDataIntro !== null ||
        onSubsequentHomeVisit.htmlDataIntro !== 'active' ||
        onSubsequentHomeVisit.seenInSessionStorage !== '1' ||
        homeWithoutOverlay.seenInSessionStorage !== null
      ) {
        throw new Error(`R-34 verification failed: ${JSON.stringify(r34Verification)}`)
      }
    }

    // =========================================================================
    // 3. R-31 & R-32: Warm Next.js image/route cache at 412 / 768 / 1440 in en & ar
    // =========================================================================
    const matrixViewports = [
      {
        label: '412',
        width: 412,
        height: 823,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1.75,
      },
      {
        label: '768',
        width: 768,
        height: 1024,
        isMobile: false,
        hasTouch: true,
        deviceScaleFactor: 1,
      },
      {
        label: '1440',
        width: 1440,
        height: 900,
        isMobile: false,
        hasTouch: false,
        deviceScaleFactor: 1,
      },
    ]

    for (const vvp of matrixViewports) {
      for (const warmLoc of ['en', 'ar']) {
        const warmCtx = await browser.newContext({
          viewport: { width: vvp.width, height: vvp.height },
          isMobile: vvp.isMobile,
          hasTouch: vvp.hasTouch,
          deviceScaleFactor: vvp.deviceScaleFactor,
        })
        const warmPage = await warmCtx.newPage()
        await warmPage.goto(`${baseUrl}/${warmLoc}`, { waitUntil: 'networkidle' })
        await warmCtx.close()
      }
    }

    // =========================================================================
    // 4. Record `.webm` Videos:
    //    - Mid-tier 412 (`2x CPU, 40ms RTT, 9Mbps`) in `en` and `ar` (`R-31`)
    //    - Unthrottled 412 / 768 / 1440 in `en` and `ar`
    // =========================================================================
    const recordedVideos = {}
    const videoSpecs = [
      {
        namePrefix: 'intro-412-mid',
        vp: matrixViewports[0],
        mode: 'mid-tier',
      },
      {
        namePrefix: 'intro-412',
        vp: matrixViewports[0],
        mode: 'unthrottled',
      },
      {
        namePrefix: 'intro-768',
        vp: matrixViewports[1],
        mode: 'unthrottled',
      },
      {
        namePrefix: 'intro-1440',
        vp: matrixViewports[2],
        mode: 'unthrottled',
      },
    ]

    for (const vSpec of videoSpecs) {
      for (const loc of ['en', 'ar']) {
        const vvp = vSpec.vp
        const videoTmpDir = path.join(reportsPhase3Dir, `_video_tmp_${vSpec.namePrefix}_${loc}`)
        fs.mkdirSync(videoTmpDir, { recursive: true })
        const videoCtx = await browser.newContext({
          viewport: { width: vvp.width, height: vvp.height },
          isMobile: vvp.isMobile,
          hasTouch: vvp.hasTouch,
          deviceScaleFactor: vvp.deviceScaleFactor,
          recordVideo: { dir: videoTmpDir, size: { width: vvp.width, height: vvp.height } },
        })
        await videoCtx.addInitScript(() => {
          window.__aljaziraVideoFrames = []
          window.__aljaziraDataIntroHistory = []
          const origRaf = window.requestAnimationFrame.bind(window)

          const attachAttrObserver = () => {
            if (!document.documentElement || window.__aljaziraAttrObsAttached) return
            window.__aljaziraAttrObsAttached = true
            const initial = document.documentElement.getAttribute('data-intro')
            if (initial !== null) {
              window.__aljaziraDataIntroHistory.push(initial)
            }
            const obs = new MutationObserver(() => {
              const val = document.documentElement.getAttribute('data-intro')
              window.__aljaziraDataIntroHistory.push(val)
            })
            obs.observe(document.documentElement, {
              attributes: true,
              attributeFilter: ['data-intro'],
            })
          }

          const sample = (rafTs) => {
            attachAttrObserver()
            const tMs = Math.round(
              typeof rafTs === 'number' && rafTs > 0 ? rafTs : performance.now(),
            )
            const paintsCount = performance.getEntriesByType('paint').length
            const overlay = document.querySelector('[data-component="intro-splash"]')
            const style = overlay ? window.getComputedStyle(overlay) : null
            const bodyStyle = document.body ? window.getComputedStyle(document.body) : null
            const visible = Boolean(
              style &&
              style.display === 'flex' &&
              style.visibility !== 'hidden' &&
              Number(style.opacity) > 0.01,
            )
            const entry = {
              tMs,
              paintsCount,
              hasDecision: Boolean(window.__aljaziraIntroDecision),
              htmlIntro: document.documentElement?.dataset?.intro ?? null,
              bodyVisibility: bodyStyle ? bodyStyle.visibility : null,
              visible,
            }
            const last = window.__aljaziraVideoFrames[window.__aljaziraVideoFrames.length - 1]
            if (last && last.tMs === tMs) {
              window.__aljaziraVideoFrames[window.__aljaziraVideoFrames.length - 1] = entry
            } else {
              window.__aljaziraVideoFrames.push(entry)
              if (tMs < 2600) {
                scheduleNextFrame()
              }
            }
          }

          const scheduleNextFrame = () => {
            origRaf((rafTs) => {
              sample(rafTs)
            })
          }

          scheduleNextFrame()

          window.requestAnimationFrame = function (cb) {
            attachAttrObserver()
            const id = origRaf(cb)
            origRaf((rafTs) => {
              sample(rafTs)
            })
            return id
          }
        })
        const videoPage = await videoCtx.newPage()
        if (vSpec.mode === 'mid-tier') {
          const cdp = await videoCtx.newCDPSession(videoPage)
          await cdp.send('Network.enable')
          await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 40,
            downloadThroughput: Math.floor((9 * 1024 * 1024) / 8),
            uploadThroughput: Math.floor((3 * 1024 * 1024) / 8),
          })
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 })
        }

        await videoPage.goto(`${baseUrl}/${loc}`, { waitUntil: 'domcontentloaded' })
        await videoPage.waitForTimeout(2200)

        const videoTrace = await videoPage.evaluate(() => {
          const paints = performance.getEntriesByType('paint')
          const fp = paints.find((p) => p.name === 'first-paint')
          const fcp = paints.find((p) => p.name === 'first-contentful-paint')
          const fpMs = fp ? Math.round(fp.startTime) : null
          const fcpMs = fcp ? Math.round(fcp.startTime) : null
          const frames = window.__aljaziraVideoFrames || []
          const firstVisIdx = frames.findIndex((f) => f.visible)
          const framesBeforeOverlay =
            firstVisIdx >= 0
              ? frames
                  .slice(0, firstVisIdx)
                  .filter((f) => f.paintsCount > 0 || (fpMs !== null && f.tMs >= fpMs)).length
              : frames.length
          const firstPaintedFrame =
            frames.find((f) => f.paintsCount > 0) || frames[firstVisIdx] || frames[0]
          const firstFrameVisible = Boolean(
            firstVisIdx >= 0 &&
            frames[firstVisIdx].paintsCount === 0 &&
            (fpMs === null || frames[firstVisIdx].tMs <= fpMs) &&
            firstPaintedFrame?.visible,
          )
          return {
            fpMs,
            fcpMs,
            decision: window.__aljaziraIntroDecision ?? null,
            framesBeforeOverlay,
            preDclUnpaintedRafCount: firstVisIdx > 0 ? firstVisIdx : 0,
            firstFrameVisible,
            first10Frames: frames.slice(0, 10),
          }
        })

        const recordedVideo = videoPage.video()
        await videoPage.close()
        await videoCtx.close()
        const outName = `${vSpec.namePrefix}-${loc}.webm`
        const outPath = path.join(reportsPhase3Dir, outName)
        if (recordedVideo) {
          const srcPath = await recordedVideo.path()
          fs.copyFileSync(srcPath, outPath)
        }
        fs.rmSync(videoTmpDir, { recursive: true, force: true })

        recordedVideos[outName] = {
          mode: vSpec.mode,
          viewport: `${vvp.width}x${vvp.height}`,
          locale: loc,
          ...videoTrace,
        }

        if (videoTrace.framesBeforeOverlay !== 0 || !videoTrace.firstFrameVisible) {
          throw new Error(
            `R-31 violation in video recording ${outName}: ${JSON.stringify(recordedVideos[outName])}`,
          )
        }
      }
    }

    // =========================================================================
    // 5. Full 54-Run Matrix (`412 / 768 / 1440` × `unthrottled / mid-tier / throttled` × `en / ar` × 3 runs)
    // =========================================================================
    const throttleModes = ['unthrottled', 'mid-tier', 'throttled']
    const rafMatrixRuns = []

    for (const vvp of matrixViewports) {
      for (const throttleMode of throttleModes) {
        for (const loc of ['en', 'ar']) {
          for (let runIndex = 1; runIndex <= 3; runIndex += 1) {
            const runCtx = await browser.newContext({
              viewport: { width: vvp.width, height: vvp.height },
              isMobile: vvp.isMobile,
              hasTouch: vvp.hasTouch,
              deviceScaleFactor: vvp.deviceScaleFactor,
            })
            await runCtx.addInitScript(() => {
              window.__aljaziraRafAll = []
              window.__aljaziraDataIntroHistory = []
              window.__aljaziraCspViolations = []
              window.__aljaziraPageRafCalls = 0
              const origRaf = window.requestAnimationFrame.bind(window)

              window.addEventListener('securitypolicyviolation', (ev) => {
                window.__aljaziraCspViolations.push({
                  violatedDirective: ev.violatedDirective,
                  effectiveDirective: ev.effectiveDirective,
                  blockedURI: ev.blockedURI,
                })
              })

              const attachAttrObserver = () => {
                if (!document.documentElement || window.__aljaziraAttrObsAttached) return
                window.__aljaziraAttrObsAttached = true
                const initial = document.documentElement.getAttribute('data-intro')
                if (initial !== null) {
                  window.__aljaziraDataIntroHistory.push(initial)
                }
                const obs = new MutationObserver(() => {
                  const val = document.documentElement.getAttribute('data-intro')
                  window.__aljaziraDataIntroHistory.push(val)
                })
                obs.observe(document.documentElement, {
                  attributes: true,
                  attributeFilter: ['data-intro'],
                })
              }

              const sample = (rafTs) => {
                attachAttrObserver()
                const tMs = Math.round(
                  typeof rafTs === 'number' && rafTs > 0 ? rafTs : performance.now(),
                )
                const perfNowMs = Math.round(performance.now())
                const paints = performance.getEntriesByType('paint')
                const paintsCount = paints.length
                const htmlIntro = document.documentElement?.dataset?.intro ?? null
                const bodyStyle = document.body ? window.getComputedStyle(document.body) : null
                const bodyVisibility = bodyStyle ? bodyStyle.visibility : null
                const overlay = document.querySelector('[data-component="intro-splash"]')
                const logo = document.querySelector(
                  '[data-component="intro-splash"] [class*="logoWrap"]',
                )
                const style = overlay ? window.getComputedStyle(overlay) : null
                const logoStyle = logo ? window.getComputedStyle(logo) : null
                const display = style ? style.display : 'none'
                const visibility = style ? style.visibility : 'hidden'
                const overlayOpacity = style ? Number(Number(style.opacity).toFixed(3)) : 0
                const logoOpacity = logoStyle ? Number(Number(logoStyle.opacity).toFixed(3)) : 0
                const overlayVisible =
                  display === 'flex' && visibility !== 'hidden' && overlayOpacity > 0.01
                const entry = {
                  tMs,
                  perfNowMs,
                  paintsCount,
                  hasDecision: Boolean(window.__aljaziraIntroDecision),
                  htmlIntro,
                  bodyVisibility,
                  display,
                  visibility,
                  overlayOpacity,
                  logoOpacity,
                  overlayVisible,
                }
                const last = window.__aljaziraRafAll[window.__aljaziraRafAll.length - 1]
                if (last && last.tMs === tMs) {
                  window.__aljaziraRafAll[window.__aljaziraRafAll.length - 1] = entry
                } else {
                  window.__aljaziraRafAll.push(entry)
                  if (htmlIntro !== 'seen' && tMs < 3500) {
                    scheduleNextFrame()
                  }
                }
              }

              const scheduleNextFrame = () => {
                origRaf((rafTs) => {
                  sample(rafTs)
                })
              }

              scheduleNextFrame()

              window.requestAnimationFrame = function (cb) {
                attachAttrObserver()
                window.__aljaziraPageRafCalls += 1
                const id = origRaf(cb)
                origRaf((rafTs) => {
                  sample(rafTs)
                })
                return id
              }
            })

            const runPage = await runCtx.newPage()
            const pageErrors = []
            const consoleErrors = []
            runPage.on('pageerror', (err) => pageErrors.push(String(err)))
            runPage.on('console', (msg) => {
              if (msg.type() === 'error') {
                consoleErrors.push(msg.text())
              }
            })
            if (throttleMode === 'mid-tier') {
              const cdp = await runCtx.newCDPSession(runPage)
              await cdp.send('Network.enable')
              await cdp.send('Network.emulateNetworkConditions', {
                offline: false,
                latency: 40,
                downloadThroughput: Math.floor((9 * 1024 * 1024) / 8),
                uploadThroughput: Math.floor((3 * 1024 * 1024) / 8),
              })
              await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 })
            } else if (throttleMode === 'throttled') {
              const cdp = await runCtx.newCDPSession(runPage)
              await cdp.send('Network.enable')
              await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
              await cdp.send('Network.emulateNetworkConditions', {
                offline: false,
                latency: 150,
                downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8),
                uploadThroughput: Math.floor((750 * 1024) / 8),
              })
              await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
            }

            await runPage.goto(`${baseUrl}/${loc}`, { waitUntil: 'domcontentloaded' })
            await runPage.waitForTimeout(2600)

            const runSummary = await runPage.evaluate(() => {
              const frames = window.__aljaziraRafAll || []
              const decision = window.__aljaziraIntroDecision || null
              const paints = performance.getEntriesByType('paint')
              const fpEntry = paints.find((p) => p.name === 'first-paint')
              const fcpEntry = paints.find((p) => p.name === 'first-contentful-paint')
              const fpMs = fpEntry ? Math.round(fpEntry.startTime) : null
              const fcpMs = fcpEntry ? Math.round(fcpEntry.startTime) : null

              const visibleFrames = frames.filter((f) => f.overlayVisible)
              const firstVisibleIdx = frames.findIndex((f) => f.overlayVisible)
              const firstVisible = firstVisibleIdx >= 0 ? frames[firstVisibleIdx] : null
              const lastVisible = visibleFrames[visibleFrames.length - 1] || null
              const hiddenFrame = firstVisible
                ? frames.find((f) => f.tMs > firstVisible.tMs && !f.overlayVisible) || null
                : null
              const logoFullFrames = visibleFrames.filter(
                (f) => f.logoOpacity >= 0.99 && f.overlayOpacity >= 0.99,
              )
              const logoFirstFull = logoFullFrames[0] || null
              const logoLastFull = logoFullFrames[logoFullFrames.length - 1] || null

              const skipped = decision?.action !== 'active'
              const framesBeforeOverlay = !skipped
                ? firstVisibleIdx >= 0
                  ? frames
                      .slice(0, firstVisibleIdx)
                      .filter((f) => f.paintsCount > 0 || (fpMs !== null && f.tMs >= fpMs)).length
                  : frames.length
                : 0
              const preDclUnpaintedRafCount = !skipped && firstVisibleIdx > 0 ? firstVisibleIdx : 0
              const firstPaintedFrame = frames.find((f) => f.paintsCount > 0) || null
              const firstPaintedFrameHasOverlay = !skipped
                ? Boolean(
                    firstVisible &&
                    firstVisible.paintsCount === 0 &&
                    (fpMs === null || firstVisible.tMs <= fpMs) &&
                    (!firstPaintedFrame || firstPaintedFrame.overlayVisible),
                  )
                : false

              const decisionMs = decision?.rafMs ?? decision?.nowMs ?? null
              const firstFrameRafMs = frames[0]?.tMs ?? null
              const fpMinusDecisionMs =
                fpMs !== null && decisionMs !== null ? fpMs - decisionMs : null
              // M-171 #1 (B-01): Real count of rAF frames whose timestamp is strictly between decision and FP
              const rafFramesBetweenDecisionAndFp =
                fpMs !== null && decisionMs !== null
                  ? frames.filter(
                      (f) =>
                        f.tMs > Math.min(decisionMs, fpMs) && f.tMs < Math.max(decisionMs, fpMs),
                    ).length
                  : null
              const dataIntroHistory = window.__aljaziraDataIntroHistory || []
              const cspViolations = window.__aljaziraCspViolations || []
              const anyBodyHiddenFrame = frames.some((f) => f.bodyVisibility === 'hidden')
              const decisionVsFpDisagreement =
                decisionMs !== null && fpMs !== null ? decisionMs <= 1200 !== fpMs <= 1200 : false

              let logoRestartCount = 0
              if (logoFirstFull) {
                for (const f of visibleFrames) {
                  if (f.tMs > logoFirstFull.tMs && f.logoOpacity < 0.95) {
                    logoRestartCount += 1
                  }
                }
              }

              let overlayBounceCount = 0
              let fadeStarted = false
              let minOverlayOpacityDuringFade = 1
              if (firstVisible) {
                for (const f of frames) {
                  if (f.tMs < firstVisible.tMs) continue
                  const effOpacity = f.overlayVisible ? f.overlayOpacity : 0
                  if (effOpacity < 0.95) {
                    fadeStarted = true
                  }
                  if (fadeStarted) {
                    if (effOpacity > minOverlayOpacityDuringFade + 0.02) {
                      overlayBounceCount += 1
                    }
                    if (effOpacity < minOverlayOpacityDuringFade) {
                      minOverlayOpacityDuringFade = effOpacity
                    }
                  }
                }
              }

              const overlayNow = document.querySelector('[data-component="intro-splash"]')
              const styleNow = overlayNow ? window.getComputedStyle(overlayNow) : null
              const finalOverlayVisible = Boolean(
                styleNow &&
                styleNow.display !== 'none' &&
                styleNow.visibility !== 'hidden' &&
                Number(styleNow.opacity) > 0.01,
              )
              const finalInertCount = document.querySelectorAll('[inert]').length

              return {
                fpMs,
                fcpMs,
                firstFrameRafMs,
                decisionMs,
                fpMinusDecisionMs,
                rafFramesBetweenDecisionAndFp,
                decisionVsFpDisagreement,
                dataIntroHistory,
                anyBodyHiddenFrame,
                cspViolationsCount: cspViolations.length,
                skipped,
                decision,
                framesBeforeOverlay,
                preDclUnpaintedRafCount,
                firstPaintedFrameHasOverlay,
                firstVisibleMs: firstVisible ? firstVisible.tMs : null,
                logoFullyVisibleStartMs: logoFirstFull ? logoFirstFull.tMs : null,
                logoFullyVisibleEndMs: logoLastFull ? logoLastFull.tMs : null,
                logoFullyVisibleDurationMs:
                  logoFirstFull && logoLastFull ? logoLastFull.tMs - logoFirstFull.tMs : 0,
                lastVisibleMs: lastVisible ? lastVisible.tMs : null,
                hiddenMs: hiddenFrame ? hiddenFrame.tMs : null,
                durationFromFirstVisibleMs:
                  firstVisible && hiddenFrame ? hiddenFrame.tMs - firstVisible.tMs : null,
                visibleFrameCount: visibleFrames.length,
                totalRafFrames: frames.length,
                logoRestartCount,
                overlayBounceCount,
                finalHtmlDataIntro: document.documentElement.dataset.intro ?? null,
                finalOverlayVisible,
                finalInertCount,
              }
            })

            await runCtx.close()
            rafMatrixRuns.push({
              viewport: `${vvp.width}x${vvp.height}`,
              width: vvp.width,
              mode: throttleMode,
              locale: loc,
              run: runIndex,
              pageErrorsCount: pageErrors.length,
              consoleErrorsCount: consoleErrors.length,
              ...runSummary,
            })
          }
        }
      }
    }

    const exceedingOneFrameRuns = rafMatrixRuns.filter(
      (r) => r.rafFramesBetweenDecisionAndFp === null || r.rafFramesBetweenDecisionAndFp > 1,
    )
    const decisionVsFpDisagreements = rafMatrixRuns.filter((r) => r.decisionVsFpDisagreement)

    const rafTableLines = [
      '| # | Viewport | Mode | Locale | Run | FP (ms) | FCP (ms) | Decision rAF (ms) | Δ(FP−rAF) / Intermediate Frames | Skipped | Frames Before Overlay | First Visible (ms) | Logo-Visible Start..End (`duration` ms) | Hidden (ms) | Span (ms) | Frames (`vis / total`) | Restarts / Bounces |',
      '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      ...rafMatrixRuns.map(
        (r, i) =>
          `| ${i + 1} | \`${r.viewport}\` | \`${r.mode}\` | \`${r.locale}\` | ${r.run} | \`${r.fpMs ?? 'n/a'}\` | \`${r.fcpMs ?? 'n/a'}\` | \`${r.decisionMs ?? 'n/a'}\` | \`${r.fpMinusDecisionMs !== null ? (r.fpMinusDecisionMs >= 0 ? '+' : '') + r.fpMinusDecisionMs + 'ms' : 'n/a'}\` (\`${r.rafFramesBetweenDecisionAndFp ?? 'n/a'}\` frames) | \`${r.skipped}\` | \`${r.framesBeforeOverlay}\` | \`${r.firstVisibleMs ?? 'skipped'}\` | \`${r.logoFullyVisibleStartMs ?? 'n/a'}..${r.logoFullyVisibleEndMs ?? 'n/a'}\` (\`${r.logoFullyVisibleDurationMs}ms\`) | \`${r.hiddenMs ?? 'skipped'}\` | \`${r.durationFromFirstVisibleMs ?? 0}ms\` | \`${r.visibleFrameCount} / ${r.totalRafFrames}\` | \`${r.logoRestartCount} / ${r.overlayBounceCount}\` |`,
      ),
    ]

    // Evaluate all strict P3-T13 gates before writing intro-verification.log (M-171 #4, B-08)
    const gateFailures = []
    for (const r of rafMatrixRuns) {
      if (!r.decision || r.decisionMs === null || r.fpMs === null || r.fcpMs === null) {
        gateFailures.push(`Missing decision or FP/FCP in run: ${JSON.stringify(r)}`)
        continue
      }
      if (r.dataIntroHistory.includes('pending') || r.anyBodyHiddenFrame) {
        gateFailures.push(
          `R-26 / M-171 #2 violation: data-intro='pending' or hidden body detected in run: ${JSON.stringify(r)}`,
        )
      }
      if (r.pageErrorsCount > 0 || r.cspViolationsCount > 0) {
        gateFailures.push(`Runtime pageerror/CSP violation during intro run: ${JSON.stringify(r)}`)
      }
      if (r.decisionMs <= 1200) {
        if (
          r.skipped ||
          r.decision.action !== 'active' ||
          r.framesBeforeOverlay !== 0 ||
          !r.firstPaintedFrameHasOverlay ||
          r.firstVisibleMs === null ||
          r.firstVisibleMs !== r.decisionMs ||
          r.hiddenMs === null ||
          r.hiddenMs > 2500 ||
          r.durationFromFirstVisibleMs === null ||
          r.durationFromFirstVisibleMs > 1600 ||
          r.logoFullyVisibleDurationMs < 300 ||
          r.visibleFrameCount < 5 ||
          r.logoRestartCount !== 0 ||
          r.overlayBounceCount !== 0 ||
          r.finalOverlayVisible ||
          r.finalInertCount !== 0
        ) {
          gateFailures.push(`Active intro run failed assertions: ${JSON.stringify(r)}`)
        }
      } else {
        if (
          !r.skipped ||
          r.decision.action !== 'skipped_late_first_paint' ||
          r.visibleFrameCount !== 0 ||
          r.finalOverlayVisible
        ) {
          gateFailures.push(`Skipped intro run failed assertions: ${JSON.stringify(r)}`)
        }
      }
      // Mid-tier en and ar play the intro whenever FP <= 1200
      if (r.mode === 'mid-tier' && r.fpMs <= 1200 && r.skipped) {
        gateFailures.push(
          `R-32 violation: mid-tier ${r.locale} at ${r.viewport} had FP=${r.fpMs}ms <= 1200ms but skipped: ${JSON.stringify(r)}`,
        )
      }
    }

    const midTierActiveEn = rafMatrixRuns.filter(
      (r) => r.mode === 'mid-tier' && r.locale === 'en' && !r.skipped,
    ).length
    const midTierActiveAr = rafMatrixRuns.filter(
      (r) => r.mode === 'mid-tier' && r.locale === 'ar' && !r.skipped,
    ).length
    if (midTierActiveEn === 0 || midTierActiveAr === 0) {
      gateFailures.push(
        `Expected mid-tier en and ar to play the intro (got active en=${midTierActiveEn}, ar=${midTierActiveAr})`,
      )
    }

    const fpDeltaGatePassed = exceedingOneFrameRuns.length === 0
    const strictGatesPassed = gateFailures.length === 0

    const introAudit = {
      gates: {
        strictGatesPassed,
        fpDeltaWithinOneFramePassed: fpDeltaGatePassed,
        exceedingOneFrameCount: exceedingOneFrameRuns.length,
        exceedingOneFrameRuns: exceedingOneFrameRuns.map((r) => ({
          viewport: r.viewport,
          mode: r.mode,
          locale: r.locale,
          run: r.run,
          decisionMs: r.decisionMs,
          fpMs: r.fpMs,
          fpMinusDecisionMs: r.fpMinusDecisionMs,
          rafFramesBetweenDecisionAndFp: r.rafFramesBetweenDecisionAndFp,
        })),
        decisionVsFpDisagreementsCount: decisionVsFpDisagreements.length,
        decisionVsFpDisagreements: decisionVsFpDisagreements.map((r) => ({
          viewport: r.viewport,
          mode: r.mode,
          locale: r.locale,
          run: r.run,
          decisionMs: r.decisionMs,
          fpMs: r.fpMs,
          skipped: r.skipped,
        })),
        gateFailures,
      },
      r34Verification,
      recordedVideos,
      rafMatrixRuns,
    }

    const introGateLines = [
      `GATE R-26 (0 runs with data-intro='pending' or hidden body): ${rafMatrixRuns.every((r) => !r.dataIntroHistory.includes('pending') && !r.anyBodyHiddenFrame) ? 'PASS' : 'FAIL'}`,
      `GATE R-31 (0 frames painted before overlay; firstVisibleMs === decisionMs): ${rafMatrixRuns.filter((r) => !r.skipped).every((r) => r.framesBeforeOverlay === 0 && r.firstVisibleMs === r.decisionMs) ? 'PASS' : 'FAIL'}`,
      `GATE R-32-TIMELINE (<=1600ms span, >=300ms logo hold, <=2500ms hidden, mid-tier en/ar active when FP<=1200): ${strictGatesPassed ? 'PASS' : `FAIL (${gateFailures.join(' | ')})`}`,
      `GATE R-32-FP-DELTA (rafFramesBetweenDecisionAndFp <= 1 across all 54 runs): ${fpDeltaGatePassed ? 'PASS (54/54 runs <= 1 frame)' : `FAIL (${exceedingOneFrameRuns.length}/54 runs had >1 rAF frames between decision rAF and Chromium FP presentation timestamp — reported in Questions for CTO per M-171 #1)`}`,
      `GATE R-34 (only home page with overlay writes aljazira_intro_seen): PASS`,
      `GATE: ${strictGatesPassed && fpDeltaGatePassed ? 'PASS' : strictGatesPassed ? `FAIL (R-32-FP-DELTA: ${exceedingOneFrameRuns.length}/54 runs > 1 frame between decision rAF and FP; all other gates PASS)` : `FAIL (${gateFailures.join(' | ')})`}`,
    ]

    const introLog = [
      headerBlock,
      '=== P3-T13 Intro Splash First-Frame Decision Verification (R-31..R-34, 54-Run Matrix: 412/768/1440 × unthrottled/mid-tier/throttled × en/ar × 3 runs) ===',
      ...rafTableLines,
      '',
      JSON.stringify(introAudit, null, 2),
      ...introGateLines,
      '',
    ].join('\n')
    fs.writeFileSync(path.join(reportsEvidenceDir, 'intro-verification.log'), introLog, 'utf8')

    if (!strictGatesPassed) {
      throw new Error(`P3-T13 intro verification failed: ${gateFailures.join(' | ')}`)
    }
    if (!fpDeltaGatePassed) {
      console.warn(
        `[P3-T13 Evidence] Note (M-171 #1): ${exceedingOneFrameRuns.length}/54 runs had >1 rAF frames between decision rAF and Chromium FP presentation timestamp; recorded in ${path.join(reportsEvidenceDir, 'intro-verification.log')} for Questions for CTO.`,
      )
    }

    // =========================================================================
    // 6. R-35 & M-169: Single-Attempt Cold + Warm Google Lighthouse Mobile Audits on `/ar` and `/en`
    // =========================================================================
    const nextImagesCacheDir = path.resolve(process.cwd(), '.next/cache/images')
    for (const loc of ['ar', 'en']) {
      // 6a. Cold run (no /_next/image pre-warm; clear .next/cache/images first so first-transform cost is measured)
      try {
        fs.rmSync(nextImagesCacheDir, { recursive: true, force: true })
      } catch {
        // ignore if absent
      }
      const coldLogPath = path.join(reportsEvidenceDir, `lighthouse-mobile-${loc}-cold.log`)
      const coldJsonPath = path.join(reportsEvidenceDir, `lighthouse-mobile-${loc}-cold.json`)
      console.log(
        `[P3-T13 Evidence] Running COLD Google Lighthouse mobile audit (warmImages=false) on ${baseUrl}/${loc}...`,
      )
      try {
        await runLighthouseAudit({
          url: `${baseUrl}/${loc}`,
          locale: loc,
          headerBlock,
          outLogPath: coldLogPath,
          outJsonPath: coldJsonPath,
          warmImages: false,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (
          msg.includes('Lighthouse mobile gate failed') &&
          !msg.includes('"accessibility":') // check parsed JSON below
        ) {
          throw err
        }
        const coldSummary = JSON.parse(fs.readFileSync(coldJsonPath, 'utf8'))
        const coldAcc = Math.round((coldSummary.categories?.accessibility?.score ?? 0) * 100)
        const coldBp = Math.round((coldSummary.categories?.['best-practices']?.score ?? 0) * 100)
        const coldSeo = Math.round((coldSummary.categories?.seo?.score ?? 0) * 100)
        const coldCls = Number(
          (coldSummary.audits?.['cumulative-layout-shift']?.numericValue ?? 1).toFixed(5),
        )
        if (coldAcc < 95 || coldBp < 95 || coldSeo < 95 || coldCls > 0.05) {
          throw err
        }
        console.warn(
          `[P3-T13 Evidence] Note (M-169 #1): Cold Lighthouse mobile performance on /${loc} < 80 logged in ${coldLogPath} for CTO review: ${msg}`,
        )
      }

      // 6b. Warm run (warmImages=true: pre-warms up to 8 /_next/image URLs)
      const warmLogPath = path.join(reportsEvidenceDir, `lighthouse-mobile-${loc}.log`)
      const warmJsonPath = path.join(reportsEvidenceDir, `lighthouse-mobile-${loc}.json`)
      console.log(
        `[P3-T13 Evidence] Running WARM Google Lighthouse mobile audit (warmImages=true) on ${baseUrl}/${loc}...`,
      )
      try {
        await runLighthouseAudit({
          url: `${baseUrl}/${loc}`,
          locale: loc,
          headerBlock,
          outLogPath: warmLogPath,
          outJsonPath: warmJsonPath,
          warmImages: true,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const warmSummary = JSON.parse(fs.readFileSync(warmJsonPath, 'utf8'))
        const warmAcc = Math.round((warmSummary.categories?.accessibility?.score ?? 0) * 100)
        const warmBp = Math.round((warmSummary.categories?.['best-practices']?.score ?? 0) * 100)
        const warmSeo = Math.round((warmSummary.categories?.seo?.score ?? 0) * 100)
        const warmCls = Number(
          (warmSummary.audits?.['cumulative-layout-shift']?.numericValue ?? 1).toFixed(5),
        )
        if (warmAcc < 95 || warmBp < 95 || warmSeo < 95 || warmCls > 0.05) {
          throw err
        }
        console.warn(
          `[P3-T13 Evidence] Note (M-169 #1): Warm Lighthouse mobile performance on /${loc} < 80 logged in ${warmLogPath} for CTO review: ${msg}`,
        )
      }
    }
  } finally {
    await browser.close()
  }

  console.log(
    `[P3-T13 Evidence] All P3-T13 r1 evidence generated in ${reportsEvidenceDir} (logs) and ${reportsPhase3Dir} (images/videos)`,
  )
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/evidence/p3-t13-evidence.mjs')
) {
  const rawArgs = process.argv.slice(2)
  const modeArg = rawArgs.find((a) => a.startsWith('--mode='))
  const mode = modeArg ? modeArg.slice('--mode='.length) : process.env.EVIDENCE_MODE || 'all'
  const skipBrands = rawArgs.includes('--skip-brands')
  const posArgs = rawArgs.filter((a) => !a.startsWith('--'))

  const baseUrl = posArgs[0] || process.env.EVIDENCE_BASE_URL || 'http://localhost:3000'
  const reportsEvidenceDir =
    posArgs[1] || path.resolve(process.cwd(), 'docs/reports/evidence/P3-T13/r1')
  const reportsPhase3Dir =
    posArgs[2] || path.resolve(process.cwd(), 'docs/reports/phase-3/P3-T13/r1')

  runP3T13Evidence({
    baseUrl,
    reportsEvidenceDir,
    reportsPhase3Dir,
    mode,
    skipBrands,
  }).catch((err) => {
    console.error('[P3-T13 Evidence] ERROR:', err)
    process.exit(1)
  })
}
