import crypto from 'node:crypto'

import { env } from '../env'

/**
 * Server-only IP hashing helper (`docs/03-security.md` S2, S4, D2; `handoff/tasks/P2-T6.md` Scope 5).
 *
 * Raw client IP addresses must NEVER be stored in PostgreSQL or written to logs (D2).
 * Only the salted SHA-256 hex digest (`SHA-256(normalizedIp + IP_HASH_SALT)`) is persisted
 * in `quote-requests.ipHash` and used for rate-limiting keys.
 *
 * Client-side imports of `@/lib/ipHash` are blocked at lint time by `local/no-server-in-client`
 * (`eslint-rules/no-server-in-client.mjs`) and guarded at runtime below.
 */
if (typeof window !== 'undefined') {
  throw new Error(
    'src/lib/ipHash.ts is a server-only module and must never be imported in client code (S4, D2).',
  )
}

export const IP_HASH_HEX_REGEX = /^[a-f0-9]{64}$/

/**
 * Normalizes an IP address string before hashing so equivalent representations
 * (such as IPv4-mapped IPv6 `::ffff:203.0.113.10` and `203.0.113.10`, or uppercase IPv6 hex)
 * produce an identical digest.
 */
export function normalizeIpForHash(rawIp: string): string {
  const trimmed = rawIp.trim().toLowerCase()
  if (!trimmed) {
    return 'unknown'
  }
  if (trimmed.startsWith('::ffff:')) {
    const mappedIpv4 = trimmed.slice('::ffff:'.length).trim()
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(mappedIpv4)) {
      return mappedIpv4
    }
  }
  return trimmed
}

/**
 * Computes `SHA-256(normalizedIp + salt)` as a 64-character lowercase hexadecimal digest.
 * Defaults `salt` to `env.IP_HASH_SALT` (validated ≥ 48 chars at boot per S1/S2).
 * Never logs or returns the raw IP or salt.
 */
export function hashIp(ip: string, salt: string = env.IP_HASH_SALT): string {
  const trimmedSalt = salt.trim()
  if (trimmedSalt.length < 16) {
    throw new Error('IP_HASH_SALT must be at least 16 characters long to hash client IPs.')
  }
  const normalizedIp = normalizeIpForHash(ip)
  return crypto.createHash('sha256').update(`${normalizedIp}${trimmedSalt}`, 'utf8').digest('hex')
}

export function isValidIpHash(value: unknown): value is string {
  return typeof value === 'string' && IP_HASH_HEX_REGEX.test(value)
}
