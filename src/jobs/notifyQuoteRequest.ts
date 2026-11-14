import type { TaskConfig } from 'payload'

import type { QuoteNotificationInput } from '../email/quoteNotification'
import { sendEmailAndWait } from '../security/emailAdapter'
import { withQuoteEmailStateLock } from './quoteEmailState'
import { QUOTE_NOTIFICATION_RETRIES, runQuoteNotification } from './quoteNotificationCore'

export const NOTIFY_QUOTE_REQUEST_TASK_SLUG = 'notifyQuoteRequest'

/**
 * P5-T2 §1 — the job queued after every saved quote request (P5-T1 queued it as a no-op). It
 * e-mails the P5-T1 template to `SALES_INBOX` only (Q1), retries with exponential backoff, and
 * is idempotent (Q2). The rules live in `quoteNotificationCore.ts`; this file wires them to
 * Payload, Postgres and the SMTP adapter.
 *
 * A failed attempt throws a sanitized error so the job runner schedules the retry; the runner
 * logs that error and the job input (the request ID only — no PII, D2).
 */
export const notifyQuoteRequestTask: TaskConfig<{
  input: { quoteRequestId: number }
  output: { handled: boolean; outcome: string }
}> = {
  slug: NOTIFY_QUOTE_REQUEST_TASK_SLUG,
  label: 'Notify the sales inbox about a quote request',
  inputSchema: [{ name: 'quoteRequestId', type: 'number', required: true }],
  outputSchema: [
    { name: 'handled', type: 'checkbox' },
    { name: 'outcome', type: 'text' },
  ],
  retries: QUOTE_NOTIFICATION_RETRIES,
  handler: async ({ input, job, req }) => {
    const { payload } = req
    const outcome = await runQuoteNotification(
      {
        loadRequest: async (id) => {
          // z6-allow-override-access: server-side job reading the customer fields of one request; nothing is returned to a client
          const doc = await payload.findByID({
            collection: 'quote-requests',
            id,
            depth: 0,
            disableErrors: true,
            overrideAccess: true,
          })
          if (!doc) {
            return null
          }
          const data: QuoteNotificationInput = {
            id: doc.id,
            name: doc.name,
            company: doc.company,
            email: doc.email,
            phone: doc.phone,
            preferredContact: doc.preferredContact,
            projectType: doc.projectType,
            projectStage: doc.projectStage,
            projectLocation: doc.projectLocation,
            servicesNeeded: doc.servicesNeeded,
            message: doc.message,
            locale: doc.locale,
          }
          return data
        },
        withEmailStateLock: (id, fn) => withQuoteEmailStateLock(payload, id, fn),
        send: (message) =>
          sendEmailAndWait(payload, {
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
          }),
        salesInbox: process.env.SALES_INBOX,
        adminBaseUrl: payload.config.serverURL,
        secrets: [
          process.env.SMTP_USER,
          process.env.SMTP_PASS,
          process.env.SMTP_HOST,
          process.env.SALES_INBOX,
        ],
      },
      { quoteRequestId: input.quoteRequestId, attempt: (job.totalTried ?? 0) + 1 },
    )

    if (outcome.kind === 'failed-will-retry' || outcome.kind === 'failed-final') {
      throw new Error(
        `quote notification for request ${String(input.quoteRequestId)} failed: ${outcome.error}`,
      )
    }
    if (outcome.kind === 'missing') {
      payload.logger.info(
        { quoteRequestId: input.quoteRequestId },
        'quote notification skipped: the request no longer exists',
      )
    }
    return {
      output: {
        handled: outcome.kind === 'sent' || outcome.kind === 'already-sent',
        outcome: outcome.kind,
      },
    }
  },
}
