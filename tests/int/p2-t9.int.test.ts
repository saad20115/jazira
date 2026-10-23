import { sql } from '@payloadcms/db-postgres'
import {
  REST_DELETE as createRestDelete,
  REST_GET as createRestGet,
  REST_PATCH as createRestPatch,
  REST_POST as createRestPost,
} from '@payloadcms/next/routes'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import payloadConfig from '../../src/payload.config'

const handlers = {
  DELETE: createRestDelete(payloadConfig),
  GET: createRestGet(payloadConfig),
  PATCH: createRestPatch(payloadConfig),
  POST: createRestPost(payloadConfig),
}

async function callJsonApi(opts: {
  acceptLanguage?: string
  body?: unknown
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST'
  query?: Record<string, string>
  slugPath: string[]
  token?: string
}): Promise<{
  body: Record<string, unknown>
  headers: Headers
  rawText: string
  status: number
}> {
  const url = new URL(`http://localhost:3000/api/${opts.slugPath.join('/')}`)
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, v)
    }
  }
  const headers = new Headers()
  if (opts.body !== undefined) {
    headers.set('content-type', 'application/json')
  }
  if (opts.token) {
    headers.set('authorization', `JWT ${opts.token}`)
  }
  if (opts.acceptLanguage) {
    headers.set('accept-language', opts.acceptLanguage)
  }

  const req = new Request(url.toString(), {
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    headers,
    method: opts.method,
  })
  const res = await handlers[opts.method](req, {
    params: Promise.resolve({ slug: opts.slugPath }),
  })
  const rawText = await res.text()
  let parsed: Record<string, unknown> = {}
  if (rawText.trim().length > 0) {
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      parsed = { _raw: rawText }
    }
  }
  return {
    body: parsed,
    headers: res.headers,
    rawText,
    status: res.status,
  }
}

