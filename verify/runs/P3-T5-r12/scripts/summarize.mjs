// CTO verifier: generates SUMMARY.md from the raw files in this folder. Usage: node scripts/summarize.mjs (from verify/runs/P3-T5-r12)
import fs from 'node:fs'
const j = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const lines = (p) => fs.readFileSync(p, 'utf8').trim().split(/\r?\n/)
const out = ['# P3-T5 r12 — generated summary (do not edit; run scripts/summarize.mjs)', '', fs.readFileSync('partA/head.txt', 'utf8').trim()]
const steps = (p, title) => {
  out.push('', title, '', '| step | exit | seconds |', '|---|---|---|')
  for (const l of lines(p).slice(1)) { const [s, e, t] = l.split('\t'); out.push(e === undefined ? `| ${s} | | |` : `| ${s} | ${e} | ${t} |`) }
}
const e2e = (f) => [...new Set(lines(f).filter((x) => /^\s*\d+ (passed|failed|flaky|skipped|interrupted)|^\s*\d+\) \[/.test(x)).map((x) => x.trim()))]
const tl = (t) => {
  const c = t.marks[0][0]; const live = t.log.find((l) => l[0] >= c && l[1].startsWith('live/'))
  const wins = [[live ? live[0] : c + 9000, c + 9000], ...t.marks.slice(1).map((m) => [m[0], m[0] + 3000])]
  return { live: live ? live[0] - c : null, long: Math.max(0, ...t.longTasks.filter((l) => l[0] >= c && l[0] < c + 9000).map((l) => l[1])), gap: Math.max(0, ...t.gaps.filter((g) => wins.some(([a, b]) => g[0] >= a && g[0] < b)).map((g) => g[1])), stills: t.log.some((l) => l[0] >= c && l[1].startsWith('stills')) }
}
const gateHead = ['| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks ms | O-14b stills after live ms | pass |', '|---|---|---|---|---|---|---|---|---|---|---|']
const gateRow = (d, r) => `| ${d} | ${r.mode} | ${r.settledMs} | ${r.settledState} | ${r.liveMs} | ${r.maxLongTaskFirstWindow} | ${r.maxFlightGap} | ${r.tiersAfterLive.join(',')} | ${r.laterStartMs.join(', ')} | ${r.stillsAfterLiveMs} | ${Object.entries(r.pass).filter(([, v]) => !v).map(([k]) => 'FAIL ' + k).join(' ') || 'all'} |`
const gates = (dir, title, filter) => { out.push('', title, '', ...gateHead); for (const d of fs.readdirSync(dir).filter((n) => fs.existsSync(`${dir}/${n}/result.json`) && filter(n)).sort()) out.push(gateRow(d, j(`${dir}/${d}/result.json`))) }
steps('partA/summary.tsv', '## Part A, A2, A3 steps (partA/summary.tsv; A and A2 were broken by the port clash, M-230/M-231)')
for (const f of ['e2e-default-pre', 'e2e-default', 'e2e-gpu', 'e2e-p3t5-prodflag', 'e2e-default-pre-A3', 'e2e-default-A3', 'e2e-gpu-A3', 'e2e-p3t5-prodflag-A3']) out.push('', `### ${f}`, '', '```', ...e2e(`partA/${f}.log`), '```')
gates('partA', '## Part A3 gates (throttle10, held)', (n) => n.endsWith('-A3'))
out.push('', '## O-13 sky swap, part A3: gate = top band within ±6 per channel', '', '| case | state | tier | top Δ RGB | pass |', '|---|---|---|---|---|')
for (const f of ['en', 'ar']) for (const r of j(`partA/sky-swap-A3/${f}-swap-results.json`)) out.push(`| ${r.case} | ${r.state} | ${r.tier} | ${r.topDelta.join(' ')} | ${r.pass ? 'pass' : 'FAIL'} |`)
out.push('', 'Arabic after A3: `' + lines('partA/arabic-after-A3.txt')[0] + '`')
out.push('', '## Part B (quiet window M-232): GPU samples', '')
for (const s of ['before', 'mid', 'after']) out.push(`### gpu-${s}`, '', '```', ...lines(`partB/gpu-${s}.txt`), '```', '')
gates('partB', '## Part B interleaved gates: r11 control (3328) and r12 (3331), order in partB/summary.tsv', (n) => /^r1[12]-/.test(n))
out.push('', '## Part B r12 timelines', '', '| run | click→live ms | max long task ms | max frame gap in flights ms | ever stills |', '|---|---|---|---|---|')
for (const r of [1, 2, 3]) { const t = tl(j(`partB/timeline-r${r}/timeline.json`)); out.push(`| timeline-r${r} | ${t.live} | ${t.long} | ${t.gap} | ${t.stills} |`) }
out.push('', '## Part B r12 Lighthouse 13.5.0 /en', '', '| run | perf | a11y | bp | seo | LCP ms | TBT ms |', '|---|---|---|---|---|---|---|')
for (const f of fs.readdirSync('partB/lighthouse').sort()) { const r = j('partB/lighthouse/' + f); if (r.runtimeError) { out.push(`| ${f} | tool error ${r.runtimeError.code} | | | | | |`); continue } const c = r.categories, a = r.audits; out.push(`| ${f} | ${Math.round(c.performance.score * 100)} | ${Math.round(c.accessibility.score * 100)} | ${Math.round(c['best-practices'].score * 100)} | ${Math.round(c.seo.score * 100)} | ${Math.round(a['largest-contentful-paint'].numericValue)} | ${Math.round(a['total-blocking-time'].numericValue)} |`) }
fs.writeFileSync('SUMMARY.md', out.join('\n') + '\n'); console.log('wrote SUMMARY.md')
