// CTO verifier, R-1 live checks against the running clone server (3329). Usage: node r1-live.mjs <baseUrl> <envFile> <outJson>
// A-02: an editor-token JSON { url, filename } create/update on media and videos is refused, and no remote fetch is made
//       (the url points at a local listener that counts hits).
// A-10: a media file response carries CSP "default-src 'none'; sandbox" and nosniff; so does a 404 under /file/.
// A-06: an editor cannot reach /api/payload-jobs/run.
import fs from 'node:fs'
import http from 'node:http'
import crypto from 'node:crypto'
const [base, envFile, outFile] = process.argv.slice(2)
const env = Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const out = { base, steps: [] }
const log = (k, v) => { out.steps.push([k, v]); console.log(k, JSON.stringify(v)) }
let hits = 0
const listener = http.createServer((req, res) => { hits++; res.writeHead(200, { 'content-type': 'image/png' }); res.end(Buffer.alloc(64)) })
await new Promise((r) => listener.listen(3399, '127.0.0.1', r))
const j = async (method, path, token, body) => {
  const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'JWT ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })
  let json = null; try { json = await res.json() } catch {}
  return { status: res.status, json }
}
const admin = await j('POST', '/api/users/login', null, { email: 'e2e-admin@aljazira.co', password: env.E2E_ADMIN_PASSWORD })
log('admin-login', admin.status)
const edEmail = `r1-verify-editor-${Date.now()}@aljazira.co`; const edPwd = crypto.randomBytes(18).toString('base64url') + 'aA1!'
const created = await j('POST', '/api/users', admin.json?.token, { name: 'R1 Verify Editor', email: edEmail, password: edPwd, role: 'editor' })
log('editor-create', { status: created.status, role: created.json?.doc?.role })
const ed = await j('POST', '/api/users/login', null, { email: edEmail, password: edPwd })
log('editor-login', ed.status)
const tok = ed.json?.token
for (const coll of ['media', 'videos']) {
  const ext = coll === 'media' ? 'png' : 'mp4'
  const before = hits
  const r = await j('POST', `/api/${coll}`, tok, { url: `http://127.0.0.1:3399/a.${ext}`, filename: `a.${ext}`, alt: 'r1 verify', title: 'r1 verify' })
  log(`A-02 ${coll} create JSON {url,filename}`, { status: r.status, id: r.json?.doc?.id ?? null, remoteHits: hits - before, message: r.json?.errors?.[0]?.message ?? null })
}
const list = await j('GET', '/api/media?limit=1&depth=0', tok)
const doc = list.json?.docs?.[0]
if (doc) {
  const before = hits
  const u = await j('PATCH', `/api/media/${doc.id}`, tok, { url: 'http://127.0.0.1:3399/b.png', filename: 'b.png' })
  log('A-02 media update JSON {url,filename}', { status: u.status, remoteHits: hits - before, message: u.json?.errors?.[0]?.message ?? null })
  const f = await fetch(`${base}/api/media/file/${encodeURIComponent(doc.filename)}`)
  log('A-10 media file headers', { status: f.status, csp: f.headers.get('content-security-policy'), nosniff: f.headers.get('x-content-type-options') })
}
const nf = await fetch(`${base}/api/media/file/does-not-exist-r1.png`)
log('A-10 media file 404 headers', { status: nf.status, csp: nf.headers.get('content-security-policy'), nosniff: nf.headers.get('x-content-type-options') })
const vf = await fetch(`${base}/api/videos/file/does-not-exist-r1.mp4`)
log('A-10 videos file 404 headers', { status: vf.status, csp: vf.headers.get('content-security-policy'), nosniff: vf.headers.get('x-content-type-options') })
const jobs = await j('GET', '/api/payload-jobs/run', tok)
log('A-06 editor GET /api/payload-jobs/run', jobs.status)
const jobsAnon = await j('GET', '/api/payload-jobs/run', null)
log('A-06 anonymous GET /api/payload-jobs/run', jobsAnon.status)
if (created.json?.doc?.id) log('editor-delete', (await j('DELETE', `/api/users/${created.json.doc.id}`, admin.json?.token)).status)
log('listener total hits', hits)
listener.close()
fs.writeFileSync(outFile, JSON.stringify(out, null, 1))
