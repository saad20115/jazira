import { notFound } from 'next/navigation'
import type React from 'react'

import { CmsLink } from '@/components/CmsLink'
import { getAlternateLocale, getDictionary, isSupportedLocale } from '@/i18n'
import { getHomePage, getSiteSettings } from '@/lib/cms'
import gridStyles from '@/styles/grid.module.css'

import styles from './page.module.css'

interface LocaleHomePageProps {
  params: Promise<{ locale: string }>
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

  const companyName = siteSettings?.companyName || dict.specimen.title
  const tagline = siteSettings?.tagline || ''
  const eyebrow = homePage?.hero?.eyebrow || dict.specimen.sampleLabelEyebrow
  const heroTitle = homePage?.hero?.title || dict.specimen.sampleDisplayXl
  const heroSubtitle = homePage?.hero?.subtitle || dict.specimen.sampleBodyL
  const primaryCtaLabel = homePage?.hero?.primaryCta?.label || dict.specimen.sampleLabelButton
  const primaryCtaLink = homePage?.hero?.primaryCta?.link
  const secondaryCtaLabel = homePage?.hero?.secondaryCta?.label || dict.actions.learnMore
  const secondaryCtaLink = homePage?.hero?.secondaryCta?.link

  return (
    <section className={styles.heroShell} data-theme="dark">
      <div className={gridStyles.container}>
        <header className={styles.topBar}>
          <div className={styles.brandBlock}>
            <p className={`${styles.companyName} t-h4`}>{companyName}</p>
            {tagline ? <p className={`${styles.tagline} t-caption`}>{tagline}</p> : null}
          </div>
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

      <div className={gridStyles.container}>
        <div className={styles.heroCard}>
          <span className={`${styles.eyebrow} t-label-eyebrow`}>{eyebrow}</span>
          <h1 className={`${styles.heroTitle} t-display-xl`}>{heroTitle}</h1>
          <p className={`${styles.heroSubtitle} t-body-l`}>{heroSubtitle}</p>
          <div className={styles.ctaRow}>
            <CmsLink
              link={primaryCtaLink}
              href={primaryCtaLink ? undefined : `/${locale}/contact`}
              locale={locale}
              className={`${styles.primaryCta} t-label-button`}
            >
              {primaryCtaLabel}
            </CmsLink>
            <CmsLink
              link={secondaryCtaLink}
              href={secondaryCtaLink ? undefined : `/${locale}/projects`}
              locale={locale}
              className={`${styles.secondaryCta} t-label-button`}
            >
              {secondaryCtaLabel}
            </CmsLink>
          </div>
        </div>
      </div>
    </section>
  )
}
