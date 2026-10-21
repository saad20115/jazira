import type { AccessArgs } from 'payload'
import { describe, expect, it } from 'vitest'

import { publishedOrLoggedIn } from './publishedOrLoggedIn'

const makeArgs = (user: { id: number; role: 'admin' | 'editor' } | null): AccessArgs =>
  ({ req: { user } }) as unknown as AccessArgs

describe('publishedOrLoggedIn access helper', () => {
  it('returns published filter for anonymous requests', () => {
    expect(publishedOrLoggedIn(makeArgs(null))).toEqual({
      _status: {
        equals: 'published',
      },
    })
  })

  it('returns true for editor users', () => {
    expect(publishedOrLoggedIn(makeArgs({ id: 2, role: 'editor' }))).toBe(true)
  })

  it('returns true for admin users', () => {
    expect(publishedOrLoggedIn(makeArgs({ id: 1, role: 'admin' }))).toBe(true)
  })
})
