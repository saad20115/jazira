// CTO verifier: generates SUMMARY.md from the raw files in this folder. Usage: node scripts/summarize.mjs (from verify/runs/R-1-r1)
import fs from 'node:fs'
const lines = (p) => fs.readFileSync(p, 'utf8').trim().split(/\r?\n/)
const j = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const out = ['# R-1 r1 — generated summary (do not edit; run scripts/summarize.mjs)', '', 'HEAD ' + lines('head.txt')[0], '']
out.push('## Steps (summary.tsv)', '', '| step | exit | seconds |', '|---|---|---|')
for (const l of lines('summary.tsv').slice(1)) { const [s, e, t] = l.split('\t'); out.push(e === undefined ? `| ${s} | | |` : `| ${s} | ${e} | ${t} |`) }
const grab = (f, re) => lines(f).filter((x) => re.test(x)).map((x) => x.trim())
out.push('', '## Test counts (lines from the logs)', '', '```', ...grab('test.log', /Test Files|Tests +\d/).map((x) => 'test: ' + x), ...grab('int-shuffle-1.log', /Test Files|Tests +\d/).map((x) => 'int-shuffle-1: ' + x), ...grab('int-shuffle-2.log', /Test Files|Tests +\d/).map((x) => 'int-shuffle-2: ' + x), '```')
out.push('', '## e2e-default (unfiltered): first lines of the log', '', '```', ...lines('e2e-default.log').slice(0, 4), '```')
out.push('', '## e2e-spec-only (diagnostic path filter `spec\\.ts$`)', '', '```', ...new Set(grab('e2e-spec-only.log', /^\s*\d+ (passed|failed|flaky|skipped)|^\s*\d+\) \[/)), '```')
out.push('', '## Arabic switch around the runs', '', ...['arabic-before-e2e.txt', 'arabic-after-e2e.txt', 'arabic-before-e2e-spec.txt', 'arabic-after-e2e-spec.txt', 'arabic-after-visual.txt'].map((f) => `- ${f}: \`${lines(f)[0] ?? ''}\``))
out.push('', '## Live checks (live.json)', '', '| check | result |', '|---|---|')
for (const [k, v] of j('live.json').steps) out.push(`| ${k} | \`${JSON.stringify(v)}\` |`)
out.push('', '## Must-fail per finding (mustfail/summary.tsv): base = fix files at 34f3597 (A01: behavioural mutant), fix = df4ecdc', '', '| case | phase | exit | first assertion |', '|---|---|---|---|')
for (const l of lines('mustfail/summary.tsv').slice(1)) { const [c, ph, e] = l.split('\t'); if (e === undefined) continue; const first = ph === 'base' ? (lines(`mustfail/${c}-base.log`).find((x) => /AssertionError/.test(x)) ?? '').trim().slice(0, 140).replace(/\|/g, '\\|') : ''; out.push(`| ${c} | ${ph} | ${e} | ${first} |`) }
out.push('', '## Visual (visual/visual.json): differing pixels, reduced motion, intro skipped', '', '| page | base vs fix | fix vs fix2 (noise floor) | size |', '|---|---|---|---|')
for (const r of j('visual/visual.json')) out.push(`| ${r.page} | ${r.baseVsFix.diffPixels} | ${r.fixVsFix2.diffPixels} | ${(r.baseVsFix.size ?? []).join('×')} |`)
out.push('', 'Base build HEAD: `' + lines('visual-base-head.txt')[0] + '`; clone after the visual run: `' + lines('head-after-visual.txt')[0] + '`')
fs.writeFileSync('SUMMARY.md', out.join('\n') + '\n'); console.log('wrote SUMMARY.md')
