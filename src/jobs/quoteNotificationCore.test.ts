import { describe, expect, it } from 'vitest'

import type { QuoteNotificationInput } from '../email/quoteNotification'
import {
  QUOTE_NOTIFICATION_MAX_ATTEMPTS,
  QUOTE_NOTIFICATION_RETRIES,
  runQuoteNotification,
  type QuoteEmailState,
  type QuoteNotificationDeps,
} from './quoteNotificationCore'

const VISITOR_EMAIL = 'visitor@example.test'
const SALES_INBOX = 'sales-inbox@example.test'

const REQUEST: QuoteNotificationInput = {
  id: 7,
  name: 'Test Visitor',
  company: 'Test Company',
  email: VISITOR_EMAIL,
  phone: '+966573534185',
  locale: 'en',
}

type Sent = { to: string; subject: string }

/** An in-memory stand-in for the Postgres row lock: one holder at a time, per request. */
function createHarness(options: { failSends?: number | 'always'; initial?: QuoteEmailState } = {}) {
  const state: { value: QuoteEmailState | null; lastError: string | null } = {
    value: options.initial ?? { emailStatus: 'pending', emailAttempts: 0 },
    lastError: null,
  }
  const sent: Sent[] = []
  let failuresLeft =
    options.failSends === 'always' ? Number.POSITIVE_INFINITY : (options.failSends ?? 0)
  let lock: Promise<void> = Promise.resolve()

  const deps: QuoteNotificationDeps = {
    loadRequest: (id) => Promise.resolve(id === REQUEST.id ? REQUEST : null),
    withEmailStateLock: (_id, fn) => {
      const run = lock.then(async () => {
        const update = await fn(state.value ? { ...state.value } : null)
        if (update && state.value) {
          state.value = { emailStatus: update.emailStatus, emailAttempts: update.emailAttempts }
          state.lastError = update.emailLastError
        }
      })
      lock = run.catch(() => undefined)
      return run
    },
    send: async (message) => {
      // A real SMTP round trip yields to the event loop; so does this fake.
      await new Promise((resolve) => setTimeout(resolve, 5))
      if (failuresLeft > 0) {
        failuresLeft -= 1
        throw Object.assign(
          new Error(
            'connect ECONNREFUSED 10.0.0.5:587 (smtp.mail.example.test) user mailer pass S3cr3tPass!',
          ),
          { code: 'ECONNREFUSED' },
        )
      }
      sent.push({ to: message.to, subject: message.subject })
    },
    salesInbox: SALES_INBOX,
    adminBaseUrl: 'http://localhost:3000',
    secrets: ['mailer', 'S3cr3tPass!', 'smtp.mail.example.test', SALES_INBOX],
  }
  return { deps, state, sent }
}

