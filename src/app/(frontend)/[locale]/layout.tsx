import '@/styles/globals.css'

import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type React from 'react'

import { DraftImageBypassProvider } from '@/components/CspSafeImage'
import { Footer, type FooterColumnItem, type FooterSocialItem } from '@/components/Footer'
import { INTRO_PREPAINT_INLINE_SCRIPT, IntroSplash } from '@/components/IntroSplash'
import { MotionRoot } from '@/components/MotionRoot'
import { Navbar, type NavbarNavItem } from '@/components/Navbar'
import { WhatsAppFab } from '@/components/WhatsAppFab'
import {
  buildHreflangAlternates,
  DEFAULT_LOCALE,
  getDictionary,
  getLocaleDirection,
  isSupportedLocale,
  switchLocaleInPathname,
  type SupportedLocale,
} from '@/i18n'
import {
  getNavigation,
  getSiteSettings,
  isArabicEnabled,
  isAuthorizedArabicPreviewRequest,
  resolveAuthenticatedStaffUser,
} from '@/lib/cms'
import { serializeJsonLd } from '@/lib/link-safety'
import type { Navigation, SiteSetting } from '@/payload-types'
import { preloadLocaleFonts } from '@/styles/font-preload'
import { fontVariablesClassName, getLocaleFontClassName } from '@/styles/fonts'
import gridStyles from '@/styles/grid.module.css'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function buildEnglishRedirectTarget(pathname: string, search = ''): string {
  const cleanPath = pathname.trim() || '/ar'
  const switchedPath = switchLocaleInPathname(cleanPath, 'en')
  if (!search) {
    return switchedPath
  }
  const normalizedSearch = search.startsWith('?') ? search : `?${search}`
  return `${switchedPath}${normalizedSearch}`
}

export async function canServeArabicLocaleForCurrentRequest(): Promise<boolean> {
  let arabicEnabled = false
  try {
    arabicEnabled = await isArabicEnabled()
  } catch {
    arabicEnabled = false
  }
  if (arabicEnabled) {
    return true
  }

  let isDraftMode = false
  try {
    const dm = await draftMode()
    isDraftMode = dm.isEnabled
  } catch {
    isDraftMode = false
  }

  let requestHeaders: { get(name: string): string | null | undefined }
  try {
    requestHeaders = await headers()
  } catch {
    return false
  }

  const activeSearch = requestHeaders.get('x-aljazira-search') || ''
  return isAuthorizedArabicPreviewRequest(requestHeaders, isDraftMode, activeSearch)
}

export async function enforceArabicEnabledOrRedirect(
  requestHeaders: { get(name: string): string | null | undefined },
  activePathname: string,
  activeSearch = '',
): Promise<void> {
  let arabicEnabled = false
  try {
    arabicEnabled = await isArabicEnabled()
  } catch {
    arabicEnabled = false
  }
  if (arabicEnabled) {
    return
  }

  let isDraftMode = false
  try {
    const dm = await draftMode()
    isDraftMode = dm.isEnabled
  } catch {
    isDraftMode = false
  }

  const canPreview = await isAuthorizedArabicPreviewRequest(
    requestHeaders,
    isDraftMode,
    activeSearch,
  )
  if (!canPreview) {
    redirect(buildEnglishRedirectTarget(activePathname, activeSearch))
  }
}

export function buildOrganizationJsonLd(
  siteSettings: SiteSetting | null,
  locale: SupportedLocale,
  arabicEnabled: boolean,
): string {
  const effectiveLocale: SupportedLocale = locale === 'ar' && arabicEnabled ? 'ar' : 'en'
  const baseUrl = resolveMetadataBaseUrl().origin.replace(/\/+$/, '')
  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteSettings?.companyName || 'Al Jazira for Imdad Smart Co.',
    url: `${baseUrl}/${effectiveLocale}`,
    inLanguage: effectiveLocale,
  })
}

/**
 * P3-T10 §2: `LocalBusiness` JSON-LD built only from `site-settings` (no business data in code).
 * Empty fields are left out. Serialized with the same `<`-escaping serializer as `Organization` (I2).
 * Returns null when there is no site-settings document, so nothing is emitted.
 */
