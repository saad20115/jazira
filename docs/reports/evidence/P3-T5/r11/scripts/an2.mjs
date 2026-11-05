import fs from 'node:fs'
import path from 'node:path'
const root = process.argv[2]
for (const run of fs.readdirSync(root).sort((a, b) => parseInt(a) - parseInt(b))) for (const sub of fs.readdirSync(path.join(root, run)).filter((s) => s.startsWith('gates') && !s.endsWith('.log'))) {
  const p = JSON.parse(fs.readFileSync(path.join(root, run, sub, 'probe.json'), 'utf8'))
  const d0 = p.downs[0]; const live = (p.log.find((l) => l[0] >= d0 && l[1].startsWith('live/')) || [null])[0]
  const later = p.downs.slice(1)
  const gaps = p.gaps.filter((g) => g[1] >= 83 && g[0] >= (live ?? Infinity)).map((g) => { const k = later.findIndex((d) => g[0] >= d && g[0] < d + 3000); return `${g[1]}@${k >= 0 ? `later${k}+${g[0] - later[k]}` : `L+${g[0] - live}`}` })
  const longs = p.long.filter((l) => l[0] >= d0 && l[1] >= 100).map((l) => `${l[1]}@${live && l[0] >= live ? `L+${l[0] - live}` : `c+${l[0] - d0}`}`)
  console.log(run, sub, 'live', live && live - d0, '| long', longs.join(' '), '| gaps>=83', gaps.join(' '))
}
