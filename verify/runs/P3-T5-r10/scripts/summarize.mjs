// CTO verifier: generates SUMMARY.md from the raw files in this folder. Usage: node scripts/summarize.mjs (from verify/runs/P3-T5-r10)
import fs from 'node:fs'
const j = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const lines = (p) => fs.readFileSync(p, 'utf8').trim().split(/\r?\n/)
const out = ['# P3-T5 r10 — generated summary (do not edit; run scripts/summarize.mjs)', '', fs.readFileSync('head.txt', 'utf8').trim()]
const steps = (p, title) => {
  out.push('', title, '', '| step | exit |', '|---|---|')
  for (const l of lines(p).slice(1)) { const [s, e] = l.split('\t'); if (e !== undefined) out.push(`| ${s} | ${e} |`) }
}
const tl = (t) => {
  const c = t.marks[0][0]; const live = t.log.find((l) => l[0] >= c && l[1].startsWith('live/'))
  const wins = [[live ? live[0] : c + 9000, c + 9000], ...t.marks.slice(1).map((m) => [m[0], m[0] + 3000])]
  return { live: live ? live[0] - c : null, long: Math.max(0, ...t.longTasks.filter((l) => l[0] >= c && l[0] < c + 9000).map((l) => l[1])), gap: Math.max(0, ...t.gaps.filter((g) => wins.some(([a, b]) => g[0] >= a && g[0] < b)).map((g) => g[1])), tiers: [...new Set(t.log.filter((l) => live && l[0] >= live[0]).map((l) => l[1].split('/')[2]))].join(',') }
}
const tlTable = (base, title) => {
  out.push('', title, '', '| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |', '|---|---|---|---|---|')
  for (const f of fs.readdirSync(base + '/timeline').sort()) { const r = tl(j(base + '/timeline/' + f)); out.push(`| ${f} | ${r.live} | ${r.long} | ${r.gap} | ${r.tiers} |`) }
}
const gateTable = (base, title) => {
  out.push('', title, '', '| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | O-14b stills after live ms | O-14b long / gap after live+3 s ms | pass |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const d of fs.readdirSync(base + '/gates').filter((n) => n.startsWith('gates-')).sort()) {
    const r = j(`${base}/gates/${d}/result.json`)
    out.push(`| ${d} | ${r.mode} | ${r.settledMs} | ${r.settledState} | ${r.liveMs} | ${r.maxLongTaskFirstWindow} | ${r.maxFlightGap} | ${r.tiersAfterLive.join(',')} | ${r.laterStartMs.join(', ')} | ${r.enteredAfterFirstPhase} | ${r.maxLoadScale} | ${r.stillsAfterLiveMs} | ${r.maxLongAfterLive3s} / ${r.maxGapAfterLive3s} | ${Object.entries(r.pass).filter(([, v]) => !v).map(([k]) => 'FAIL ' + k).join(' ') || 'all'} |`)
  }
}
const lhTable = (base, title) => {
  out.push('', title, '', '| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |', '|---|---|---|---|---|---|---|---|')
  for (const f of fs.readdirSync(base + '/lighthouse').sort()) {
    const r = j(base + '/lighthouse/' + f)
    if (r.runtimeError) { out.push(`| ${f} | tool error ${r.runtimeError.code} (kept, no score) | | | | | | |`); continue }
    const c = r.categories, a = r.audits
    out.push(`| ${f} | ${Math.round(c.performance.score * 100)} | ${Math.round(c.accessibility.score * 100)} | ${Math.round(c['best-practices'].score * 100)} | ${Math.round(c.seo.score * 100)} | ${Math.round(a['largest-contentful-paint'].numericValue)} | ${Math.round(a['total-blocking-time'].numericValue)} | ${a['cumulative-layout-shift'].numericValue.toFixed(3)} |`)
  }
}
steps('summary.tsv', '## Parts A and B steps (summary.tsv)')
tlTable('.', '## CTO timeline script (click 2 s after scrolling to the card), part B')
gateTable('.', '## Gate script (scripts/cards-gates.mjs), parts A and B')
out.push('', '## O-13 sky swap (scripts/sky-swap.mjs): gate = top band within ±6 per channel; luma and floor are information only', '', '| case | state | tier | live ms | top Δ RGB | info: luma Δ | info: floor Δ RGB | pass |', '|---|---|---|---|---|---|---|---|')
for (const f of fs.readdirSync('sky-swap').filter((n) => n.endsWith('-swap-results.json')).sort()) for (const r of j('sky-swap/' + f)) out.push(`| ${r.case} | ${r.state} | ${r.tier} | ${r.liveMs} | ${r.topDelta.join(' ')} | ${r.info_lumaDelta} | ${r.info_floorDelta.join(' ')} | ${r.pass ? 'pass' : 'FAIL'} |`)
out.push('', '## Arabic switch after the run', '', '`' + fs.readFileSync('arabic-after.txt', 'utf8').trim() + '`')
lhTable('.', '## Lighthouse 13.5.0 /en, part B')
out.push('', '## Part B2: clean re-run of part B (browser pane on a blank file; see README)', '', '`' + lines('partB2/head.txt').join(' ') + '`')
steps('partB2/summary.tsv', '### Part B2 steps')
tlTable('partB2', '### Part B2 timeline')
gateTable('partB2', '### Part B2 gates')
lhTable('partB2', '### Part B2 Lighthouse 13.5.0 /en')
steps('m11/summary.tsv', '## m11 must-fail (executor mutant: the switch flies via the overview), @gpu O-16 test only')
out.push('', 'Lines from `m11/logs/e2e-gpu-o16-mutant.log`:', '', '```', ...lines('m11/logs/e2e-gpu-o16-mutant.log').filter((x) => /Error:|Expected:|Received:|passed|failed/.test(x)).map((x) => x.trim()), '```')
fs.writeFileSync('SUMMARY.md', out.join('\n') + '\n'); console.log('wrote SUMMARY.md')