describe('P5-T2 §1 — sales-inbox notification job (Q1, Q2)', () => {
  it('sends the e-mail exactly once, to SALES_INBOX only, and records it', async () => {
    const { deps, state, sent } = createHarness()
    const outcome = await runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 })
    expect(outcome).toEqual({ kind: 'sent' })
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe(SALES_INBOX)
    expect(state.value).toEqual({ emailStatus: 'sent', emailAttempts: 1 })
    expect(state.lastError).toBeNull()
  })

  it('never sends to the address the visitor typed (Q1)', async () => {
    const { deps, sent } = createHarness()
    await runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 })
    await runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 })
    expect(sent.map((message) => message.to)).not.toContain(VISITOR_EMAIL)
    expect(sent.every((message) => message.to === SALES_INBOX)).toBe(true)
  })

  it('the job running twice (one after the other) does not send twice', async () => {
    const { deps, sent } = createHarness()
    await runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 })
    const second = await runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 })
    expect(second).toEqual({ kind: 'already-sent' })
    expect(sent).toHaveLength(1)
  })

  it('two jobs running at the same time send once (the lock serialises them)', async () => {
    const { deps, sent } = createHarness()
    const outcomes = await Promise.all([
      runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 }),
      runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 }),
    ])
    expect(outcomes.map((outcome) => outcome.kind).sort()).toEqual(['already-sent', 'sent'])
    expect(sent).toHaveLength(1)
  })

  it('SMTP down: every attempt is counted, the request stays pending until the last attempt, then failed', async () => {
    const { deps, state, sent } = createHarness({ failSends: 'always' })
    for (let attempt = 1; attempt < QUOTE_NOTIFICATION_MAX_ATTEMPTS; attempt += 1) {
      const outcome = await runQuoteNotification(deps, { quoteRequestId: 7, attempt })
      expect(outcome.kind).toBe('failed-will-retry')
      expect(state.value).toEqual({ emailStatus: 'pending', emailAttempts: attempt })
    }
    const last = await runQuoteNotification(deps, {
      quoteRequestId: 7,
      attempt: QUOTE_NOTIFICATION_MAX_ATTEMPTS,
    })
    expect(last.kind).toBe('failed-final')
    expect(state.value).toEqual({
      emailStatus: 'failed',
      emailAttempts: QUOTE_NOTIFICATION_MAX_ATTEMPTS,
    })
    expect(sent).toHaveLength(0)
  })

  it('stores a sanitized error: no SMTP user, password, host, IP or inbox (Q2)', async () => {
    const { deps, state } = createHarness({ failSends: 1 })
    await runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 })
    const stored = state.lastError ?? ''
    expect(stored).toMatch(/^ECONNREFUSED/)
    for (const leaked of [
      'mailer',
      'S3cr3tPass!',
      'smtp.mail.example.test',
      '10.0.0.5',
      SALES_INBOX,
    ]) {
      expect(stored).not.toContain(leaked)
    }
    expect(stored.length).toBeLessThanOrEqual(500)
  })

  it('a resend after failure sends once, and a second job for it sends nothing more', async () => {
    const { deps, state, sent } = createHarness({
      initial: { emailStatus: 'failed', emailAttempts: QUOTE_NOTIFICATION_MAX_ATTEMPTS },
    })
    // The resend endpoint moves failed -> pending and queues a new job (attempt 1 of that job).
    state.value = { emailStatus: 'pending', emailAttempts: QUOTE_NOTIFICATION_MAX_ATTEMPTS }
    const first = await runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 })
    const again = await runQuoteNotification(deps, { quoteRequestId: 7, attempt: 1 })
    expect(first).toEqual({ kind: 'sent' })
    expect(again).toEqual({ kind: 'already-sent' })
    expect(sent).toHaveLength(1)
    expect(state.value).toEqual({
      emailStatus: 'sent',
      emailAttempts: QUOTE_NOTIFICATION_MAX_ATTEMPTS + 1,
    })
  })

  it('a missing SALES_INBOX is a failure (retried), never a send to anyone else', async () => {
    const { deps, state, sent } = createHarness()
    const outcome = await runQuoteNotification(
      { ...deps, salesInbox: undefined },
      { quoteRequestId: 7, attempt: 1 },
    )
    expect(outcome.kind).toBe('failed-will-retry')
    expect(sent).toHaveLength(0)
    expect(state.lastError).toMatch(/^ENOINBOX/)
  })

  it('a deleted request is skipped without sending', async () => {
    const { deps, sent } = createHarness()
    const outcome = await runQuoteNotification(deps, { quoteRequestId: 999, attempt: 1 })
    expect(outcome).toEqual({ kind: 'missing' })
    expect(sent).toHaveLength(0)
  })

  it('retry policy: 5 attempts with exponential backoff spanning about an hour', () => {
    expect(QUOTE_NOTIFICATION_RETRIES.attempts + 1).toBe(QUOTE_NOTIFICATION_MAX_ATTEMPTS)
    expect(QUOTE_NOTIFICATION_RETRIES.backoff.type).toBe('exponential')
    // Payload waits 2^(tries so far) × delay before each retry.
    let totalWaitMs = 0
    for (let tried = 0; tried < QUOTE_NOTIFICATION_RETRIES.attempts; tried += 1) {
      totalWaitMs += 2 ** tried * QUOTE_NOTIFICATION_RETRIES.backoff.delay
    }
    expect(totalWaitMs).toBe(60 * 60 * 1000)
  })
})
