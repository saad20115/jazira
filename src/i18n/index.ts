import { arDictionary, type UiDictionary } from './ar'
import { enDictionary } from './en'

export const SUPPORTED_LOCALES = ['ar', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'ar'

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

export type { UiDictionary }
export { arDictionary, enDictionary }
