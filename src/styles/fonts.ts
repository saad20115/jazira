import { Noto_Kufi_Arabic, Poppins } from 'next/font/google'

import type { SupportedLocale } from '@/i18n'

/**
 * Self-hosted Google Fonts (`handoff/tasks/P3-T1.md` §3, `docs/05-design.md` §Typography, `R-11`):
 * - `Poppins`: weights 400, 500, 600, 700 + italic (`latin`), `display: 'swap'`
 * - `Noto Kufi Arabic`: weights 400, 500, 600, 700 (`arabic`), `display: 'swap'`
 * Downloaded at build time by `next/font/google` so zero runtime requests are made to Google.
 */
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-poppins',
  preload: false,
  adjustFontFallback: true,
})

export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-noto-kufi-arabic',
  preload: false,
  adjustFontFallback: false,
  fallback: ['Noto Kufi Arabic Metric Fallback', 'Tahoma', 'Arial', 'sans-serif'],
})

/**
 * Returns only the active locale's font CSS variable class so Next.js preloads only the active
 * locale's `.woff2` files on each request (`R-11`).
 */
export function getLocaleFontClassName(locale: SupportedLocale): string {
  return locale === 'ar' ? notoKufiArabic.variable : poppins.variable
}

export const fontVariablesClassName = `${poppins.variable} ${notoKufiArabic.variable}`
