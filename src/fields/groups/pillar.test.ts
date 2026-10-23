import { describe, expect, it } from 'vitest'

import { pillarFields, pillarGroup } from './pillar'

describe('pillar reusable field group', () => {
  it('returns localized required title and text fields with default bilingual labels', () => {
    const fields = pillarFields()
    expect(fields).toHaveLength(2)

    const [titleField, textField] = fields as [
      {
        label: { ar: string; en: string }
        localized: boolean
        maxLength: number
        name: string
        required: boolean
        type: string
      },
      {
        label: { ar: string; en: string }
        localized: boolean
        maxLength: number
        name: string
        required: boolean
        type: string
      },
    ]

    expect(titleField.name).toBe('title')
    expect(titleField.type).toBe('text')
    expect(titleField.localized).toBe(true)
    expect(titleField.required).toBe(true)
    expect(titleField.maxLength).toBe(200)
    expect(titleField.label).toEqual({
      ar: 'العنوان',
      en: 'Title',
    })

    expect(textField.name).toBe('text')
    expect(textField.type).toBe('textarea')
    expect(textField.localized).toBe(true)
    expect(textField.required).toBe(true)
    expect(textField.maxLength).toBe(1000)
    expect(textField.label).toEqual({
      ar: 'النص التفصيلي',
      en: 'Text',
    })
  })

  it('builds a named group field with custom label and maxLength overrides', () => {
    const group = pillarGroup({
      name: 'customPillar',
      label: { ar: 'ركيزة مخصصة', en: 'Custom Pillar' },
      titleMaxLength: 120,
      textMaxLength: 400,
    })

    expect(group.name).toBe('customPillar')
    expect(group.type).toBe('group')
    expect(group.label).toEqual({ ar: 'ركيزة مخصصة', en: 'Custom Pillar' })
    expect(group.fields).toHaveLength(2)
  })
})
