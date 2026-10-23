import '@/styles/globals.css'

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type React from 'react'

import { DEFAULT_LOCALE, getDictionary, isSupportedLocale, type SupportedLocale } from '@/i18n'

import LocaleRootLayout from './(frontend)/[locale]/layout'
import LocaleNotFoundPage from './(frontend)/[locale]/not-found'

async function resolveNotFoundLocale(): Promise<SupportedLocale> {
  const requestHeaders = await headers()
  const rawLocale = requestHeaders.get('x-aljazira-locale')
  return isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveNotFoundLocale()
  const dict = getDictionary(locale)
  return {
    title: dict.errors.notFoundTitle,
    description: dict.errors.notFoundDescription,
  }
}

export default async function GlobalNotFoundPage(): Promise<React.JSX.Element> {
  const locale = await resolveNotFoundLocale()
  return (
    <LocaleRootLayout params={Promise.resolve({ locale })}>
      <LocaleNotFoundPage />
    </LocaleRootLayout>
  )
}
