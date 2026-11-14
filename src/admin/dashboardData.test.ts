import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  pickMostRecent,
  QUOTE_WINDOW_DAYS,
  quoteWindowStart,
  RECENT_ITEMS_LIMIT,
  type RecentItem,
} from './dashboardData'

const item = (id: number, updatedAt: string): RecentItem => ({
  collection: 'projects',
  id,
  title: `Item ${String(id)}`,
  updatedAt,
})

describe('P2-T7 §4 dashboard home data helpers', () => {
  it('keeps the newest items first and caps the list', () => {
    const items = [
      item(1, '2026-11-01T10:00:00.000Z'),
      item(2, '2026-11-09T10:00:00.000Z'),
      item(3, '2026-11-05T10:00:00.000Z'),
      item(4, '2026-11-10T10:00:00.000Z'),
      item(5, '2026-10-01T10:00:00.000Z'),
      item(6, '2026-11-08T10:00:00.000Z'),
    ]
    expect(pickMostRecent(items, RECENT_ITEMS_LIMIT).map((i) => i.id)).toEqual([4, 2, 6, 3, 1])
    expect(RECENT_ITEMS_LIMIT).toBe(5)
    // The input is not reordered.
    expect(items[0]?.id).toBe(1)
  })

  it('starts the quote window seven days before now', () => {
    expect(QUOTE_WINDOW_DAYS).toBe(7)
    expect(quoteWindowStart(new Date('2026-11-11T12:00:00.000Z'))).toBe('2026-11-04T12:00:00.000Z')
  })
})
