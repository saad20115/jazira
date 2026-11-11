import { sql } from '@payloadcms/db-postgres'
import { REST_POST as createRestPost } from '@payloadcms/next/routes'
import { getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import payloadConfig from '../../src/payload.config'

const POST = createRestPost(payloadConfig)

async function postLogin(
  email: string,
  password: string,
  acceptLanguage: 'ar' | 'en',
): Promise<{ status: number; rawText: string }> {
  const req = new Request('http://localhost:3000/api/users/login', {
    body: JSON.stringify({ email, password }),
    headers: { 'accept-language': acceptLanguage, 'content-type': 'application/json' },
    method: 'POST',
  })
  const res = await POST(req, { params: Promise.resolve({ slug: ['users', 'login'] }) })
  return { status: res.status, rawText: await res.text() }
}

const TRUNCATE = sql`TRUNCATE TABLE "users_sessions", "users", "payload_locked_documents", "payload_locked_documents_rels", "payload_preferences", "payload_preferences_rels" RESTART IDENTITY CASCADE`

/**
 * P2-T7 §7 (carried from the P2-T9 review): the parallel-race path. Two requests can both pass the
 * `beforeOperation` check while the account is still unlocked; the slower one then meets a locked
 * account inside Payload's `loginOperation`, which throws `LockedAuth`. `maskLockedAuthAfterError`
 * must turn that into the same 401 as an unknown e-mail.
 *
 * The race is made deterministic: the account is locked in the database, and the hook's own lookup
 * (the first `db.findOne` of the request) is answered with the state from just before the lock.
 */
describe('P2-T7 §7 login hardening: LockedAuth raised inside loginOperation is masked', () => {
  let payload: Payload
  const execute = (query: unknown): unknown =>
    (payload.db as unknown as { drizzle: { execute: (q: unknown) => unknown } }).drizzle.execute(
      query,
    )

  beforeAll(async () => {
    const { assertTestDatabaseIsolation } = await import('./_helpers/testDbIsolation')
    assertTestDatabaseIsolation()
    payload = await getPayload({ config: payloadConfig })
    await payload.db.migrate()
    await execute(TRUNCATE)
  }, 60_000)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await execute(TRUNCATE)
  })

  it('answers the generic 401, byte for byte, in Arabic and English', async () => {
    const email = 'staff-p2t7-race@aljazira.co'
    const password = 'Str0ng!Staff#Pass2026$P2T7'
    const user = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { name: 'P2-T7 race test', email, password, role: 'editor' },
    })

    for (const language of ['ar', 'en'] as const) {
      const unknown = await postLogin('nobody-p2t7@aljazira.co', 'Wrong!Password#Probe1', language)
      expect(unknown.status).toBe(401)

      // The account becomes locked "between" the hook's check and loginOperation.
      await payload.db.updateOne({
        collection: 'users',
        id: user.id,
        data: { lockUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(), loginAttempts: 5 },
      })
      const realFindOne = payload.db.findOne.bind(payload.db)
      const findOne = vi.spyOn(payload.db, 'findOne')
      findOne.mockImplementationOnce(async (args) => {
        const found = await realFindOne(args)
        return found ? { ...found, lockUntil: null, loginAttempts: 4 } : found
      })

      // The right password, so only the lock can refuse this login.
      const raced = await postLogin(email, password, language)

      // The hook's lookup was the stale one; Payload's own lookup came after it.
      expect(findOne.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(raced.status).toBe(401)
      expect(raced.rawText).toBe(unknown.rawText)
      expect(raced.rawText.toLowerCase()).not.toContain('lock')
      expect(raced.rawText).not.toContain('مقفل')
      vi.restoreAllMocks()
    }

    // Still locked afterwards: the masked request did not unlock or log in.
    const after = await payload.db.findOne<{ id: number | string; lockUntil?: string | null }>({
      collection: 'users',
      where: { id: { equals: user.id } },
    })
    expect(after?.lockUntil).toBeTruthy()
  })
})
