// CTO verifier: generates SUMMARY.md from the raw files in this folder. Usage: node scripts/summarize.mjs (from verify/runs/P3-T5-r4)
import fs from 'node:fs'
const j = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const out = ['# P3-T5 r4 — generated summary (do not edit; run scripts/summarize.mjs)', '', fs.readFileSync('head.txt', 'utf8').trim(), '', '## DoD and e2e steps (summary.tsv)', '', '| step | exit |', '|---|---|']
for (const l of fs.readFileSync('summary.tsv', 'utf8').trim().split(/\r?\n/).slice(1)) { const [s, e] = l.split('\t'); if (e !== undefined) out.push(`| ${s} | ${e} |`) }
const tl = (t) => { const c = t.marks[0][0]; const live = t.log.find((l) => l[0] >= c && l[1].startsWith('live/')); const wins = [[live ? live[0] : c + 9000, c + 9000], ...t.marks.slice(1).map((m) => [m[0], m[0] + 3000])]
  return { live: live ? live[0] - c : null, long: Math.max(0, ...t.longTasks.filter((l) => l[0] >= c && l[0] < c + 9000).map((l) => l[1])), gap: Math.max(0, ...t.gaps.filter((g) => wins.some(([a, b]) => g[0] >= a && g[0] < b)).map((g) => g[1])), tiers: [...new Set(t.log.filter((l) => live && l[0] >= live[0]).map((l) => l[1].split('/')[2]))].join(',') } }
out.push('', '## CTO timeline script (click 2 s after scrolling to the card), final code', '', '| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |', '|---|---|---|---|---|')
for (const f of fs.readdirSync('timeline').sort()) { const r = tl(j('timeline/' + f)); out.push(`| ${f} | ${r.live} | ${r.long} | ${r.gap} | ${r.tiers} |`) }
const gt = (dir) => { out.push('', '| run | mode | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | pass |', '|---|---|---|---|---|---|---|---|---|---|')
  for (const d of fs.readdirSync(dir).filter((n) => n.startsWith('gates-')).sort()) { const r = j(`${dir}/${d}/result.json`); out.push(`| ${d} | ${r.mode} | ${r.liveMs} | ${r.maxLongTaskFirstWindow} | ${r.maxFlightGap} | ${r.tiersAfterLive.join(',')} | ${r.laterStartMs.join(', ')} | ${r.enteredAfterFirstPhase} | ${r.maxLoadScale} | ${Object.entries(r.pass).filter(([, v]) => !v).map(([k]) => 'FAIL ' + k).join(' ') || 'all'} |`) } }
out.push('', '## Gate script (scripts/cards-gates.mjs), final code'); gt('gates')
out.push('', '## Must-fail: mutant o9-no-preparation (mutant-o9/)', '', '| run | click→live ms | max long task ms |', '|---|---|---|')
for (const f of fs.readdirSync('mutant-o9').filter((n) => n.startsWith('timeline')).sort()) { const r = tl(j('mutant-o9/' + f)); out.push(`| ${f} | ${r.live} | ${r.long} |`) }
gt('mutant-o9')
out.push('', '## Lighthouse 13.5.0 /en', '', '| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |', '|---|---|---|---|---|---|---|---|')
for (const f of fs.readdirSync('lighthouse').sort()) { const r = j('lighthouse/' + f); const c = r.categories, a = r.audits; out.push(`| ${f} | ${Math.round(c.performance.score * 100)} | ${Math.round(c.accessibility.score * 100)} | ${Math.round(c['best-practices'].score * 100)} | ${Math.round(c.seo.score * 100)} | ${Math.round(a['largest-contentful-paint'].numericValue)} | ${Math.round(a['total-blocking-time'].numericValue)} | ${a['cumulative-layout-shift'].numericValue.toFixed(3)} |`) }
fs.writeFileSync('SUMMARY.md', out.join('\n') + '\n'); console.log('wrote SUMMARY.md')
