import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  handleQuoteSubmission,
  issueQuoteStartToken,
  type QuoteHandlerDeps,
} from '../../src/app/(frontend)/[locale]/contact/quote-handler'
import { createPublicQuoteRequest, recordQuoteSubmissionAttempt } from '../../src/lib/cms/client'
import { hashIp } from '../../src/lib/ipHash'

type RouteHandler = (
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
) => Promise<Response>

let payload: Payload
let restGet: RouteHandler
let restPost: RouteHandler
let restPatch: RouteHandler
let adminToken = ''

const KEY = 'p5-t1-int-test-signing-key-0123456789-abcdefghijklmnopqrstuvwxyz'
const VISITOR_EMAIL = 'p5t1-visitor@example.test'
const VISITOR_PHONE = '+966 57 353 4185'
const VISITOR_NAME = 'P5T1 Visitor Name'

async function callApi(
  method: 'GET' | 'POST' | 'PATCH',
  slugPath: string[],
  options: { token?: string; body?: unknown } = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers = new Headers({ Origin: 'http://localhost:3000' })
  if (options.token) headers.set('Authorization', `JWT ${options.token}`)
  let body: string | undefined
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }
  const request = new Request(`http://localhost:3000/api/${slugPath.join('/')}`, {
    method,
    headers,
    body,
  })
  const context = { params: Promise.resolve({ slug: slugPath }) }
  const handler = method === 'GET' ? restGet : method === 'POST' ? restPost : restPatch
  const response = await handler(request, context)
  return {
    status: response.status,
    body: (await response.json().catch(() => ({}))) as Record<string, unknown>,
  }
}

function formInput(
  nowMs: number,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    projectType: 'commercial-office',
    projectStage: 'tender',
    servicesNeeded: ['electrical', 'low-current'],
    projectLocation: 'riyadh',
    name: VISITOR_NAME,
    company: 'P5T1 Company',
    phone: VISITOR_PHONE,
    email: VISITOR_EMAIL,
    preferredContact: 'email',
    message: 'Integration test request.',
    consent: true,
    locale: 'en',
    sourcePage: '/en/contact',
    honeypot: '',
    startedAtMs: nowMs - 10_000,
    startToken: issueQuoteStartToken(nowMs - 10_000, KEY),
    ...overrides,
  }
}

function realDeps(ip: string, nowMs: number = Date.now()): QuoteHandlerDeps {
  return {
    nowMs,
    ipHash: hashIp(ip),
    userAgent: 'p5-t1-int-test',
    signingKey: KEY,
    turnstileEnabled: false,
    recordAttempt: recordQuoteSubmissionAttempt,
    saveRequest: createPublicQuoteRequest,
    verifyTurnstile: () => Promise.resolve(false),
  }
}

async function quoteCount(): Promise<number> {
  return (await payload.count({ collection: 'quote-requests', overrideAccess: true })).totalDocs
}

