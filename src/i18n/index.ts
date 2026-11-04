import { arDictionary, type UiDictionary } from './ar'
import { enDictionary } from './en'

export const SUPPORTED_LOCALES = ['en', 'ar'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'en'

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return value === 'ar' || value === 'en'
}

export function getLocaleDirection(locale: SupportedLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function getAlternateLocale(locale: SupportedLocale): SupportedLocale {
  return locale === 'ar' ? 'en' : 'ar'
}

const DICTIONARIES: Record<SupportedLocale, UiDictionary> = {
  ar: arDictionary,
  en: enDictionary,
}

export function getDictionary(locale: SupportedLocale): UiDictionary {
  return DICTIONARIES[locale]
}

export function formatStepCounter(template: string, current: number, total: number): string {
  return template.replace('{current}', String(current)).replace('{total}', String(total))
}

export function formatServiceEyebrow(template: string, paddedNumber: string): string {
  return template.replace('{number}', paddedNumber)
}

export function formatMaterialsShowing(template: string, shown: number, total: number): string {
  return template.replace('{shown}', String(shown)).replace('{total}', String(total))
}

export function formatMaterialsShowingSystem(
  template: string,
  shown: number,
  total: number,
  systemLabel: string,
): string {
  return template
    .replace('{shown}', String(shown))
    .replace('{total}', String(total))
    .replace('{system}', systemLabel.toLowerCase())
}

export function formatViewAllItems(template: string, total: number): string {
  return template.replace('{total}', String(total))
}

export function splitHeadingForGoldAccent(rawTitle: string | null | undefined): {
  mainPart: string
  accentPart: string | null
} {
  const trimmed = (rawTitle ?? '').trim()
  if (!trimmed) {
    return { mainPart: '', accentPart: null }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length >= 2) {
    return {
      mainPart: `${lines.slice(0, -1).join(' ')} `,
      accentPart: lines[lines.length - 1] ?? null,
    }
  }

  const words = trimmed.split(/\s+/)
  if (words.length <= 1) {
    return { mainPart: trimmed, accentPart: null }
  }

  const lower = trimmed.toLowerCase()
  if (lower.startsWith('approved ') && words.length >= 3) {
    return {
      mainPart: `${words[0] ?? ''} `,
      accentPart: words.slice(1).join(' '),
    }
  }

  const accentWordCount = words.length >= 4 && (words[words.length - 2]?.length ?? 0) <= 3 ? 2 : 1
  return {
    mainPart: `${words.slice(0, words.length - accentWordCount).join(' ')} `,
    accentPart: words.slice(words.length - accentWordCount).join(' '),
  }
}

/**
 * Replaces the leading locale segment (`/ar/...` or `/en/...`) in a pathname with `targetLocale`,
 * keeping the rest of the path intact (`handoff/tasks/P3-T2.md` §5).
 */
export function switchLocaleInPathname(pathname: string, targetLocale: SupportedLocale): string {
  const clean = pathname.trim() || '/'
  const [pathOnly, queryPart] = clean.split('?')
  const segments = (pathOnly || '/').split('/').filter(Boolean)

  if (segments.length === 0) {
    return queryPart ? `/${targetLocale}?${queryPart}` : `/${targetLocale}`
  }

  if (isSupportedLocale(segments[0])) {
    segments[0] = targetLocale
  } else {
    segments.unshift(targetLocale)
  }

  const rebuilt = `/${segments.join('/')}`
  return queryPart ? `${rebuilt}?${queryPart}` : rebuilt
}

/**
 * Builds the `alternates.languages` (`hreflang`) map for a localized route (`handoff/tasks/P3-T12.md` §3 & §4,
 * `docs/01-architecture.md` §3 "Arabic switch"):
 * - When `arabicEnabled === false`: returns `{ en: '/en...', 'x-default': '/en...' }` (no `ar` link).
 * - When `arabicEnabled === true`: returns `{ en: '/en...', ar: '/ar...', 'x-default': '/en...' }`.
 */
export function buildHreflangAlternates(
  subpath = '/',
  arabicEnabled = false,
): Record<string, string> {
  const trimmed = subpath.trim()
  const normalizedSubpath =
    trimmed === '' || trimmed === '/' ? '' : trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const enHref = `/en${normalizedSubpath}`

  if (!arabicEnabled) {
    return {
      en: enHref,
      'x-default': enHref,
    }
  }

  return {
    en: enHref,
    ar: `/ar${normalizedSubpath}`,
    'x-default': enHref,
  }
}

export type { UiDictionary }
export { arDictionary, enDictionary }
