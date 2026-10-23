import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Self-contained machine-captured evidence generator for `P3-T1` (`R-1`, `R-2`, `R-7`, `M-107`,
 * `handoff/README.md` §"Machine-captured evidence").
 *
 * Usage:
 *   node scripts/evidence/p3-t1-evidence.mjs [baseUrl] [outDir]
 *
 * Example:
 *   node scripts/evidence/p3-t1-evidence.mjs http://localhost:3000 docs/reports/evidence/P3-T1/r2
 *
 * Captures:
 * 1. `curl-headers.log` & `http-checks.json`:
 *    - `GET /` -> `308 Permanent Redirect` to `/ar` + `Content-Security-Policy`
 *    - `GET /ar` -> `200` + `H3` + `H3a` CSP (`'wasm-unsafe-eval'`, `worker-src 'self' blob:`) + `<html lang="ar" dir="rtl">`
 *    - `GET /en` -> `200` + `H3` + `H3a` CSP + `<html lang="en" dir="ltr">`
 *    - `GET /ar/projects` -> `H3` CSP WITHOUT `'wasm-unsafe-eval'` or `worker-src` + `<html lang="ar" dir="rtl">`
 *    - `GET /admin/login` -> `/admin` relaxed CSP + `Set-Cookie: payload-lng=ar`
 *    - `GET /fr` -> `404` + `<html lang="ar" dir="rtl">` (`R-7`)
 *    - `GET /en/this-page-does-not-exist` -> `404` + `<html lang="en" dir="ltr">` + localized `<title>Page Not Found` (`R-7`)
 *    - `GET /api/preview` (`401` wrong secret, `400` open-redirect `//evil.example.com`, `403` anonymous caller with valid secret)
 *    - `GET /api/preview/exit?returnTo=/ar` (`307` + cleared `__prerender_bypass` cookie)
 * 2. `console-csp-network.json`, `console-csp.log`, & `fonts-network-proof.log`:
 *    - Playwright headless Chromium visits `/ar` and `/en` (and `/ar/_specimen` + `/en/_specimen` when HTTP 200 in dev)
 *    - Collects `console`, `pageerror`, `securitypolicyviolation` DOM events, and all network requests
 *    - Verifies `0` console errors, `0` uncaught page errors, `0` CSP violations, `0` requests to `fonts.googleapis.com` / `fonts.gstatic.com`, and locale-specific `.woff2` font loading (`R-11`)
 * 3. Visual screenshots (`home-ar.png`, `home-en.png`, and `specimen-ar.png` / `specimen-en.png` when `/_specimen` returns 200):
 *    - Strictly visual `page.screenshot({ fullPage: true })` with zero injected DOM nodes or text overlays (`R-1`).
 */

function resolvePreviewSecret() {
  let payloadSecret = process.env.PAYLOAD_SECRET ? process.env.PAYLOAD_SECRET.trim() : ''
  if (!payloadSecret) {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const match = envContent.match(/^PAYLOAD_SECRET=(.+)$/m)
      if (match && match[1]) {
        payloadSecret = match[1].trim().replace(/^['"]|['"]$/g, '')
      }
    }
  }
  if (!payloadSecret) {
    payloadSecret = 'dev-only-secret-change-me-in-production-32chars'
  }
  return crypto
    .createHmac('sha256', payloadSecret)
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}

function getRepoHeaderBlock() {
  const cwd = process.cwd()
  let head = 'unknown'
  try {
    head = execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim()
  } catch {
    // ignore
  }
  return [`$ pwd`, cwd, `$ git rev-parse HEAD`, head, ''].join('\n')
}

/**
 * Stitches `specimen-ar.png` and `specimen-en.png` side-by-side into `specimen-comparison.png`
 * with zero text overlays (`handoff/README.md:180`).
 *
 * @param {string} outDir
 */
async function stitchSpecimenComparison(outDir) {
  const arPath = path.join(outDir, 'specimen-ar.png')
  const enPath = path.join(outDir, 'specimen-en.png')
  const outPath = path.join(outDir, 'specimen-comparison.png')
  if (!fs.existsSync(arPath) || !fs.existsSync(enPath)) {
    return
  }
  const arBuf = fs.readFileSync(arPath)
  const enBuf = fs.readFileSync(enPath)
  const arMeta = await sharp(arBuf).metadata()
  const enMeta = await sharp(enBuf).metadata()
  const arW = arMeta.width ?? 1440
  const arH = arMeta.height ?? 1800
  const enW = enMeta.width ?? 1440
  const enH = enMeta.height ?? 1800
  const gap = 24
  const pad = 24
  const totalW = pad + arW + gap + enW + pad
  const totalH = pad + Math.max(arH, enH) + pad

  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 10, g: 22, b: 40, alpha: 1 },
    },
  })
    .composite([
      { input: arBuf, left: pad, top: pad },
      { input: enBuf, left: pad + arW + gap, top: pad },
    ])
    .png()
    .toFile(outPath)
}

