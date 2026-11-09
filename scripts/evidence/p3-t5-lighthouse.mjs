// P3-T5 Lighthouse evidence: mobile audits of /en and /ar against a running server, compared with
// the P3-T4 r5 baseline (docs/reports/evidence/P3-T4/r5). The number of attempts is fixed up front
// (default 3); every attempt is kept and the median is compared — no retry, no best-of.
// Usage: node scripts/evidence/p3-t5-lighthouse.mjs <baseUrl> <outDir> [attempts]
import fs from 'node:fs'
import path from 'node:path'

import { runLighthouseAudit } from './run-lighthouse.mjs'

const [baseUrl, outDir, attemptsArg] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('usage: node scripts/evidence/p3-t5-lighthouse.mjs <baseUrl> <outDir> [attempts]')
  process.exit(2)
}
const attempts = Number(attemptsArg ?? 3)
fs.mkdirSync(outDir, { recursive: true })

const baselineDir = 'docs/reports/evidence/P3-T4/r5'
const pick = (json) => ({
  performance: Math.round(json.categories.performance.score * 100),
  accessibility: Math.round(json.categories.accessibility.score * 100),
  bestPractices: Math.round(json.categories['best-practices'].score * 100),
  seo: Math.round(json.categories.seo.score * 100),
  lcpMs: Math.round(json.audits['largest-contentful-paint'].numericValue),
  tbtMs: Math.round(json.audits['total-blocking-time'].numericValue),
  cls: Number(json.audits['cumulative-layout-shift'].numericValue.toFixed(5)),
})
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

const summary = { baseUrl, attempts, locales: {} }
for (const locale of ['en', 'ar']) {
  const runs = []
  for (let i = 1; i <= attempts; i += 1) {
    const outJsonPath = path.join(outDir, `lighthouse-mobile-${locale}-${i}.json`)
    await runLighthouseAudit({
      url: `${baseUrl}/${locale}`,
      locale,
      headerBlock: `P3-T5 attempt ${i}/${attempts} (fixed count, all reported)`,
      outLogPath: path.join(outDir, `lighthouse-mobile-${locale}-${i}.log`),
      outJsonPath,
    })
    runs.push(pick(JSON.parse(fs.readFileSync(outJsonPath, 'utf8'))))
  }
  const baseline = pick(
    JSON.parse(fs.readFileSync(path.join(baselineDir, `lighthouse-mobile-${locale}.json`), 'utf8')),
  )
  const med = Object.fromEntries(
    Object.keys(runs[0]).map((key) => [key, median(runs.map((run) => run[key]))]),
  )
  summary.locales[locale] = {
    runs,
    median: med,
    baseline,
    performanceDelta: med.performance - baseline.performance,
  }
  console.log(
    locale,
    'perf runs',
    runs.map((run) => run.performance).join(','),
    'median',
    med.performance,
    'baseline',
    baseline.performance,
  )
}
fs.writeFileSync(
  path.join(outDir, 'lighthouse-summary.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
)
