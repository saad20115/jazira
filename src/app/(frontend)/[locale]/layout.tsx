import '@/styles/globals.css'

import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import type React from 'react'

import {
  DEFAULT_LOCALE,
  getDictionary,
  getLocaleDirection,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import { getSiteSettings } from '@/lib/cms'
import { fontVariablesClassName } from '@/styles/fonts'
import gridStyles from '@/styles/grid.module.css'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

function resolveMetadataBaseUrl(): URL {
  const rawUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3000'
  try {
    return new URL(rawUrl)
  } catch {
    return new URL('http://localhost:3000')
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const metadataBase = resolveMetadataBaseUrl()

  if (!isSupportedLocale(locale)) {
    const fallbackDict = getDictionary(DEFAULT_LOCALE)
    return {
      metadataBase,
      title: fallbackDict.errors.notFoundTitle,
      description: fallbackDict.errors.notFoundDescription,
      icons: {
        icon: '/icon.svg',
      },
    }
  }

  try {
    const siteSettings = await getSiteSettings(locale)
    const companyName = siteSettings.companyName || ''
    const defaultTitle = siteSettings.defaultSeo?.title || companyName
    const defaultDescription =
      siteSettings.defaultSeo?.description || siteSettings.tagline || ''

    return {
      metadataBase,
      title: companyName
        ? {
            default: defaultTitle,
            template: `%s | ${companyName}`,
          }
        : defaultTitle,
      description: defaultDescription,
      icons: {
        icon: '/icon.svg',
      },
      alternates: {
        canonical: `/${locale}`,
        languages: {
          ar: '/ar',
          en: '/en',
        },
      },
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        siteName: companyName,
        locale: locale === 'ar' ? 'ar_SA' : 'en_US',
        type: 'website',
      },
    }
  } catch {
    return {
      metadataBase,
      icons: {
        icon: '/icon.svg',
      },
      alternates: {
        canonical: `/${locale}`,
        languages: {
          ar: '/ar',
          en: '/en',
        },
      },
    }
  }
}

export default async function LocaleRootLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<React.JSX.Element> {
  const { locale } = await params
  const resolvedLocale: SupportedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
  const dir = getLocaleDirection(resolvedLocale)
  const dict = getDictionary(resolvedLocale)

  // Reading incoming request headers opts the layout into dynamic rendering so Next.js
  // extracts the per-request CSP nonce (`x-nonce` / `Content-Security-Policy`) and attaches
  // `nonce` to all framework hydration scripts (`docs/03-security.md` H3).
  const requestHeaders = await headers()
  const activePathname = requestHeaders.get('x-aljazira-pathname') || `/${resolvedLocale}`
  const { isEnabled: isDraftMode } = await draftMode()

  return (
    <html lang={resolvedLocale} dir={dir} className={fontVariablesClassName}>
      <body>
        <a href="#main-content" className={`${gridStyles.skipLink} t-label-button`}>
          {dict.a11y.skipToMainContent}
        </a>
        {isDraftMode ? (
          <aside className={`${gridStyles.draftBanner} t-body-s-medium`}>
            <span>{dict.draftMode.bannerText}</span>
            <a
              href={`/api/preview/exit?returnTo=${encodeURIComponent(activePathname)}`}
              className={`${gridStyles.draftExitLink} t-label-link`}
            >
              {dict.draftMode.exitPreviewLabel}
            </a>
          </aside>
        ) : null}
        <main id="main-content">{children}</main>
      </body>
    </html>
  )
}
