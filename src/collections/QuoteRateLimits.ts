import type { CollectionConfig } from 'payload'

import { withImmutableCreatedAt } from './_shared/immutableTimestamps'

/**
 * P5-T1 §1 (I6) — rate-limit hits for the public quote form, kept in Postgres so the limit
 * survives restarts and works across several app instances (no in-memory store).
 *
 * One row per submission attempt, keyed by the salted IP hash (D2: never a raw IP). Rows are
 * written and counted only by the server-side quote handler through the Local API
 * (`recordQuoteSubmissionAttempt` in `src/lib/cms/client.ts`). Nobody can read or write them through REST or GraphQL, and they
 * are hidden from the admin.
 */
export const QuoteRateLimits: CollectionConfig = withImmutableCreatedAt({
  slug: 'quote-rate-limits',
  labels: {
    singular: { ar: 'محاولة إرسال', en: 'Quote Rate-Limit Hit' },
    plural: { ar: 'محاولات الإرسال', en: 'Quote Rate-Limit Hits' },
  },
  admin: {
    hidden: true,
  },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  timestamps: true,
  fields: [
    {
      name: 'ipHash',
      type: 'text',
      required: true,
      index: true,
      maxLength: 64,
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
      },
    },
  ],
})
