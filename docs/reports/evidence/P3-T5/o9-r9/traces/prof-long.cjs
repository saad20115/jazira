const fs = require('fs')
const dir = process.argv[2]
const p = JSON.parse(fs.readFileSync(dir + '/probe.json', 'utf8'))
const ev = JSON.parse(fs.readFileSync(dir + '/trace.json', 'utf8')).traceEvents
const names = new Map(); for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') names.set(e.pid + ':' + e.tid, e.args.name)
const pds = ev.filter((e) => e.name === 'EventDispatch' && e.args?.data?.type === 'pointerdown').map((e) => e.ts)
const byId = new Map()
for (const e of ev) {
  if (e.name === 'Profile') byId.set(e.id, { thread: names.get(e.pid + ':' + e.tid), start: e.args.data.startTime, nodes: new Map(), samples: [], deltas: [] })
  if (e.name === 'ProfileChunk') { const pr = byId.get(e.id); if (!pr) continue; const c = e.args.data.cpuProfile || {}; for (const n of c.nodes || []) pr.nodes.set(n.id, n); for (const s of c.samples || []) pr.samples.push(s); for (const d of e.args.data.timeDeltas || []) pr.deltas.push(d) }
}
const prof = [...byId.values()].find((x) => x.thread === 'CrRendererMain')
let t = prof.start; const times = prof.deltas.map((d) => (t += d))
const parentOf = new Map(); for (const n of prof.nodes.values()) for (const c of n.children || []) parentOf.set(c, n.id)
const label = (n) => { const cf = n.callFrame; return (cf.functionName || '(anon)') + '@' + (cf.url || '').split('/').pop() + ':' + cf.columnNumber }
const stackOf = (id) => { const s = []; let cur = id; while (cur !== undefined) { const n = prof.nodes.get(cur); s.push(label(n)); cur = parentOf.get(cur) } return s }
const f = p.downs[0]
const longs = p.long.filter((l) => l[0] >= f && l[0] < f + 6000 && l[1] >= Number(process.argv[3] || 120)).map((l) => [pds[0] + (l[0] - f) * 1000, l[1], l[0] - f])
for (const [ts, dur, rel] of longs) {
  const self = new Map(); const incl = new Map(); let n0 = 0
  prof.samples.forEach((id, i) => { if (times[i] < ts || times[i] > ts + dur * 1000) return; n0++; const n = prof.nodes.get(id); const k = label(n); self.set(k, (self.get(k) || 0) + 1); for (const fr of new Set(stackOf(id))) incl.set(fr, (incl.get(fr) || 0) + 1) })
  console.log('long task at', rel, 'ms after click, dur', dur, 'samples', n0)
  console.log('  self:', [...self].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => v + ' ' + k).join(' | '))
  console.log('  inclusive:', [...incl].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => v + ' ' + k).join(' | '))
}