export function buildLocalBusinessJsonLd(
  siteSettings: SiteSetting | null,
  locale: SupportedLocale,
  arabicEnabled: boolean,
): string | null {
  if (!siteSettings?.companyName) {
    return null
  }
  const effectiveLocale: SupportedLocale = locale === 'ar' && arabicEnabled ? 'ar' : 'en'
  const baseUrl = resolveMetadataBaseUrl().origin.replace(/\/+$/, '')
  const address = siteSettings.office?.address?.trim() || siteSettings.address?.trim() || ''
  const mapUrl = siteSettings.office?.mapUrl?.trim() || siteSettings.mapUrl?.trim() || ''
  const sameAs = (siteSettings.socials ?? [])
    .map((social) => social.url.trim())
    .filter((url) => /^https:\/\//i.test(url))
  return serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteSettings.companyName,
    url: `${baseUrl}/${effectiveLocale}`,
    ...(siteSettings.tagline?.trim() ? { description: siteSettings.tagline.trim() } : {}),
    ...(siteSettings.phone.trim() ? { telephone: siteSettings.phone.trim() } : {}),
    ...(siteSettings.email.trim() ? { email: siteSettings.email.trim() } : {}),
    ...(address ? { address } : {}),
    ...(/^https:\/\//i.test(mapUrl) ? { hasMap: mapUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  })
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

  if (locale === 'ar' && !(await canServeArabicLocaleForCurrentRequest())) {
    return {}
  }

  try {
    const siteSettings = await getSiteSettings(locale)
    const arabicEnabled = siteSettings.arabicEnabled === true
    const effectiveLocale: SupportedLocale = locale === 'ar' && arabicEnabled ? 'ar' : 'en'
    const companyName = siteSettings.companyName || ''
    const defaultTitle = siteSettings.defaultSeo?.title || companyName
    const defaultDescription = siteSettings.defaultSeo?.description || siteSettings.tagline || ''

    return {
      metadataBase,
      title: companyName
        ? {
            default: defaultTitle,
            template: `%s | ${companyName}`,
          }
        : defaultTitle || undefined,
      description: defaultDescription || undefined,
      icons: {
        icon: '/icon.svg',
      },
      alternates: {
        canonical: `/${effectiveLocale}`,
        languages: buildHreflangAlternates('/', arabicEnabled),
      },
      openGraph: {
        title: defaultTitle || undefined,
        description: defaultDescription || undefined,
        siteName: companyName || undefined,
        locale: effectiveLocale === 'ar' ? 'ar_SA' : 'en_US',
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
        canonical: '/en',
        languages: buildHreflangAlternates('/', false),
      },
    }
  }
}

function isHomeRoutePath(pathname: string): boolean {
  const normalized =
    pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  return normalized === '/ar' || normalized === '/en' || normalized === '/'
}

async function LocaleHomeIntro({
  locale,
  activePathname,
  cspNonce,
  isSupportedLocaleParam,
  shellGlobalsPromise,
}: {
  locale: SupportedLocale
  activePathname: string
  cspNonce?: string | undefined
  isSupportedLocaleParam: boolean
  shellGlobalsPromise: Promise<{ navigation: Navigation | null; siteSettings: SiteSetting | null }>
}): Promise<React.JSX.Element | null> {
  if (!isSupportedLocaleParam || !isHomeRoutePath(activePathname)) {
    return null
  }
  const { siteSettings } = await shellGlobalsPromise
  const companyName = siteSettings?.companyName || null
  const tagline = siteSettings?.tagline || null

  return (
    <>
      <IntroSplash locale={locale} siteName={companyName} tagline={tagline} />
      <script nonce={cspNonce} dangerouslySetInnerHTML={{ __html: INTRO_PREPAINT_INLINE_SCRIPT }} />
    </>
  )
}

async function LocaleShellHeader({
  locale,
  activePathname,
  cspNonce,
  isDevSpecimenOrStyleguide,
  shellGlobalsPromise,
}: {
  locale: SupportedLocale
  activePathname: string
  cspNonce?: string | undefined
  isDevSpecimenOrStyleguide: boolean
  shellGlobalsPromise: Promise<{ navigation: Navigation | null; siteSettings: SiteSetting | null }>
}): Promise<React.JSX.Element | null> {
  const dict = getDictionary(locale)
  const [{ isEnabled: isDraftMode }, requestHeaders, shellGlobals] = await Promise.all([
    draftMode(),
    headers(),
    shellGlobalsPromise,
  ])

  const isStaffDraftPreview =
    isDraftMode && Boolean(await resolveAuthenticatedStaffUser(requestHeaders))

  const { siteSettings, navigation } = shellGlobals
  const arabicEnabled = Boolean(siteSettings?.arabicEnabled)

  const headerNavItems: NavbarNavItem[] | undefined =
    navigation?.header && navigation.header.length > 0
      ? navigation.header.map((row) => ({
          id: row.id,
          label: row.label,
          link: row.link,
        }))
      : undefined

  const localBusinessJsonLd = buildLocalBusinessJsonLd(siteSettings, locale, arabicEnabled)

  return (
    <>
      <script
        nonce={cspNonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: buildOrganizationJsonLd(siteSettings, locale, arabicEnabled),
        }}
      />
      {localBusinessJsonLd ? (
        <script
          nonce={cspNonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: localBusinessJsonLd }}
        />
      ) : null}
      {isStaffDraftPreview ? (
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
          locale={locale}
          showLanguageSwitcher={arabicEnabled}
          siteName={siteSettings?.companyName}
        />
      ) : null}
    </>
  )
}

