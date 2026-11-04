import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type React from 'react'

import { Button } from '@/components/Button'
import { CmsLink } from '@/components/CmsLink'
import { CspSafeImage, DraftImageBypassProvider } from '@/components/CspSafeImage'
import { Eyebrow } from '@/components/Eyebrow'
import { resolveMediaAsset } from '@/components/media-utils'
import { PageHeader } from '@/components/PageHeader'
import { QuoteForm } from '@/components/QuoteForm'
import { revealAttributes } from '@/components/Reveal'
import {
  buildHreflangAlternates,
  getDictionary,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import { getAboutPage, getContactPage, getHomePage, getSiteSettings } from '@/lib/cms'
import gridStyles from '@/styles/grid.module.css'

import { canServeArabicLocaleForCurrentRequest, enforceArabicEnabledOrRedirect } from '../layout'
import { submitQuoteRequestStubAction } from './actions'
import styles from './page.module.css'

interface LocaleContactPageProps {
  params: Promise<{ locale: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function renderInlineGoldHeading(rawTitle: string): React.ReactNode {
  const trimmed = rawTitle.trim()
  if (!trimmed) {
    return null
  }

  let before = trimmed
  let accent: string | null = null

  if (trimmed.includes('\n')) {
    const [first = '', ...rest] = trimmed.split('\n')
    const second = rest.join(' ').trim()
    before = first.trim()
    accent = second.length > 0 ? second : null
  } else {
    const words = trimmed.split(/\s+/)
    if (words.length >= 2) {
      const splitAt =
        words.length === 2 ? 1 : words.length === 3 ? 1 : Math.max(1, words.length - 2)
      before = words.slice(0, splitAt).join(' ')
      accent = words.slice(splitAt).join(' ')
    }
  }

  if (!accent) {
    return before
  }

  return (
    <>
      {`${before} `}
      <span className={styles.goldText}>{accent}</span>
    </>
  )
}

function formatShortHeadOfficeAddress(fullAddress: string): string {
  return fullAddress
    .replace(/\s+Al-Mukarramah,\s*KSA$/i, '')
    .replace(/،\s*المملكة العربية السعودية$/u, '')
    .trim()
}

function PhoneChannelSvg(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M18.3333 14.0833V16.5833C18.3345 16.817 18.2865 17.0482 18.1926 17.2621C18.0986 17.476 17.9607 17.6678 17.7878 17.8249C17.6149 17.9821 17.411 18.1011 17.1891 18.1744C16.9672 18.2476 16.7325 18.2734 16.5 18.25C13.9423 17.9597 11.488 17.075 9.33333 15.6667C7.31986 14.3872 5.61278 12.6801 4.33333 10.6667C2.92499 8.51199 2.0403 6.05769 1.75 3.5C1.72663 3.26754 1.7524 3.03276 1.82563 2.81091C1.89886 2.58905 2.01792 2.38506 2.17508 2.21219C2.33223 2.03932 2.52398 1.90142 2.73788 1.80744C2.95177 1.71346 3.18304 1.6655 3.41667 1.66667H5.91667C6.31861 1.66212 6.70865 1.803 7.01492 2.06333C7.3212 2.32366 7.52306 2.68591 7.58333 3.08333C7.66667 3.91667 7.91667 4.66667 8.16667 5.41667C8.27189 5.71766 8.28857 6.04252 8.21471 6.35271C8.14086 6.6629 7.97958 6.94539 7.75 7.16667L6.66667 8.25C7.85296 10.3363 9.58038 12.0637 11.6667 13.25L12.75 12.1667C12.9803 11.9512 13.267 11.8056 13.5767 11.7466C13.8865 11.6876 14.2066 11.7177 14.5 11.8333C15.25 12.0833 16 12.3333 16.8333 12.4167C17.2308 12.4769 17.593 12.6788 17.8533 12.9851C18.1137 13.2914 18.2545 13.6814 18.25 14.0833H18.3333Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WhatsAppChannelSvg(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2.5 17.5L3.875 14.3333C2.82305 12.84 2.35222 11.0142 2.55087 9.19842C2.74952 7.38265 3.60399 5.70178 4.95392 4.47127C6.30386 3.24075 8.05646 2.54518 9.88282 2.51508C11.7092 2.48499 13.4837 3.12244 14.8735 4.30781C16.2632 5.49318 17.1726 7.14498 17.431 8.95322C17.6893 10.7615 17.2789 12.6018 16.2768 14.129C15.2746 15.6561 13.7495 16.765 11.9878 17.2476C10.2261 17.7302 8.34885 17.5532 6.70833 16.75L2.5 17.5Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 8.33333C7.5 8.44384 7.5439 8.54982 7.62204 8.62796C7.70018 8.7061 7.80616 8.75 7.91667 8.75C8.02717 8.75 8.13315 8.7061 8.21129 8.62796C8.28943 8.54982 8.33333 8.44384 8.33333 8.33333V7.5C8.33333 7.38949 8.28943 7.28351 8.21129 7.20537C8.13315 7.12723 8.02717 7.08333 7.91667 7.08333C7.80616 7.08333 7.70018 7.12723 7.62204 7.20537C7.5439 7.28351 7.5 7.38949 7.5 7.5V8.33333ZM7.5 8.33333C7.5 9.4384 7.93899 10.4982 8.72039 11.2796C9.50179 12.061 10.5616 12.5 11.6667 12.5M11.6667 12.5H12.5C12.6105 12.5 12.7165 12.4561 12.7946 12.378C12.8728 12.2998 12.9167 12.1938 12.9167 12.0833C12.9167 11.9728 12.8728 11.8668 12.7946 11.7887C12.7165 11.7106 12.6105 11.6667 12.5 11.6667H11.6667C11.5562 11.6667 11.4502 11.7106 11.372 11.7887C11.2939 11.8668 11.25 11.9728 11.25 12.0833C11.25 12.1938 11.2939 12.2998 11.372 12.378C11.4502 12.4561 11.5562 12.5 11.6667 12.5Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EmailChannelSvg(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16.6667 5V3.33333H3.33333V5M16.6667 5V16.6667H3.33333V5M16.6667 5L10 10.8333L3.33333 5"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MapPinChannelSvg(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 18.3333C10 18.3333 15.8333 13.0833 15.8333 8.33333C15.8333 7.56729 15.6825 6.80875 15.3893 6.10101C15.0961 5.39328 14.6665 4.75022 14.1248 4.20854C13.5831 3.66687 12.9401 3.23719 12.2323 2.94404C11.5246 2.65088 10.766 2.5 10 2.5C9.23396 2.5 8.47541 2.65088 7.76768 2.94404C7.05995 3.23719 6.41689 3.66687 5.87521 4.20854C5.33354 4.75022 4.90386 5.39328 4.6107 6.10101C4.31755 6.80875 4.16667 7.56729 4.16667 8.33333C4.16667 13.0833 10 18.3333 10 18.3333ZM10 10.4167C10.5525 10.4167 11.0824 10.1972 11.4731 9.80647C11.8638 9.41577 12.0833 8.88587 12.0833 8.33333C12.0833 7.7808 11.8638 7.2509 11.4731 6.86019C11.0824 6.46949 10.5525 6.25 10 6.25C9.44747 6.25 8.91756 6.46949 8.52686 6.86019C8.13616 7.2509 7.91667 7.7808 7.91667 8.33333C7.91667 8.88587 8.13616 9.41577 8.52686 9.80647C8.91756 10.1972 9.44747 10.4167 10 10.4167Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClockChannelSvg(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 5V10L13.3333 11.6667M10 18.3333C12.2101 18.3333 14.3298 17.4554 15.8926 15.8926C17.4554 14.3298 18.3333 12.2101 18.3333 10C18.3333 7.78986 17.4554 5.67025 15.8926 4.10744C14.3298 2.54464 12.2101 1.66667 10 1.66667C7.78986 1.66667 5.67025 2.54464 4.10744 4.10744C2.54464 5.67025 1.66667 7.78986 1.66667 10C1.66667 12.2101 2.54464 14.3298 4.10744 15.8926C5.67025 17.4554 7.78986 18.3333 10 18.3333Z"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ExternalLinkSmallSvg(): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12.25 5.25V1.75H8.75M12.25 1.75L5.83333 8.16667M10.5 7.58333V11.0833C10.5 11.3928 10.3771 11.6895 10.1583 11.9083C9.9395 12.1271 9.64275 12.25 9.33333 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V4.66667C1.75 4.35725 1.87292 4.0605 2.09171 3.84171C2.3105 3.62292 2.60725 3.5 2.91667 3.5H6.41667"
        stroke="currentColor"
        strokeWidth="1.17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Static vector street-map illustration matching Figma `23:1449` (`1160×420`),
 * used when no custom raster `siteSettings.office.mapImage` is uploaded in CMS.
 * Zero third-party map scripts or iframes (`handoff/tasks/P3-T9.md` Scope 4 & Criterion #5).
 */
function StaticOfficeMapSvg(): React.ReactElement {
  return (
    <svg
      className={styles.staticMapSvg}
      viewBox="0 0 1160 420"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="1160" height="420" className={styles.staticMapBgRect} />

      {/* Angled primary & secondary road lines (`23:1450`–`23:1463`) */}
      <g fill="var(--white)">
        <g transform="translate(521.5, -360.15) rotate(-24)">
          <rect x="-700" y="-5" width="1400" height="10" />
        </g>
        <g transform="translate(520.3, -282.89) rotate(-24)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(521.5, -200.15) rotate(-24)">
          <rect x="-700" y="-5" width="1400" height="10" />
        </g>
        <g transform="translate(520.3, -122.89) rotate(-24)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(521.5, -40.15) rotate(-24)">
          <rect x="-700" y="-5" width="1400" height="10" />
        </g>
        <g transform="translate(520.3, 37.11) rotate(-24)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(521.5, 119.85) rotate(-24)">
          <rect x="-700" y="-5" width="1400" height="10" />
        </g>

        <g transform="translate(545.1, 178.2) rotate(18)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(545.1, 258.2) rotate(18)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(545.1, 338.2) rotate(18)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(545.1, 418.2) rotate(18)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(545.1, 498.2) rotate(18)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(545.1, 578.2) rotate(18)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
        <g transform="translate(545.1, 658.2) rotate(18)">
          <rect x="-700" y="-2" width="1400" height="4" />
        </g>
      </g>

      {/* Park blocks (`23:1464`–`23:1467`) */}
      <g className={styles.staticMapParks}>
        <rect x="600" y="60" width="180" height="120" rx="8" />
        <rect x="820" y="240" width="220" height="140" rx="8" />
        <rect x="320" y="280" width="160" height="100" rx="8" />
        <rect x="980" y="40" width="140" height="120" rx="8" />
      </g>

      {/* Gold Location Pin (`23:1468` at x=700, y=170) */}
      <g transform="translate(700, 170)">
        <circle cx="32" cy="32" r="30" fill="var(--gold-500)" fillOpacity="0.25" />
        <path
          d="M32 50C32 50 44 39.5 44 30C44 26.8174 42.7357 23.7652 40.4853 21.5147C38.2348 19.2643 35.1826 18 32 18C28.8174 18 25.7652 19.2643 23.5147 21.5147C21.2643 23.7652 20 26.8174 20 30C20 39.5 32 50 32 50Z"
          fill="var(--gold-500)"
        />
        <circle cx="32" cy="30" r="4.5" fill="var(--navy-950)" />
      </g>
    </svg>
  )
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

  const [siteSettings, contactPage] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getContactPage(locale).catch(() => null),
  ])

  const arabicEnabled = siteSettings?.arabicEnabled === true
  const effectiveLocale: SupportedLocale = locale === 'ar' && arabicEnabled ? 'ar' : 'en'
  const dict = getDictionary(effectiveLocale)
  const siteName = siteSettings?.companyName || undefined

  const title = contactPage?.meta?.title || contactPage?.pageHeader?.title || dict.nav.contactUs
  const description =
    contactPage?.meta?.description ||
    contactPage?.pageHeader?.subtitle ||
    siteSettings?.defaultSeo?.description ||
    undefined
  const ogImageAsset =
    resolveMediaAsset(contactPage?.meta?.image, title, 'og') ??
    resolveMediaAsset(contactPage?.pageHeader?.image, title, 'og') ??
    resolveMediaAsset(siteSettings?.defaultSeo?.image, title, 'og')

  return {
    title: { absolute: title },
    ...(description ? { description } : {}),
    alternates: {
      canonical: `/${effectiveLocale}/contact`,
      languages: buildHreflangAlternates('/contact', arabicEnabled),
    },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      ...(siteName ? { siteName } : {}),
      url: `/${effectiveLocale}/contact`,
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

export default async function LocaleContactPage({
  params,
  searchParams,
}: LocaleContactPageProps): Promise<React.JSX.Element> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const activePathname = requestHeaders.get('x-aljazira-pathname') || '/ar/contact'
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

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const rawStepParam = resolvedSearchParams.quoteStep
  const stepParamStr = Array.isArray(rawStepParam) ? rawStepParam[0] : rawStepParam
  const initialStep: 1 | 2 | 3 =
    isDraftMode && stepParamStr === '2' ? 2 : isDraftMode && stepParamStr === '3' ? 3 : 1
  const rawSentParam = resolvedSearchParams.quoteSent
  const sentParamStr = Array.isArray(rawSentParam) ? rawSentParam[0] : rawSentParam
  const initialSuccessOpen = isDraftMode && sentParamStr === '1'

  const [siteSettings, contactPage, homePage, aboutPage] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getContactPage(locale).catch(() => null),
    getHomePage(locale).catch(() => null),
    getAboutPage(locale).catch(() => null),
  ])

  const companyName = siteSettings?.companyName || ''

  // 1. Page Header (`23:1366`)
  const pageHeader = contactPage?.pageHeader
  const pageHeaderEnabled = pageHeader?.enabled !== false
  const headerTitle = pageHeader?.title?.trim() || dict.nav.contactUs
  const headerSubtitle = pageHeader?.subtitle?.trim() || null
  const headerImage = resolveMediaAsset(pageHeader?.image, headerTitle, 'hero')

  // 2. Get in Touch (`23:1378`)
  const getInTouch = contactPage?.getInTouch
  const getInTouchEnabled = getInTouch?.enabled !== false
  const getInTouchEyebrow = getInTouch?.eyebrow?.trim() || null
  const getInTouchTitle = getInTouch?.title?.trim() || dict.nav.getAQuote
  const getInTouchIntro = getInTouch?.intro?.trim() || null

  // Contact details from `site-settings` (`handoff/tasks/P3-T9.md` Scope 1)
  const displayPhone = (siteSettings?.phone ?? '').trim()
  const rawPhoneHref = displayPhone.replace(/[^\d+]/g, '')
  const whatsappDigits = (siteSettings?.whatsapp || displayPhone).replace(/\D/g, '')
  const whatsappLabelText = siteSettings?.whatsappLabel?.trim() || dict.footer.chatOnWhatsapp
  const emailValue = (siteSettings?.email ?? '').trim()
  const fullOfficeAddress =
    siteSettings?.office?.address?.trim() || siteSettings?.address?.trim() || ''
  const shortAddressText = formatShortHeadOfficeAddress(
    siteSettings?.address?.trim() || fullOfficeAddress,
  )
  const workingHoursText = siteSettings?.workingHours?.trim() || ''
  const mapUrl =
    siteSettings?.office?.mapUrl?.trim() ||
    siteSettings?.mapUrl?.trim() ||
    'https://maps.google.com'

  // 3. Find Our Office (`23:1441`)
  const findOffice = contactPage?.findOffice
  const findOfficeEnabled = findOffice?.enabled !== false
  const officeCardTitle = siteSettings?.office?.title?.trim() || dict.contact.headOfficeLabel
  const findOfficeEyebrow = findOffice?.eyebrow?.trim() || null
  const findOfficeTitle = findOffice?.title?.trim() || officeCardTitle
  const findOfficeIntro = findOffice?.intro?.trim() || null

  const findOfficeBgImage =
    resolveMediaAsset(homePage?.hero?.background, findOfficeTitle || companyName, 'hero') ??
    resolveMediaAsset(aboutPage?.missionVision?.image, findOfficeTitle || companyName, 'hero') ??
    headerImage
  const officeMapImage = resolveMediaAsset(siteSettings?.office?.mapImage, officeCardTitle, 'hero')

  return (
    <DraftImageBypassProvider enabled={isDraftMode}>
      <div className={styles.contactPage}>
        {/* ====================================================================
            1. Page Header (`23:1366`)
            ==================================================================== */}
        {pageHeaderEnabled ? (
          <PageHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            backgroundImageSrc={headerImage?.url ?? null}
            backgroundImageAlt={headerImage?.alt ?? headerTitle}
            breadcrumbs={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.nav.contactUs },
            ]}
            breadcrumbAriaLabel={dict.a11y.breadcrumbNav}
            waveFill="surface"
          />
        ) : null}

        {/* ====================================================================
            2. Get in Touch + 3-Step Quote Form (`23:1378` + `103:422`)
            ==================================================================== */}
        {getInTouchEnabled ? (
          <section
            id="get-in-touch"
            className={styles.getInTouchSection}
            data-section="get-in-touch"
          >
            <div className={`${gridStyles.container} ${styles.getInTouchContainer}`}>
              {/* Left Column: Intro + 5 Channel Cards */}
              <div className={styles.getInTouchCol}>
                {getInTouchEyebrow ? (
                  <div {...revealAttributes({ variant: 'rise', step: 0 })}>
                    <Eyebrow tone="Light" label={getInTouchEyebrow} />
                  </div>
                ) : null}

                <h2
                  className={`${styles.getInTouchTitle} t-h2`}
                  {...revealAttributes({ variant: 'rise', step: 1 })}
                >
                  {renderInlineGoldHeading(getInTouchTitle)}
                </h2>

                {getInTouchIntro ? (
                  <p
                    className={`${styles.getInTouchIntro} t-body-l`}
                    {...revealAttributes({ variant: 'rise', step: 2 })}
                  >
                    {getInTouchIntro}
                  </p>
                ) : null}

                <div className={styles.channelsBlock}>
                  <div className={styles.channelsGrid}>
                    {/* 1. Call Us (`23:1386`) */}
                    {displayPhone ? (
                      <a
                        href={`tel:${rawPhoneHref}`}
                        className={`${styles.channelCard} ${styles.channelCardRow1}`}
                        data-channel="phone"
                        {...revealAttributes({ variant: 'rise', step: 1 })}
                      >
                        <span className={styles.channelIconBox}>
                          <PhoneChannelSvg />
                        </span>
                        <span className={styles.channelTextCol}>
                          <span className={`${styles.channelLabel} t-label-caps`}>
                            {dict.contact.callUsLabel}
                          </span>
                          <span dir="ltr" className={`${styles.channelValue} t-body-m-medium`}>
                            {displayPhone}
                          </span>
                        </span>
                      </a>
                    ) : null}

                    {/* 2. WhatsApp (`104:1489`) */}
                    {whatsappDigits ? (
                      <a
                        href={`https://wa.me/${whatsappDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.channelCard} ${styles.channelCardRow1}`}
                        data-channel="whatsapp"
                        {...revealAttributes({ variant: 'rise', step: 2 })}
                      >
                        <span className={styles.channelIconBox}>
                          <WhatsAppChannelSvg />
                        </span>
                        <span className={styles.channelTextCol}>
                          <span className={`${styles.channelLabel} t-label-caps`}>
                            {dict.contact.whatsappLabel}
                          </span>
                          <span className={`${styles.channelValue} t-body-m-medium`}>
                            {whatsappLabelText}
                          </span>
                        </span>
                      </a>
                    ) : null}

                    {/* 3. Email (`23:1393`) */}
                    {emailValue ? (
                      <a
                        href={`mailto:${emailValue}`}
                        className={`${styles.channelCard} ${styles.channelCardRow2}`}
                        data-channel="email"
                        {...revealAttributes({ variant: 'rise', step: 3 })}
                      >
                        <span className={styles.channelIconBox}>
                          <EmailChannelSvg />
                        </span>
                        <span className={styles.channelTextCol}>
                          <span className={`${styles.channelLabel} t-label-caps`}>
                            {dict.contact.emailLabel}
                          </span>
                          <span dir="ltr" className={`${styles.channelValue} t-body-m-medium`}>
                            {emailValue}
                          </span>
                        </span>
                      </a>
                    ) : null}

                    {/* 4. Head Office (`23:1400`) */}
                    {shortAddressText ? (
                      <CmsLink
                        href={mapUrl}
                        newTab
                        className={`${styles.channelCard} ${styles.channelCardRow2}`}
                        data-channel="address"
                        {...revealAttributes({ variant: 'rise', step: 4 })}
                      >
                        <span className={styles.channelIconBox}>
                          <MapPinChannelSvg />
                        </span>
                        <span className={styles.channelTextCol}>
                          <span className={`${styles.channelLabel} t-label-caps`}>
                            {dict.contact.headOfficeLabel}
                          </span>
                          <span className={`${styles.channelValue} t-body-m-medium`}>
                            {shortAddressText}
                          </span>
                        </span>
                      </CmsLink>
                    ) : null}
                  </div>

                  {/* 5. Working Hours (`23:1407`) */}
                  {workingHoursText ? (
                    <div
                      className={`${styles.channelCard} ${styles.channelCardWide}`}
                      data-channel="working-hours"
                      {...revealAttributes({ variant: 'rise', step: 5 })}
                    >
                      <span className={styles.channelIconBox}>
                        <ClockChannelSvg />
                      </span>
                      <span className={styles.channelTextCol}>
                        <span className={`${styles.channelLabel} t-label-caps`}>
                          {dict.contact.workingHoursLabel}
                        </span>
                        <span className={`${styles.channelValue} t-body-m-medium`}>
                          {workingHoursText}
                        </span>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right Column: 3-Step Quote Form (`103:422`) */}
              <div
                className={styles.quoteFormCol}
                {...revealAttributes({ variant: 'rise', step: 2 })}
              >
                <QuoteForm
                  locale={locale}
                  sourcePage={`/${locale}/contact`}
                  initialStep={initialStep}
                  initialSuccessOpen={initialSuccessOpen}
                  onSubmitAction={submitQuoteRequestStubAction}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ====================================================================
            3. Find Our Office (`23:1441`) — Static Map + External Google Maps Link
            ==================================================================== */}
        {findOfficeEnabled ? (
          <section
            id="find-our-office"
            className={styles.findOfficeSection}
            data-section="find-our-office"
            data-theme="dark"
          >
            <div className={styles.findOfficeBg} aria-hidden="true">
              {findOfficeBgImage ? (
                <CspSafeImage
                  src={findOfficeBgImage.url}
                  alt=""
                  width={findOfficeBgImage.width ?? 1440}
                  height={findOfficeBgImage.height ?? 771}
                  sizes="100vw"
                  className={styles.findOfficeBgImage}
                />
              ) : null}
              <div className={styles.findOfficeBgOverlay} />
            </div>

            <div className={`${gridStyles.container} ${styles.findOfficeContainer}`}>
              <div className={styles.findOfficeHeader}>
                {findOfficeEyebrow ? (
                  <div {...revealAttributes({ variant: 'rise', step: 0 })}>
                    <Eyebrow tone="Dark" label={findOfficeEyebrow} />
                  </div>
                ) : null}
                <h2
                  className={`${styles.findOfficeTitle} t-h2`}
                  {...revealAttributes({ variant: 'rise', step: 1 })}
                >
                  {renderInlineGoldHeading(findOfficeTitle)}
                </h2>
                {findOfficeIntro ? (
                  <p
                    className={`${styles.findOfficeSubtitle} t-body-l`}
                    {...revealAttributes({ variant: 'rise', step: 2 })}
                  >
                    {findOfficeIntro}
                  </p>
                ) : null}
                <span className={styles.goldGradientDivider} aria-hidden="true" />
              </div>

              {/* Static Map Frame (`23:1449`) — NO iframe or third-party scripts */}
              <div
                className={styles.mapFrame}
                data-static-map
                {...revealAttributes({ variant: 'rise', step: 2 })}
              >
                {officeMapImage ? (
                  <CspSafeImage
                    src={officeMapImage.url}
                    alt={officeMapImage.alt || officeCardTitle}
                    width={officeMapImage.width ?? 1160}
                    height={officeMapImage.height ?? 420}
                    sizes="(max-width: 1200px) 100vw, 1160px"
                    className={styles.mapImage}
                  />
                ) : (
                  <StaticOfficeMapSvg />
                )}

                {/* Open in Maps Top-Start Pill (`23:1472`) */}
                <CmsLink
                  href={mapUrl}
                  newTab
                  className={`${styles.openInMapsPill} t-body-s`}
                  data-open-in-maps
                >
                  <span>{dict.contact.openInMapsLabel}</span>
                  <ExternalLinkSmallSvg />
                </CmsLink>

                {/* Floating Office Location Card (`23:1476`) */}
                <div className={styles.officeCard} data-office-card>
                  <div className={styles.officeCardHead}>
                    <span className={styles.officeCardIconBox}>
                      <MapPinChannelSvg />
                    </span>
                    <h3 className={`${styles.officeCardTitle} t-h5`}>{officeCardTitle}</h3>
                  </div>

                  {fullOfficeAddress ? (
                    <div className={styles.officeFieldGroup}>
                      <span className={`${styles.officeFieldLabel} t-label-caps`}>
                        {dict.contact.officeAddressLabel}
                      </span>
                      <span className={`${styles.officeFieldValue} t-body-s`}>
                        {fullOfficeAddress}
                      </span>
                    </div>
                  ) : null}

                  {displayPhone ? (
                    <div className={styles.officeFieldGroup}>
                      <span className={`${styles.officeFieldLabel} t-label-caps`}>
                        {dict.contact.officePhoneLabel}
                      </span>
                      <a
                        href={`tel:${rawPhoneHref}`}
                        dir="ltr"
                        className={`${styles.officeFieldLink} t-body-s`}
                      >
                        {displayPhone}
                      </a>
                    </div>
                  ) : null}

                  {emailValue ? (
                    <div className={styles.officeFieldGroup}>
                      <span className={`${styles.officeFieldLabel} t-label-caps`}>
                        {dict.contact.officeEmailLabel}
                      </span>
                      <a
                        href={`mailto:${emailValue}`}
                        dir="ltr"
                        className={`${styles.officeFieldLink} t-body-s`}
                      >
                        {emailValue}
                      </a>
                    </div>
                  ) : null}

                  <Button href={mapUrl} newTab variant="Gold" size="lg" showArrow fullWidth>
                    {dict.contact.getDirectionsButton}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </DraftImageBypassProvider>
  )
}
