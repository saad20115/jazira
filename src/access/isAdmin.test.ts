import type { AccessArgs } from 'payload'
import { describe, expect, it } from 'vitest'

import { isAdmin } from './isAdmin'

const makeArgs = (user: { id: number; role: 'admin' | 'editor' } | null): AccessArgs =>
  ({ req: { user } }) as unknown as AccessArgs

describe('isAdmin access helper', () => {
  it('returns false for anonymous requests', () => {
    expect(isAdmin(makeArgs(null))).toBe(false)
  })

  it('returns false for editor users', () => {
    expect(isAdmin(makeArgs({ id: 2, role: 'editor' }))).toBe(false)
  })

  it('returns true for admin users', () => {
    expect(isAdmin(makeArgs({ id: 1, role: 'admin' }))).toBe(true)
  })
})
