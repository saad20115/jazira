import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { Button } from '@/components/Button'
import { CspSafeImage, DraftImageBypassProvider } from '@/components/CspSafeImage'
import { CtaBand, extractMediaDisplay, renderAccentHeading } from '@/components/CtaBand'
import { Eyebrow } from '@/components/Eyebrow'
import { PageHeader } from '@/components/PageHeader'
import { revealAttributes } from '@/components/Reveal'
import { hasLexicalContent, RichTextRenderer } from '@/components/RichTextRenderer'
import { ServiceTile } from '@/components/ServiceTile'
import {
  buildHreflangAlternates,
  getDictionary,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import {
  getHomePage,
  getServiceBySlug,
  getServices,
  getServicesPage,
  getSiteSettings,
} from '@/lib/cms'

import { canServeArabicLocaleForCurrentRequest, enforceArabicEnabledOrRedirect } from '../../layout'
import styles from './page.module.css'

export interface ServiceDetailPageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isSupportedLocale(locale)) {
    return {}
  }
  if (locale === 'ar' && !(await canServeArabicLocaleForCurrentRequest())) {
    return {}
  }

  const [site, service] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getServiceBySlug(locale, slug).catch(() => null),
  ])

  if (!service) {
    return {}
  }

  const arabicEnabled = site?.arabicEnabled === true
  const dict = getDictionary(locale)
  const siteName = site?.companyName.trim() || dict.nav.services
  const title = service.meta?.title?.trim() || `${service.title} | ${siteName}`
  const description =
    service.meta?.description?.trim() ||
    service.shortDescription?.trim() ||
    site?.defaultSeo?.description?.trim() ||
    site?.tagline?.trim() ||
    title

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/services/${service.slug}`,
      languages: buildHreflangAlternates(`/services/${service.slug}`, arabicEnabled),
    },
  }
}

export default async function ServiceDetailRoutePage({
  params,
}: ServiceDetailPageProps): Promise<JSX.Element> {
  const { locale: rawLocale, slug } = await params
  if (!isSupportedLocale(rawLocale)) {
    notFound()
  }
  const locale: SupportedLocale = rawLocale

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const activePathname =
      requestHeaders.get('x-aljazira-pathname') || `/ar/services/${encodeURIComponent(slug)}`
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

  const [service, servicesPage, homePage, allServices] = await Promise.all([
    getServiceBySlug(locale, slug).catch(() => null),
    getServicesPage(locale).catch(() => null),
    getHomePage(locale).catch(() => null),
    getServices(locale).catch(() => []),
  ])

  if (!service) {
    notFound()
  }

  const serviceMedia = extractMediaDisplay(service.image, service.title, 800, 600)
  const headerFallbackMedia = extractMediaDisplay(
    servicesPage?.pageHeader?.image,
    service.title,
    1440,
    537,
  )
  const pipesBgMedia =
    extractMediaDisplay(homePage?.statsSection?.backgroundImage, '', 1440, 425) ??
    headerFallbackMedia ??
    serviceMedia
  const headerBgUrl = serviceMedia?.url ?? headerFallbackMedia?.url ?? null
  const overviewMedia = serviceMedia ?? headerFallbackMedia

  const servicesPageTitle = servicesPage?.pageHeader?.title?.trim() || dict.nav.services
  const hasBody = hasLexicalContent(service.body)

  const highlights = Array.isArray(service.highlights)
    ? service.highlights.filter((h) => h.text.trim().length > 0)
    : []

  const otherServices = allServices.filter((s) => s.slug !== service.slug).slice(0, 6)

  return (
    <DraftImageBypassProvider enabled={isDraftMode}>
      <div className={styles.pageRoot}>
        {/* 1. Shared PageHeader (`24:1478`) */}
        <PageHeader
          title={service.title}
          subtitle={service.shortDescription}
          backgroundImageSrc={headerBgUrl}
          backgroundImageAlt=""
          breadcrumbAriaLabel={dict.a11y.breadcrumbNav}
          breadcrumbs={[
            { label: dict.nav.home, href: `/${locale}` },
            { label: servicesPageTitle, href: `/${locale}/services` },
            { label: service.title },
          ]}
          waveFill="white"
        />

        {/* 2. Service Overview & Lexical RichText Body */}
        <section className={styles.overviewSection}>
          <div className={styles.overviewContainer}>
            <div className={styles.overviewContent} {...revealAttributes({ variant: 'rise' })}>
              <Eyebrow tone="Light" label={dict.services.overviewEyebrow} />
              <h2 className={`${styles.overviewTitle} t-h2`}>{service.title}</h2>
              <span className={styles.goldDivider} aria-hidden="true" />

              {hasBody ? (
                <RichTextRenderer
                  content={service.body}
                  locale={locale}
                  paragraphTypographyClass="t-body-l"
                />
              ) : service.shortDescription ? (
                <p className={`${styles.fallbackDescription} t-body-l`}>
                  {service.shortDescription}
                </p>
              ) : null}

              <div className={styles.ctaButtonWrap}>
                <Button
                  variant="Dark"
                  label={dict.nav.requestQuote}
                  href={`/${locale}/contact?service=${encodeURIComponent(service.slug)}#quote`}
                  showArrow
                />
              </div>
            </div>

            <div className={styles.overviewVisual}>
              <div
                className={styles.overviewImageWrap}
                {...revealAttributes({ variant: 'wipe', step: 1 })}
              >
                {overviewMedia ? (
                  <CspSafeImage
                    src={overviewMedia.url}
                    alt={overviewMedia.alt}
                    width={540}
                    height={400}
                    sizes="(min-width: 1280px) 460px, 100vw"
                    loading="lazy"
                    className={styles.overviewImage}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Key Deliverables / Highlights (`20:947` pattern) */}
        {highlights.length > 0 ? (
          <section className={styles.deliverablesSection} data-theme="dark">
            <div className={styles.deliverablesBgLayer} aria-hidden="true">
              {pipesBgMedia ? (
                <CspSafeImage
                  src={pipesBgMedia.url}
                  alt=""
                  width={1440}
                  height={425}
                  sizes="100vw"
                  loading="lazy"
                  className={styles.deliverablesBgImage}
                />
              ) : null}
              <div className={styles.deliverablesBgOverlay} />
            </div>

            <div className={styles.deliverablesContainer}>
              <div className={styles.sectionHeadStart} {...revealAttributes({ variant: 'rise' })}>
                <Eyebrow tone="Dark" label={dict.services.keyDeliverablesEyebrow} />
                <h2 className={`${styles.sectionTitleDark} t-h2`}>
                  {renderAccentHeading(dict.services.keyDeliverablesHeading)}
                </h2>
                <span className={styles.goldDivider} aria-hidden="true" />
              </div>

              <div className={styles.deliverablesGrid}>
                {highlights.map((item, idx) => (
                  <div
                    key={item.id ?? `hl-${String(idx)}`}
                    className={styles.deliverableCard}
                    {...revealAttributes({ variant: 'rise', step: (idx % 2) + 1 })}
                  >
                    <span className={styles.deliverableIconWrap} aria-hidden="true">
                      <svg className={styles.deliverableIcon} viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.6" />
                        <path
                          d="M6.5 10.2L8.9 12.6L13.6 7.8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <p className={`${styles.deliverableText} t-body-m-medium`}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 4. Other Services (`ServiceTile` grid) */}
        {otherServices.length > 0 ? (
          <section className={styles.otherServicesSection}>
            <div className={styles.otherServicesContainer}>
              <div className={styles.centeredHead} {...revealAttributes({ variant: 'rise' })}>
                <Eyebrow tone="Light" label={dict.services.otherServicesEyebrow} />
                <h2 className={`${styles.sectionTitleLight} t-h2`}>
                  {renderAccentHeading(dict.services.otherServicesHeading)}
                </h2>
                <span className={styles.goldDivider} aria-hidden="true" />
              </div>

              <div className={styles.otherServicesGrid}>
                {otherServices.map((other, idx) => (
                  <div
                    key={other.id}
                    className={styles.otherServiceItem}
                    {...revealAttributes({ variant: 'rise', step: (idx % 3) + 1 })}
                  >
                    <ServiceTile
                      service={other}
                      locale={locale}
                      state="Default"
                      className={styles.otherServiceTile}
                      href={`/${locale}/services/${other.slug}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 5. Shared CTA Band (`24:1677`) */}
        <CtaBand cta={servicesPage?.cta} locale={locale} />
      </div>
    </DraftImageBypassProvider>
  )
}
