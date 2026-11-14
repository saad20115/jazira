import { describe, expect, it } from 'vitest'

import {
  quoteRetentionCutoff,
  runQuoteRetention,
  type QuoteRetentionDeps,
} from './purgeExpiredQuoteRequests'

const NOW = new Date('2026-11-10T03:00:00.000Z')

function createDeps(createdAt: string[], enabled: boolean) {
  const rows = createdAt.map((value) => new Date(value))
  const logs: Record<string, unknown>[] = []
  const deps: QuoteRetentionDeps = {
    isDeletionEnabled: () => Promise.resolve(enabled),
    countOlderThan: (cutoff) => Promise.resolve(rows.filter((row) => row < cutoff).length),
    deleteOlderThan: (cutoff) => {
      const kept = rows.filter((row) => row >= cutoff)
      const deleted = rows.length - kept.length
      rows.splice(0, rows.length, ...kept)
      return Promise.resolve(deleted)
    },
    log: (fields) => {
      logs.push(fields)
    },
  }
  return { deps, rows, logs }
}

describe('P5-T2 §5 (D3) — quote retention job', () => {
  it('the cut-off is exactly 24 months back, clamped at month ends', () => {
    expect(quoteRetentionCutoff(NOW).toISOString()).toBe('2024-11-10T03:00:00.000Z')
    expect(quoteRetentionCutoff(new Date('2026-02-28T00:00:00.000Z')).toISOString()).toBe(
      '2024-02-28T00:00:00.000Z',
    )
    expect(quoteRetentionCutoff(new Date('2026-03-31T00:00:00.000Z')).toISOString()).toBe(
      '2024-03-31T00:00:00.000Z',
    )
    expect(quoteRetentionCutoff(new Date('2028-02-29T12:00:00.000Z')).toISOString()).toBe(
      '2026-02-28T12:00:00.000Z',
    )
  })

  it('deletes only requests older than 24 months', async () => {
    const { deps, rows } = createDeps(
      [
        '2024-11-10T02:59:59.999Z', // older than 24 months: deleted
        '2023-01-01T00:00:00.000Z', // older: deleted
        '2024-11-10T03:00:00.000Z', // exactly 24 months: kept
        '2025-06-01T00:00:00.000Z', // kept
      ],
      true,
    )
    const result = await runQuoteRetention(deps, NOW)
    expect(result).toEqual({ dryRun: false, matched: 2, deleted: 2 })
    expect(rows.map((row) => row.toISOString()).sort()).toEqual([
      '2024-11-10T03:00:00.000Z',
      '2025-06-01T00:00:00.000Z',
    ])
  })

  it('while deletion is off in site settings, it is a dry run that only logs the count', async () => {
    const { deps, rows, logs } = createDeps(
      ['2020-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'],
      false,
    )
    const result = await runQuoteRetention(deps, NOW)
    expect(result).toEqual({ dryRun: true, matched: 1, deleted: 0 })
    expect(rows).toHaveLength(2)
    expect(logs[0]).toMatchObject({ matched: 1, dryRun: true })
  })
})