async function LocaleShellFooter({
  locale,
  activePathname,
  isDevSpecimenOrStyleguide,
  shellGlobalsPromise,
}: {
  locale: SupportedLocale
  activePathname: string
  isDevSpecimenOrStyleguide: boolean
  shellGlobalsPromise: Promise<{ navigation: Navigation | null; siteSettings: SiteSetting | null }>
}): Promise<React.JSX.Element | null> {
  if (isDevSpecimenOrStyleguide) {
    return null
  }

  const { siteSettings, navigation } = await shellGlobalsPromise
  const arabicEnabled = Boolean(siteSettings?.arabicEnabled)

  const footerColumns: FooterColumnItem[] | undefined =
    navigation?.footer && navigation.footer.length > 0
      ? navigation.footer.map((col) => ({
          id: col.id,
          title: col.title,
          links: (col.links ?? []).map((row) => ({
            id: row.id,
            label: row.label,
            link: row.link,
          })),
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
        ctaWhatsappLabel={navigation?.footerCta?.whatsappLabel}
        currentPath={activePathname}
        description={siteSettings?.footerText}
        emails={siteSettings?.email ? [siteSettings.email] : undefined}
        footerColumns={footerColumns}
        locale={locale}
        phones={siteSettings?.phone ? [siteSettings.phone] : undefined}
        showLanguageSwitcher={arabicEnabled}
        siteName={siteSettings?.companyName}
        socialLinks={socialLinks}
        whatsapp={siteSettings?.whatsapp}
      />
      <WhatsAppFab
        locale={locale}
        tooltipLabel={siteSettings?.whatsappLabel || undefined}
        whatsapp={siteSettings?.whatsapp}
      />
    </>
  )
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
  // Async DB shell queries run inside `<LocaleShellHeader>` and `<LocaleShellFooter>` so synchronous
  // `notFound()` throws in child pages never abort `<html lang={resolvedLocale} dir={dir}>` (`R-7`).
  const requestHeaders = await headers()
  const activePathname = requestHeaders.get('x-aljazira-pathname') || `/${resolvedLocale}`
  const activeSearch = requestHeaders.get('x-aljazira-search') || ''
  const cspNonce = requestHeaders.get('x-nonce') || undefined

  if (resolvedLocale === 'ar') {
    await enforceArabicEnabledOrRedirect(requestHeaders, activePathname, activeSearch)
  }

  const isDevSpecimenOrStyleguide =
    activePathname.endsWith('/_specimen') || activePathname.endsWith('/styleguide')

  const fontPreloadUrls = preloadLocaleFonts(resolvedLocale)
  const htmlFontClass = isDevSpecimenOrStyleguide
    ? fontVariablesClassName
    : getLocaleFontClassName(resolvedLocale)

  const shellGlobalsPromise = isDevSpecimenOrStyleguide
    ? Promise.resolve({ siteSettings: null, navigation: null })
    : loadShellGlobals(resolvedLocale)

  const [introNode, headerNode, footerNode] = await Promise.all([
    LocaleHomeIntro({
      locale: resolvedLocale,
      activePathname,
      cspNonce,
      isSupportedLocaleParam: isSupportedLocale(locale),
      shellGlobalsPromise,
    }),
    LocaleShellHeader({
      locale: resolvedLocale,
      activePathname,
      cspNonce,
      isDevSpecimenOrStyleguide,
      shellGlobalsPromise,
    }),
    LocaleShellFooter({
      locale: resolvedLocale,
      activePathname,
      isDevSpecimenOrStyleguide,
      shellGlobalsPromise,
    }),
  ])

  let isDraftMode = false
  try {
    const dm = await draftMode()
    isDraftMode = dm.isEnabled
  } catch {
    isDraftMode = false
  }

  return (
    <html lang={resolvedLocale} dir={dir} className={htmlFontClass} suppressHydrationWarning>
      <head>
        {fontPreloadUrls.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>
        {introNode}
        <a href="#main-content" className={`${gridStyles.skipLink} t-label-button`}>
          {dict.a11y.skipToMainContent}
        </a>
        {headerNode}
        <main id="main-content" tabIndex={-1}>
          <DraftImageBypassProvider enabled={isDraftMode}>{children}</DraftImageBypassProvider>
        </main>
        {footerNode}
        <MotionRoot />
      </body>
    </html>
  )
}
