import type { TaskConfig } from 'payload'

export const NOTIFY_QUOTE_REQUEST_TASK_SLUG = 'notifyQuoteRequest'

/**
 * P5-T1 §2 — the job queued after every saved quote request. P5-T1 ships it as a no-op on
 * purpose (the card: "until then enqueue a no-op task"); P5-T2 replaces the handler with the
 * email send (retries, idempotency, `emailStatus` updates) built on
 * `src/email/quoteNotification.ts`. It never sends anything to the visitor (Q1).
 */
export const notifyQuoteRequestTask: TaskConfig<{
  input: { quoteRequestId: number }
  output: { handled: boolean }
}> = {
  slug: NOTIFY_QUOTE_REQUEST_TASK_SLUG,
  label: 'Notify the sales inbox about a quote request',
  inputSchema: [{ name: 'quoteRequestId', type: 'number', required: true }],
  outputSchema: [{ name: 'handled', type: 'checkbox' }],
  handler: () => Promise.resolve({ output: { handled: false } }),
}
