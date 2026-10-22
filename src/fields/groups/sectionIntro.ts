import type { Field, NamedGroupField } from 'payload'

export interface SectionIntroFieldsOptions {
  eyebrowMaxLength?: number
  includeEnabled?: boolean
  introMaxLength?: number
  required?: boolean
  titleMaxLength?: number
}

export interface SectionIntroGroupOptions extends SectionIntroFieldsOptions {
  extraFields?: Field[]
  label?: {
    ar: string
    en: string
  }
  name?: string
  overrides?: Partial<NamedGroupField>
}

/**
 * Returns the fields for the reusable `sectionIntro` group (`docs/02-content-model.md` Addendum line 160):
 * - `enabled` (checkbox, default `true`, when `includeEnabled` is `true`)
 * - `eyebrow` (L, text)
 * - `title` (L, text)
 * - `intro` (L, textarea)
 */
export function sectionIntroFields(options: SectionIntroFieldsOptions = {}): Field[] {
  const {
    eyebrowMaxLength = 120,
    includeEnabled = true,
    introMaxLength = 600,
    required = false,
    titleMaxLength = 200,
  } = options

  const fields: Field[] = []

  if (includeEnabled) {
    fields.push({
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: {
        ar: 'تفعيل وإظهار هذا القسم في الصفحة',
        en: 'Enable and display this section on the page',
      },
    })
  }

  fields.push(
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      required: false,
      maxLength: eyebrowMaxLength,
      label: {
        ar: 'الوسم العلوي الصغير (Eyebrow)',
        en: 'Eyebrow Label',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return true
        }
        if (typeof val !== 'string') {
          return 'الوسم العلوي غير صالح. / Invalid eyebrow text.'
        }
        if (val.length > eyebrowMaxLength) {
          return `يجب ألا يتجاوز الوسم العلوي ${String(eyebrowMaxLength)} حرفاً. / Eyebrow must not exceed ${String(eyebrowMaxLength)} characters.`
        }
        return true
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required,
      maxLength: titleMaxLength,
      label: {
        ar: 'عنوان القسم',
        en: 'Section Title',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return required ? 'عنوان القسم مطلوب. / Section title is required.' : true
        }
        if (typeof val !== 'string') {
          return 'عنوان القسم غير صالح. / Invalid section title.'
        }
        if (val.length > titleMaxLength) {
          return `يجب ألا يتجاوز عنوان القسم ${String(titleMaxLength)} حرفاً. / Section title must not exceed ${String(titleMaxLength)} characters.`
        }
        return true
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      required: false,
      maxLength: introMaxLength,
      label: {
        ar: 'النص التمهيدي للقسم (Intro)',
        en: 'Section Intro Text',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return true
        }
        if (typeof val !== 'string') {
          return 'النص التمهيدي غير صالح. / Invalid section intro text.'
        }
        if (val.length > introMaxLength) {
          return `يجب ألا يتجاوز النص التمهيدي ${String(introMaxLength)} حرفاً. / Section intro must not exceed ${String(introMaxLength)} characters.`
        }
        return true
      },
    },
  )

  return fields
}

/**
 * Reusable `sectionIntro` group (`eyebrow` (L), `title` (L), `intro` (L), plus `enabled` checkbox and optional `extraFields`)
 * per `handoff/tasks/P2-T5.md` Scope 1 and `docs/02-content-model.md` Addendum line 160.
 */
export function sectionIntroGroup(options: SectionIntroGroupOptions = {}): NamedGroupField {
  const {
    extraFields = [],
    name = 'sectionIntro',
    label = {
      ar: 'مقدمة القسم (Section Intro)',
      en: 'Section Intro',
    },
    overrides = {},
    ...fieldOptions
  } = options

  const { admin: adminOverrides, ...restOverrides } = overrides

  return {
    name,
    type: 'group',
    label,
    fields: [...sectionIntroFields(fieldOptions), ...extraFields],
    ...restOverrides,
    ...(adminOverrides ? { admin: { ...adminOverrides } } : {}),
  }
}
