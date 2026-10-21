import type {
  CollectionSlug,
  Condition,
  Field,
  NamedGroupField,
  TextFieldSingleValidation,
} from 'payload'

export const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'] as const

export const INTERNAL_ROUTE_OPTIONS = [
  { value: '/', label: { en: 'Home (/)', ar: 'الرئيسية (/)' } },
  { value: '/services', label: { en: 'Services (/services)', ar: 'خدماتنا (/services)' } },
  { value: '/about', label: { en: 'About Us (/about)', ar: 'من نحن (/about)' } },
  { value: '/projects', label: { en: 'Projects (/projects)', ar: 'مشاريعنا (/projects)' } },
  { value: '/contact', label: { en: 'Contact Us (/contact)', ar: 'تواصل معنا (/contact)' } },
  {
    value: '/privacy',
    label: { en: 'Privacy Policy (/privacy)', ar: 'سياسة الخصوصية (/privacy)' },
  },
  { value: 'custom', label: { en: 'Custom Internal Path', ar: 'مسار داخلي مخصص' } },
] as const

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/

export interface ValidateUrlOptions {
  required?: boolean
  allowedProtocols?: readonly string[]
  allowedHosts?: readonly string[]
}

/**
 * Security baseline I3 validator:
 * Allows only `http:`, `https:`, `mailto:`, `tel:` (unless restricted further via `allowedProtocols`).
 * Strictly rejects `javascript:` (any casing or control-char obfuscation), `data:`, `vbscript:`,
 * `file:`, `blob:`, protocol-relative URLs (`//...`), and embedded credentials.
 */
export function validateExternalUrl(
  value: unknown,
  options: ValidateUrlOptions = {},
): true | string {
  const { required = false, allowedProtocols = ALLOWED_LINK_PROTOCOLS, allowedHosts } = options

  if (value === null || value === undefined || value === '') {
    return required ? 'الرابط مطلوب. / URL is required.' : true
  }

  if (typeof value !== 'string') {
    return 'صيغة الرابط غير صالحة. / Invalid URL value.'
  }

  if (CONTROL_CHARS_REGEX.test(value)) {
    return 'يحتوي الرابط على محارف تحكم غير مسموحة. / URL contains disallowed control characters.'
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return required ? 'الرابط مطلوب. / URL is required.' : true
  }

  // Reject protocol-relative URLs (`//evil.com`, `\\evil.com`)
  if (trimmed.startsWith('//') || trimmed.startsWith('\\\\') || trimmed.startsWith('/\\')) {
    return 'الروابط النسبية للبروتوكول (//) غير مسموحة. / Protocol-relative URLs (//) are not allowed.'
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'الرابط غير صالح. يجب استخدام بروتوكول مسموح (https:, http:, mailto:, tel:). / Invalid URL format.'
  }

  const protocol = parsed.protocol.toLowerCase()
  const normalizedAllowedProtocols = allowedProtocols.map((p) => p.toLowerCase())
  if (!normalizedAllowedProtocols.includes(protocol)) {
    return `البروتوكول "${protocol}" غير مسموح. البروتوكولات المسموحة: ${normalizedAllowedProtocols.join(', ')}. / Disallowed URL scheme "${protocol}".`
  }

  if (protocol === 'http:' || protocol === 'https:') {
    if (parsed.username !== '' || parsed.password !== '') {
      return 'لا يُسمح بتضمين بيانات الاعتماد داخل الرابط. / Embedded credentials in URLs are not allowed.'
    }

    const hostname = parsed.hostname.toLowerCase()
    if (!hostname || hostname.startsWith('.') || hostname.endsWith('.')) {
      return 'اسم النطاق في الرابط غير صالح. / Invalid URL hostname.'
    }

    if (allowedHosts && allowedHosts.length > 0) {
      const normalizedHosts = allowedHosts.map((h) => h.toLowerCase())
      if (!normalizedHosts.includes(hostname)) {
        return `النطاق "${hostname}" غير مسموح. النطاقات المسموحة: ${normalizedHosts.join(', ')}. / Host "${hostname}" is not in the allowlist.`
      }
    }
  } else if (protocol === 'mailto:' || protocol === 'tel:') {
    if (parsed.pathname.trim().length === 0) {
      return 'قيمة الرابط (البريد أو الهاتف) مطلوبة. / mailto: or tel: target cannot be empty.'
    }
  }

  return true
}

