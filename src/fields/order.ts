import type { NumberField } from 'payload'

export type SingleNumberField = Extract<NumberField, { hasMany?: false | undefined }>

export interface OrderFieldOptions {
  name?: string
  defaultValue?: number
  overrides?: Partial<SingleNumberField>
}

const DEFAULT_ORDER_DESCRIPTION = {
  en: 'Manual ascending sort order (0, 1, 2…). Lower numbers appear first.',
  ar: 'الترتيب التصاعدي اليدوي (0، 1، 2…). الأرقام الأصغر تظهر أولاً.',
} as const

export function orderField(options: OrderFieldOptions = {}): SingleNumberField {
  const { name = 'order', defaultValue = 0, overrides = {} } = options
  const { admin: adminOverrides, hooks: hookOverrides, ...restOverrides } = overrides

  const rawDesc = adminOverrides?.description
  const mergedDescription =
    typeof rawDesc === 'object'
      ? {
          ...DEFAULT_ORDER_DESCRIPTION,
          ...rawDesc,
        }
      : (rawDesc ?? DEFAULT_ORDER_DESCRIPTION)

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
    ...restOverrides,
    admin: {
      position: 'sidebar',
      step: 1,
      ...adminOverrides,
      description: mergedDescription,
    },
    hooks: {
      ...hookOverrides,
      beforeValidate: [...(hookOverrides?.beforeValidate ?? [])],
      beforeChange: [...(hookOverrides?.beforeChange ?? [])],
      afterChange: [...(hookOverrides?.afterChange ?? [])],
      afterRead: [...(hookOverrides?.afterRead ?? [])],
      beforeDuplicate: [...(hookOverrides?.beforeDuplicate ?? [])],
    },
    hasMany: false,
  }
}
