import type { AccessArgs, FieldAccessArgs } from 'payload'
import { describe, expect, it } from 'vitest'

import { adminOrSelf, isAdminOrSelfFieldLevel } from './adminOrSelf'

const makeArgs = (user: { id: number; role: 'admin' | 'editor' } | null): AccessArgs =>
  ({ req: { user } }) as unknown as AccessArgs

const makeFieldArgs = (
  user: { id: number; role: 'admin' | 'editor' } | null,
  docId?: number,
): FieldAccessArgs =>
  ({
    req: { user },
    doc: docId !== undefined ? { id: docId } : undefined,
    id: docId,
  }) as unknown as FieldAccessArgs

describe('adminOrSelf & isAdminOrSelfFieldLevel access helpers', () => {
  it('returns false for anonymous requests', () => {
    expect(adminOrSelf(makeArgs(null))).toBe(false)
    expect(isAdminOrSelfFieldLevel(makeFieldArgs(null, 42))).toBe(false)
  })

  it('returns self-id constraint for editor users at collection level and self-only boolean at field level (R-11)', () => {
    expect(adminOrSelf(makeArgs({ id: 42, role: 'editor' }))).toEqual({
      id: {
        equals: 42,
      },
    })
    expect(isAdminOrSelfFieldLevel(makeFieldArgs({ id: 42, role: 'editor' }, 42))).toBe(true)
    expect(isAdminOrSelfFieldLevel(makeFieldArgs({ id: 42, role: 'editor' }, 99))).toBe(false)
  })

  it('returns true for admin users at both collection and field levels', () => {
    expect(adminOrSelf(makeArgs({ id: 1, role: 'admin' }))).toBe(true)
    expect(isAdminOrSelfFieldLevel(makeFieldArgs({ id: 1, role: 'admin' }, 42))).toBe(true)
  })
})