export function validateInternalPath(
  value: unknown,
  options: { required?: boolean } = {},
): true | string {
  const { required = false } = options
  if (value === null || value === undefined || value === '') {
    return required ? 'المسار الداخلي مطلوب. / Internal path is required.' : true
  }
  if (typeof value !== 'string') {
    return 'المسار الداخلي غير صالح. / Invalid internal path.'
  }
  if (CONTROL_CHARS_REGEX.test(value)) {
    return 'المسار الداخلي يحتوي على محارف غير مسموحة. / Internal path contains control characters.'
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return required ? 'المسار الداخلي مطلوب. / Internal path is required.' : true
  }
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return 'يجب أن يبدأ المسار الداخلي بشرطة مائلة واحدة (/) وليس (//). / Internal path must start with a single "/" and not "//".'
  }
  if (trimmed.includes(':') || trimmed.includes('..') || /\s/.test(trimmed)) {
    return 'المسار الداخلي يحتوي على تسلسل غير آمن. / Internal path contains unsafe characters.'
  }
  return true
}

export interface LinkFieldOptions {
  name?: string
  label?: { en: string; ar: string }
  includeLabel?: boolean
  required?: boolean
  internalRelations?: CollectionSlug[]
  overrides?: Partial<NamedGroupField>
}

const isExternalCondition: Condition = (_data, siblingData) => {
  const type = (siblingData as { type?: unknown } | undefined)?.type
  return type === 'external'
}

const isInternalCondition: Condition = (_data, siblingData) => {
  const type = (siblingData as { type?: unknown } | undefined)?.type
  return type !== 'external'
}

const isCustomInternalCondition: Condition = (_data, siblingData) => {
  const sibling = siblingData as { type?: unknown; internalRoute?: unknown } | undefined
  return sibling?.type !== 'external' && sibling?.internalRoute === 'custom'
}

export function buildInternalPathValidator(required = false): TextFieldSingleValidation {
  return (value, validateOpts) => {
    const sibling = validateOpts.siblingData as
      { type?: unknown; internalRoute?: unknown } | undefined
    const isRequired =
      required && sibling?.type !== 'external' && sibling?.internalRoute === 'custom'
    return validateInternalPath(value, { required: isRequired })
  }
}

export function buildExternalUrlValidator(required = false): TextFieldSingleValidation {
  return (value, validateOpts) => {
    const sibling = validateOpts.siblingData as { type?: unknown } | undefined
    if (sibling?.type !== 'external') {
      return true
    }
    return validateExternalUrl(value, { required })
  }
}

export function linkField(options: LinkFieldOptions = {}): NamedGroupField {
  const {
    name = 'link',
    label = { en: 'Link', ar: 'الرابط' },
    includeLabel = true,
    required = false,
    internalRelations,
    overrides = {},
  } = options

  const fields: Field[] = []

  if (includeLabel) {
    fields.push({
      name: 'label',
      type: 'text',
      localized: true,
      required,
      label: {
        en: 'Label',
        ar: 'نص الرابط',
      },
    })
  }

  fields.push(
    {
      name: 'type',
      type: 'select',
      required,
      defaultValue: 'internal',
      label: {
        en: 'Link Type',
        ar: 'نوع الرابط',
      },
      options: [
        { value: 'internal', label: { en: 'Internal Page', ar: 'صفحة داخلية' } },
        { value: 'external', label: { en: 'External URL', ar: 'رابط خارجي' } },
      ],
    },
    {
      name: 'internalRoute',
      type: 'select',
      defaultValue: '/',
      label: {
        en: 'Internal Page',
        ar: 'الصفحة الداخلية',
      },
      options: [...INTERNAL_ROUTE_OPTIONS],
      admin: {
        condition: isInternalCondition,
      },
    },
    {
      name: 'internalPath',
      type: 'text',
      label: {
        en: 'Custom Internal Path',
        ar: 'مسار داخلي مخصص',
      },
      admin: {
        condition: isCustomInternalCondition,
        placeholder: '/projects/sofitel-makkah-hotel',
      },
      validate: buildInternalPathValidator(required),
    },
  )

  if (internalRelations && internalRelations.length > 0) {
    fields.push({
      name: 'reference',
      type: 'relationship',
      relationTo: internalRelations,
      label: {
        en: 'Linked Document (Optional)',
        ar: 'المستند المرتبط (اختياري)',
      },
      admin: {
        condition: isInternalCondition,
      },
    })
  }

  fields.push(
    {
      name: 'url',
      type: 'text',
      label: {
        en: 'External URL',
        ar: 'الرابط الخارجي',
      },
      admin: {
        condition: isExternalCondition,
        placeholder: 'https://example.com',
      },
      validate: buildExternalUrlValidator(required),
    },
    {
      name: 'newTab',
      type: 'checkbox',
      defaultValue: false,
      label: {
        en: 'Open in new tab',
        ar: 'فتح في تبويب جديد',
      },
    },
  )

  return {
    name,
    type: 'group',
    label,
    fields,
    ...overrides,
  }
}
