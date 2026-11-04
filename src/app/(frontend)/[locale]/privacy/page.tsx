import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type React from 'react'

import { Button } from '@/components/Button'
import { DraftImageBypassProvider } from '@/components/CspSafeImage'
import { resolveMediaAsset } from '@/components/media-utils'
import { PageHeader } from '@/components/PageHeader'
import { revealAttributes } from '@/components/Reveal'
import { hasLexicalContent, RichTextRenderer } from '@/components/RichTextRenderer'
import {
  buildHreflangAlternates,
  getDictionary,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import { getPrivacyPage, getSiteSettings } from '@/lib/cms'
import gridStyles from '@/styles/grid.module.css'

import { canServeArabicLocaleForCurrentRequest, enforceArabicEnabledOrRedirect } from '../layout'
import styles from './page.module.css'

interface LocalePrivacyPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    return {}
  }

  if (locale === 'ar' && !(await canServeArabicLocaleForCurrentRequest())) {
    return {}
  }

  const [siteSettings, privacyPage] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getPrivacyPage(locale).catch(() => null),
  ])

  const arabicEnabled = siteSettings?.arabicEnabled === true
  const effectiveLocale: SupportedLocale = locale === 'ar' && arabicEnabled ? 'ar' : 'en'
  const dict = getDictionary(effectiveLocale)
  const siteName = siteSettings?.companyName || undefined

  const title = privacyPage?.meta?.title || privacyPage?.pageHeader?.title || dict.nav.privacy
  const description =
    privacyPage?.meta?.description ||
    privacyPage?.pageHeader?.subtitle ||
    siteSettings?.defaultSeo?.description ||
    undefined
  const ogImageAsset =
    resolveMediaAsset(privacyPage?.meta?.image, title, 'og') ??
    resolveMediaAsset(privacyPage?.pageHeader?.image, title, 'og') ??
    resolveMediaAsset(siteSettings?.defaultSeo?.image, title, 'og')

  return {
    title: { absolute: title },
    ...(description ? { description } : {}),
    alternates: {
      canonical: `/${effectiveLocale}/privacy`,
      languages: buildHreflangAlternates('/privacy', arabicEnabled),
    },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      ...(siteName ? { siteName } : {}),
      url: `/${effectiveLocale}/privacy`,
      locale: effectiveLocale === 'ar' ? 'ar_SA' : 'en_US',
      type: 'website',
      ...(ogImageAsset
        ? {
            images: [
              {
                url: ogImageAsset.url,
                ...(ogImageAsset.width ? { width: ogImageAsset.width } : {}),
                ...(ogImageAsset.height ? { height: ogImageAsset.height } : {}),
                alt: ogImageAsset.alt,
              },
            ],
          }
        : {}),
    },
  }
}

export default async function LocalePrivacyPage({
  params,
}: LocalePrivacyPageProps): Promise<React.JSX.Element> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const activePathname = requestHeaders.get('x-aljazira-pathname') || '/ar/privacy'
    const activeSearch = requestHeaders.get('x-aljazira-search') || ''
    await enforceArabicEnabledOrRedirect(requestHeaders, activePathname, activeSearch)
  }

  const dict = getDictionary(locale)

  let isDraftMode = false
  try {
    const dm = await draftMode()
    isDraftMode = dm.isEnabled
  } catch {
    isDraftMode = false
  }

  const privacyPage = await getPrivacyPage(locale).catch(() => null)

  const pageHeader = privacyPage?.pageHeader
  const pageHeaderEnabled = pageHeader?.enabled !== false
  const headerTitle = pageHeader?.title?.trim() || dict.nav.privacy
  const headerSubtitle = pageHeader?.subtitle?.trim() || null
  const headerImage = resolveMediaAsset(pageHeader?.image, headerTitle, 'hero')

  const bodyEnabled = privacyPage?.enabled !== false
  const hasBody = bodyEnabled && hasLexicalContent(privacyPage?.body)

  return (
    <DraftImageBypassProvider enabled={isDraftMode}>
      <div className={styles.privacyPage}>
        {pageHeaderEnabled ? (
          <PageHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            backgroundImageSrc={headerImage?.url ?? null}
            backgroundImageAlt={headerImage?.alt ?? headerTitle}
            breadcrumbs={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.nav.privacy },
            ]}
            breadcrumbAriaLabel={dict.a11y.breadcrumbNav}
            waveFill="surface"
          />
        ) : null}

        <section className={styles.bodySection} data-section="privacy-body">
          <div className={`${gridStyles.container} ${styles.bodyContainer}`}>
            <div className={styles.bodyCard} {...revealAttributes({ variant: 'rise', step: 0 })}>
              {hasBody ? (
                <RichTextRenderer
                  content={privacyPage?.body}
                  locale={locale}
                  className={styles.richTextContent}
                />
              ) : (
                <p className={`${styles.emptyNotice} t-body-m`}>{dict.privacy.emptyNotice}</p>
              )}

              <div className={styles.actionsRow}>
                <Button href={`/${locale}/contact`} variant="Dark" size="lg" showArrow>
                  {dict.nav.contactUs}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DraftImageBypassProvider>
  )
}
