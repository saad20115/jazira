import type { PayloadRequest } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  exportQuoteRequestsCsvEndpoint,
  exportWhereFromQuery,
  resendQuoteNotificationEndpoint,
} from './quoteRequestEndpoints'

/** A fake request: the e-mail state of request 7 lives in memory, like one Postgres row. */
function createReq(role: string | null, emailStatus: 'pending' | 'sent' | 'failed' = 'failed') {
  const row = { emailStatus }
  const queued: unknown[] = []
  const found: unknown[] = []
  const req = {
    user: role ? { id: 1, role } : null,
    routeParams: { id: '7' },
    query: {},
    i18n: { language: 'en' },
    payload: {
      db: {
        drizzle: {
          execute: (query: { queryChunks?: unknown[] }) => {
            const text = JSON.stringify(query.queryChunks ?? '')
            if (
              text.includes('AND \\"email_status\\" = \'failed\'') &&
              row.emailStatus === 'failed'
            ) {
              row.emailStatus = 'pending'
              return Promise.resolve({ rows: [{ id: 7 }] })
            }
            return Promise.resolve({ rows: [] })
          },
        },
      },
      jobs: {
        queue: (args: unknown) => {
          queued.push(args)
          return Promise.resolve({ id: queued.length })
        },
      },
      find: (args: unknown) => {
        found.push(args)
        return Promise.resolve({ docs: [] })
      },
      logger: { info: () => undefined, error: () => undefined },
    },
  }
  return { req: req as unknown as PayloadRequest, row, queued, found }
}

describe('P5-T2 §2 — Resend notification endpoint (admin only, no double send)', () => {
  it('an editor cannot resend (403) and nothing is queued', async () => {
    const { req, queued, row } = createReq('editor')
    const response = await resendQuoteNotificationEndpoint.handler(req)
    expect(response.status).toBe(403)
    expect(queued).toHaveLength(0)
    expect(row.emailStatus).toBe('failed')
  })

  it('an anonymous caller cannot resend (403)', async () => {
    const { req, queued } = createReq(null)
    const response = await resendQuoteNotificationEndpoint.handler(req)
    expect(response.status).toBe(403)
    expect(queued).toHaveLength(0)
  })

  it('an admin resends a failed request once; a second click is refused (409) and queues nothing', async () => {
    const { req, queued, row } = createReq('admin', 'failed')
    const first = await resendQuoteNotificationEndpoint.handler(req)
    const second = await resendQuoteNotificationEndpoint.handler(req)
    expect(first.status).toBe(202)
    expect(second.status).toBe(409)
    expect(queued).toEqual([
      {
        task: 'notifyQuoteRequest',
        input: { quoteRequestId: 7 },
        queue: 'default',
        overrideAccess: true,
      },
    ])
    expect(row.emailStatus).toBe('pending')
  })

  it('a request that was already sent cannot be resent (409)', async () => {
    const { req, queued } = createReq('admin', 'sent')
    const response = await resendQuoteNotificationEndpoint.handler(req)
    expect(response.status).toBe(409)
    expect(queued).toHaveLength(0)
  })
})

describe('P5-T2 §4 — CSV export endpoint (admin only)', () => {
  it('an editor cannot export (403) and no data is read', async () => {
    const { req, found } = createReq('editor')
    const response = await exportQuoteRequestsCsvEndpoint.handler(req)
    expect(response.status).toBe(403)
    expect(found).toHaveLength(0)
  })

  it('an admin gets a UTF-8 CSV download read with normal access rules', async () => {
    const { req, found } = createReq('admin')
    const response = await exportQuoteRequestsCsvEndpoint.handler(req)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('content-disposition')).toMatch(
      /^attachment; filename="quote-requests-/,
    )
    expect(found[0]).toMatchObject({ collection: 'quote-requests', overrideAccess: false })
    // The downloaded bytes start with the UTF-8 BOM (Response.text() would strip it on decode).
    const bytes = new Uint8Array(await response.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  })

  it('exports the current filter and search of the list view', () => {
    expect(exportWhereFromQuery({})).toEqual({})
    expect(exportWhereFromQuery({ where: { status: { equals: 'new' } } })).toEqual({
      status: { equals: 'new' },
    })
    expect(
      exportWhereFromQuery({ where: { status: { equals: 'new' } }, search: ' Ahmad ' }),
    ).toEqual({
      and: [
        { status: { equals: 'new' } },
        {
          or: [
            { name: { like: 'Ahmad' } },
            { company: { like: 'Ahmad' } },
            { email: { like: 'Ahmad' } },
            { phone: { like: 'Ahmad' } },
          ],
        },
      ],
    })
    expect(exportWhereFromQuery({ where: 'not-an-object' })).toEqual({})
  })
})
