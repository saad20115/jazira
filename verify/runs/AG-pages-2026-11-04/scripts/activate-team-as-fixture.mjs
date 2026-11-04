// Verifier-only: log in as the e2e fixture admin and set every team member active, so the About team section can be
// reviewed. Usage: node activate-team-as-fixture.mjs <baseUrl> <fixtureFile>
import fs from 'node:fs'
const [base, fixtureFile] = process.argv.slice(2)
const src = fs.readFileSync(fixtureFile, 'utf8')
const email = src.match(/E2E_ADMIN_EMAIL = '([^']+)'/)[1], password = src.match(/E2E_ADMIN_PASSWORD = '([^']+)'/)[1]
const login = await (await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })).json()
const auth = { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }
const list = await (await fetch(`${base}/api/team?limit=100&depth=0`, { headers: auth })).json()
for (const d of list.docs) { const p = await fetch(`${base}/api/team/${d.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ active: true }) }); console.log('activate', d.tier, p.status) }
