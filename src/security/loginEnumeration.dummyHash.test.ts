import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Users } from '../collections/Users'
import {
  DUMMY_PBKDF2_SALT_HEX,
  hardenLoginEnumerationBeforeOperation,
  PAYLOAD_PBKDF2_DIGEST,
  PAYLOAD_PBKDF2_ITERATIONS,
  PAYLOAD_PBKDF2_KEY_LENGTH,
} from './loginEnumeration'

/**
 * P2-T7 §7 (carried from the P2-T9 review): a spy on the real PBKDF2 call. If the dummy hash is
 * removed from `hardenLoginEnumerationBeforeOperation`, the unknown-email and locked-account paths
 * answer faster than a real login and these assertions fail.
 */
function login(findOneResult: unknown, password: string): Promise<unknown> {
  return Promise.resolve(
    hardenLoginEnumerationBeforeOperation({
      args: { data: { email: 'someone@aljazira.co', password } },
      collection: Users as never,
      context: {},
      operation: 'login',
      req: {
        payload: { db: { findOne: vi.fn().mockResolvedValue(findOneResult) } },
        t: undefined,
      } as never,
    } as never),
  )
}

describe('P2-T7 §7 login hardening: the dummy hash really runs', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('derives one full PBKDF2 key for an unknown email, with Payload’s parameters', async () => {
    const pbkdf2 = vi.spyOn(crypto, 'pbkdf2')
    await expect(login(null, 'Wrong!Password#2026')).rejects.toMatchObject({ status: 401 })
    expect(pbkdf2).toHaveBeenCalledTimes(1)
    expect(pbkdf2.mock.calls[0]?.slice(0, 5)).toEqual([
      'Wrong!Password#2026',
      DUMMY_PBKDF2_SALT_HEX,
      PAYLOAD_PBKDF2_ITERATIONS,
      PAYLOAD_PBKDF2_KEY_LENGTH,
      PAYLOAD_PBKDF2_DIGEST,
    ])
  })

  it('derives one full PBKDF2 key for a locked account', async () => {
    const pbkdf2 = vi.spyOn(crypto, 'pbkdf2')
    const lockedUser = { id: 1, lockUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString() }
    await expect(login(lockedUser, 'Right!Password#2026')).rejects.toMatchObject({ status: 401 })
    expect(pbkdf2).toHaveBeenCalledTimes(1)
  })

  it('does not run the dummy hash for an existing, unlocked user (Payload hashes once itself)', async () => {
    const pbkdf2 = vi.spyOn(crypto, 'pbkdf2')
    await expect(login({ id: 1, lockUntil: null }, 'Any!Password#2026')).resolves.toBeDefined()
    expect(pbkdf2).not.toHaveBeenCalled()
  })
})
