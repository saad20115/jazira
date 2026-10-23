import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { env } from '../env'
import { hashIp, IP_HASH_HEX_REGEX, isValidIpHash, normalizeIpForHash } from './ipHash'

describe('ipHash server-only helper (P2-T6, D2, S2, S4)', () => {
  it('computes deterministic SHA-256(normalizedIp + IP_HASH_SALT) 64-char hex digest using env.IP_HASH_SALT by default', () => {
    const sampleIp = '203.0.113.42'
    const digest = hashIp(sampleIp)

    const expected = crypto
      .createHash('sha256')
      .update(`${sampleIp}${env.IP_HASH_SALT}`, 'utf8')
      .digest('hex')

    expect(digest).toBe(expected)
    expect(digest).toMatch(IP_HASH_HEX_REGEX)
    expect(isValidIpHash(digest)).toBe(true)
    expect(digest).not.toContain(sampleIp)
  })

  it('normalizes IPv4-mapped IPv6 addresses, casing, and whitespace before hashing', () => {
    const salt = 'custom_unit_test_salt_with_at_least_48_chars_1234567890'
    expect(normalizeIpForHash('  ::FFFF:198.51.100.7  ')).toBe('198.51.100.7')
    expect(normalizeIpForHash('2001:DB8::1A2B')).toBe('2001:db8::1a2b')
    expect(normalizeIpForHash('   ')).toBe('unknown')

    expect(hashIp('::ffff:198.51.100.7', salt)).toBe(hashIp('198.51.100.7', salt))
    expect(hashIp('2001:DB8::1A2B', salt)).toBe(hashIp('2001:db8::1a2b', salt))
  })

  it('produces different digests for different IPs or different salts and rejects weak salts', () => {
    const saltA = 'salt_alpha_at_least_48_characters_long_for_testing_0001'
    const saltB = 'salt_bravo_at_least_48_characters_long_for_testing_0002'

    expect(hashIp('203.0.113.1', saltA)).not.toBe(hashIp('203.0.113.2', saltA))
    expect(hashIp('203.0.113.1', saltA)).not.toBe(hashIp('203.0.113.1', saltB))
    expect(() => hashIp('203.0.113.1', 'short')).toThrow(/at least 16 characters/)
    expect(isValidIpHash('not-a-sha256-hash')).toBe(false)
    expect(isValidIpHash('203.0.113.1')).toBe(false)
  })
})
