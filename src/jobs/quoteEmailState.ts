import { sql } from '@payloadcms/db-postgres'

import type { QuoteEmailState, QuoteEmailStateUpdate } from './quoteNotificationCore'

/**
 * P5-T2 (Q2) — the e-mail state of a quote request, read and written in Postgres under a row lock.
 *
 * The lock (`SELECT … FOR UPDATE` inside one transaction) is what makes the notification
 * idempotent when two jobs for the same request run at the same time: the second waits for the
 * first to commit, then sees `sent` and stops. The update is written in the same transaction, so
 * no other code path sees a half-finished state.
 *
 * Raw SQL is used because the Local API cannot hold a row lock across the SMTP send.
 */

type SqlQuery = ReturnType<typeof sql>
type QueryResult = { rows: Record<string, unknown>[] }
type DrizzleExecutor = { execute: (query: SqlQuery) => Promise<QueryResult> }
type DrizzleDatabase = DrizzleExecutor & {
  transaction: <T>(fn: (tx: DrizzleExecutor) => Promise<T>) => Promise<T>
}

function drizzleOf(payload: { db: unknown }): DrizzleDatabase {
  const db = payload.db as { drizzle?: DrizzleDatabase } | null
  if (!db?.drizzle) {
    throw new Error('quote e-mail state: the Postgres adapter is not initialised')
  }
  return db.drizzle
}

function toEmailState(row: Record<string, unknown> | undefined): QuoteEmailState | null {
  if (!row) {
    return null
  }
  const status = row.email_status
  const attempts = Number(row.email_attempts ?? 0)
  return {
    emailStatus: status === 'sent' || status === 'failed' ? status : 'pending',
    emailAttempts: Number.isFinite(attempts) && attempts >= 0 ? attempts : 0,
  }
}

export async function withQuoteEmailStateLock(
  payload: { db: unknown },
  id: number,
  fn: (state: QuoteEmailState | null) => Promise<QuoteEmailStateUpdate | null>,
): Promise<void> {
  await drizzleOf(payload).transaction(async (tx) => {
    const locked = await tx.execute(
      sql`SELECT "email_status", "email_attempts" FROM "quote_requests" WHERE "id" = ${id} FOR UPDATE`,
    )
    const update = await fn(toEmailState(locked.rows[0]))
    if (update) {
      await tx.execute(
        sql`UPDATE "quote_requests"
            SET "email_status" = ${update.emailStatus}::"enum_quote_requests_email_status",
                "email_attempts" = ${update.emailAttempts},
                "email_last_error" = ${update.emailLastError},
                "updated_at" = now()
            WHERE "id" = ${id}`,
      )
    }
  })
}

/**
 * P5-T2 §2 — moves a `failed` request back to `pending` for a resend, atomically: of two resend
 * clicks at the same time, only one gets `true` (and queues a job).
 */
export async function claimFailedQuoteForResend(
  payload: { db: unknown },
  id: number,
): Promise<boolean> {
  const result = await drizzleOf(payload).execute(
    sql`UPDATE "quote_requests"
        SET "email_status" = 'pending', "updated_at" = now()
        WHERE "id" = ${id} AND "email_status" = 'failed'
        RETURNING "id"`,
  )
  return result.rows.length === 1
}

/** Puts a request back to `failed` when its resend job could not be queued. */
export async function restoreFailedQuoteAfterResendError(
  payload: { db: unknown },
  id: number,
): Promise<void> {
  await drizzleOf(payload).execute(
    sql`UPDATE "quote_requests"
        SET "email_status" = 'failed', "updated_at" = now()
        WHERE "id" = ${id} AND "email_status" = 'pending'`,
  )
}
