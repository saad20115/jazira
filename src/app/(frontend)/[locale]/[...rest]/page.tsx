import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type React from 'react'

import { isSupportedLocale } from '@/i18n'

import { enforceArabicEnabledOrRedirect } from '../layout'

interface CatchAllRouteProps {
  params: Promise<{ locale: string; rest?: string[] }>
}

export default async function LocaleCatchAllNotFoundPage({
  params,
}: CatchAllRouteProps): Promise<React.JSX.Element> {
  const { locale, rest = [] } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const fallbackPath = `/ar${rest.length > 0 ? `/${rest.join('/')}` : ''}`
    const activePathname = requestHeaders.get('x-aljazira-pathname') || fallbackPath
    const activeSearch = requestHeaders.get('x-aljazira-search') || ''
    await enforceArabicEnabledOrRedirect(requestHeaders, activePathname, activeSearch)
  }

  notFound()
}
