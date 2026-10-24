import type { SupportedLocale } from '@/i18n'

/**
 * Pure client- and server-safe CMS link validator & resolver (`handoff/PLAN.md` §"Phase 3 rules",
 * `docs/03-security.md` I3, `P2-T8 R-9`).
 *
 * Zero server-only imports so `<CmsLink>` can be rendered safely in both Server and Client Components
 * (including Live Preview).
 */

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/
const ENCODED_SLASH_REGEX = /%2f|%5c/i
const SLUG_SAFE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface SanitizeCmsHrefOptions {
  locale?: SupportedLocale | undefined
  nodeEnv?: string | undefined
}

export interface SafeResolvedHref {
  href: string
  isExternal: boolean
}

export function isValidInternalCmsPath(rawPath: string): boolean {
  const trimmed = rawPath.trim()
  if (!trimmed || CONTROL_CHARS_REGEX.test(trimmed)) {
    return false
  }
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return false
  }
  if (trimmed.includes('\\') || ENCODED_SLASH_REGEX.test(trimmed)) {
    return false
  }

  const pathPart = trimmed.split(/[?#]/)[0] ?? ''
  if (pathPart.includes(':')) {
    return false
  }

  const segments = pathPart.split('/')
  if (segments.some((seg) => seg === '..' || seg === '.')) {
    return false
  }

  const nonEmptySegments = segments.filter(Boolean).map((s) => s.toLowerCase())
  const firstNonLocaleSeg =
    nonEmptySegments[0] === 'ar' || nonEmptySegments[0] === 'en'
      ? nonEmptySegments[1]
      : nonEmptySegments[0]
  if (
    firstNonLocaleSeg === 'admin' ||
    firstNonLocaleSeg === 'api' ||
    firstNonLocaleSeg === '_next'
  ) {
    return false
  }

  try {
    const decoded = decodeURIComponent(pathPart)
    if (
      decoded.startsWith('//') ||
      decoded.startsWith('/\\') ||
      decoded.includes('\\') ||
      decoded.split('/').some((seg) => seg === '..' || seg === '.')
    ) {
      return false
    }
  } catch {
    return false
  }

  return true
}

export function prefixInternalPathWithLocale(path: string, locale?: SupportedLocale): string {
  if (!locale) return path
  if (
    path === `/${locale}` ||
    path.startsWith(`/${locale}/`) ||
    path.startsWith(`/${locale}?`) ||
    path.startsWith(`/${locale}#`) ||
    path === '/ar' ||
    path.startsWith('/ar/') ||
    path === '/en' ||
    path.startsWith('/en/')
  ) {
    return path
  }
  if (path === '/') {
    return `/${locale}`
  }
  return `/${locale}${path}`
}

/**
 * Re-validates a raw href string at render time (`I3`, `R-9`):
 * - Internal paths starting with a single `/` -> `{ href, isExternal: false }`
 * - `https:`, `mailto:`, `tel:` (plus `http:` ONLY when `nodeEnv !== 'production'`) -> `{ href, isExternal: true }`
 * - Anything else (`javascript:`, `data:`, `vbscript:`, `//evil.com`, `http:` in production, etc.) -> `null`
 */
export function sanitizeCmsHref(
  rawHref: unknown,
  options: SanitizeCmsHrefOptions = {},
): SafeResolvedHref | null {
  if (typeof rawHref !== 'string') {
    return null
  }

  const trimmed = rawHref.trim()
  if (!trimmed || CONTROL_CHARS_REGEX.test(trimmed)) {
    return null
  }

  if (trimmed.startsWith('/')) {
    if (!isValidInternalCmsPath(trimmed)) {
      return null
    }
    return {
      href: prefixInternalPathWithLocale(trimmed, options.locale),
      isExternal: false,
    }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  if (parsed.username || parsed.password) {
    return null
  }

  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV
  const allowedProtocols =
    nodeEnv === 'production'
      ? ['https:', 'mailto:', 'tel:']
      : ['https:', 'http:', 'mailto:', 'tel:']

  const protocol = parsed.protocol.toLowerCase()
  if (!allowedProtocols.includes(protocol)) {
    return null
  }

  if (protocol === 'http:' || protocol === 'https:') {
    if (!parsed.hostname) {
      return null
    }
    return {
      href: trimmed,
      isExternal: true,
    }
  }

  if (protocol === 'mailto:' || protocol === 'tel:') {
    if (!parsed.pathname || parsed.pathname.trim().length === 0) {
      return null
    }
    return {
      href: trimmed,
      isExternal: true,
    }
  }

  return null
}

export interface CmsLinkDataLike {
  label?: string | null
  type?: ('internal' | 'external') | null
  internalRoute?: string | null
  internalPath?: string | null
  reference?: {
    relationTo: 'services' | 'projects'
    value: number | string | { slug?: string | null }
  } | null
  url?: string | null
  newTab?: boolean | null
}

const NAMED_INTERNAL_ROUTE_MAP: Readonly<Record<string, string>> = {
  '/': '/',
  home: '/',
  '/services': '/services',
  services: '/services',
  '/about': '/about',
  about: '/about',
  'about-us': '/about',
  '/projects': '/projects',
  projects: '/projects',
  '/contact': '/contact',
  contact: '/contact',
  'contact-us': '/contact',
  '/privacy': '/privacy',
  privacy: '/privacy',
}

/**
 * Resolves a CMS `linkField` / `buttonGroup` object into a validated `{ href, isExternal, newTab }`
 * or `null` if unsafe/incomplete.
 */
export function resolveSafeCmsLinkData(
  link: CmsLinkDataLike | null | undefined,
  options: SanitizeCmsHrefOptions = {},
): (SafeResolvedHref & { newTab: boolean }) | null {
  if (!link || typeof link !== 'object') {
    return null
  }

  const newTab = Boolean(link.newTab)

  if (link.type === 'external') {
    const safeExt = sanitizeCmsHref(link.url, options)
    if (!safeExt || !safeExt.isExternal) {
      return null
    }
    return {
      ...safeExt,
      newTab,
    }
  }

  // 1. Reference to `services` or `projects` takes precedence when populated with a valid slug
  const ref = link.reference
  if (ref && typeof ref === 'object') {
    const rel = ref.relationTo as string | undefined
    const val = ref.value as unknown
    if (
      (rel === 'services' || rel === 'projects') &&
      typeof val === 'object' &&
      val !== null &&
      'slug' in val &&
      typeof (val as { slug?: unknown }).slug === 'string'
    ) {
      const slug = (val as { slug: string }).slug.trim()
      if (SLUG_SAFE_REGEX.test(slug)) {
        const safeRef = sanitizeCmsHref(`/${rel}/${slug}`, options)
        if (safeRef) {
          return {
            ...safeRef,
            newTab,
          }
        }
      }
    }
  }

  // 2. Named internal route or custom internal path
  const route = typeof link.internalRoute === 'string' ? link.internalRoute.trim() : ''
  const mappedRoute = route ? (NAMED_INTERNAL_ROUTE_MAP[route.toLowerCase()] ?? route) : ''
  const candidatePath = route === 'custom' || !route ? link.internalPath : mappedRoute
  const safeInternal = sanitizeCmsHref(candidatePath, options)
  if (!safeInternal || safeInternal.isExternal) {
    return null
  }

  return {
    ...safeInternal,
    newTab,
  }
}
