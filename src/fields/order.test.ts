import type { FieldHook } from 'payload'
import { describe, expect, it } from 'vitest'

import { orderField } from './order'

describe('orderField', () => {
  it('returns a number field with defaultValue 0, index true, and sidebar position', () => {
    const field = orderField()
    expect(field.name).toBe('order')
    expect(field.type).toBe('number')
    expect(field.defaultValue).toBe(0)
    expect(field.index).toBe(true)
    expect(field.admin?.position).toBe('sidebar')
  })

  it('deep-merges admin overrides and preserves hook arrays without losing sidebar or description (R-1)', () => {
    const customAfterRead: FieldHook = ({ value }): unknown => value
    const field = orderField({
      overrides: {
        admin: {
          readOnly: false,
        },
        hooks: {
          afterRead: [customAfterRead],
        },
      },
    })

    expect(field.admin?.position).toBe('sidebar')
    expect(field.admin?.step).toBe(1)
    expect(field.admin?.readOnly).toBe(false)
    expect(field.admin?.description).toEqual({
      en: 'Manual ascending sort order (0, 1, 2…). Lower numbers appear first.',
      ar: 'الترتيب التصاعدي اليدوي (0، 1، 2…). الأرقام الأصغر تظهر أولاً.',
    })
    expect(field.hooks?.afterRead).toEqual([customAfterRead])
  })
})
