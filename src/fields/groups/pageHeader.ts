import type { Field, NamedGroupField } from 'payload'

export interface PageHeaderFieldsOptions {
  includeEnabled?: boolean
  required?: boolean
  subtitleMaxLength?: number
  titleMaxLength?: number
}

export interface PageHeaderGroupOptions extends PageHeaderFieldsOptions {
  label?: {
    ar: string
    en: string
  }
  name?: string
  overrides?: Partial<NamedGroupField>
}

/**
 * Returns the fields for the reusable `pageHeader` group (`docs/02-content-model.md` Addendum line 159):
 * - `enabled` (checkbox, default `true`, when `includeEnabled` is `true`)
 * - `title` (L, text)
 * - `subtitle` (L, textarea)
 * - `image` (upload -> `media`)
 * Breadcrumb ("Home") is i18n, not CMS.
 */
export function pageHeaderFields(options: PageHeaderFieldsOptions = {}): Field[] {
  const {
    includeEnabled = true,
    required = false,
    subtitleMaxLength = 500,
    titleMaxLength = 200,
  } = options

  const fields: Field[] = []

  if (includeEnabled) {
    fields.push({
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: {
        ar: 'تفعيل وإظهار ترويسة الصفحة',
        en: 'Enable and display page header',
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
        ar: 'عنوان الصفحة الرئيسي',
        en: 'Page Title',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return required ? 'عنوان الصفحة مطلوب. / Page title is required.' : true
        }
        if (typeof val !== 'string') {
          return 'عنوان الصفحة غير صالح. / Invalid page title.'
        }
        if (val.length > titleMaxLength) {
          return `يجب ألا يتجاوز عنوان الصفحة ${String(titleMaxLength)} حرفاً. / Page title must not exceed ${String(titleMaxLength)} characters.`
        }
        return true
      },
    },
    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
      required: false,
      maxLength: subtitleMaxLength,
      label: {
        ar: 'العنوان الفرعي / الوصف التمهيدي للصفحة',
        en: 'Page Subtitle',
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return true
        }
        if (typeof val !== 'string') {
          return 'العنوان الفرعي غير صالح. / Invalid page subtitle.'
        }
        if (val.length > subtitleMaxLength) {
          return `يجب ألا يتجاوز العنوان الفرعي ${String(subtitleMaxLength)} حرفاً. / Page subtitle must not exceed ${String(subtitleMaxLength)} characters.`
        }
        return true
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      filterOptions: () => true,
      label: {
        ar: 'صورة خلفية الترويسة',
        en: 'Header Background Image',
      },
      admin: {
        description: {
          ar: 'صورة الخلفية لترويسة الصفحة (تُعرض أعلى الصفحة خلف العنوان ومسار التنقل).',
          en: 'Background image displayed behind the page title and breadcrumb.',
        },
      },
    },
  )

  return fields
}

/**
 * Reusable `pageHeader` group (`title` (L), `subtitle` (L), `image` upload -> `media`)
 * used by `services-page`, `about-page`, `projects-page`, `contact-page`, and `privacy-page`.
 */
export function pageHeaderGroup(options: PageHeaderGroupOptions = {}): NamedGroupField {
  const {
    name = 'pageHeader',
    label = {
      ar: 'ترويسة الصفحة (Page Header)',
      en: 'Page Header',
    },
    overrides = {},
    ...fieldOptions
  } = options

  const { admin: adminOverrides, ...restOverrides } = overrides

  return {
    name,
    type: 'group',
    label,
    fields: pageHeaderFields(fieldOptions),
    ...restOverrides,
    ...(adminOverrides ? { admin: { ...adminOverrides } } : {}),
  }
}
