// CTO verifier: set site-settings.arabicEnabled on a clone server with the e2e admin. Usage: node r1-arabic.mjs <baseUrl> <envFile> <true|false>
import fs from 'node:fs'
const [base, envFile, val] = process.argv.slice(2)
const env = Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const login = await fetch(base + '/api/users/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'e2e-admin@aljazira.co', password: env.E2E_ADMIN_PASSWORD }) })
const { token } = await login.json()
const res = await fetch(base + '/api/globals/site-settings', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'JWT ' + token }, body: JSON.stringify({ arabicEnabled: val === 'true' }) })
const json = await res.json().catch(() => null)
console.log('login', login.status, 'update', res.status, 'arabicEnabled', json?.result?.arabicEnabled ?? json?.arabicEnabled ?? null)
