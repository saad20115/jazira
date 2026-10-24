import type { Field, NamedGroupField } from 'payload'

import { buttonGroup } from './button'

export interface CtaFieldsOptions {
  includeBackgroundImage?: boolean
  includeEnabled?: boolean
  includeSecondaryButton?: boolean
  required?: boolean
  textMaxLength?: number
  titleMaxLength?: number
}

export interface CtaGroupOptions extends CtaFieldsOptions {
  label?: {
    ar: string
    en: string
  }
  name?: string
  overrides?: Partial<NamedGroupField>
}

/**
 * Returns the fields for the reusable `cta` section (`docs/02-content-model.md` Addendum line 157):
 * - `enabled` (checkbox, default `true`, when `includeEnabled` is `true`)
 * - `title` (L, text)
 * - `text` (L, textarea)
 * - `button` (`label` (L) + `linkField`)
 * - `secondaryButton` (optional `buttonGroup` for secondary action such as "Call Us Now" in Figma CTA `18:660` / `24:1677` / `19:926`)
 * - `backgroundImage` (optional `upload` -> `media` for CTA section backdrop)
 */
export function ctaFields(options: CtaFieldsOptions = {}): Field[] {
  const {
    includeBackgroundImage = true,
    includeEnabled = true,
    includeSecondaryButton = true,
    required = false,
    textMaxLength = 600,
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
      name: 'title',
      type: 'text',
      localized: true,
      required,
      maxLength: titleMaxLength,
      label: {
        ar: 'عنوان الدعوة لاتخاذ إجراء (CTA)',
        en: 'CTA Heading',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return required ? 'عنوان قسم الدعوة لاتخاذ إجراء مطلوب. / CTA title is required.' : true
        }
        if (typeof val !== 'string') {
          return 'عنوان قسم الدعوة لاتخاذ إجراء غير صالح. / Invalid CTA title.'
        }
        if (val.length > titleMaxLength) {
          return `يجب ألا يتجاوز العنوان ${String(titleMaxLength)} حرفاً. / CTA title must not exceed ${String(titleMaxLength)} characters.`
        }
        return true
      },
    },
    {
      name: 'titleAccent',
      type: 'text',
      localized: true,
      required: false,
      maxLength: titleMaxLength,
      label: {
        ar: 'الجزء الذهبي المميز من العنوان (سطر ثانٍ اختياري)',
        en: 'CTA Accent Heading (Gold Second Line)',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return true
        }
        if (typeof val !== 'string') {
          return 'الجزء المميز من العنوان غير صالح. / Invalid CTA accent title.'
        }
        if (val.length > titleMaxLength) {
          return `يجب ألا يتجاوز الجزء المميز من العنوان ${String(titleMaxLength)} حرفاً. / CTA accent title must not exceed ${String(titleMaxLength)} characters.`
        }
        return true
      },
    },
    {
      name: 'text',
      type: 'textarea',
      localized: true,
      required,
      maxLength: textMaxLength,
      label: {
        ar: 'النص الوصفي للدعوة لاتخاذ إجراء',
        en: 'CTA Description Text',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return required ? 'النص الوصفي مطلوب. / CTA text is required.' : true
        }
        if (typeof val !== 'string') {
          return 'النص الوصفي غير صالح. / Invalid CTA text.'
        }
        if (val.length > textMaxLength) {
          return `يجب ألا يتجاوز النص الوصفي ${String(textMaxLength)} حرفاً. / CTA text must not exceed ${String(textMaxLength)} characters.`
        }
        return true
      },
    },
    buttonGroup({
      name: 'button',
      required,
      label: {
        ar: 'الزر الرئيسي (Primary CTA Button)',
        en: 'Primary CTA Button',
      },
    }),
  )

  if (includeSecondaryButton) {
    fields.push(
      buttonGroup({
        name: 'secondaryButton',
        required: false,
        label: {
          ar: 'الزر الثانوي (اختياري — مثل: اتصل بنا الآن)',
          en: 'Secondary CTA Button (Optional — e.g. Call Us Now)',
        },
      }),
    )
  }

  if (includeBackgroundImage) {
    fields.push({
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
      filterOptions: () => true,
      label: {
        ar: 'صورة خلفية القسم (اختيارية)',
        en: 'Background Image (Optional)',
      },
    })
  }

  return fields
}

/**
 * Reusable `cta` section group (`title` (L), `text` (L), `button`, plus optional `secondaryButton` & `backgroundImage`)
 * used by `home-page`, `services-page`, `projects-page`, and project detail (`docs/02-content-model.md` line 157).
 */
export function ctaGroup(options: CtaGroupOptions = {}): NamedGroupField {
  const {
    name = 'cta',
    label = {
      ar: 'قسم الدعوة للتواصل وطلب عرض سعر (CTA)',
      en: 'Call to Action Section (CTA)',
    },
    overrides = {},
    ...fieldOptions
  } = options

  const { admin: adminOverrides, ...restOverrides } = overrides

  return {
    name,
    type: 'group',
    label,
    fields: ctaFields(fieldOptions),
    ...restOverrides,
    ...(adminOverrides ? { admin: { ...adminOverrides } } : {}),
  }
}
