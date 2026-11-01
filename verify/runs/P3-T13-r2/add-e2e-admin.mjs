// Verifier-only: add the e2e fixture admin (credentials come from tests/e2e/global-setup.ts) to the verifier DB.
import fs from 'node:fs'
const [base, credsFile, fixtureFile] = process.argv.slice(2)
const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'))
const src = fs.readFileSync(fixtureFile, 'utf8')
const email = src.match(/E2E_ADMIN_EMAIL = '([^']+)'/)[1]
const password = src.match(/E2E_ADMIN_PASSWORD = '([^']+)'/)[1]
const login = await (await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(creds) })).json()
const r = await fetch(`${base}/api/users`, { method: 'POST', headers: { authorization: `JWT ${login.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ email, password, name: 'E2E Admin', role: 'admin' }) })
console.log('create e2e admin', r.status)
