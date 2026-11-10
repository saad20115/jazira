import type { TaskConfig } from 'payload'

/**
 * P5-T2 §5 (D3) — daily retention job: quote requests older than 24 months are deleted.
 *
 * Deletion stays off until an admin turns on `site-settings.quoteRetentionDeleteEnabled`: until
 * then every run is a dry run that only logs how many requests it would delete. That is the card's
 * "first run in dry-run mode", decided by a stored admin setting, not by the environment.
 * Logs carry counts only, never request data (D2).
 */
export const PURGE_EXPIRED_QUOTE_REQUESTS_TASK_SLUG = 'purgeExpiredQuoteRequests'
export const QUOTE_RETENTION_MONTHS = 24

/** The cut-off: the same calendar moment 24 months before `now` (UTC). */
export function quoteRetentionCutoff(now: Date): Date {
  const cutoff = new Date(now.getTime())
  const day = cutoff.getUTCDate()
  cutoff.setUTCDate(1)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - QUOTE_RETENTION_MONTHS)
  const lastDay = new Date(
    Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0),
  ).getUTCDate()
  cutoff.setUTCDate(Math.min(day, lastDay))
  return cutoff
}

export interface QuoteRetentionDeps {
  isDeletionEnabled: () => Promise<boolean>
  countOlderThan: (cutoff: Date) => Promise<number>
  deleteOlderThan: (cutoff: Date) => Promise<number>
  log: (fields: Record<string, unknown>, message: string) => void
}

export type QuoteRetentionResult = { dryRun: boolean; matched: number; deleted: number }

export async function runQuoteRetention(
  deps: QuoteRetentionDeps,
  now: Date,
): Promise<QuoteRetentionResult> {
  const cutoff = quoteRetentionCutoff(now)
  const matched = await deps.countOlderThan(cutoff)
  const enabled = await deps.isDeletionEnabled()
  if (!enabled) {
    deps.log(
      { matched, cutoff: cutoff.toISOString(), dryRun: true },
      'quote retention dry run: nothing deleted (deletion is off in site settings)',
    )
    return { dryRun: true, matched, deleted: 0 }
  }
  const deleted = matched > 0 ? await deps.deleteOlderThan(cutoff) : 0
  deps.log({ matched, deleted, cutoff: cutoff.toISOString() }, 'quote retention run')
  return { dryRun: false, matched, deleted }
}

export const purgeExpiredQuoteRequestsTask: TaskConfig<{
  input: Record<string, never>
  output: { dryRun: boolean; matched: number; deleted: number }
}> = {
  slug: PURGE_EXPIRED_QUOTE_REQUESTS_TASK_SLUG,
  label: 'Delete quote requests older than 24 months (D3)',
  inputSchema: [],
  outputSchema: [
    { name: 'dryRun', type: 'checkbox' },
    { name: 'matched', type: 'number' },
    { name: 'deleted', type: 'number' },
  ],
  // Daily at 03:00 server time (seconds field first, as Payload's scheduler expects).
  schedule: [{ cron: '0 0 3 * * *', queue: 'default' }],
  retries: 2,
  handler: async ({ req }) => {
    const { payload } = req
    const result = await runQuoteRetention(
      {
        isDeletionEnabled: async () => {
          // z6-allow-override-access: server-side job reading an admin-only setting
          const settings = await payload.findGlobal({
            slug: 'site-settings',
            depth: 0,
            overrideAccess: true,
          })
          return settings.quoteRetentionDeleteEnabled === true
        },
        countOlderThan: async (cutoff) => {
          // z6-allow-override-access: server-side retention job; counts only
          const counted = await payload.count({
            collection: 'quote-requests',
            where: { createdAt: { less_than: cutoff.toISOString() } },
            overrideAccess: true,
          })
          return counted.totalDocs
        },
        deleteOlderThan: async (cutoff) => {
          // z6-allow-override-access: server-side retention job (D3); deletes by age only
          const removed = await payload.delete({
            collection: 'quote-requests',
            where: { createdAt: { less_than: cutoff.toISOString() } },
            depth: 0,
            overrideAccess: true,
          })
          if (removed.errors.length > 0) {
            payload.logger.error(
              { failed: removed.errors.length },
              'quote retention: some requests could not be deleted',
            )
          }
          return removed.docs.length
        },
        log: (fields, message) => {
          payload.logger.info(fields, message)
        },
      },
      new Date(),
    )
    return { output: result }
  },
}
