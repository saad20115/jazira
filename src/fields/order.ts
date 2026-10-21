import type { NumberField } from 'payload'

export type SingleNumberField = Extract<NumberField, { hasMany?: false | undefined }>

export interface OrderFieldOptions {
  name?: string
  defaultValue?: number
  overrides?: Partial<SingleNumberField>
}

export function orderField(options: OrderFieldOptions = {}): SingleNumberField {
  const { name = 'order', defaultValue = 0, overrides = {} } = options

  return {
    name,
    type: 'number',
    required: true,
    defaultValue,
    index: true,
    label: {
      en: 'Display Order',
      ar: 'ترتيب العرض',
    },
    admin: {
      position: 'sidebar',
      step: 1,
      description: {
        en: 'Manual ascending sort order (0, 1, 2…). Lower numbers appear first.',
        ar: 'الترتيب التصاعدي اليدوي (0، 1، 2…). الأرقام الأصغر تظهر أولاً.',
      },
      ...overrides.admin,
    },
    ...overrides,
    hasMany: false,
  }
}
