const fs = require('fs')
const dir = process.argv[2]
const p = JSON.parse(fs.readFileSync(dir + '/probe.json', 'utf8'))
const ev = JSON.parse(fs.readFileSync(dir + '/trace.json', 'utf8')).traceEvents
const names = new Map(); for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') names.set(e.pid + ':' + e.tid, e.args.name)
const pd = ev.find((e) => e.name === 'EventDispatch' && e.args?.data?.type === 'pointerdown').ts
const f = p.downs[0]
const live = (p.log.find((l) => l[0] >= f && l[1].startsWith('live/')) || [null])[0]
console.log('live', live === null ? null : live - f)
for (const l of p.long.filter((l) => l[0] >= f && l[0] < f + 9000 && l[1] >= 120)) {
  const ts = pd + (l[0] - f) * 1000
  console.log(' long', l[0] - f, l[1])
  const inner = ev.filter((e) => e.ph === 'X' && names.get(e.pid + ':' + e.tid) === 'CrRendererMain' && e.ts >= ts - 2000 && e.ts <= ts + l[1] * 1000 && e.dur >= 8000 && !/^(RunTask|ThreadControllerImpl::RunTask)$/.test(e.name))
  for (const e of inner.slice(0, 12)) console.log('    ', Math.round((e.ts - pd) / 1000), Math.round(e.dur / 1000), e.name, JSON.stringify(e.args?.data?.functionName || e.args?.data?.url || e.args?.data?.type || '').slice(0, 50))
}
