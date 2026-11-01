// Verifier-only anonymous/editor probes for P4-T2 r2. Usage: node p4t2-probe.mjs <base> <credsFile>
import fs from 'node:fs'
import crypto from 'node:crypto'
const [base, credsFile] = process.argv.slice(2)
const out = []
const log = (k, v) => { out.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`) }
const get = async (p, h = {}) => { const r = await fetch(base + p, { headers: h, redirect: 'manual' }); let b = ''; try { b = await r.text() } catch {} ; return { s: r.status, b } }
// anonymous media list
const ml = await get('/api/media?limit=500&depth=0')
const md = JSON.parse(ml.b)
log('anon /api/media status', ml.s); log('anon media totalDocs', md.totalDocs)
log('anon media with [placeholder] alt', (md.docs || []).filter((d) => JSON.stringify(d).includes('[placeholder]')).length)
log('anon media exposes placeholder field', (md.docs || []).some((d) => 'placeholder' in d))
// admin view to find placeholder docs
const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'))
const login = JSON.parse((await (await fetch(base + '/api/users/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(creds) })).text()))
const A = { authorization: `JWT ${login.token}` }
const all = JSON.parse((await get('/api/media?limit=500&depth=0', A)).b)
const ph = all.docs.filter((d) => d.placeholder === true)
log('admin media total', all.totalDocs); log('admin placeholder count', ph.length)
for (const d of ph.slice(0, 3)) {
  log(`anon GET /api/media/${d.id}`, (await get(`/api/media/${d.id}?depth=0`)).s)
  log(`anon file ${d.filename}`, (await get(`/api/media/file/${encodeURIComponent(d.filename)}`)).s)
  for (const [k, v] of Object.entries(d.sizes || {})) if (v?.filename) log(`anon size ${k} ${v.filename}`, (await get(`/api/media/file/${encodeURIComponent(v.filename)}`)).s)
  log(`admin file ${d.filename}`, (await get(`/api/media/file/${encodeURIComponent(d.filename)}`, A)).s)
}
const np = all.docs.find((d) => !d.placeholder)
if (np) log(`anon non-placeholder file ${np.filename}`, (await get(`/api/media/file/${encodeURIComponent(np.filename)}`)).s)
// drafts / versions hidden
for (const p of ['/api/projects?draft=true&limit=200&depth=0', '/api/projects/versions?limit=1', '/api/services?draft=true&limit=50&depth=0', '/api/services/versions?limit=1', '/api/globals/home-page?draft=true', '/api/globals/about-page?draft=true', '/api/team?limit=50']) {
  const r = await get(p); let n = '-'; try { const j = JSON.parse(r.b); n = j.totalDocs ?? (Object.keys(j).length) } catch {}
  log(`anon ${p}`, `${r.s} docs/keys=${n}`)
}
const pub = JSON.parse((await get('/api/projects?limit=200&depth=0')).b)
log('anon published projects', pub.totalDocs)
const jp = pub.docs.find((d) => /Jeddah Palace/i.test(d.title || ''))
log('XLSX-22 public location', jp ? jp.location : 'not found')
log('public projects with reviewNote/needsClientReview field', pub.docs.filter((d) => 'reviewNote' in d || 'needsClientReview' in d).length)
const html = (await get('/en')).b
for (const s of ['[placeholder]', 'working day', 'Rashwan', 'IMDAD Group']) log(`/en contains "${s}"`, html.includes(s))
// editor reviewNote
const ed = { email: 'verifier-editor@aljazira.test', password: crypto.randomBytes(18).toString('base64url') + 'aA1!' }
log('create editor', (await fetch(base + '/api/users', { method: 'POST', headers: { ...A, 'content-type': 'application/json' }, body: JSON.stringify({ ...ed, name: 'Verifier Editor', role: 'editor' }) })).status)
const el = JSON.parse(await (await fetch(base + '/api/users/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ed) })).text())
const E = { authorization: `JWT ${el.token}` }
const ep = JSON.parse((await get('/api/projects?limit=200&depth=0&draft=true', E)).b)
log('editor sees reviewNote on any project', ep.docs.some((d) => 'reviewNote' in d))
const target = ep.docs.find((d) => d.needsClientReview !== undefined) || ep.docs[0]
const upd = await fetch(`${base}/api/projects/${target.id}`, { method: 'PATCH', headers: { ...E, 'content-type': 'application/json' }, body: JSON.stringify({ reviewNote: 'editor-should-not-write' }) })
const after = JSON.parse((await get(`/api/projects/${target.id}?depth=0&draft=true`, A)).b)
log('editor PATCH reviewNote status', upd.status); log('reviewNote after editor PATCH', after.reviewNote === 'editor-should-not-write' ? 'WRITTEN (bad)' : 'unchanged')
const ph2 = JSON.parse((await get('/api/media?limit=500&depth=0', E)).b)
log('editor sees placeholder field', ph2.docs.some((d) => 'placeholder' in d)); log('editor media total', ph2.totalDocs)
console.log(out.join('\n'))
