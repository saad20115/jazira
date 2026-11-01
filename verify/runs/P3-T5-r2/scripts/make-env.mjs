// Usage: node make-env.mjs <srcEnv> <dstEnv> <pgPort> <smtpPort> <uiPort> <appPort>
import fs from 'node:fs'; import crypto from 'node:crypto'
const [src, dst, pg, smtp, ui, app] = process.argv.slice(2)
const rnd = (n = 48) => crypto.randomBytes(n).toString('base64url')
const kv = Object.fromEntries(fs.readFileSync(src, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
kv.POSTGRES_PORT = pg; kv.SMTP_PORT = smtp; kv.MAILPIT_UI_PORT = ui
kv.POSTGRES_PASSWORD = rnd(24); kv.APP_DB_PASSWORD = rnd(24); kv.PAYLOAD_SECRET = rnd(); kv.IP_HASH_SALT = rnd()
const url = (db) => `postgres://${kv.APP_DB_USER}:${kv.APP_DB_PASSWORD}@127.0.0.1:${pg}/${db}`
kv.DATABASE_URL = url(kv.APP_DB_NAME); kv.TEST_DATABASE_URL = url(kv.APP_TEST_DB_NAME)
kv.SERVER_URL = `http://localhost:${app}`
fs.writeFileSync(dst, Object.entries(kv).map(([k, v]) => `${k}=${v}`).join('\n') + '\n')
console.log('wrote', Object.keys(kv).length, 'keys')
