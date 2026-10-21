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
})
