import type { Endpoint, PayloadRequest, Where } from 'payload'

import {
  claimFailedQuoteForResend,
  restoreFailedQuoteAfterResendError,
} from '../jobs/quoteEmailState'
import { quoteRequestsToCsv } from './quoteRequestsCsv'

/**
 * P5-T2 §2 and §4 — admin-only endpoints on `quote-requests`:
 * - `POST /api/quote-requests/:id/resend-notification` re-queues the sales-inbox e-mail for a
 *   request whose `emailStatus` is `failed`;
 * - `GET /api/quote-requests/export-csv` downloads the requests matching the list view's current
 *   filter as a formula-safe CSV (Q3). Every export is logged with the user ID and row count only.
 * Editors (and everyone else) get 403 from both: the check is here, on the server, not only in
 * the admin UI.
 */

const json = (body: Record<string, unknown>, status: number): Response =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

function isAdminUser(req: PayloadRequest): boolean {
  const user = req.user as { role?: string } | null | undefined
  return user?.role === 'admin'
}

function readRequestId(req: PayloadRequest): number | null {
  const raw = req.routeParams?.id
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return null
  }
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export const resendQuoteNotificationEndpoint: Endpoint = {
  path: '/:id/resend-notification',
  method: 'post',
  handler: async (req) => {
    if (!isAdminUser(req)) {
      return json({ message: 'Forbidden' }, 403)
    }
    const id = readRequestId(req)
    if (id === null) {
      return json({ message: 'Invalid request ID' }, 400)
    }
    const claimed = await claimFailedQuoteForResend(req.payload, id)
    if (!claimed) {
      // Not failed (already pending, sent, or gone): nothing is queued, so nothing can double-send.
      return json({ message: 'Only a request whose notification failed can be resent' }, 409)
    }
    try {
      await req.payload.jobs.queue({
        task: 'notifyQuoteRequest',
        input: { quoteRequestId: id },
        queue: 'default',
        overrideAccess: true,
      })
    } catch {
      await restoreFailedQuoteAfterResendError(req.payload, id)
      req.payload.logger.error(
        { quoteRequestId: id },
        'quote notification resend could not be queued',
      )
      return json({ message: 'The resend could not be queued' }, 500)
    }
    req.payload.logger.info(
      { quoteRequestId: id, userId: req.user?.id },
      'quote notification resend queued',
    )
    return json({ queued: true }, 202)
  },
}

const SEARCH_FIELDS = ['name', 'company', 'email', 'phone'] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The list view's filter (`where[...]`) plus its search box (`search`), as one `Where`. */
export function exportWhereFromQuery(query: Record<string, unknown>): Where {
  const clauses: Where[] = []
  if (isPlainObject(query.where)) {
    clauses.push(query.where as Where)
  }
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  if (search) {
    clauses.push({ or: SEARCH_FIELDS.map((field) => ({ [field]: { like: search } })) })
  }
  if (clauses.length === 0) {
    return {}
  }
  return clauses.length === 1 ? (clauses[0] ?? {}) : { and: clauses }
}

export const exportQuoteRequestsCsvEndpoint: Endpoint = {
  path: '/export-csv',
  method: 'get',
  handler: async (req) => {
    if (!isAdminUser(req)) {
      return json({ message: 'Forbidden' }, 403)
    }
    const where = exportWhereFromQuery(req.query)
    // Runs as the logged-in admin with normal access rules (overrideAccess: false).
    const result = await req.payload.find({
      collection: 'quote-requests',
      where,
      depth: 1,
      pagination: false,
      sort: '-createdAt',
      overrideAccess: false,
      user: req.user,
      req,
    })
    const language = req.i18n.language === 'ar' ? 'ar' : 'en'
    const csv = quoteRequestsToCsv(result.docs, language)
    req.payload.logger.info(
      { userId: req.user?.id, rows: result.docs.length, at: new Date().toISOString() },
      'quote-requests CSV export',
    )
    const day = new Date().toISOString().slice(0, 10)
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="quote-requests-${day}.csv"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  },
}

export const quoteRequestEndpoints: Endpoint[] = [
  exportQuoteRequestsCsvEndpoint,
  resendQuoteNotificationEndpoint,
]
