// Raw HTTP chunk-arrival recorder. Usage: node chunks.mjs <url> [runs]
import http from 'node:http'

const url = new URL(process.argv[2])
const runs = Number(process.argv[3] || 3)
const MARKERS = [
  ['<head', /<head[\s>]/],
  ['introScript', /aljazira_intro_seen/],
  ['firstStylesheet', /<link rel="stylesheet"/],
  ['</head>', /<\/head>/],
  ['<body', /<body[\s>]/],
  ['skipLink', /href="#main-content"/],
  ['<header', /<header[\s>]/],
  ['<main', /<main[\s>]/],
  ['overlay', /data-component="intro-splash"/],
  ['homeContent', /data-home-content="true"/],
  ['heroH1', /<h1[\s>]/],
  ['<footer', /<footer[\s>]/],
  ['</body>', /<\/body>/],
  ['</html>', /<\/html>/],
  ['$RC/streamed boundary', /\$RC|<template id="B:|hidden id="S:/],
]

function once() {
  return new Promise((resolve, reject) => {
    const t0 = process.hrtime.bigint()
    const ms = () => Number(process.hrtime.bigint() - t0) / 1e6
    const r = http.get(url, { headers: { 'accept-encoding': 'identity', accept: 'text/html' } }, (res) => {
      const tHead = ms()
      const chunks = []
      let all = ''
      res.setEncoding('utf8')
      res.on('data', (c) => {
        const start = all.length
        all += c
        chunks.push({ t: +ms().toFixed(1), start, len: c.length })
      })
      res.on('end', () => {
        const marks = []
        const bodyAt = all.search(/<body[s>]/)
        for (const [name, re] of MARKERS) {
          const inBody = ["skipLink","<header","<main","overlay","homeContent","heroH1","<footer"].includes(name)
          const sub = inBody ? all.slice(bodyAt) : all
          const mm = re.exec(sub)
          const m = mm ? { index: mm.index + (inBody ? bodyAt : 0) } : null
          if (!m) { marks.push({ name, at: null }); continue }
          const idx = m.index
          const ci = chunks.findIndex((c) => idx >= c.start && idx < c.start + c.len)
          marks.push({ name, at: idx, chunk: ci, t: chunks[ci]?.t })
        }
        // stylesheet link positions relative to overlay
        const links = [...all.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map((m) => ({ href: m[1].replace(/\?.*$/, ''), at: m.index, prec: /data-precedence/.test(m[0]) }))
        resolve({ status: res.statusCode, tHead: +tHead.toFixed(1), total: all.length, chunks, marks, links, te: res.headers['transfer-encoding'] })
      })
    })
    r.on('error', reject)
  })
}

for (let i = 0; i < runs; i++) {
  const r = await once()
  console.log(`--- run ${i + 1}: status ${r.status} headers@${r.tHead}ms total ${r.total} bytes, ${r.chunks.length} chunks, TE=${r.te}`)
  console.log('chunks (t ms, byteStart, len):', r.chunks.map((c) => `${c.t}/${c.start}/${c.len}`).join('  '))
  for (const m of r.marks) console.log(`  ${m.name.padEnd(22)} byte=${m.at} chunk#=${m.chunk} t=${m.t}`)
  console.log('  stylesheets:', r.links.map((l) => `${l.href.split('/').pop()}@${l.at}`).join(', '))
}
