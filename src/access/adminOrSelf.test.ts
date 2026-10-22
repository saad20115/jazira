import type { AccessArgs } from 'payload'
import { describe, expect, it } from 'vitest'

import { adminOrSelf } from './adminOrSelf'

const makeArgs = (user: { id: number; role: 'admin' | 'editor' } | null): AccessArgs =>
  ({ req: { user } }) as unknown as AccessArgs

describe('adminOrSelf access helper', () => {
  it('returns false for anonymous requests', () => {
    expect(adminOrSelf(makeArgs(null))).toBe(false)
  })

  it('returns self-id constraint for editor users', () => {
    expect(adminOrSelf(makeArgs({ id: 42, role: 'editor' }))).toEqual({
      id: {
        equals: 42,
      },
    })
  })

  it('returns true for admin users', () => {
    expect(adminOrSelf(makeArgs({ id: 1, role: 'admin' }))).toBe(true)
  })
})
