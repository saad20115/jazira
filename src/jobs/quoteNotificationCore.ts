import {
  buildQuoteNotificationEmail,
  type QuoteNotificationEmail,
  type QuoteNotificationInput,
} from '../email/quoteNotification'
import { sanitizeEmailError } from '../email/sanitizeEmailError'

/**
 * P5-T2 §1 (Q1, Q2) — the sales-inbox notification for one quote request, without Payload or a
 * database, so every rule is unit-testable:
 * - the only recipient is the configured `SALES_INBOX` (Q1: never the visitor's address);
 * - idempotent: the e-mail state is read and written under a per-request lock, and a request whose
 *   `emailStatus` is `sent` is never sent again, however many jobs run for it (Q2);
 * - every attempt is counted in `emailAttempts`; a failure stores a sanitized `emailLastError`;
 *   the request stays `pending` while the job runner will retry, and becomes `failed` on the
 *   last attempt (Q2). The request itself is never deleted or changed otherwise.
 */

/** Total attempts per job: the first try plus `QUOTE_NOTIFICATION_RETRIES.attempts` retries. */
export const QUOTE_NOTIFICATION_MAX_ATTEMPTS = 5

/**
 * Payload retries: wait 2^(tries so far) × 4 minutes → retries after 4, 8, 16 and 32 minutes, so
 * the five attempts span about one hour.
 */
export const QUOTE_NOTIFICATION_RETRIES = {
  attempts: QUOTE_NOTIFICATION_MAX_ATTEMPTS - 1,
  backoff: { type: 'exponential' as const, delay: 4 * 60 * 1000 },
}

export type QuoteEmailState = {
  emailStatus: 'pending' | 'sent' | 'failed'
  emailAttempts: number
}

export type QuoteEmailStateUpdate = QuoteEmailState & { emailLastError: string | null }

export type QuoteNotificationOutcome =
  | { kind: 'missing' }
  | { kind: 'already-sent' }
  | { kind: 'sent' }
  | { kind: 'failed-will-retry'; error: string }
  | { kind: 'failed-final'; error: string }

export interface QuoteNotificationDeps {
  /** The customer data for the e-mail (immutable after creation), or null if the request is gone. */
  loadRequest: (id: number) => Promise<QuoteNotificationInput | null>
  /**
   * Runs `fn` while holding a lock on the request's e-mail state (null when the request is gone)
   * and writes the update `fn` returns before releasing the lock.
   */
  withEmailStateLock: (
    id: number,
    fn: (state: QuoteEmailState | null) => Promise<QuoteEmailStateUpdate | null>,
  ) => Promise<void>
  /** Sends one message and rejects if the SMTP server does not accept it. */
  send: (message: QuoteNotificationEmail & { to: string }) => Promise<void>
  salesInbox: string | undefined
  adminBaseUrl: string
  /** Configured values that must never appear in a stored error (SMTP user/pass/host, inbox). */
  secrets: readonly (string | undefined)[]
}

export async function runQuoteNotification(
  deps: QuoteNotificationDeps,
  args: { quoteRequestId: number; attempt: number },
): Promise<QuoteNotificationOutcome> {
  const request = await deps.loadRequest(args.quoteRequestId)
  if (!request) {
    return { kind: 'missing' }
  }
  const isFinalAttempt = args.attempt >= QUOTE_NOTIFICATION_MAX_ATTEMPTS
  let outcome: QuoteNotificationOutcome = { kind: 'missing' }

  await deps.withEmailStateLock(args.quoteRequestId, async (state) => {
    if (!state) {
      outcome = { kind: 'missing' }
      return null
    }
    if (state.emailStatus === 'sent') {
      outcome = { kind: 'already-sent' }
      return null
    }
    const emailAttempts = state.emailAttempts + 1
    try {
      const salesInbox = deps.salesInbox?.trim()
      if (!salesInbox) {
        throw Object.assign(new Error('SALES_INBOX is not configured'), { code: 'ENOINBOX' })
      }
      const email = buildQuoteNotificationEmail(request, deps.adminBaseUrl)
      await deps.send({ ...email, to: salesInbox })
      outcome = { kind: 'sent' }
      return { emailStatus: 'sent', emailAttempts, emailLastError: null }
    } catch (error: unknown) {
      const sanitized = sanitizeEmailError(error, deps.secrets)
      outcome = isFinalAttempt
        ? { kind: 'failed-final', error: sanitized }
        : { kind: 'failed-will-retry', error: sanitized }
      return {
        emailStatus: isFinalAttempt ? 'failed' : 'pending',
        emailAttempts,
        emailLastError: sanitized,
      }
    }
  })

  return outcome
}
