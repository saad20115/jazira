import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type React from 'react'

import { CmsLink } from '@/components/CmsLink'
import { DEFAULT_LOCALE, getAlternateLocale, getDictionary, isSupportedLocale } from '@/i18n'
import { getHomePage, getSiteSettings } from '@/lib/cms'
import gridStyles from '@/styles/grid.module.css'

import styles from './page.module.css'

interface LocaleHomePageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: LocaleHomePageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    const dict = getDictionary(DEFAULT_LOCALE)
    return {
      title: dict.errors.notFoundTitle,
      description: dict.errors.notFoundDescription,
    }
  }
  const [siteSettings, homePage] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getHomePage(locale).catch(() => null),
  ])
  const title =
    homePage?.meta?.title ||
    siteSettings?.defaultSeo?.title ||
    siteSettings?.companyName ||
    undefined
  const description =
    homePage?.meta?.description ||
    siteSettings?.defaultSeo?.description ||
    siteSettings?.tagline ||
    undefined
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
  }
}

export default async function LocaleHomePage({
  params,
}: LocaleHomePageProps): Promise<React.JSX.Element> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  const dict = getDictionary(locale)
  const alternateLocale = getAlternateLocale(locale)

  const [siteSettings, homePage] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getHomePage(locale).catch(() => null),
  ])

  const companyName = siteSettings?.companyName || null
  const tagline = siteSettings?.tagline || null
  const eyebrow = homePage?.hero?.eyebrow || null
  const heroTitle = homePage?.hero?.title || null
  const heroSubtitle = homePage?.hero?.subtitle || null
  const primaryCtaLabel = homePage?.hero?.primaryCta?.label || null
  const primaryCtaLink = homePage?.hero?.primaryCta?.link
  const secondaryCtaLabel = homePage?.hero?.secondaryCta?.label || null
  const secondaryCtaLink = homePage?.hero?.secondaryCta?.link
  const hasHeroContent = Boolean(
    eyebrow || heroTitle || heroSubtitle || primaryCtaLabel || secondaryCtaLabel,
  )

  return (
    <section className={styles.heroShell} data-theme="dark">
      <div className={gridStyles.container}>
        <header className={styles.topBar}>
          {companyName || tagline ? (
            <div className={styles.brandBlock}>
              {companyName ? (
                <p className={`${styles.companyName} t-h4`} dir="auto">
                  {companyName}
                </p>
              ) : null}
              {tagline ? <p className={`${styles.tagline} t-caption`}>{tagline}</p> : null}
            </div>
          ) : null}
          <CmsLink
            href={`/${alternateLocale}`}
            aria-label={dict.a11y.languageSwitcherLabel}
            className={`${styles.localeSwitch} t-label-button`}
          >
            <span>{dict.localeSwitcher.targetCode}</span>
            <span>{dict.localeSwitcher.targetName}</span>
          </CmsLink>
        </header>
      </div>

      {hasHeroContent ? (
        <div className={gridStyles.container}>
          <div className={styles.heroCard}>
            {eyebrow ? <span className={`${styles.eyebrow} t-label-eyebrow`}>{eyebrow}</span> : null}
            {heroTitle ? <h1 className={`${styles.heroTitle} t-display-xl`}>{heroTitle}</h1> : null}
            {heroSubtitle ? (
              <p className={`${styles.heroSubtitle} t-body-l`}>{heroSubtitle}</p>
            ) : null}
            {primaryCtaLabel || secondaryCtaLabel ? (
              <div className={styles.ctaRow}>
                {primaryCtaLabel ? (
                  <CmsLink
                    link={primaryCtaLink}
                    href={primaryCtaLink ? undefined : `/${locale}/contact`}
                    locale={locale}
                    className={`${styles.primaryCta} t-label-button`}
                  >
                    {primaryCtaLabel}
                  </CmsLink>
                ) : null}
                {secondaryCtaLabel ? (
                  <CmsLink
                    link={secondaryCtaLink}
                    href={secondaryCtaLink ? undefined : `/${locale}/projects`}
                    locale={locale}
                    className={`${styles.secondaryCta} t-label-button`}
                  >
                    {secondaryCtaLabel}
                  </CmsLink>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