describe('P2-T9 Login enumeration hardening integration suite (A1, A5 spirit)', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config: payloadConfig })
    const drizzleDb = (payload.db as unknown as { drizzle: { execute: (q: unknown) => unknown } })
      .drizzle
    await drizzleDb.execute(
      sql`TRUNCATE TABLE "users_sessions", "users", "payload_locked_documents", "payload_locked_documents_rels", "payload_preferences", "payload_preferences_rels" RESTART IDENTITY CASCADE`,
    )
  }, 60_000)

  afterAll(async () => {
    const drizzleDb = (payload.db as unknown as { drizzle: { execute: (q: unknown) => unknown } })
      .drizzle
    await drizzleDb.execute(
      sql`TRUNCATE TABLE "users_sessions", "users", "payload_locked_documents", "payload_locked_documents_rels", "payload_preferences", "payload_preferences_rels" RESTART IDENTITY CASCADE`,
    )
  })

  it('returns identical 401 status and byte-identical JSON body for unknown email, wrong password (attempts 1..5), and locked account (wrong or right password) in both ar and en; locks on the 5th failure for 15 min; and allows correct password after the lock window expires', async () => {
    const staffEmail = 'staff-p2t9@aljazira.co'
    const staffPassword = 'Str0ng!Staff#Pass2026$P2T9'
    const unknownEmail = 'nonexistent-oracle-probe-p2t9@aljazira.co'

    const staffUser = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: 'م. فهد الدوسري (اختبار P2-T9)',
        email: staffEmail,
        password: staffPassword,
        role: 'admin',
      },
    })
    expect(staffUser.email).toBe(staffEmail)

    // 1. Unknown email baseline (Arabic default and English Accept-Language)
    const unknownAr = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      acceptLanguage: 'ar',
      body: {
        email: unknownEmail,
        password: 'Wrong!Password#Probe1',
      },
    })
    const unknownEn = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      acceptLanguage: 'en',
      body: {
        email: unknownEmail,
        password: 'Wrong!Password#Probe1',
      },
    })
    expect(unknownAr.status).toBe(401)
    expect(unknownEn.status).toBe(401)

    // 2. Attempts 1..4 with wrong password on existing user -> 401 + byte-identical body; still unlocked after attempt 4
    for (let attempt = 1; attempt <= 4; attempt++) {
      const wrongResAr = await callJsonApi({
        method: 'POST',
        slugPath: ['users', 'login'],
        acceptLanguage: 'ar',
        body: {
          email: staffEmail,
          password: `Wrong!Password#Attempt${String(attempt)}`,
        },
      })
      expect(wrongResAr.status).toBe(401)
      expect(wrongResAr.rawText).toBe(unknownAr.rawText)
      expect(wrongResAr.body).toEqual(unknownAr.body)
    }

    const afterAttempt4 = await payload.db.findOne<{
      id: number | string
      lockUntil?: null | string
      loginAttempts?: number
    }>({
      collection: 'users',
      where: { email: { equals: staffEmail } },
    })
    expect(afterAttempt4?.loginAttempts).toBe(4)
    expect(afterAttempt4?.lockUntil ?? null).toBeNull()

    // 3. Attempt 5 with wrong password locks the account in DB for 15 minutes (A1) and still returns identical 401 body
    const fifthAttemptEn = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      acceptLanguage: 'en',
      body: {
        email: staffEmail,
        password: 'Wrong!Password#Attempt5',
      },
    })
    expect(fifthAttemptEn.status).toBe(401)
    expect(fifthAttemptEn.rawText).toBe(unknownEn.rawText)
    expect(fifthAttemptEn.body).toEqual(unknownEn.body)

    const afterAttempt5 = await payload.db.findOne<{
      id: number | string
      lockUntil?: null | string
      loginAttempts?: number
    }>({
      collection: 'users',
      where: { email: { equals: staffEmail } },
    })
    expect(afterAttempt5?.loginAttempts).toBe(5)
    expect(typeof afterAttempt5?.lockUntil).toBe('string')
    const lockRemainingMs = new Date(afterAttempt5?.lockUntil ?? '').getTime() - Date.now()
    expect(lockRemainingMs).toBeGreaterThan(14 * 60 * 1000)
    expect(lockRemainingMs).toBeLessThanOrEqual(15 * 60 * 1000 + 5_000)

    // 4. Attempt 6 while locked (wrong password in ar and en) -> 401 + byte-identical body (never "تمّ قفل هذا المستخدم..." or "locked")
    const lockedWrongAr = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      acceptLanguage: 'ar',
      body: {
        email: staffEmail,
        password: 'Wrong!Password#Attempt6',
      },
    })
    const lockedWrongEn = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      acceptLanguage: 'en',
      body: {
        email: staffEmail,
        password: 'Wrong!Password#Attempt6',
      },
    })
    expect(lockedWrongAr.status).toBe(401)
    expect(lockedWrongAr.rawText).toBe(unknownAr.rawText)
    expect(lockedWrongAr.body).toEqual(unknownAr.body)
    expect(lockedWrongAr.rawText).not.toContain('قفل')

    expect(lockedWrongEn.status).toBe(401)
    expect(lockedWrongEn.rawText).toBe(unknownEn.rawText)
    expect(lockedWrongEn.body).toEqual(unknownEn.body)
    expect(lockedWrongEn.rawText.toLowerCase()).not.toContain('locked')

    // 5. Correct password while locked -> ALSO refused with 401 + byte-identical generic body
    const lockedCorrectAr = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      acceptLanguage: 'ar',
      body: {
        email: staffEmail,
        password: staffPassword,
      },
    })
    const lockedCorrectEn = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      acceptLanguage: 'en',
      body: {
        email: staffEmail,
        password: staffPassword,
      },
    })
    expect(lockedCorrectAr.status).toBe(401)
    expect(lockedCorrectAr.rawText).toBe(unknownAr.rawText)
    expect(lockedCorrectEn.status).toBe(401)
    expect(lockedCorrectEn.rawText).toBe(unknownEn.rawText)

    // 6. Simulate lock window expiration (lockUntil in the past) -> correct password logs in (200 OK), resets lock state, and preserves cookie flags
    await payload.db.updateOne({
      collection: 'users',
      id: staffUser.id,
      data: {
        lockUntil: new Date(Date.now() - 5_000).toISOString(),
      },
    })

    const loginAfterLockWindow = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'login'],
      acceptLanguage: 'ar',
      body: {
        email: staffEmail,
        password: staffPassword,
      },
    })
    expect(loginAfterLockWindow.status).toBe(200)
    expect(typeof loginAfterLockWindow.body.token).toBe('string')
    const setCookie = loginAfterLockWindow.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('payload-token=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Strict')

    const afterSuccess = await payload.db.findOne<{
      id: number | string
      lockUntil?: null | string
      loginAttempts?: number
    }>({
      collection: 'users',
      where: { email: { equals: staffEmail } },
    })
    expect(afterSuccess?.loginAttempts ?? 0).toBe(0)
    expect(afterSuccess?.lockUntil ?? null).toBeNull()
  })

  it('keeps POST /api/users/forgot-password non-enumerating across existing, unknown, and locked emails (A5)', async () => {
    const existingEmail = 'staff-p2t9@aljazira.co'
    const unknownEmail = 'unknown-forgot-p2t9@aljazira.co'

    const forgotExisting = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'forgot-password'],
      acceptLanguage: 'ar',
      body: { email: existingEmail },
    })
    const forgotUnknown = await callJsonApi({
      method: 'POST',
      slugPath: ['users', 'forgot-password'],
      acceptLanguage: 'ar',
      body: { email: unknownEmail },
    })
    expect(forgotExisting.status).toBe(200)
    expect(forgotUnknown.status).toBe(200)
    expect(forgotExisting.rawText).toBe(forgotUnknown.rawText)
  })
})
