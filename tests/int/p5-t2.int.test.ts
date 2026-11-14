import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

/**
 * The SMTP side is replaced by a recorder so the tests can make it fail on purpose; everything
 * else (Payload, the jobs runner, the Postgres row lock, REST routes, access control) is real.
 */
const smtp = vi.hoisted(() => ({
  down: false,
  delayMs: 0,
  sent: [] as { to: string; subject: string }[],
}))

vi.mock('../../src/security/emailAdapter', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/security/emailAdapter')>()
  return {
    ...original,
    sendEmailAndWait: async (_payload: object, message: { to: string; subject: string }) => {
      if (smtp.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, smtp.delayMs))
      }
      if (smtp.down) {
        throw Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:1025'), {
          code: 'ECONNREFUSED',
        })
      }
      smtp.sent.push({ to: message.to, subject: message.subject })
    },
  }
})

import { createPublicQuoteRequest } from '../../src/lib/cms/client'
import { QUOTE_NOTIFICATION_MAX_ATTEMPTS } from '../../src/jobs/quoteNotificationCore'

type RouteHandler = (
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
) => Promise<Response>

const SALES_INBOX = 'sales-inbox-p5t2@example.test'
const VISITOR_EMAIL = 'p5t2-visitor@example.test'

let payload: Payload
let restGet: RouteHandler
let restPost: RouteHandler
let adminToken = ''
let editorToken = ''

async function callApi(
  method: 'GET' | 'POST',
  slugPath: string[],
  options: { token?: string; search?: string } = {},
): Promise<Response> {
  const headers = new Headers({ Origin: 'http://localhost:3000' })
  if (options.token) headers.set('Authorization', `JWT ${options.token}`)
  const url = `http://localhost:3000/api/${slugPath.join('/')}${options.search ?? ''}`
  const request = new Request(url, { method, headers })
  const context = { params: Promise.resolve({ slug: slugPath }) }
  return (method === 'GET' ? restGet : restPost)(request, context)
}

async function newRequest(overrides: Record<string, unknown> = {}): Promise<number> {
  const { id } = await createPublicQuoteRequest({
    name: 'P5T2 Visitor',
    email: VISITOR_EMAIL,
    phone: '+966573534185',
    consent: true,
    locale: 'en',
    ...overrides,
  })
  return id
}

async function readRequest(id: number) {
  return payload.findByID({ collection: 'quote-requests', id, overrideAccess: true, depth: 0 })
}

async function jobsFor(id: number) {
  const found = await payload.find({
    collection: 'payload-jobs',
    where: { 'input.quoteRequestId': { equals: id } },
    overrideAccess: true,
    limit: 50,
  })
  return found.docs
}

/** Raw SQL for test set-up only (backdating createdAt, skipping a backoff wait). */
function db(): { execute: (query: ReturnType<typeof sql>) => Promise<unknown> } {
  return (
    payload.db as unknown as {
      drizzle: { execute: (query: ReturnType<typeof sql>) => Promise<unknown> }
    }
  ).drizzle
}

/** Lets a job that is waiting for its backoff run now (the retry policy itself is unit-tested). */
async function skipBackoff(): Promise<void> {
  await db().execute(sql`UPDATE "payload_jobs" SET "wait_until" = NULL`)
}

async function runJobs(): Promise<void> {
  await payload.jobs.run({ queue: 'default', limit: 20, overrideAccess: true, silent: true })
}