/**
 * @param {string} html
 */
function extractHtmlOpeningTagAndTitle(html) {
  const htmlTagMatch = html.match(/<html[^>]*>/i)
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const preloadMatches = [...html.matchAll(/<link[^>]*rel=["']preload["'][^>]*as=["']font["'][^>]*>/gi)].map(
    (m) => m[0],
  )
  return {
    htmlTag: htmlTagMatch ? htmlTagMatch[0] : null,
    title: titleMatch ? titleMatch[1].trim() : null,
    fontPreloadLinks: preloadMatches,
  }
}

/**
 * @param {string} baseUrl
 * @param {string} reqPath
 */
async function probeEndpoint(baseUrl, reqPath) {
  const url = `${baseUrl}${reqPath}`
  const res = await fetch(url, { redirect: 'manual' })
  const body = await res.text()
  const { htmlTag, title, fontPreloadLinks } = extractHtmlOpeningTagAndTitle(body)
  return {
    path: reqPath,
    url,
    status: res.status,
    statusText: res.statusText,
    headers: {
      location: res.headers.get('location'),
      contentSecurityPolicy: res.headers.get('content-security-policy'),
      setCookie: res.headers.get('set-cookie'),
      contentType: res.headers.get('content-type'),
    },
    htmlTag,
    title,
    fontPreloadLinks,
  }
}

/**
 * @param {import('@playwright/test').Browser} browser
 * @param {string} baseUrl
 * @param {string} routePath
 * @param {string | null} screenshotPath
 */
async function inspectRouteWithPlaywright(browser, baseUrl, routePath, screenshotPath) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  /** @type {Array<{ type: string; text: string; location: string }>} */
  const consoleMessages = []
  /** @type {Array<string>} */
  const pageErrors = []
  /** @type {Array<{ url: string; resourceType: string; method: string }>} */
  const requests = []
  /** @type {Array<{ url: string; status: number; contentType: string | null }>} */
  const fontResponses = []

  await page.addInitScript(() => {
    window.__cspViolations = []
    window.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push({
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
        originalPolicy: e.originalPolicy,
        disposition: e.disposition,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
      })
    })
  })

  page.on('console', (msg) => {
    const loc = msg.location()
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: loc?.url ? `${loc.url}:${String(loc.lineNumber ?? 0)}` : '',
    })
  })

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err))
  })

  page.on('request', (req) => {
    requests.push({
      url: req.url(),
      resourceType: req.resourceType(),
      method: req.method(),
    })
  })

  page.on('response', (res) => {
    const url = res.url()
    const ct = res.headers()['content-type'] ?? null
    if (url.includes('.woff2') || (ct && ct.includes('font'))) {
      fontResponses.push({
        url,
        status: res.status(),
        contentType: ct,
      })
    }
  })

  const navResponse = await page.goto(`${baseUrl}${routePath}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  })

  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
  })

  if (screenshotPath) {
    await page.screenshot({ path: screenshotPath, fullPage: true })
  }

  const domMeta = await page.evaluate(() => {
    const htmlEl = document.documentElement
    const bodyStyle = window.getComputedStyle(document.body)
    return {
      lang: htmlEl.getAttribute('lang'),
      dir: htmlEl.getAttribute('dir'),
      htmlClassName: htmlEl.className,
      title: document.title,
      bodyFontFamily: bodyStyle.fontFamily,
      cspViolations: Array.isArray(window.__cspViolations) ? window.__cspViolations : [],
    }
  })

  await context.close()

  const consoleErrors = consoleMessages.filter((m) => m.type === 'error')
  const hydrationWarnings = consoleMessages.filter((m) =>
    /hydrat|did not match|server-rendered HTML/i.test(m.text),
  )
  const googleFontRequests = requests.filter((r) =>
    /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(r.url),
  )

  return {
    route: routePath,
    status: navResponse ? navResponse.status() : null,
    cspHeader: navResponse ? (navResponse.headers()['content-security-policy'] ?? null) : null,
    dom: {
      lang: domMeta.lang,
      dir: domMeta.dir,
      htmlClassName: domMeta.htmlClassName,
      title: domMeta.title,
      bodyFontFamily: domMeta.bodyFontFamily,
    },
    counts: {
      totalConsoleMessages: consoleMessages.length,
      consoleErrors: consoleErrors.length,
      hydrationWarnings: hydrationWarnings.length,
      pageErrors: pageErrors.length,
      cspViolations: domMeta.cspViolations.length,
      totalRequests: requests.length,
      selfHostedFontResponses: fontResponses.length,
      googleFontRequests: googleFontRequests.length,
    },
    consoleMessages,
    consoleErrors,
    hydrationWarnings,
    pageErrors,
    cspViolations: domMeta.cspViolations,
    fontResponses,
    googleFontRequests,
    requests,
  }
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')))
  const baseUrl = (args[0] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const outDir = path.resolve(process.cwd(), args[1] || 'docs/reports/evidence/P3-T1/r2')
  const specimenOnly = flags.has('--specimen-only')

  fs.mkdirSync(outDir, { recursive: true })
  const headerBlock = getRepoHeaderBlock()
  const previewSecret = resolvePreviewSecret()

  if (!specimenOnly) {
    const endpointsToProbe = [
      '/',
      '/ar',
      '/en',
      '/ar/projects',
      '/ar/_specimen',
      '/admin/login',
      '/fr',
      '/en/this-page-does-not-exist',
      '/api/preview?secret=wrong-secret-00000000&locale=ar&path=/ar',
      `/api/preview?secret=${encodeURIComponent(previewSecret)}&locale=ar&path=//evil.example.com`,
      `/api/preview?secret=${encodeURIComponent(previewSecret)}&locale=ar&path=/ar`,
      '/api/preview/exit?returnTo=/ar',
    ]

    const httpProbes = []
    const curlLines = [headerBlock.trimEnd(), '']

    for (const ep of endpointsToProbe) {
      const probe = await probeEndpoint(baseUrl, ep)
      httpProbes.push(probe)
      curlLines.push(`=== GET ${probe.path} ===`)
      curlLines.push(`HTTPStatus: ${String(probe.status)} ${probe.statusText}`)
      if (probe.headers.location) {
        curlLines.push(`Location: ${probe.headers.location}`)
      }
      if (probe.headers.setCookie) {
        curlLines.push(`Set-Cookie: ${probe.headers.setCookie}`)
      }
      if (probe.headers.contentSecurityPolicy) {
        curlLines.push(`Content-Security-Policy: ${probe.headers.contentSecurityPolicy}`)
      }
      if (probe.htmlTag) {
        curlLines.push(`HTMLTag: ${probe.htmlTag}`)
      }
      if (probe.title) {
        curlLines.push(`Title: ${probe.title}`)
      }
      if (probe.fontPreloadLinks.length > 0) {
        curlLines.push(`FontPreloadCount: ${String(probe.fontPreloadLinks.length)}`)
        for (const preload of probe.fontPreloadLinks) {
          curlLines.push(`  FontPreload: ${preload}`)
        }
      }
      curlLines.push('')
    }

    fs.writeFileSync(path.join(outDir, 'curl-headers.log'), `${curlLines.join('\n')}\n`, 'utf8')
    fs.writeFileSync(
      path.join(outDir, 'http-checks.json'),
      `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), probes: httpProbes }, null, 2)}\n`,
      'utf8',
    )
  }

  const browser = await chromium.launch({ headless: true })
  try {
    if (specimenOnly) {
      const specAr = await inspectRouteWithPlaywright(
        browser,
        baseUrl,
        '/ar/_specimen',
        path.join(outDir, 'specimen-ar.png'),
      )
      const specEn = await inspectRouteWithPlaywright(
        browser,
        baseUrl,
        '/en/_specimen',
        path.join(outDir, 'specimen-en.png'),
      )
      await stitchSpecimenComparison(outDir)
      fs.writeFileSync(
        path.join(outDir, 'specimen-capture.json'),
        `${JSON.stringify({ baseUrl, routes: [specAr, specEn] }, null, 2)}\n`,
        'utf8',
      )
      process.stdout.write(
        `[p3-t1-evidence] Captured dev specimen screenshots (specimen-ar.png status=${String(specAr.status)}, specimen-en.png status=${String(specEn.status)}, specimen-comparison.png)\n`,
      )
      return
    }

    const arReport = await inspectRouteWithPlaywright(
      browser,
      baseUrl,
      '/ar',
      path.join(outDir, 'home-ar.png'),
    )
    const enReport = await inspectRouteWithPlaywright(
      browser,
      baseUrl,
      '/en',
      path.join(outDir, 'home-en.png'),
    )

    // If `/ar/_specimen` is reachable (e.g. dev server), also capture specimen screenshots
    const specimenProbe = await fetch(`${baseUrl}/ar/_specimen`, { redirect: 'manual' })
    let specimenReports = []
    if (specimenProbe.status === 200) {
      const specAr = await inspectRouteWithPlaywright(
        browser,
        baseUrl,
        '/ar/_specimen',
        path.join(outDir, 'specimen-ar.png'),
      )
      const specEn = await inspectRouteWithPlaywright(
        browser,
        baseUrl,
        '/en/_specimen',
        path.join(outDir, 'specimen-en.png'),
      )
      await stitchSpecimenComparison(outDir)
      specimenReports = [specAr, specEn]
    }

    const summaryPayload = {
      baseUrl,
      generatedAt: new Date().toISOString(),
      routes: [arReport, enReport, ...specimenReports],
    }

    fs.writeFileSync(
      path.join(outDir, 'console-csp-network.json'),
      `${JSON.stringify(summaryPayload, null, 2)}\n`,
      'utf8',
    )

    const consoleLogLines = [
      headerBlock.trimEnd(),
      `BaseURL: ${baseUrl}`,
      '',
    ]
    const fontLogLines = [
      headerBlock.trimEnd(),
      `BaseURL: ${baseUrl}`,
      '',
    ]

    for (const r of [arReport, enReport]) {
      consoleLogLines.push(`=== Route ${r.route} (HTTP ${String(r.status)}) ===`)
      consoleLogLines.push(`DOM: <html lang="${String(r.dom.lang)}" dir="${String(r.dom.dir)}">`)
      consoleLogLines.push(`CSP: ${String(r.cspHeader)}`)
      consoleLogLines.push(`ConsoleErrors: ${String(r.counts.consoleErrors)}`)
      consoleLogLines.push(`HydrationWarnings: ${String(r.counts.hydrationWarnings)}`)
      consoleLogLines.push(`PageErrors: ${String(r.counts.pageErrors)}`)
      consoleLogLines.push(`CSPViolations: ${String(r.counts.cspViolations)}`)
      consoleLogLines.push(`ConsoleMessages (${String(r.consoleMessages.length)}):`)
      if (r.consoleMessages.length === 0) {
        consoleLogLines.push('  (none)')
      } else {
        for (const m of r.consoleMessages) {
          consoleLogLines.push(`  [${m.type}] ${m.text} (${m.location})`)
        }
      }
      consoleLogLines.push('')

      fontLogLines.push(`=== Route ${r.route} ===`)
      fontLogLines.push(`ComputedBodyFontFamily: ${r.dom.bodyFontFamily}`)
      fontLogLines.push(`SelfHostedFontResponses (${String(r.fontResponses.length)}):`)
      for (const f of r.fontResponses) {
        fontLogLines.push(`  [${String(f.status)}] ${f.url} (${String(f.contentType)})`)
      }
      fontLogLines.push(
        `GoogleFontExternalRequests (fonts.googleapis.com / fonts.gstatic.com): ${String(r.counts.googleFontRequests)}`,
      )
      fontLogLines.push('')
    }

    fs.writeFileSync(
      path.join(outDir, 'console-csp.log'),
      `${consoleLogLines.join('\n')}\n`,
      'utf8',
    )
    fs.writeFileSync(
      path.join(outDir, 'fonts-network-proof.log'),
      `${fontLogLines.join('\n')}\n`,
      'utf8',
    )

    // Assertions: fail non-zero if any console error, pageerror, CSP violation, or Google font request occurred
    for (const r of [arReport, enReport]) {
      if (r.counts.consoleErrors > 0 || r.counts.pageErrors > 0 || r.counts.cspViolations > 0) {
        throw new Error(
          `Route ${r.route} had errors: consoleErrors=${String(r.counts.consoleErrors)}, pageErrors=${String(r.counts.pageErrors)}, cspViolations=${String(r.counts.cspViolations)}`,
        )
      }
      if (r.counts.googleFontRequests > 0) {
        throw new Error(
          `Route ${r.route} made ${String(r.counts.googleFontRequests)} external requests to Google Fonts`,
        )
      }
    }

    process.stdout.write(
      `[p3-t1-evidence] Completed machine-captured evidence in ${outDir} (0 console errors, 0 page errors, 0 CSP violations, 0 external font requests).\n`,
    )
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  process.stderr.write(
    `[p3-t1-evidence] ERROR: ${err instanceof Error ? err.stack || err.message : String(err)}\n`,
  )
  process.exit(1)
})
