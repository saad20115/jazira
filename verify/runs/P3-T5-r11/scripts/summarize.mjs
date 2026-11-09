// CTO verifier: generates SUMMARY.md from the raw files in this folder. Usage: node scripts/summarize.mjs (from verify/runs/P3-T5-r11)
import fs from 'node:fs'
const j = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const lines = (p) => fs.readFileSync(p, 'utf8').trim().split(/\r?\n/)
const out = ['# P3-T5 r11 — generated summary (do not edit; run scripts/summarize.mjs)', '', fs.readFileSync('head.txt', 'utf8').trim()]
const steps = (p, title) => {
  out.push('', title, '', '| step | exit |', '|---|---|')
  for (const l of lines(p).slice(1)) { const [s, e] = l.split('\t'); if (e !== undefined) out.push(`| ${s} | ${e} |`) }
}
const tl = (t) => {
  const c = t.marks[0][0]; const live = t.log.find((l) => l[0] >= c && l[1].startsWith('live/'))
  const wins = [[live ? live[0] : c + 9000, c + 9000], ...t.marks.slice(1).map((m) => [m[0], m[0] + 3000])]
  return { live: live ? live[0] - c : null, long: Math.max(0, ...t.longTasks.filter((l) => l[0] >= c && l[0] < c + 9000).map((l) => l[1])), gap: Math.max(0, ...t.gaps.filter((g) => wins.some(([a, b]) => g[0] >= a && g[0] < b)).map((g) => g[1])), tiers: [...new Set(t.log.filter((l) => live && l[0] >= live[0]).map((l) => l[1].split('/')[2]))].join(','), stills: t.log.some((l) => l[0] >= c && l[1].startsWith('stills')) }
}
const tlTable = (base, title) => {
  out.push('', title, '', '| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live | ever stills |', '|---|---|---|---|---|---|')
  for (const f of fs.readdirSync(base + '/timeline').sort()) { const r = tl(j(base + '/timeline/' + f)); out.push(`| ${f} | ${r.live} | ${r.long} | ${r.gap} | ${r.tiers} | ${r.stills} |`) }
}
const gateRow = (d, r) => `| ${d} | ${r.mode} | ${r.settledMs} | ${r.settledState} | ${r.liveMs} | ${r.maxLongTaskFirstWindow} | ${r.maxFlightGap} | ${r.tiersAfterLive.join(',')} | ${r.laterStartMs.join(', ')} | ${r.enteredAfterFirstPhase} | ${r.maxLoadScale} | ${r.stillsAfterLiveMs} | ${r.maxLongAfterLive3s} / ${r.maxGapAfterLive3s} | ${Object.entries(r.pass).filter(([, v]) => !v).map(([k]) => 'FAIL ' + k).join(' ') || 'all'} |`
const gateHead = ['| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | O-14b stills after live ms | O-14b long / gap after live+3 s ms | pass |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|']
const gateTable = (dir, title, filter = () => true) => {
  out.push('', title, '', ...gateHead)
  for (const d of fs.readdirSync(dir).filter((n) => fs.existsSync(`${dir}/${n}/result.json`) && filter(n)).sort()) out.push(gateRow(d, j(`${dir}/${d}/result.json`)))
}
const lhTable = (dir, title) => {
  out.push('', title, '', '| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |', '|---|---|---|---|---|---|---|---|')
  for (const f of fs.readdirSync(dir).sort()) {
    const r = j(dir + '/' + f)
    if (r.runtimeError) { out.push(`| ${f} | tool error ${r.runtimeError.code} (kept, no score) | | | | | | |`); continue }
    const c = r.categories, a = r.audits
    out.push(`| ${f} | ${Math.round(c.performance.score * 100)} | ${Math.round(c.accessibility.score * 100)} | ${Math.round(c['best-practices'].score * 100)} | ${Math.round(c.seo.score * 100)} | ${Math.round(a['largest-contentful-paint'].numericValue)} | ${Math.round(a['total-blocking-time'].numericValue)} | ${a['cumulative-layout-shift'].numericValue.toFixed(3)} |`)
  }
}
steps('summary.tsv', '## 2026-11-05 parts A and B steps (summary.tsv)')
tlTable('.', '## 2026-11-05 part B: CTO timeline script')
gateTable('gates', '## 2026-11-05 parts A and B: gate script (scripts/cards-gates.mjs)')
out.push('', '## O-13 sky swap (scripts/sky-swap.mjs): gate = top band within ±6 per channel; luma and floor are information only', '', '| case | state | tier | live ms | top Δ RGB | info: luma Δ | info: floor Δ RGB | pass |', '|---|---|---|---|---|---|---|---|')
for (const f of fs.readdirSync('sky-swap').filter((n) => n.endsWith('-swap-results.json')).sort()) for (const r of j('sky-swap/' + f)) out.push(`| ${r.case} | ${r.state} | ${r.tier} | ${r.liveMs} | ${r.topDelta.join(' ')} | ${r.info_lumaDelta} | ${r.info_floorDelta.join(' ')} | ${r.pass ? 'pass' : 'FAIL'} |`)
out.push('', '## Arabic switch after part A', '', '`' + fs.readFileSync('arabic-after.txt', 'utf8').trim() + '`')
lhTable('lighthouse', '## 2026-11-05 part B: Lighthouse 13.5.0 /en')
out.push('', '## 2026-11-05 interleaved r9 (3326) / r11 (3328), machine diagnosis', '', '```', ...lines('ab-2026-11-05/machine-diagnosis.txt'), '```')
gateTable('ab-2026-11-05', '### 2026-11-05 interleaved gates (order in ab-2026-11-05/summary.tsv)')
out.push('', '## 2026-11-09 re-run (scripts/ab-r9-r11-quiet.sh, scripts/r11-timeline-lh.sh)', '', 'GPU sample after the runs (`quiet-2026-11-09/gpu-after-runs.txt`):', '', '```', ...lines('quiet-2026-11-09/gpu-after-runs.txt'), '```')
steps('quiet-2026-11-09/summary.tsv', '### 2026-11-09 interleaved steps (run order)')
gateTable('quiet-2026-11-09/gates', '### 2026-11-09 interleaved gates, r9 (control) and r11', (n) => n.startsWith('r9-') || n.startsWith('r11-'))
steps('quiet-2026-11-09/timeline-lh-summary.tsv', '### 2026-11-09 r11 timeline and Lighthouse steps')
tlTable('quiet-2026-11-09', '### 2026-11-09 r11 timelines')
lhTable('quiet-2026-11-09/lighthouse', '### 2026-11-09 r11 Lighthouse 13.5.0 /en')
fs.writeFileSync('SUMMARY.md', out.join('\n') + '\n'); console.log('wrote SUMMARY.md')