describe(
  'P5-T2 integration — notification job, resend, CSV export, retention (Q1–Q3, D3)',
  { shuffle: false },
  () => {
    beforeAll(async () => {
      process.env.SALES_INBOX = SALES_INBOX
      const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'aljazira-p5t2-'))
      process.env.MEDIA_DIR = path.join(tmpBase, 'media')
      process.env.VIDEOS_DIR = path.join(tmpBase, 'videos')
      process.env.UPLOAD_TMP_DIR = path.join(tmpBase, 'tmp')
      for (const dir of [
        process.env.MEDIA_DIR,
        process.env.VIDEOS_DIR,
        process.env.UPLOAD_TMP_DIR,
      ]) {
        await fs.mkdir(dir, { recursive: true })
      }
      const configModule = await import('../../src/payload.config')
      const routesModule = await import('@payloadcms/next/routes')
      const { assertTestDatabaseIsolation } = await import('./_helpers/testDbIsolation')
      assertTestDatabaseIsolation()
      restGet = routesModule.REST_GET(configModule.default)
      restPost = routesModule.REST_POST(configModule.default)
      payload = await getPayload({ config: configModule.default })
      await payload.db.migrateFresh({ forceAcceptWarning: true })

      for (const [role, email, password] of [
        ['admin', 'admin-p5t2@aljazira.co', 'Str0ng!Admin#Pass2026$P5t2'],
        ['editor', 'editor-p5t2@aljazira.co', 'Str0ng!Editor#Pass2026$P5t2'],
      ] as const) {
        await payload.create({
          collection: 'users',
          data: { name: `P5-T2 ${role}`, email, password, role },
          overrideAccess: true,
        })
        const login = await payload.login({ collection: 'users', data: { email, password } })
        if (role === 'admin') adminToken = login.token ?? ''
        else editorToken = login.token ?? ''
      }
    }, 120_000)

    beforeEach(() => {
      smtp.down = false
      smtp.delayMs = 0
      smtp.sent.length = 0
    })

    afterAll(async () => {
      for (const dir of [
        process.env.MEDIA_DIR,
        process.env.VIDEOS_DIR,
        process.env.UPLOAD_TMP_DIR,
      ]) {
        await fs.rm(dir ?? '', { recursive: true, force: true })
      }
    }, 60_000)

    it('a new request is e-mailed exactly once, to SALES_INBOX only, and marked sent', async () => {
      const id = await newRequest()
      await runJobs()
      await runJobs()
      expect(smtp.sent).toHaveLength(1)
      expect(smtp.sent[0]?.to).toBe(SALES_INBOX)
      expect(smtp.sent.map((message) => message.to)).not.toContain(VISITOR_EMAIL)
      expect(await readRequest(id)).toMatchObject({
        emailStatus: 'sent',
        emailAttempts: 1,
      })
    })

    it('the job running twice for one request does not double-send', async () => {
      const id = await newRequest()
      await payload.jobs.queue({
        task: 'notifyQuoteRequest',
        input: { quoteRequestId: id },
        queue: 'default',
        overrideAccess: true,
      })
      smtp.delayMs = 200 // keep the first send in flight while the second job takes the lock
      await runJobs()
      expect(smtp.sent).toHaveLength(1)
      expect(await readRequest(id)).toMatchObject({ emailStatus: 'sent', emailAttempts: 1 })
    })

    it('SMTP down: retried, then failed after the last attempt; the request is kept', async () => {
      smtp.down = true
      const id = await newRequest()
      for (let attempt = 1; attempt <= QUOTE_NOTIFICATION_MAX_ATTEMPTS; attempt += 1) {
        await skipBackoff()
        await runJobs()
        const doc = await readRequest(id)
        expect(doc.emailAttempts).toBe(attempt)
        expect(doc.emailStatus).toBe(
          attempt < QUOTE_NOTIFICATION_MAX_ATTEMPTS ? 'pending' : 'failed',
        )
      }
      // No further attempt after the last one, even if the runner is called again.
      await skipBackoff()
      await runJobs()
      const doc = await readRequest(id)
      expect(doc).toMatchObject({
        name: 'P5T2 Visitor',
        email: VISITOR_EMAIL,
        emailStatus: 'failed',
        emailAttempts: QUOTE_NOTIFICATION_MAX_ATTEMPTS,
      })
      expect(doc.emailLastError).toMatch(/^ECONNREFUSED/)
      expect(doc.emailLastError).not.toMatch(/127\.0\.0\.1/)
      expect(smtp.sent).toHaveLength(0)
      expect(await jobsFor(id)).toEqual([expect.objectContaining({ hasError: true })])
    })

    it('resend: an editor gets 403; an admin resends a failed request once; a second click is 409', async () => {
      smtp.down = true
      const id = await newRequest()
      for (let attempt = 1; attempt <= QUOTE_NOTIFICATION_MAX_ATTEMPTS; attempt += 1) {
        await skipBackoff()
        await runJobs()
      }
      expect((await readRequest(id)).emailStatus).toBe('failed')
      smtp.down = false

      const byEditor = await callApi(
        'POST',
        ['quote-requests', String(id), 'resend-notification'],
        {
          token: editorToken,
        },
      )
      expect(byEditor.status).toBe(403)
      const anonymous = await callApi('POST', ['quote-requests', String(id), 'resend-notification'])
      expect(anonymous.status).toBe(403)
      expect((await readRequest(id)).emailStatus).toBe('failed')

      const first = await callApi('POST', ['quote-requests', String(id), 'resend-notification'], {
        token: adminToken,
      })
      const second = await callApi('POST', ['quote-requests', String(id), 'resend-notification'], {
        token: adminToken,
      })
      expect(first.status).toBe(202)
      expect(second.status).toBe(409)

      await runJobs()
      await runJobs()
      expect(smtp.sent).toHaveLength(1)
      expect(smtp.sent[0]?.to).toBe(SALES_INBOX)
      expect(await readRequest(id)).toMatchObject({ emailStatus: 'sent' })

      const afterSent = await callApi(
        'POST',
        ['quote-requests', String(id), 'resend-notification'],
        {
          token: adminToken,
        },
      )
      expect(afterSent.status).toBe(409)
    })

    it('CSV export: editor 403; admin gets the current filter, formula-safe, without system fields', async () => {
      const formulaId = await newRequest({ name: '=SUM(A1)', company: '+1 Co', message: '@x' })
      await payload.update({
        collection: 'quote-requests',
        id: formulaId,
        data: { status: 'quoted', internalNotes: 'staff only note' },
        overrideAccess: true,
      })
      await newRequest({ name: 'Not Quoted' })

      const byEditor = await callApi('GET', ['quote-requests', 'export-csv'], {
        token: editorToken,
      })
      expect(byEditor.status).toBe(403)

      const infoSpy = vi.spyOn(payload.logger, 'info')
      const response = await callApi('GET', ['quote-requests', 'export-csv'], {
        token: adminToken,
        search: '?where[status][equals]=quoted',
      })
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
      const bytes = new Uint8Array(await response.clone().arrayBuffer())
      expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
      const csv = await response.text()
      expect(csv).toContain(`"'=SUM(A1)"`)
      expect(csv).toContain(`"'+1 Co"`)
      expect(csv).toContain(`"'@x"`)
      expect(csv).not.toContain('Not Quoted')
      expect(csv).not.toContain('staff only note')
      const exportLog = infoSpy.mock.calls.find((call) => call[1] === 'quote-requests CSV export')
      expect(exportLog?.[0]).toMatchObject({ rows: 1 })
      expect(JSON.stringify(exportLog?.[0])).not.toContain(VISITOR_EMAIL)
      infoSpy.mockRestore()
    })

    it('retention: a dry run deletes nothing; with deletion on, only requests older than 24 months go', async () => {
      const old = await newRequest({ name: 'Old Request' })
      const recent = await newRequest({ name: 'Recent Request' })
      await db().execute(
        sql`UPDATE "quote_requests" SET "created_at" = now() - interval '25 months' WHERE "id" = ${old}`,
      )
      await db().execute(
        sql`UPDATE "quote_requests" SET "created_at" = now() - interval '23 months' WHERE "id" = ${recent}`,
      )

      const runRetention = async () => {
        await payload.jobs.queue({
          task: 'purgeExpiredQuoteRequests',
          input: {},
          queue: 'retention-test',
          overrideAccess: true,
        })
        await payload.jobs.run({ queue: 'retention-test', overrideAccess: true, silent: true })
      }
      const exists = async (id: number) =>
        (
          await payload.count({
            collection: 'quote-requests',
            where: { id: { equals: id } },
            overrideAccess: true,
          })
        ).totalDocs === 1

      await runRetention()
      expect(await exists(old)).toBe(true)
      expect(await exists(recent)).toBe(true)

      await payload.updateGlobal({
        slug: 'site-settings',
        data: { quoteRetentionDeleteEnabled: true },
        overrideAccess: true,
      })
      await runRetention()
      expect(await exists(old)).toBe(false)
      expect(await exists(recent)).toBe(true)
    })

    it('the retention switch is admin-only and never public', async () => {
      const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: false })
      expect(settings).not.toHaveProperty('quoteRetentionDeleteEnabled')
    })
  },
)
