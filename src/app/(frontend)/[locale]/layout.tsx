import '@/styles/globals.css'

import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import type React from 'react'

import { Footer, type FooterQuickLinkItem, type FooterSocialItem } from '@/components/Footer'
import { Navbar, type NavbarNavItem } from '@/components/Navbar'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import {
  DEFAULT_LOCALE,
  getDictionary,
  getLocaleDirection,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import { getNavigation, getSiteSettings } from '@/lib/cms'
import type { Navigation, SiteSetting } from '@/payload-types'
import { fontVariablesClassName } from '@/styles/fonts'
import gridStyles from '@/styles/grid.module.css'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

function resolveMetadataBaseUrl(): URL {
  const rawUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3000'
  try {
    return new URL(rawUrl)
  } catch {
    return new URL('http://localhost:3000')
  }
}

async function loadShellGlobals(
  locale: SupportedLocale,
): Promise<{ navigation: Navigation | null; siteSettings: SiteSetting | null }> {
  try {
    const [siteSettings, navigation] = await Promise.all([
      getSiteSettings(locale),
      getNavigation(locale),
    ])
    return { siteSettings, navigation }
  } catch {
    return { siteSettings: null, navigation: null }
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

  const isDevSpecimenOrStyleguide =
    activePathname.endsWith('/_specimen') || activePathname.endsWith('/styleguide')

  const { siteSettings, navigation } = isDevSpecimenOrStyleguide
    ? { siteSettings: null, navigation: null }
    : await loadShellGlobals(resolvedLocale)

  const headerNavItems: NavbarNavItem[] | undefined =
    navigation?.header && navigation.header.length > 0
      ? navigation.header.map((row) => ({
          id: row.id,
          label: row.label,
          link: row.link,
        }))
      : undefined

  const footerQuickLinks: FooterQuickLinkItem[] | undefined =
    navigation?.footer && navigation.footer[0]?.links && navigation.footer[0].links.length > 0
      ? navigation.footer[0].links.map((row) => ({
          id: row.id,
          label: row.label,
          link: row.link,
        }))
      : undefined

  const socialLinks: FooterSocialItem[] | undefined =
    siteSettings?.socials && siteSettings.socials.length > 0
      ? siteSettings.socials.map((row) => ({
          id: row.id,
          platform: row.platform,
          url: row.url,
        }))
      : undefined

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
        {!isDevSpecimenOrStyleguide ? (
          <Navbar
            ctaLabel={navigation?.headerCta?.label}
            ctaLink={navigation?.headerCta?.label ? navigation.headerCta.link : undefined}
            items={headerNavItems}
            locale={resolvedLocale}
            siteName={siteSettings?.companyName}
          />
        ) : null}
        <main id="main-content">{children}</main>
        {!isDevSpecimenOrStyleguide ? (
          <>
            <Footer
              address={siteSettings?.address || siteSettings?.office?.address}
              copyright={siteSettings?.copyright}
              ctaBody={navigation?.footerCta?.text}
              ctaButtonLabel={navigation?.footerCta?.button?.label}
              ctaButtonLink={
                navigation?.footerCta?.button?.label ? navigation.footerCta.button.link : undefined
              }
              ctaTitle={navigation?.footerCta?.title}
              description={siteSettings?.footerText}
              emails={siteSettings?.email ? [siteSettings.email] : undefined}
              locale={resolvedLocale}
              phones={siteSettings?.phone ? [siteSettings.phone] : undefined}
              quickLinks={footerQuickLinks}
              siteName={siteSettings?.companyName}
              socialLinks={socialLinks}
              whatsapp={siteSettings?.whatsapp}
            />
            <WhatsAppFab
              locale={resolvedLocale}
              tooltipLabel={siteSettings?.whatsappLabel || undefined}
              whatsapp={siteSettings?.whatsapp}
            />
          </>
        ) : null}
      </body>
    </html>
  )
}
