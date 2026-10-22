import type { CollectionSlug, Field, NamedGroupField } from 'payload'

import { type LinkDataShape, linkField, resolveLinkHref } from '../link'

export interface ButtonFieldsOptions {
  internalRelations?: CollectionSlug[]
  labelMaxLength?: number
  required?: boolean
}

export interface ButtonGroupOptions extends ButtonFieldsOptions {
  label?: {
    ar: string
    en: string
  }
  name?: string
  overrides?: Partial<NamedGroupField>
}

export interface ButtonDataShape extends LinkDataShape {
  label?: string | null
  link?: LinkDataShape | null
}

/**
 * Resolves a button group value (`{ label, link }` or flat `{ label, type, internalRoute, ... }`)
 * to its validated target href using `resolveLinkHref` (`I3`).
 */
export function resolveButtonHref(button: ButtonDataShape | null | undefined): string | null {
  if (!button || typeof button !== 'object') {
    return null
  }
  if (button.link && typeof button.link === 'object') {
    return resolveLinkHref(button.link)
  }
  return resolveLinkHref(button)
}

/**
 * Returns the inner fields (`[label, link]`) of the reusable `button` group (`docs/02-content-model.md` Addendum):
 * - `label`: localized text (up to `labelMaxLength`, default 100)
 * - `link`: `linkField({ includeLabel: false })` with `I3` URL scheme allowlist and internal route/document options
 */
export function buttonFields(options: ButtonFieldsOptions = {}): Field[] {
  const {
    internalRelations = ['services', 'projects'],
    labelMaxLength = 100,
    required = false,
  } = options

  return [
    {
      name: 'label',
      type: 'text',
      localized: true,
      required,
      maxLength: labelMaxLength,
      label: {
        ar: 'نص الزر',
        en: 'Button Label',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return required ? 'نص الزر مطلوب. / Button label is required.' : true
        }
        if (typeof val !== 'string') {
          return 'نص الزر غير صالح. / Invalid button label.'
        }
        if (required && val.trim().length === 0) {
          return 'نص الزر مطلوب. / Button label is required.'
        }
        if (val.length > labelMaxLength) {
          return `يجب ألا يتجاوز نص الزر ${String(labelMaxLength)} حرفاً. / Button label must not exceed ${String(labelMaxLength)} characters.`
        }
        return true
      },
    },
    linkField({
      name: 'link',
      includeLabel: false,
      required,
      internalRelations,
      label: {
        ar: 'وجهة الزر (الرابط)',
        en: 'Button Destination (Link)',
      },
    }),
  ]
}

/**
 * Reusable `button` group (`label` (L) + `linkField`) per `handoff/tasks/P2-T5.md` Scope 1
 * and `docs/02-content-model.md` Addendum.
 */
export function buttonGroup(options: ButtonGroupOptions = {}): NamedGroupField {
  const {
    name = 'button',
    label = {
      ar: 'زر الإجراء (Button)',
      en: 'Action Button',
    },
    overrides = {},
    ...fieldOptions
  } = options

  const { admin: adminOverrides, ...restOverrides } = overrides

  return {
    name,
    type: 'group',
    label,
    fields: buttonFields(fieldOptions),
    ...restOverrides,
    ...(adminOverrides ? { admin: { ...adminOverrides } } : {}),
  }
}
