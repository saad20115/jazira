// Verifier-only: log in as the e2e fixture admin (test credentials from tests/e2e/global-setup.ts),
// publish the home-page global (en, ar) and set arabicEnabled. Usage: node publish-as-fixture.mjs <baseUrl> <fixtureFile> <arabic:true|false>
import fs from 'node:fs'
const [base, fixtureFile, arabic] = process.argv.slice(2)
const src = fs.readFileSync(fixtureFile, 'utf8')
const email = src.match(/E2E_ADMIN_EMAIL = '([^']+)'/)[1]
const password = src.match(/E2E_ADMIN_PASSWORD = '([^']+)'/)[1]
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t) } catch { return t } }
const r = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
const login = await j(r); console.log('login', r.status)
const auth = { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }
for (const locale of ['en', 'ar']) {
  const d = await j(await fetch(`${base}/api/globals/home-page?draft=true&locale=${locale}&depth=0`, { headers: auth }))
  const { id, createdAt, updatedAt, globalType, ...body } = d
  const p = await fetch(`${base}/api/globals/home-page?locale=${locale}&depth=0`, { method: 'POST', headers: auth, body: JSON.stringify({ ...body, _status: 'published' }) })
  console.log('publish home-page', locale, p.status, 'interactiveSystems.enabled', body.interactiveSystems?.enabled)
}
const s = await fetch(`${base}/api/globals/site-settings?depth=0`, { method: 'POST', headers: auth, body: JSON.stringify({ arabicEnabled: arabic === 'true' }) })
console.log('site-settings arabicEnabled', arabic, s.status)
