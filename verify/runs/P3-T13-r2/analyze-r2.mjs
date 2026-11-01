// node analyze.mjs <results.json> -> markdown tables + rule counts
import fs from 'node:fs'
const R = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).filter((r) => !r.error)
const errs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).filter((r) => r.error)
const f = (x) => (x === null || x === undefined ? '–' : typeof x === 'number' ? Math.round(x) : x)
const lines = []
lines.push('| # | vp | mode | loc | run | FP | FCP | rafTs (code) | callback now (MO) | FP−rafTs | FP−now | overlay parsed | FP−overlayParsed | path | played | 1st overlay paint | logo ≥1 (ms) | hidden (DOM) | hidden (paint) | span | page frames before overlay | hidden content samples | console/CSP |')
lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
R.forEach((r, i) => {
  const raf = r.implDecision?.rafMs ?? null
  const path = r.decisionDom ? (r.decisionDom.hasOverlay ? (r.dcl && Math.abs(r.decisionT - r.dcl) < 2 ? 'DCL' : 'rAF') : 'no-ov') : 'none'
  r._raf = raf
  r._path = r.implDecision ? (r.dcl !== null && r.decisionT !== null && r.decisionT >= r.dcl - 1 && Math.abs((r.implDecision.rafMs ?? -99) - r.decisionT) < 5 ? 'DCL-fallback' : 'rAF') : 'none'
  lines.push(`| ${i + 1} | ${r.vp} | ${r.mode} | ${r.locale} | ${r.run} | ${f(r.fp)} | ${f(r.fcp)} | ${f(raf)} | ${f(r.decisionT)} | ${raf !== null && r.fp ? f(r.fp - raf) : '–'} | ${r.decisionT !== null && r.fp ? f(r.fp - r.decisionT) : '–'} | ${f(r.domAt?.overlay)} | ${r.domAt?.overlay !== undefined && r.fp ? f(r.fp - r.domAt.overlay) : '–'} | ${r._path} | ${r.skipped ? 'SKIP' : 'play'} | ${f(r.firstOverlayPaint)} | ${f(r.logoDur)} | ${f(r.hidden)} | ${f(r.firstPageAfterOverlayShot)} | ${f(r.span)} | ${f(r.pageFramesBeforeOverlay)} | ${r.hiddenSampleCount}/${r.samples} | ${r.console.length}/${r.csp.length} |`)
})
const played = R.filter((r) => !r.skipped)
const cnt = (arr, p) => `${arr.filter(p).length}/${arr.length}`
const rules = []
rules.push(`- played: ${played.length}/${R.length}; skipped: ${R.length - played.length}`)
rules.push(`- R1 span (first overlay paint → hidden DOM) ≤ 1600: pass ${cnt(played, (r) => r.span !== null && r.span <= 1600)}`)
rules.push(`- R2 logo fully visible ≥ 300 ms: pass ${cnt(played, (r) => r.logoDur !== null && r.logoDur >= 300)}`)
rules.push(`- R3a gone by 2500 (DOM hidden): pass ${cnt(played, (r) => r.hidden !== null && r.hidden <= 2500)}`)
rules.push(`- R3b gone by 2500 (first page frame after overlay, paint): pass ${cnt(played, (r) => r.firstPageAfterOverlayShot !== null && r.firstPageAfterOverlayShot <= 2500)}`)
rules.push(`- R4 skipped iff FP > 1100 (strict): pass ${cnt(R, (r) => r.skipped === r.fp > 1100)}; FP>1100 but played: ${R.filter((r) => r.fp > 1100 && !r.skipped).length}; FP≤1100 but skipped: ${R.filter((r) => r.fp <= 1100 && r.skipped).length}`)
rules.push(`- R4' with ±17 ms tolerance: violations ${R.filter((r) => (r.fp > 1117 && !r.skipped) || (r.fp <= 1083 && r.skipped)).length}`)
const mid = R.filter((r) => r.mode === 'mid-tier' && r.fp <= 1100)
rules.push(`- R5 mid-tier with FP ≤ 1100 plays: ${cnt(mid, (r) => !r.skipped)} (mid-tier runs with FP > 1100: ${R.filter((r) => r.mode === 'mid-tier' && r.fp > 1100).length})`)
rules.push(`- R6 0 page frames painted before overlay (played runs): pass ${cnt(played, (r) => r.pageFramesBeforeOverlay === 0)}`)
rules.push(`- R6' first non-blank screenshot is the overlay (played): ${cnt(played, (r) => r.firstNonBlankShot !== null && r.firstOverlayPaint !== null && r.firstNonBlankShot === r.firstOverlayPaint)}`)
rules.push(`- R7 content never hidden (no rAF sample with main/header/footer/body visibility≠visible, display:none, opacity<1, content-visibility≠visible): pass ${cnt(R, (r) => r.hiddenSampleCount === 0)}; total samples ${R.reduce((a, r) => a + r.samples, 0)}`)
rules.push(`- console entries total ${R.reduce((a, r) => a + r.console.length, 0)}, CSP violations total ${R.reduce((a, r) => a + r.csp.length, 0)}`)
rules.push(`- decision path: rAF ${R.filter((r) => r._path === 'rAF').length}, DCL-fallback ${R.filter((r) => r._path === 'DCL-fallback').length}`)
// deltas
const st = (xs) => xs.length ? `min ${Math.round(Math.min(...xs))} / median ${Math.round(xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)])} / max ${Math.round(Math.max(...xs))}` : 'n/a'
for (const mode of ['unthrottled', 'mid-tier', 'throttled']) {
  const M = R.filter((r) => r.mode === mode)
  rules.push(`- ${mode}: FP−rafTs ${st(M.filter((r) => r._raf !== null).map((r) => r.fp - r._raf))}; FP−callbackNow ${st(M.filter((r) => r.decisionT !== null).map((r) => r.fp - r.decisionT))}; callbackNow−rafTs ${st(M.filter((r) => r._raf !== null && r.decisionT !== null).map((r) => r.decisionT - r._raf))}; FP−overlayParsed ${st(M.filter((r) => r.domAt?.overlay !== undefined).map((r) => r.fp - r.domAt.overlay))}; anim startTime−FP ${st(M.filter((r) => r.anStartTimeline !== null).map((r) => r.anStartTimeline - r.fp))}`)
}
const hyp = (thr, key) => R.filter((r) => {
  const t = key(r); if (t === null || t === undefined) return false
  const wouldPlay = t <= thr
  return wouldPlay ? r.fp > 1100 : r.fp <= 1100
}).length
rules.push(`- counterfactual misclassifications vs FP>1100 rule (n=${R.length}): using rafTs (current code) ${hyp(1100, (r) => r._raf)}; using performance.now() in the rAF callback ${hyp(1100, (r) => r.decisionT)}; using sync-after-overlay parse time ${hyp(1100, (r) => r.domAt?.overlay)}`)
console.log(lines.join('\n'))
console.log('\n' + rules.join('\n'))
if (errs.length) console.log('\nERRORS: ' + JSON.stringify(errs))
const bad = R.filter((r) => r.console.length || r.csp.length)
for (const r of bad) console.log(`console/CSP ${r.tag}: ${JSON.stringify(r.console)} ${JSON.stringify(r.csp)}`)
// r2: does the code's own decision clock agree with what it did?
const inconsistent = R.filter((r) => r.implDecision && r.implDecision.nowMs !== undefined && ((r.implDecision.nowMs > 1100) !== r.skipped))
console.log(`- r2 decision self-consistency (skip iff code nowMs > 1100): violations ${inconsistent.length}/${R.length}`)
console.log(`- r2 overlay is first body element in parsed DOM: see dom-order.txt`)
