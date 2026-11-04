// Verifier-only: log in as the e2e fixture admin (test credentials from tests/e2e/global-setup.ts) and publish the
// page globals and the services collection (en, ar), so the P3-T6..T9 pages can be reviewed. Usage: node publish-pages-as-fixture.mjs <baseUrl> <fixtureFile>
import fs from 'node:fs'
const [base, fixtureFile] = process.argv.slice(2)
const src = fs.readFileSync(fixtureFile, 'utf8')
const email = src.match(/E2E_ADMIN_EMAIL = '([^']+)'/)[1]
const password = src.match(/E2E_ADMIN_PASSWORD = '([^']+)'/)[1]
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t) } catch { return t } }
const r = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
const login = await j(r); console.log('login', r.status)
const auth = { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }
const strip = ({ id, createdAt, updatedAt, globalType, ...b }) => b
for (const g of ['services-page', 'about-page', 'projects-page', 'contact-page', 'privacy-page']) for (const locale of ['en', 'ar']) {
  const d = await j(await fetch(`${base}/api/globals/${g}?draft=true&locale=${locale}&depth=0`, { headers: auth }))
  const p = await fetch(`${base}/api/globals/${g}?locale=${locale}&depth=0`, { method: 'POST', headers: auth, body: JSON.stringify({ ...strip(d), _status: 'published' }) })
  console.log('publish', g, locale, p.status)
}
const list = await j(await fetch(`${base}/api/services?draft=true&limit=100&depth=0`, { headers: auth }))
for (const doc of list.docs) for (const locale of ['en', 'ar']) {
  const d = await j(await fetch(`${base}/api/services/${doc.id}?draft=true&locale=${locale}&depth=0`, { headers: auth }))
  const p = await fetch(`${base}/api/services/${doc.id}?locale=${locale}&depth=0`, { method: 'PATCH', headers: auth, body: JSON.stringify({ ...strip(d), _status: 'published' }) })
  console.log('publish service', doc.slug, locale, p.status)
}
