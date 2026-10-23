import { Noto_Kufi_Arabic, Poppins } from 'next/font/google'

/**
 * Self-hosted Google Fonts (`handoff/tasks/P3-T1.md` §3, `docs/05-design.md` §Typography):
 * - `Poppins`: weights 400, 500, 600, 700 + 400 italic (`latin`), `display: 'swap'`
 * - `Noto Kufi Arabic`: weights 400, 500, 600, 700 (`arabic`), `display: 'swap'`
 * Downloaded at build time by `next/font/google` so zero runtime requests are made to Google.
 */
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
})

export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-noto-kufi-arabic',
  preload: true,
})

export const fontVariablesClassName = `${poppins.variable} ${notoKufiArabic.variable}`
