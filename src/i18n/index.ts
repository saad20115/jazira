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

export function formatStepCounter(
  template: string,
  current: number,
  total: number,
): string {
  return template.replace('{current}', String(current)).replace('{total}', String(total))
}

export type { UiDictionary }
export { arDictionary, enDictionary }
