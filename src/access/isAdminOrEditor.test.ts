import type { AccessArgs } from 'payload'
import { describe, expect, it } from 'vitest'

import { isAdminOrEditor } from './isAdminOrEditor'

const makeArgs = (user: { id: number; role: 'admin' | 'editor' } | null): AccessArgs =>
  ({ req: { user } }) as unknown as AccessArgs

describe('isAdminOrEditor access helper', () => {
  it('returns false for anonymous requests', () => {
    expect(isAdminOrEditor(makeArgs(null))).toBe(false)
  })

  it('returns true for editor users', () => {
    expect(isAdminOrEditor(makeArgs({ id: 2, role: 'editor' }))).toBe(true)
  })

  it('returns true for admin users', () => {
    expect(isAdminOrEditor(makeArgs({ id: 1, role: 'admin' }))).toBe(true)
  })
})
