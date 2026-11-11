// CTO verifier: generates SUMMARY.md from the raw files in this folder. Usage: node scripts/summarize.mjs (from verify/runs/R-1-r2)
import fs from 'node:fs'
const lines = (p) => fs.readFileSync(p, 'utf8').trim().split(/\r?\n/)
const clean = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').trim()
const grab = (f, re) => [...new Set(lines(f).map(clean).filter((x) => re.test(x)))]
const out = ['# R-1 r2 — generated summary (do not edit; run scripts/summarize.mjs)', '', 'HEAD ' + lines('head.txt')[0], '']
out.push('## Steps (summary.tsv)', '', '| step | exit | seconds |', '|---|---|---|')
for (const l of lines('summary.tsv').slice(1)) { const [s, e, t] = l.split('\t'); out.push(e === undefined ? `| ${s} | | |` : `| ${s} | ${e} | ${t} |`) }
out.push('', '## Test counts', '', '```')
for (const f of ['test.log', 'test-2.log', 'int-shuffle-1.log', 'int-shuffle-2.log']) for (const x of grab(f, /^(Test Files|Tests) +\d|^FAIL /)) out.push(`${f}: ${x.slice(0, 180)}`)
out.push('```', '', '## test.log failure (first lines)', '', '```', ...grab('test.log', /Test timed out|^FAIL /).map((x) => x.slice(0, 200)), '```')
out.push('', '## R1-2 live refusal: e2e run against a server on the dev DB', '', '```', ...grab('e2e-against-devdb-server.log', /safety guard/).map((x) => x.slice(0, 260)), '```', '', 'r12-live-refusal.txt (the user counts failed: psql had no password, a CTO tooling error):', '', '```', ...lines('r12-live-refusal.txt'), '```')
out.push('', '## Unfiltered e2e against a server on the e2e/test DB', '', '```', ...grab('e2e-unfiltered.log', /^\d+ (passed|failed|flaky|skipped)|^\d+\) \[/), '```')
out.push('', 'Arabic before/after: `' + lines('arabic-before-e2e.txt')[0] + '` / `' + lines('arabic-after-e2e.txt')[0] + '`')
out.push('', '## Round 2 must-fail (mustfail/summary.tsv): base = the files at bfe0bd5, fix = 0b325e5', '', '| case | phase | exit | first assertion |', '|---|---|---|---|')
for (const l of lines('mustfail/summary.tsv').slice(1)) { const [c, ph, e] = l.split('\t'); const first = ph === 'base' ? (lines(`mustfail/${c}-base.log`).map(clean).find((x) => /AssertionError/.test(x)) ?? '').slice(0, 140).replace(/\|/g, '\\|') : ''; out.push(`| ${c} | ${ph} | ${e} | ${first} |`) }
fs.writeFileSync('SUMMARY.md', out.join('\n') + '\n'); console.log('wrote SUMMARY.md')
