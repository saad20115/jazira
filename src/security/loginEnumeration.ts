import crypto from 'crypto'
import {
  AuthenticationError,
  LockedAuth,
  type AfterErrorHook,
  type CollectionBeforeOperationHook,
} from 'payload'

/**
 * Exact PBKDF2 parameters used by Payload 3.91.0 local auth strategy
 * (`node_modules/payload/dist/auth/strategies/local/generatePasswordSaltHash.js:4`–`6`
 * and `node_modules/payload/dist/auth/strategies/local/authenticate.js:8`–`24`).
 */
export const PAYLOAD_PBKDF2_ITERATIONS = 600_000
export const PAYLOAD_PBKDF2_KEY_LENGTH = 32
export const PAYLOAD_PBKDF2_DIGEST = 'sha256'

/**
 * Fixed 32-byte (64-hex-char) salt and 32-byte dummy digest buffer used to equalize
 * PBKDF2-SHA256 + `crypto.timingSafeEqual` CPU work when a login targets an unknown
 * email or a currently locked account (`P2-T9`).
 */
export const DUMMY_PBKDF2_SALT_HEX =
  '9f4d8c2a7e1b6035c4a8d92f1e07b63a5c8d2f4e91a0b7c6d3e5f80123456789'
export const DUMMY_PBKDF2_HASH_BUFFER = Buffer.from(
  '3a7f1c9e4b2d8065a1c3e5f7092b4d6e8f0a1c2e3b4d5f60718293a4b5c6d7e8',
  'hex',
)

type ActiveBeforeOperationArg = Exclude<
  Parameters<CollectionBeforeOperationHook>[0],
  { operation: 'read' | 'readDistinct' }
>

/**
 * Mirrors Payload's `isUserLocked` (`node_modules/payload/dist/auth/isUserLocked.js:1`–`6`):
 * returns `true` iff `lockUntil` parses to a timestamp strictly greater than `nowMs`.
 */
export function isUserCurrentlyLocked(lockUntil: unknown, nowMs: number = Date.now()): boolean {
  if (!lockUntil) {
    return false
  }
  const timestamp =
    lockUntil instanceof Date
      ? lockUntil.getTime()
      : typeof lockUntil === 'string' || typeof lockUntil === 'number'
        ? new Date(lockUntil).getTime()
        : Number.NaN
  if (Number.isNaN(timestamp)) {
    return false
  }
  return timestamp > nowMs
}

/**
 * Executes a full 600,000-iteration PBKDF2-SHA256 derivation (32-byte key) followed by
 * `crypto.timingSafeEqual` against `DUMMY_PBKDF2_HASH_BUFFER`, matching the exact work
 * performed by Payload 3.91.0's `authenticateLocalStrategy` for an existing unlocked user.
 */
export async function runDummyPayloadPasswordHash(password: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      DUMMY_PBKDF2_SALT_HEX,
      PAYLOAD_PBKDF2_ITERATIONS,
      PAYLOAD_PBKDF2_KEY_LENGTH,
      PAYLOAD_PBKDF2_DIGEST,
      (err, hashBuffer) => {
        if (err) {
          reject(err)
          return
        }
        const matched =
          hashBuffer.length === DUMMY_PBKDF2_HASH_BUFFER.length &&
          crypto.timingSafeEqual(hashBuffer, DUMMY_PBKDF2_HASH_BUFFER)
        resolve(matched)
      },
    )
  })
}

/**
 * Constructs a Payload `AuthenticationError` with `.name` explicitly pinned to
 * `'AuthenticationError'` so Next.js production minification (`P2-T4 R-13`) never
 * strips its class name during `formatErrors`.
 */
export function createGenericAuthenticationError(t: unknown): AuthenticationError {
  const err = new AuthenticationError(t as ConstructorParameters<typeof AuthenticationError>[0])
  err.name = 'AuthenticationError'
  return err
}

/**
 * `Users` `beforeOperation` hook (`P2-T9`, security `A1` / `A5` spirit) that eliminates both
 * the login timing oracle (~7 ms unknown/locked vs ~303 ms existing user) and the locked-account
 * message oracle (`LockedAuth` `"تمّ قفل هذا المستخدم..."` / `"This user is locked..."`):
 * - When `operation === 'login'` and both `email` and `password` are non-empty strings, looks up
 *   the target user by normalized email (`email.toLowerCase().trim()`).
 * - If the email does not exist OR the user's `lockUntil` is still in the future, runs
 *   `runDummyPayloadPasswordHash(password)` (600,000 PBKDF2-SHA256 iterations + `timingSafeEqual`)
 *   and throws `createGenericAuthenticationError(req.t)` (HTTP `401` with the generic localized
 *   `"البريد الإلكتروني أو كلمة المرور غير صحيحة."` / `"The email or password provided is incorrect."`).
 * - If the user exists and is not currently locked (including when a prior 15-minute `lockUntil`
 *   window has expired), returns `args` so Payload's native `loginOperation` runs
 *   `authenticateLocalStrategy`, `incrementLoginAttempts` (locking on the 5th failed attempt for
 *   15 minutes per `A1`), `resetLoginAttempts`, session creation, and cookie signing unchanged.
 */
export const hardenLoginEnumerationBeforeOperation: CollectionBeforeOperationHook = async (
  rawArg,
) => {
  const { args, operation, req } = rawArg as ActiveBeforeOperationArg
  if (operation !== 'login') {
    return args
  }

  const data = (args as { data?: { email?: unknown; password?: unknown } }).data
  const sanitizedEmail = typeof data?.email === 'string' ? data.email.toLowerCase().trim() : ''
  const password = typeof data?.password === 'string' ? data.password : ''

  // Let Payload's native ValidationError handle missing/blank email or password
  if (!sanitizedEmail || password.trim() === '') {
    return args
  }

  const existingUser = await req.payload.db.findOne<{
    id: number | string
    lockUntil?: Date | null | string
  }>({
    collection: 'users',
    req,
    where: {
      email: {
        equals: sanitizedEmail,
      },
    },
  })

  if (!existingUser || isUserCurrentlyLocked(existingUser.lockUntil)) {
    await runDummyPayloadPasswordHash(password)
    throw createGenericAuthenticationError(req.t)
  }

  return args
}

/**
 * Defense-in-depth `Users` `afterError` hook (`P2-T9`): if concurrent parallel login requests
 * race past `beforeOperation` and trigger `LockedAuth` inside `loginOperation`
 * (`node_modules/payload/dist/auth/operations/login.js:156`, `179`, or `215`), rewrites the
 * REST response to the exact generic `AuthenticationError` status (`401`) and body.
 */
export const maskLockedAuthAfterError: AfterErrorHook = ({ error, req, result }) => {
  const errName = (error as { name?: string } | null | undefined)?.name
  if (!(error instanceof LockedAuth) && errName !== 'LockedAuth') {
    return
  }

  const genericAuthErr = createGenericAuthenticationError(req.t)
  return {
    response: {
      ...result,
      errors: [
        {
          message: genericAuthErr.message,
        },
      ],
    },
    status: genericAuthErr.status,
  }
}
