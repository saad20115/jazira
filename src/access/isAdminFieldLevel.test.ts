import type { FieldAccess } from 'payload'
import { describe, expect, it } from 'vitest'

import { isAdminFieldLevel } from './isAdminFieldLevel'

type FieldAccessArgs = Parameters<FieldAccess>[0]

const makeArgs = (user: { id: number; role: 'admin' | 'editor' } | null): FieldAccessArgs =>
  ({ req: { user } }) as unknown as FieldAccessArgs

describe('isAdminFieldLevel access helper', () => {
  it('returns false for anonymous requests', () => {
    expect(isAdminFieldLevel(makeArgs(null))).toBe(false)
  })

  it('returns false for editor users', () => {
    expect(isAdminFieldLevel(makeArgs({ id: 2, role: 'editor' }))).toBe(false)
  })

  it('returns true for admin users', () => {
    expect(isAdminFieldLevel(makeArgs({ id: 1, role: 'admin' }))).toBe(true)
  })
})
