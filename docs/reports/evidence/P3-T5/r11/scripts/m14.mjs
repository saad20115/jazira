// Mutant m14 (O-17 must-fail): the systems' warm-up starts before the start-up probe, so it runs
// during the timed frames. Usage: node m14.mjs <createViewer.ts> (applies in place)
import fs from 'node:fs'
const p = process.argv[2]
let s = fs.readFileSync(p, 'utf8')
const start = '    systemsWarming = true\n    void warmUpSystems()\n    await Promise.race([options.whenShown, aborted])\n'
if (!s.includes(start)) throw new Error('warm-up start not found')
s = s.replace(start, '    await Promise.race([options.whenShown, aborted])\n')
const probe = '    const frames = await probeFrames()\n'
if (!s.includes(probe)) throw new Error('probe not found')
s = s.replace(probe, '    systemsWarming = true\n    void warmUpSystems()\n    const frames = await probeFrames()\n')
fs.writeFileSync(p, s)
