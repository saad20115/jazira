import type {
  CollectionSlug,
  Condition,
  Field,
  NamedGroupField,
  TextFieldSingleValidation,
} from 'payload'

import { MAX_SLUG_LENGTH, SLUG_REGEX } from './slug'

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
  allowedSchemes?: readonly string[]
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
  const {
    required = false,
    allowedProtocols = options.allowedSchemes ?? ALLOWED_LINK_PROTOCOLS,
    allowedHosts,
  } = options

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

export const ALLOWED_VIDEO_EMBED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
] as const

export function validateVideoEmbedUrl(
  value: unknown,
  options: { required?: boolean } = {},
): true | string {
  const { required = false } = options
  if (value === null || value === undefined || value === '') {
    return required ? 'رابط الفيديو مطلوب. / Video URL is required.' : true
  }
  const baseVerdict = validateExternalUrl(value, {
    required,
    allowedProtocols: ['https:'],
    allowedHosts: ALLOWED_VIDEO_EMBED_HOSTS,
  })
  if (baseVerdict !== true) {
    return baseVerdict
  }
  const parsed = new URL((value as string).trim())
  if (parsed.port !== '') {
    return 'لا يُسمح بتحديد منفذ (Port) غير افتراضي في رابط الفيديو. / Non-default ports are not allowed in video URLs.'
  }
  const host = parsed.hostname.toLowerCase()
  const path = parsed.pathname
  const hasVideoIdInQuery = parsed.searchParams.has('v') && parsed.searchParams.get('v')?.trim()
  const hasNonRootPath = path.length > 1 && path !== '/'
  if (!hasVideoIdInQuery && !hasNonRootPath) {
    return `يرجى إدخال رابط فيديو كامل من YouTube أو Vimeo (وليس الصفحة الرئيسية فقط ${host}). / Please provide a full YouTube or Vimeo video URL (not the bare domain ${host}).`
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
  // Reject any backslash `\` or percent-encoded `/` (%2f) / `\` (%5c) / control bytes (R-11)
  if (trimmed.includes('\\') || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(trimmed)) {
    return 'المسار الداخلي يحتوي على شرطة عكسية أو محارف مرمّزة غير مسموحة. / Internal path contains disallowed backslashes or percent-encoded slashes.'
  }

  let decoded: string
  try {
    decoded = decodeURIComponent(trimmed)
  } catch {
    return 'المسار الداخلي يحتوي على ترميز غير صالح. / Internal path contains malformed percent-encoding.'
  }

  if (
    CONTROL_CHARS_REGEX.test(decoded) ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    decoded.includes(':') ||
    decoded.includes('..') ||
    trimmed.includes(':') ||
    trimmed.includes('..') ||
    /\s/.test(trimmed) ||
    /\s/.test(decoded)
  ) {
    return 'المسار الداخلي يحتوي على تسلسل غير آمن. / Internal path contains unsafe characters.'
  }
  return true
}

export interface LinkDataShape {
  type?: string | null
  internalRoute?: string | null
  internalPath?: string | null
  reference?:
    | {
        relationTo?: string | null
        value?: { slug?: string | null } | string | number | null
      }
    | { slug?: string | null }
    | null
  url?: string | null
}

const RELATION_TO_ROUTE_PREFIX: Readonly<Record<string, string | undefined>> = {
  projects: '/projects',
  services: '/services',
  'home-page': '/',
  'about-page': '/about',
  'services-page': '/services',
  'projects-page': '/projects',
  'contact-page': '/contact',
  'privacy-page': '/privacy',
}

/**
 * Resolves a `linkField` group value to its target href with deterministic precedence (R-11, R-16):
 * 1. When `type === 'external'`, returns the validated external `url`.
 * 2. When `type !== 'external'` (internal):
 *    a) `reference` wins when present (mapped via allowlisted `relationTo` + validated `SLUG_REGEX` `slug`).
 *       - Unknown `relationTo` values return `null` (never `/<relationTo>`).
 *       - Invalid/traversal `slug` values (e.g. `../../evil`) return `null`.
 *       - Unpopulated collection references (`depth: 0`, where `value` is a bare ID `number | string`)
 *         return `null` (never silently falling back to `internalRoute`); callers must query with `depth >= 1`
 *         so `reference.value.slug` is populated.
 *    b) Otherwise, if `internalRoute === 'custom'`, returns the validated `internalPath`.
 *    c) Otherwise, returns the fixed `internalRoute` (`'/'`, `'/services'`, etc.).
 */
export function resolveLinkHref(link: LinkDataShape | null | undefined): string | null {
  if (!link || typeof link !== 'object') {
    return null
  }

  if (link.type === 'external') {
    if (
      typeof link.url === 'string' &&
      validateExternalUrl(link.url, { required: true }) === true
    ) {
      return link.url.trim()
    }
    return null
  }

  // Internal link: 1. `reference` takes precedence when set (R-11, R-16)
  if (link.reference && typeof link.reference === 'object') {
    if ('relationTo' in link.reference && typeof link.reference.relationTo === 'string') {
      const prefix = RELATION_TO_ROUTE_PREFIX[link.reference.relationTo]
      if (!prefix) {
        return null
      }
      const refVal = link.reference.value
      if (refVal !== null && refVal !== undefined && refVal !== '') {
        if (link.reference.relationTo.endsWith('-page')) {
          return prefix
        }
        if (typeof refVal === 'object' && typeof refVal.slug === 'string') {
          const cleanSlug = refVal.slug.trim()
          if (
            cleanSlug.length > 0 &&
            cleanSlug.length <= MAX_SLUG_LENGTH &&
            SLUG_REGEX.test(cleanSlug)
          ) {
            return prefix === '/' ? `/${cleanSlug}` : `${prefix}/${cleanSlug}`
          }
          return null
        }
        // Unpopulated collection reference at depth 0 (refVal is a bare ID):
        // reference still takes precedence over internalRoute, returning null unless populated.
        return null
      }
    } else if (
      'slug' in link.reference &&
      link.reference.slug !== null &&
      link.reference.slug !== undefined
    ) {
      if (typeof link.reference.slug === 'string') {
        const cleanSlug = link.reference.slug.trim().replace(/^\/+/, '')
        if (
          cleanSlug.length > 0 &&
          cleanSlug.length <= MAX_SLUG_LENGTH &&
          SLUG_REGEX.test(cleanSlug)
        ) {
          return `/${cleanSlug}`
        }
      }
      return null
    }
  }

  // 2. Custom internal path (`internalRoute === 'custom'`)
  if (link.internalRoute === 'custom') {
    if (
      typeof link.internalPath === 'string' &&
      validateInternalPath(link.internalPath, { required: true }) === true
    ) {
      return link.internalPath.trim()
    }
    return null
  }

  // 3. Fixed internal route select
  if (typeof link.internalRoute === 'string' && link.internalRoute.trim().length > 0) {
    const route = link.internalRoute.trim()
    if (validateInternalPath(route, { required: true }) === true) {
      return route
    }
  }

  return null
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
    // Validate `internalPath` ONLY when `type !== 'external'` AND `internalRoute === 'custom'` (R-11)
    if (sibling?.type === 'external' || sibling?.internalRoute !== 'custom') {
      return true
    }
    return validateInternalPath(value, { required })
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

  const { admin: adminOverrides, hooks: hookOverrides, ...restOverrides } = overrides

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
      enumName: 'enum_link_type',
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
      enumName: 'enum_link_internal_route',
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
        description: {
          en: 'Optional — when set, this linked document takes precedence over Internal Page / Custom Internal Path.',
          ar: 'اختياري — عند تحديد مستند مرتبط، تكون له الأولوية على حقل الصفحة الداخلية أو المسار المخصص.',
        },
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
    ...restOverrides,
    ...(adminOverrides ? { admin: { ...adminOverrides } } : {}),
    ...(hookOverrides
      ? {
          hooks: {
            ...hookOverrides,
            beforeValidate: [...(hookOverrides.beforeValidate ?? [])],
            beforeChange: [...(hookOverrides.beforeChange ?? [])],
            afterChange: [...(hookOverrides.afterChange ?? [])],
            afterRead: [...(hookOverrides.afterRead ?? [])],
            beforeDuplicate: [...(hookOverrides.beforeDuplicate ?? [])],
          },
        }
      : {}),
  }
}