describe(
  'P5-T1 integration — quote handler against Postgres (I6, Z4, D2)',
  { shuffle: false },
  () => {
    beforeAll(async () => {
      const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'aljazira-p5t1-'))
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
      restPatch = routesModule.REST_PATCH(configModule.default)
      payload = await getPayload({ config: configModule.default })
      await payload.db.migrateFresh({ forceAcceptWarning: true })

      const password = 'Str0ng!Admin#Pass2026$P5t1'
      await payload.create({
        collection: 'users',
        data: { name: 'P5-T1 Admin', email: 'admin-p5t1@aljazira.co', password, role: 'admin' },
        overrideAccess: true,
      })
      const login = await payload.login({
        collection: 'users',
        data: { email: 'admin-p5t1@aljazira.co', password },
      })
      adminToken = login.token ?? ''
    }, 120_000)

    afterAll(async () => {
      for (const dir of [
        process.env.MEDIA_DIR,
        process.env.VIDEOS_DIR,
        process.env.UPLOAD_TMP_DIR,
      ]) {
        await fs.rm(dir ?? '', { recursive: true, force: true })
      }
    }, 60_000)

    it('a valid submission is saved as new/pending with its answers, and a notification job is queued', async () => {
      const before = await quoteCount()
      const result = await handleQuoteSubmission(
        formInput(Date.now(), { status: 'closed', emailStatus: 'sent' }),
        realDeps('203.0.113.10'),
      )
      expect(result).toEqual({ ok: true })
      expect(await quoteCount()).toBe(before + 1)

      const found = await payload.find({
        collection: 'quote-requests',
        where: { email: { equals: VISITOR_EMAIL } },
        overrideAccess: true,
        limit: 1,
      })
      const doc = found.docs[0]
      expect(doc).toBeDefined()
      expect(doc).toMatchObject({
        status: 'new',
        emailStatus: 'pending',
        phone: '+966573534185',
        projectType: 'commercial-office',
        projectStage: 'tender',
        servicesNeeded: ['electrical', 'low-current'],
        projectLocation: 'riyadh',
        preferredContact: 'email',
        serviceTitle: 'Electrical, Low Current',
        ipHash: hashIp('203.0.113.10'),
        locale: 'en',
      })

      const jobs = await payload.find({
        collection: 'payload-jobs',
        where: { taskSlug: { equals: 'notifyQuoteRequest' } },
        overrideAccess: true,
        limit: 10,
      })
      const inputs = jobs.docs.map(
        (job) => (job.input as { quoteRequestId?: number }).quoteRequestId,
      )
      expect(inputs).toContain(doc.id)
    })

    it('a filled honeypot, a too-fast form, an over-long field and consent false save nothing', async () => {
      const now = Date.now()
      const before = await quoteCount()
      const cases: Array<[string, Record<string, unknown>]> = [
        ['198.51.100.21', { honeypot: 'http://spam.example' }],
        ['198.51.100.22', { startToken: issueQuoteStartToken(now - 1_000, KEY) }],
        ['198.51.100.23', { name: 'x'.repeat(121) }],
        ['198.51.100.24', { consent: false }],
      ]
      for (const [ip, overrides] of cases) {
        await handleQuoteSubmission(formInput(now, overrides), realDeps(ip, now))
      }
      expect(await quoteCount()).toBe(before)
    })

    it('the 4th attempt within a minute is rate-limited, and the hits live in Postgres', async () => {
      const ip = '192.0.2.44'
      const results = []
      for (let i = 0; i < 4; i += 1) {
        results.push(await handleQuoteSubmission(formInput(Date.now()), realDeps(ip)))
      }
      expect(results.slice(0, 3)).toEqual([{ ok: true }, { ok: true }, { ok: true }])
      expect(results[3]).toEqual({ ok: false, formError: 'rateLimited' })

      // A fresh SQL query on the database itself (not the app's memory) sees every hit, which is
      // why a restart does not reset the limit.
      const pool = (
        payload.db as unknown as {
          pool: {
            query: (sql: string, values: unknown[]) => Promise<{ rows: Array<{ n: string }> }>
          }
        }
      ).pool
      const { rows } = await pool.query(
        'SELECT count(*)::text AS n FROM quote_rate_limits WHERE ip_hash = $1',
        [hashIp(ip)],
      )
      expect(rows[0]?.n).toBe('4')
    })

    it('Z4: REST POST /api/quote-requests is 403 for anonymous and admin; rate-limit rows are closed to the API', async () => {
      const body = { name: 'REST', email: 'rest@example.test', phone: VISITOR_PHONE, consent: true }
      expect((await callApi('POST', ['quote-requests'], { body })).status).toBe(403)
      expect((await callApi('POST', ['quote-requests'], { body, token: adminToken })).status).toBe(
        403,
      )
      expect((await callApi('GET', ['quote-rate-limits'])).status).toBe(403)
      expect((await callApi('GET', ['quote-rate-limits'], { token: adminToken })).status).toBe(403)
      expect(
        (
          await callApi('POST', ['quote-rate-limits'], {
            body: { ipHash: 'a'.repeat(64) },
            token: adminToken,
          })
        ).status,
      ).toBe(403)
    })

    it('the new form answers are read-only for staff', async () => {
      const found = await payload.find({
        collection: 'quote-requests',
        where: { email: { equals: VISITOR_EMAIL } },
        overrideAccess: true,
        limit: 1,
      })
      const id = found.docs[0]?.id
      expect(id).toBeDefined()
      await callApi('PATCH', ['quote-requests', String(id)], {
        token: adminToken,
        body: { projectType: 'other', servicesNeeded: ['plumbing'], status: 'contacted' },
      })
      const after = await payload.findByID({
        collection: 'quote-requests',
        id,
        overrideAccess: true,
      })
      expect(after.projectType).toBe('commercial-office')
      expect(after.servicesNeeded).toEqual(['electrical', 'low-current'])
      expect(after.status).toBe('contacted')
    })

    it('D2: the logger never receives the visitor email, phone or name during a submission', async () => {
      const seen: string[] = []
      const spies = (['info', 'warn', 'error', 'debug'] as const).map((level) =>
        vi.spyOn(payload.logger, level).mockImplementation((...args: unknown[]) => {
          seen.push(JSON.stringify(args))
        }),
      )
      try {
        await handleQuoteSubmission(
          formInput(Date.now(), { email: 'd2-check@example.test' }),
          realDeps('192.0.2.77'),
        )
      } finally {
        for (const spy of spies) spy.mockRestore()
      }
      const log = seen.join('\n')
      expect(log).not.toContain('d2-check@example.test')
      expect(log).not.toContain('573534185')
      expect(log).not.toContain(VISITOR_NAME)
    })
  },
)
