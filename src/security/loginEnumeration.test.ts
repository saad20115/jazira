import { AuthenticationError, LockedAuth, ValidationError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { Users } from '../collections/Users'
import {
  createGenericAuthenticationError,
  DUMMY_PBKDF2_HASH_BUFFER,
  DUMMY_PBKDF2_SALT_HEX,
  hardenLoginEnumerationBeforeOperation,
  isUserCurrentlyLocked,
  maskLockedAuthAfterError,
  PAYLOAD_PBKDF2_DIGEST,
  PAYLOAD_PBKDF2_ITERATIONS,
  PAYLOAD_PBKDF2_KEY_LENGTH,
  runDummyPayloadPasswordHash,
} from './loginEnumeration'

describe('P2-T9 Login enumeration hardening unit tests (A1, A5 spirit)', () => {
  it('matches Payload 3.91.0 PBKDF2-SHA256 parameters (600,000 iterations, 32-byte key, sha256) and wires Users.hooks', () => {
    expect(PAYLOAD_PBKDF2_ITERATIONS).toBe(600_000)
    expect(PAYLOAD_PBKDF2_KEY_LENGTH).toBe(32)
    expect(PAYLOAD_PBKDF2_DIGEST).toBe('sha256')
    expect(DUMMY_PBKDF2_SALT_HEX).toMatch(/^[0-9a-f]{64}$/)
    expect(DUMMY_PBKDF2_HASH_BUFFER.byteLength).toBe(32)

    expect(Users.hooks?.beforeOperation).toContain(hardenLoginEnumerationBeforeOperation)
    expect(Users.hooks?.afterError).toContain(maskLockedAuthAfterError)
  })

  it('evaluates isUserCurrentlyLocked accurately across nullish, expired, invalid, and future timestamps', () => {
    const now = 1_700_000_000_000
    expect(isUserCurrentlyLocked(null, now)).toBe(false)
    expect(isUserCurrentlyLocked(undefined, now)).toBe(false)
    expect(isUserCurrentlyLocked('', now)).toBe(false)
    expect(isUserCurrentlyLocked('not-a-valid-date', now)).toBe(false)
    expect(isUserCurrentlyLocked(new Date(now - 1).toISOString(), now)).toBe(false)
    expect(isUserCurrentlyLocked(new Date(now), now)).toBe(false)
    expect(isUserCurrentlyLocked(new Date(now + 1).toISOString(), now)).toBe(true)
    expect(isUserCurrentlyLocked(new Date(now + 60_000), now)).toBe(true)
  })

  it('executes a full 600,000-iteration PBKDF2-SHA256 derivation in runDummyPayloadPasswordHash', async () => {
    const start = performance.now()
    const matched = await runDummyPayloadPasswordHash('Probe!Password#2026')
    const elapsedMs = performance.now() - start
    expect(matched).toBe(false)
    expect(elapsedMs).toBeGreaterThan(20)
  })

  it('runs the dummy PBKDF2 hash and throws generic AuthenticationError (401) for unknown emails and locked accounts in hardenLoginEnumerationBeforeOperation', async () => {
    const findOneMock = vi.fn()
    const mockReq = {
      payload: {
        db: {
          findOne: findOneMock,
        },
      },
      t: undefined,
    }

    const invokeBeforeOperation = (params: {
      args: Record<string, unknown>
      operation: 'create' | 'login'
    }) =>
      hardenLoginEnumerationBeforeOperation({
        args: params.args,
        collection: Users as never,
        context: {},
        operation: params.operation,
        req: mockReq as never,
      } as never)

    // 1. Non-login operation passes through without querying db.findOne
    const createArgs = { data: { email: 'user@aljazira.co', password: 'Strong!Password#2026' } }
    const passthroughCreate = await invokeBeforeOperation({
      args: createArgs,
      operation: 'create',
    })
    expect(passthroughCreate).toBe(createArgs)
    expect(findOneMock).not.toHaveBeenCalled()

    // 2. Blank email or password on login passes through so Payload's ValidationError runs
    const blankLoginArgs = { data: { email: 'user@aljazira.co', password: '   ' } }
    const passthroughBlank = await invokeBeforeOperation({
      args: blankLoginArgs,
      operation: 'login',
    })
    expect(passthroughBlank).toBe(blankLoginArgs)
    expect(findOneMock).not.toHaveBeenCalled()

    // 3. Unknown email -> runs dummy hash and throws AuthenticationError (401)
    findOneMock.mockResolvedValueOnce(null)
    let unknownCaught: unknown
    try {
      await invokeBeforeOperation({
        args: { data: { email: '  UNKNOWN@AlJazira.co ', password: 'Wrong!Password#2026' } },
        operation: 'login',
      })
    } catch (err) {
      unknownCaught = err
    }
    expect(findOneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        where: { email: { equals: 'unknown@aljazira.co' } },
      }),
    )
    expect(unknownCaught).toBeInstanceOf(AuthenticationError)
    expect((unknownCaught as AuthenticationError).status).toBe(401)
    expect((unknownCaught as AuthenticationError).name).toBe('AuthenticationError')

    // 4. Locked user -> runs dummy hash and throws identical AuthenticationError (401, never LockedAuth)
    findOneMock.mockResolvedValueOnce({
      id: 42,
      lockUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    let lockedCaught: unknown
    try {
      await invokeBeforeOperation({
        args: { data: { email: 'locked@aljazira.co', password: 'RightOrWrong!Password#2026' } },
        operation: 'login',
      })
    } catch (err) {
      lockedCaught = err
    }
    expect(lockedCaught).toBeInstanceOf(AuthenticationError)
    expect(lockedCaught).not.toBeInstanceOf(LockedAuth)
    expect((lockedCaught as AuthenticationError).status).toBe(401)
    expect((lockedCaught as AuthenticationError).message).toBe(
      (unknownCaught as AuthenticationError).message,
    )

    // 5. Unlocked user (or expired lockUntil) -> returns args without throwing
    findOneMock.mockResolvedValueOnce({
      id: 42,
      lockUntil: new Date(Date.now() - 60_000).toISOString(),
    })
    const unlockedArgs = {
      data: { email: 'unlocked@aljazira.co', password: 'Strong!Password#2026' },
    }
    const unlockedResult = await invokeBeforeOperation({
      args: unlockedArgs,
      operation: 'login',
    })
    expect(unlockedResult).toBe(unlockedArgs)
  })

  it('rewrites LockedAuth in maskLockedAuthAfterError to the generic AuthenticationError response and leaves other errors untouched', () => {
    const lockedErr = new LockedAuth()
    const genericErr = createGenericAuthenticationError(undefined)

    const masked = maskLockedAuthAfterError({
      collection: Users as never,
      context: {},
      error: lockedErr,
      req: { t: undefined } as never,
      result: {
        errors: [{ message: lockedErr.message }],
      },
    })
    expect(masked).toEqual({
      response: {
        errors: [{ message: genericErr.message }],
      },
      status: 401,
    })

    const validationErr = new ValidationError({
      errors: [{ path: 'email', message: 'Required' }],
    })
    const untouched = maskLockedAuthAfterError({
      collection: Users as never,
      context: {},
      error: validationErr,
      req: { t: undefined } as never,
      result: {
        errors: [{ message: validationErr.message }],
      },
    })
    expect(untouched).toBeUndefined()
  })
})
