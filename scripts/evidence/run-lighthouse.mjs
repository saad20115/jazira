import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      srv.close(() => resolve(port))
    })
  })
}

async function waitForDevToolsPort(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error(`Chromium DevTools port ${port} did not become ready within ${timeoutMs}ms`)
}

function resolveHeadlessBrowserPath() {
  const defaultExe = chromium.executablePath()
  try {
    const browsersRoot = path.resolve(defaultExe, '../../..')
    const shellDirs = fs
      .readdirSync(browsersRoot)
      .filter((d) => d.startsWith('chromium_headless_shell-'))
      .sort()
      .reverse()
    for (const dir of shellDirs) {
      for (const sub of [
        'chrome-headless-shell-win64/chrome-headless-shell.exe',
        'chrome-headless-shell-linux64/chrome-headless-shell',
        'chrome-headless-shell-mac-arm64/chrome-headless-shell',
        'chrome-headless-shell-mac-x64/chrome-headless-shell',
      ]) {
        const candidate = path.join(browsersRoot, dir, sub)
        if (fs.existsSync(candidate)) {
          return candidate
        }
      }
    }
  } catch {
    // fallback to defaultExe
  }
  return defaultExe
}

async function runLighthousePassOnce({ url, locale, headerBlock = '', outLogPath, outJsonPath }) {
  // Ensure the Next.js server & image optimizer have warmed the route before measuring
  try {
    const warmRes = await fetch(url)
    await warmRes.text()
  } catch {
    // ignore warm-up errors
  }

  const port = await findFreePort()
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `lh-profile-${locale}-`))
  const chromePath = resolveHeadlessBrowserPath()

  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--metrics-recording-only',
    '--mute-audio',
    'about:blank',
  ]

  const chromeProc = spawn(chromePath, chromeArgs, {
    stdio: 'ignore',
    windowsHide: true,
  })

  try {
    await waitForDevToolsPort(port)

    const runnerResult = await lighthouse(
      url,
      {
        port,
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        disableStorageReset: false,
      },
      undefined,
    )

    if (!runnerResult || !runnerResult.lhr) {
      throw new Error(`Lighthouse returned empty result for ${url}`)
    }

    const { lhr } = runnerResult
    if (outJsonPath) {
      fs.mkdirSync(path.dirname(outJsonPath), { recursive: true })
      fs.writeFileSync(outJsonPath, JSON.stringify(lhr, null, 2), 'utf8')
    }

    const scores = {
      performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
      seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
    }

    const metricKeys = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
      'interactive',
    ]

    const metrics = {}
    for (const key of metricKeys) {
      const audit = lhr.audits[key]
      if (audit) {
        metrics[key] = {
          numericValue:
            typeof audit.numericValue === 'number' ? Number(audit.numericValue.toFixed(4)) : null,
          displayValue: audit.displayValue ?? null,
          score: audit.score,
        }
      }
    }

    const clsNumeric = Number((lhr.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(5))

    const failingAudits = []
    for (const catKey of ['accessibility', 'best-practices', 'seo']) {
      const cat = lhr.categories[catKey]
      if (!cat) continue
      for (const ref of cat.auditRefs || []) {
        const audit = lhr.audits[ref.id]
        if (audit && typeof audit.score === 'number' && audit.score < 1) {
          failingAudits.push({
            category: catKey,
            id: ref.id,
            title: audit.title,
            score: audit.score,
            displayValue: audit.displayValue ?? null,
          })
        }
      }
    }

    const summary = {
      lighthouseVersion: lhr.lighthouseVersion,
      requestedUrl: lhr.requestedUrl,
      finalDisplayedUrl: lhr.finalDisplayedUrl,
      fetchTime: lhr.fetchTime,
      formFactor: lhr.configSettings?.formFactor,
      throttlingMethod: lhr.configSettings?.throttlingMethod,
      screenEmulation: lhr.configSettings?.screenEmulation,
      scores,
      clsNumeric,
      metrics,
      failingAudits,
    }

    const logText = [
      headerBlock ? headerBlock.trimEnd() : '',
      `=== Google Lighthouse v${lhr.lighthouseVersion} Mobile Audit (${locale} -> ${url}) ===`,
      `Performance:    ${scores.performance} (gate >= 85)`,
      `Accessibility:  ${scores.accessibility} (gate >= 95)`,
      `Best Practices: ${scores.bestPractices} (gate >= 95)`,
      `SEO:            ${scores.seo} (gate >= 95)`,
      `CLS:            ${clsNumeric} (gate <= 0.05)`,
      JSON.stringify(summary, null, 2),
      '',
    ]
      .filter(Boolean)
      .join('\n')

    if (outLogPath) {
      fs.mkdirSync(path.dirname(outLogPath), { recursive: true })
      fs.writeFileSync(outLogPath, logText + '\n', 'utf8')
    }

    if (
      scores.performance < 85 ||
      scores.accessibility < 95 ||
      scores.bestPractices < 95 ||
      scores.seo < 95 ||
      clsNumeric > 0.05
    ) {
      throw new Error(
        `Lighthouse mobile gate failed for ${url}: ${JSON.stringify({ scores, clsNumeric, failingAudits })}`,
      )
    }

    return summary
  } finally {
    try {
      chromeProc.kill()
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 300))
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
}

export async function runLighthouseAudit(opts) {
  let lastErr = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await runLighthousePassOnce(opts)
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/evidence/run-lighthouse.mjs')
) {
  const url = process.argv[2] || 'http://localhost:3000/ar'
  const locale = process.argv[3] || (url.endsWith('/en') ? 'en' : 'ar')
  const outLogPath =
    process.argv[4] ||
    path.resolve(process.cwd(), `docs/evidence/P3-T4/lighthouse-mobile-${locale}.log`)
  const outJsonPath =
    process.argv[5] ||
    path.resolve(process.cwd(), `docs/evidence/P3-T4/lighthouse-mobile-${locale}.json`)

  runLighthouseAudit({ url, locale, outLogPath, outJsonPath })
    .then((res) => {
      console.log(
        `[Lighthouse] ${url} -> Perf=${res.scores.performance} A11y=${res.scores.accessibility} BP=${res.scores.bestPractices} SEO=${res.scores.seo} CLS=${res.clsNumeric}`,
      )
    })
    .catch((err) => {
      console.error('[Lighthouse] ERROR:', err)
      process.exit(1)
    })
}
