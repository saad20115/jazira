// Executor diagnosis (non-authoritative): one line per gate run and per timeline, from the raw files.
import fs from 'node:fs'
import path from 'node:path'
const root = process.argv[2]
for (const run of fs.readdirSync(root).sort((a, b) => parseInt(a) - parseInt(b))) {
  const dir = path.join(root, run)
  for (const sub of fs.readdirSync(dir).sort()) {
    const res = path.join(dir, sub, 'result.json')
    if (fs.existsSync(res)) {
      const r = JSON.parse(fs.readFileSync(res, 'utf8'))
      const p = JSON.parse(fs.readFileSync(path.join(dir, sub, 'probe.json'), 'utf8'))
      const d0 = p.downs[0]
      const live = (p.log.find((l) => l[0] >= d0 && l[1].startsWith('live/')) || [null])[0]
      const before = p.long.filter((l) => l[0] >= d0 && (live === null || l[0] < live)).map((l) => l[1])
      const after = p.long.filter((l) => live !== null && l[0] >= live && l[0] < d0 + 9000).map((l) => l[1])
      const fails = Object.entries(r.pass).filter(([, v]) => !v).map(([k]) => k)
      console.log(`${run.padEnd(9)} ${sub.padEnd(18)} live ${String(r.liveMs).padStart(5)} longBeforeLive ${String(Math.max(0, ...before)).padStart(4)} longAfterLive ${String(Math.max(0, ...after)).padStart(4)} flightGap ${String(r.maxFlightGap).padStart(4)} tiers ${r.tiersAfterLive.join(',')} end ${r.settledState} ${fails.length ? 'FAIL ' + fails.join(',') : 'pass'}`)
    }
    const tl = path.join(dir, sub, 'timeline.json')
    if (fs.existsSync(tl)) {
      const t = JSON.parse(fs.readFileSync(tl, 'utf8'))
      const c0 = t.marks[0][0]
      const long = t.longTasks.filter((l) => l[0] >= c0 && l[0] < c0 + 9000).map((l) => l[1])
      const live = (t.log.find((l) => l[0] >= c0 && l[1].startsWith('live/')) || [null])[0]
      const gaps = t.gaps.filter((g) => g[0] >= c0).map((g) => g[1])
      console.log(`${run.padEnd(9)} ${'timeline'.padEnd(18)} live ${String(live === null ? null : live - c0).padStart(5)} long(click..+9s) ${Math.max(0, ...long)} maxGapAfterClick ${Math.max(0, ...gaps)} tiers ${[...new Set(t.log.filter((l) => l[0] >= (live ?? Infinity)).map((l) => l[1].split('/')[2]))].join(',')}`)
    }
  }
}
