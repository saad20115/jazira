// Verifier-only: create a reviewer admin in the isolated verifier DB, publish home-page, set arabicEnabled.
// Usage: node verifier-setup.mjs <baseUrl> <credsFile> <arabicEnabled:true|false> [--publish-home]
import fs from 'node:fs'
import crypto from 'node:crypto'
const [base, credsFile, arabic] = process.argv.slice(2)
const publishHome = process.argv.includes('--publish-home')
let creds
if (fs.existsSync(credsFile)) creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'))
else {
  creds = { email: 'verifier@aljazira.test', password: crypto.randomBytes(24).toString('base64url') + 'aA1!' }
  fs.writeFileSync(credsFile, JSON.stringify(creds))
}
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t) } catch { return t } }
let r = await fetch(`${base}/api/users/first-register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...creds, name: 'Verifier', role: 'admin' }) })
console.log('first-register', r.status)
r = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(creds) })
const login = await j(r); console.log('login', r.status)
const auth = { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }
if (publishHome) {
  for (const locale of ['en', 'ar']) {
    const d = await j(await fetch(`${base}/api/globals/home-page?draft=true&locale=${locale}&depth=0`, { headers: auth }))
    const { id, createdAt, updatedAt, globalType, ...body } = d
    const p = await fetch(`${base}/api/globals/home-page?locale=${locale}&depth=0`, { method: 'POST', headers: auth, body: JSON.stringify({ ...body, _status: 'published' }) })
    console.log('publish home-page', locale, p.status)
  }
}
const s = await fetch(`${base}/api/globals/site-settings?depth=0`, { method: 'POST', headers: auth, body: JSON.stringify({ arabicEnabled: arabic === 'true' }) })
console.log('site-settings arabicEnabled', arabic, s.status)
