import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import {
  ApprovedMaterialsTable,
  type ApprovedMaterialBrandItem,
  type ApprovedMaterialRow,
} from '@/components/ApprovedMaterialsTable'
import { Button } from '@/components/Button'
import { CspSafeImage, DraftImageBypassProvider } from '@/components/CspSafeImage'
import { CtaBand, extractMediaDisplay, renderAccentHeading } from '@/components/CtaBand'
import { Eyebrow } from '@/components/Eyebrow'
import { formatServiceNumber } from '@/components/media-utils'
import { PageHeader } from '@/components/PageHeader'
import { revealAttributes } from '@/components/Reveal'
import { ServiceTile } from '@/components/ServiceTile'
import {
  buildHreflangAlternates,
  formatServiceEyebrow,
  getDictionary,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import { getHomePage, getMaterials, getServices, getServicesPage, getSiteSettings } from '@/lib/cms'

import { canServeArabicLocaleForCurrentRequest, enforceArabicEnabledOrRedirect } from '../layout'
import styles from './page.module.css'

export interface ServicesPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    return {}
  }
  if (locale === 'ar' && !(await canServeArabicLocaleForCurrentRequest())) {
    return {}
  }

  const [site, servicesPage] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getServicesPage(locale).catch(() => null),
  ])

  const arabicEnabled = site?.arabicEnabled === true
  const dict = getDictionary(locale)
  const siteName = site?.companyName.trim() || dict.nav.services
  const title =
    servicesPage?.meta?.title?.trim() ||
    servicesPage?.pageHeader?.title?.trim() ||
    `${dict.nav.services} | ${siteName}`
  const description =
    servicesPage?.meta?.description?.trim() ||
    servicesPage?.pageHeader?.subtitle?.trim() ||
    site?.defaultSeo?.description?.trim() ||
    site?.tagline?.trim() ||
    title

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/services`,
      languages: buildHreflangAlternates('/services', arabicEnabled),
    },
  }
}

function mapMaterialsToRows(
  materials: Awaited<ReturnType<typeof getMaterials>>,
): ApprovedMaterialRow[] {
  return materials.map((mat) => {
    const brands: ApprovedMaterialBrandItem[] = []
    if (Array.isArray(mat.brands)) {
      for (const b of mat.brands) {
        if (b && typeof b === 'object' && typeof b.name === 'string') {
          brands.push({
            id: b.id,
            name: b.name,
            origin: b.origin ?? null,
          })
        }
      }
    }
    return {
      id: mat.id,
      itemNo: mat.itemNo,
      system: mat.system,
      description: mat.description,
      brands,
    }
  })
}

export default async function ServicesRoutePage({
  params,
}: ServicesPageProps): Promise<JSX.Element> {
  const { locale: rawLocale } = await params
  if (!isSupportedLocale(rawLocale)) {
    notFound()
  }
  const locale: SupportedLocale = rawLocale

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const activePathname = requestHeaders.get('x-aljazira-pathname') || '/ar/services'
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

  const [servicesPage, homePage, mainServices, specialistServices, materials] = await Promise.all([
    getServicesPage(locale).catch(() => null),
    getHomePage(locale).catch(() => null),
    getServices(locale, { tier: 'main' }).catch(() => []),
    getServices(locale, { tier: 'additional' }).catch(() => []),
    getMaterials(locale).catch(() => []),
  ])

  const headerTitle = servicesPage?.pageHeader?.title?.trim() || dict.nav.services
  const headerSubtitle = servicesPage?.pageHeader?.subtitle ?? null
  const headerMedia = extractMediaDisplay(servicesPage?.pageHeader?.image, headerTitle, 1440, 537)
  const pipesBgMedia =
    extractMediaDisplay(homePage?.statsSection?.backgroundImage, '', 1440, 472) ?? headerMedia

  const showMainServices = servicesPage?.servicesIntro?.enabled !== false && mainServices.length > 0
  const showSpecialistServices =
    servicesPage?.specialist?.enabled !== false && specialistServices.length > 0

  const materialRows = mapMaterialsToRows(materials)
  const showMaterials = servicesPage?.materials?.enabled !== false && materialRows.length > 0

  const processSteps = servicesPage?.process?.steps ?? []
  const showProcess = servicesPage?.process?.enabled !== false && processSteps.length > 0

  return (
    <DraftImageBypassProvider enabled={isDraftMode}>
      <div className={styles.pageRoot}>
        {/* 1. Page Header (`24:1478`) */}
        <PageHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          backgroundImageSrc={headerMedia?.url ?? null}
          backgroundImageAlt=""
          breadcrumbAriaLabel={dict.a11y.breadcrumbNav}
          breadcrumbs={[{ label: dict.nav.home, href: `/${locale}` }, { label: headerTitle }]}
          waveFill={showMainServices ? 'white' : showSpecialistServices ? 'surface' : 'white'}
        />

        {/* 2. Main Services — 4 Alternating Blocks (`24:1490`) */}
        {showMainServices ? (
          <section className={styles.mainServicesSection}>
            <div className={styles.mainServicesContainer}>
              {mainServices.map((service, index) => {
                const isEvenRow = index % 2 === 1
                const paddedNum = formatServiceNumber(index + 1)
                const eyebrowLabel = formatServiceEyebrow(
                  dict.services.serviceEyebrowTemplate,
                  paddedNum,
                )
                const serviceMedia =
                  extractMediaDisplay(service.image, service.title, 540, 400) ?? headerMedia
                const highlights = Array.isArray(service.highlights)
                  ? service.highlights.filter((h) => h.text.trim().length > 0)
                  : []

                return (
                  <article
                    key={service.id}
                    id={service.slug}
                    className={
                      isEvenRow
                        ? `${styles.serviceRow} ${styles.serviceRowReverse}`
                        : styles.serviceRow
                    }
                  >
                    <div className={styles.serviceVisual}>
                      <div
                        className={styles.servicePhotoWrap}
                        {...revealAttributes({ variant: 'wipe' })}
                      >
                        {serviceMedia ? (
                          <CspSafeImage
                            src={serviceMedia.url}
                            alt={serviceMedia.alt}
                            width={540}
                            height={400}
                            sizes="(min-width: 1280px) 540px, 100vw"
                            loading="lazy"
                            className={styles.serviceImage}
                          />
                        ) : null}
                      </div>
                      <span
                        className={`${styles.serviceNumBadge} ${isEvenRow ? styles.serviceNumBadgeEnd : styles.serviceNumBadgeStart} t-h3`}
                        aria-hidden="true"
                      >
                        {paddedNum}
                      </span>
                    </div>

                    <div
                      className={styles.serviceContent}
                      {...revealAttributes({ variant: 'rise', step: 1 })}
                    >
                      <Eyebrow tone="Light" label={eyebrowLabel} />
                      <h2 className={`${styles.serviceTitle} t-h2`}>
                        <Link
                          href={`/${locale}/services/${service.slug}`}
                          className={styles.serviceTitleLink}
                        >
                          {service.title}
                        </Link>
                      </h2>
                      <span className={styles.goldDivider} aria-hidden="true" />
                      {service.shortDescription ? (
                        <p className={`${styles.serviceDesc} t-body-l`}>
                          {service.shortDescription}
                        </p>
                      ) : null}

                      {highlights.length > 0 ? (
                        <ul className={styles.highlightsList}>
                          {highlights.map((item, hIdx) => (
                            <li
                              key={item.id ?? `${service.slug}-hl-${String(hIdx)}`}
                              className={styles.highlightItem}
                            >
                              <span className={styles.checkIconBox} aria-hidden="true">
                                <svg className={styles.checkSvg} viewBox="0 0 12 10" fill="none">
                                  <path
                                    d="M1.5 5.2L4.4 8.1L10.5 1.9"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <span className={`${styles.highlightText} t-body-m-medium`}>
                                {item.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div className={styles.serviceCtaWrap}>
                        <Button
                          variant="Dark"
                          label={dict.nav.requestQuote}
                          href={`/${locale}/contact?service=${encodeURIComponent(service.slug)}#quote`}
                          showArrow
                        />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {/* 3. Specialist Services (`126:1887`) */}
        {showSpecialistServices ? (
          <section className={styles.specialistSection}>
            <div className={styles.specialistContainer}>
              <div className={styles.centeredHead} {...revealAttributes({ variant: 'rise' })}>
                {servicesPage?.specialist?.eyebrow ? (
                  <Eyebrow tone="Light" label={servicesPage.specialist.eyebrow} />
                ) : null}
                {servicesPage?.specialist?.title ? (
                  <h2 className={`${styles.sectionTitleLight} t-h2`}>
                    {renderAccentHeading(servicesPage.specialist.title)}
                  </h2>
                ) : null}
                {servicesPage?.specialist?.intro ? (
                  <p className={`${styles.sectionIntroLight} t-body-l`}>
                    {servicesPage.specialist.intro}
                  </p>
                ) : null}
                <span className={styles.goldDivider} aria-hidden="true" />
              </div>

              <div className={styles.specialistGrid}>
                {specialistServices.map((service, index) => (
                  <div
                    key={service.id}
                    className={styles.specialistGridItem}
                    {...revealAttributes({ variant: 'rise', step: (index % 3) + 1 })}
                  >
                    <ServiceTile
                      service={service}
                      locale={locale}
                      state="Default"
                      className={styles.specialistTile}
                      href={`/${locale}/services/${service.slug}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 4. Approved Materials & Brands (`157:3293`) */}
        {showMaterials ? (
          <ApprovedMaterialsTable
            eyebrow={servicesPage?.materials?.eyebrow}
            title={servicesPage?.materials?.title}
            intro={servicesPage?.materials?.intro}
            materials={materialRows}
            dict={dict.services}
          />
        ) : null}

        {/* 5. How We Work (`24:1646`) */}
        {showProcess ? (
          <section className={styles.processSection} data-theme="dark">
            <div className={styles.processBgLayer} aria-hidden="true">
              {pipesBgMedia ? (
                <CspSafeImage
                  src={pipesBgMedia.url}
                  alt=""
                  width={1440}
                  height={472}
                  sizes="100vw"
                  loading="lazy"
                  className={styles.processBgImage}
                />
              ) : null}
              <div className={styles.processBgOverlay} />
            </div>

            <div className={styles.processContainer}>
              <div className={styles.centeredHead} {...revealAttributes({ variant: 'rise' })}>
                {servicesPage?.process?.eyebrow ? (
                  <Eyebrow tone="Dark" label={servicesPage.process.eyebrow} />
                ) : null}
                {servicesPage?.process?.title ? (
                  <h2 className={`${styles.sectionTitleDark} t-h2`}>
                    {renderAccentHeading(servicesPage.process.title)}
                  </h2>
                ) : null}
                {servicesPage?.process?.intro ? (
                  <p className={`${styles.sectionIntroDark} t-body-l`}>
                    {servicesPage.process.intro}
                  </p>
                ) : null}
                <span className={styles.goldDivider} aria-hidden="true" />
              </div>

              <div className={styles.stepsGrid}>
                {processSteps.map((step, index) => {
                  const isFinalStep = index === processSteps.length - 1
                  const stepNum = formatServiceNumber(index + 1)
                  return (
                    <article
                      key={step.id ?? `step-${String(index)}`}
                      className={
                        isFinalStep ? `${styles.stepCard} ${styles.stepCardGold}` : styles.stepCard
                      }
                      {...revealAttributes({ variant: 'rise', step: (index % 5) + 1 })}
                    >
                      <p
                        className={`${styles.stepNumber} ${isFinalStep ? styles.stepNumberGold : ''} t-stat-m`}
                      >
                        {stepNum}
                      </p>
                      <h3
                        className={`${styles.stepTitle} ${isFinalStep ? styles.stepTitleGold : ''} t-h5`}
                      >
                        {step.title}
                      </h3>
                      {step.text ? (
                        <p
                          className={`${styles.stepDesc} ${isFinalStep ? styles.stepDescGold : ''} t-body-s`}
                        >
                          {step.text}
                        </p>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* 6. CTA Band (`24:1677`) */}
        <CtaBand cta={servicesPage?.cta} locale={locale} />
      </div>
    </DraftImageBypassProvider>
  )
}
