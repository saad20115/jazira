import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type React from 'react'

import { CountUp } from '@/components/CountUp'
import { CspSafeImage, DraftImageBypassProvider } from '@/components/CspSafeImage'
import { Eyebrow } from '@/components/Eyebrow'
import { CornerBracketIcon } from '@/components/icons'
import { resolveMediaAsset } from '@/components/media-utils'
import { PageHeader } from '@/components/PageHeader'
import { revealAttributes } from '@/components/Reveal'
import { extractLexicalParagraphStrings } from '@/components/RichTextRenderer'
import { TeamCard } from '@/components/TeamCard'
import { TeamMarquee } from '@/components/TeamMarquee'
import {
  buildHreflangAlternates,
  DEFAULT_LOCALE,
  getDictionary,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import { getAboutPage, getHomePage, getSiteSettings, getStats, getTeamMembers } from '@/lib/cms'
import type { Stat } from '@/payload-types'
import gridStyles from '@/styles/grid.module.css'

import { canServeArabicLocaleForCurrentRequest, enforceArabicEnabledOrRedirect } from '../layout'
import styles from './page.module.css'

interface LocaleAboutPageProps {
  params: Promise<{ locale: string }>
}

function resolveStatDoc(
  rawStat: number | Stat | null | undefined,
  allStats: readonly Stat[],
): Stat | null {
  if (!rawStat) {
    return null
  }
  if (typeof rawStat === 'object' && 'value' in rawStat && 'label' in rawStat) {
    return rawStat
  }
  if (typeof rawStat === 'number') {
    return allStats.find((s) => s.id === rawStat) ?? null
  }
  return null
}

function formatOneDigitIndex(idx: number): string {
  return (idx + 1).toLocaleString('en-US')
}

function formatTwoDigitIndex(idx: number): string {
  return String(idx + 1).padStart(2, '0')
}

/**
 * Renders a section heading with its gold accent part:
 * - When `multiline: true` (Section 2 `Engineering Excellence\nSince 1979`), renders the two lines stacked with the second line in gold.
 * - When `multiline: false` (Sections 3, 4, 5 `Our Core Strengths`, `Our Mission & Vision`, `Meet Our Team`), renders inline with the accent portion in gold.
 */
export function renderAboutAccentHeading(rawTitle: string, multiline = false): React.ReactNode {
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
        words.length === 2 ? 1 : words.length === 3 ? 2 : Math.max(1, words.length - 2)
      before = words.slice(0, splitAt).join(' ')
      accent = words.slice(splitAt).join(' ')
    }
  }

  if (!accent) {
    return before
  }

  if (multiline) {
    return (
      <>
        <span className={styles.blockLine}>{before}</span>{' '}
        <span className={`${styles.blockLine} ${styles.goldText}`}>{accent}</span>
      </>
    )
  }

  return (
    <>
      {`${before} `}
      <span className={styles.goldText}>{accent}</span>
    </>
  )
}

function renderStrengthIcon(index: number): React.ReactElement {
  const commonProps: React.SVGProps<SVGSVGElement> = {
    width: 22,
    height: 22,
    viewBox: '0 0 22 22',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: 'false',
  }

  switch (index % 4) {
    case 0:
      // Globe (`21:1081`)
      return (
        <svg {...commonProps} data-icon="strength-globe">
          <circle cx="11" cy="11" r="8.5" />
          <path d="M2.5 11H19.5" />
          <path d="M11 2.5C13.2 4.8 14.4 7.8 14.4 11C14.4 14.2 13.2 17.2 11 19.5C8.8 17.2 7.6 14.2 7.6 11C7.6 7.8 8.8 4.8 11 2.5Z" />
        </svg>
      )
    case 1:
      // Star (`21:1090`)
      return (
        <svg {...commonProps} data-icon="strength-star">
          <path d="M11 2.5L13.63 7.83L19.5 8.68L15.25 12.82L16.25 18.67L11 15.9L5.75 18.67L6.75 12.82L2.5 8.68L8.37 7.83L11 2.5Z" />
        </svg>
      )
    case 2:
      // Shield Check (`21:1099`)
      return (
        <svg {...commonProps} data-icon="strength-shield">
          <path d="M11 2.5L18 5.6V10.8C18 15.2 15.05 18.75 11 20C6.95 18.75 4 15.2 4 10.8V5.6L11 2.5Z" />
          <path d="M8.2 11.2L10.2 13.2L14.2 9.2" />
        </svg>
      )
    case 3:
    default:
      // Wrench (`21:1108`)
      return (
        <svg {...commonProps} data-icon="strength-wrench">
          <path d="M13.5 5.8C13.3 6 13.2 6.2 13.2 6.4C13.2 6.6 13.3 6.9 13.5 7.1L14.9 8.5C15.1 8.7 15.4 8.8 15.6 8.8C15.8 8.8 16 8.7 16.2 8.5L19.7 5C20.1 6 20.3 7.2 20.1 8.3C19.9 9.4 19.3 10.4 18.5 11.2C17.7 12 16.7 12.5 15.6 12.7C14.5 12.9 13.4 12.8 12.4 12.3L6 18.7C5.6 19.1 5.1 19.3 4.6 19.3C4.1 19.3 3.6 19.1 3.2 18.7C2.8 18.3 2.6 17.8 2.6 17.3C2.6 16.8 2.8 16.3 3.2 15.9L9.6 9.5C9.1 8.5 9 7.4 9.2 6.3C9.4 5.2 9.9 4.2 10.7 3.4C11.5 2.6 12.5 2.1 13.6 1.9C14.7 1.7 15.9 1.8 16.9 2.3L13.5 5.8Z" />
        </svg>
      )
  }
}

function renderPillarCheckIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      data-icon="pillar-check"
      fill="none"
      focusable="false"
      height={12}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.83}
      viewBox="0 0 12 12"
      width={12}
    >
      <path d="M1.5 6.2L4.5 9.2L10.5 3.2" />
    </svg>
  )
}

export async function generateMetadata({ params }: LocaleAboutPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    const dict = getDictionary(DEFAULT_LOCALE)
    return {
      title: dict.errors.notFoundTitle,
      description: dict.errors.notFoundDescription,
    }
  }
  if (locale === 'ar' && !(await canServeArabicLocaleForCurrentRequest())) {
    return {}
  }

  const [siteSettings, aboutPage] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getAboutPage(locale).catch(() => null),
  ])

  const arabicEnabled = siteSettings?.arabicEnabled === true
  const effectiveLocale: SupportedLocale = locale === 'ar' && arabicEnabled ? 'ar' : 'en'
  const dict = getDictionary(effectiveLocale)
  const siteName = siteSettings?.companyName || undefined
  const title =
    aboutPage?.meta?.title ||
    aboutPage?.pageHeader?.title ||
    dict.nav.aboutUs ||
    siteSettings?.defaultSeo?.title ||
    siteName ||
    undefined
  const description =
    aboutPage?.meta?.description ||
    aboutPage?.pageHeader?.subtitle ||
    siteSettings?.defaultSeo?.description ||
    undefined
  const ogImageAsset =
    resolveMediaAsset(aboutPage?.meta?.image, title ?? '', 'og') ??
    resolveMediaAsset(aboutPage?.pageHeader?.image, title ?? '', 'og') ??
    resolveMediaAsset(siteSettings?.defaultSeo?.image, title ?? '', 'og')

  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: `/${effectiveLocale}/about`,
      languages: buildHreflangAlternates('/about', arabicEnabled),
    },
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(siteName ? { siteName } : {}),
      url: `/${effectiveLocale}/about`,
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

export default async function LocaleAboutPage({
  params,
}: LocaleAboutPageProps): Promise<React.JSX.Element> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const activePathname = requestHeaders.get('x-aljazira-pathname') || '/ar/about'
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

  const [siteSettings, aboutPage, homePage, allStats, leadershipMembers, staffMembers] =
    await Promise.all([
      getSiteSettings(locale).catch(() => null),
      getAboutPage(locale).catch(() => null),
      getHomePage(locale).catch(() => null),
      getStats(locale).catch(() => []),
      getTeamMembers(locale, { tier: 'leadership', includeInactive: isDraftMode }).catch(() => []),
      getTeamMembers(locale, { tier: 'staff', includeInactive: isDraftMode }).catch(() => []),
    ])

  const companyName = siteSettings?.companyName || ''

  // 1. Page Header (`21:1034`)
  const pageHeader = aboutPage?.pageHeader
  const pageHeaderEnabled = pageHeader?.enabled !== false
  const headerTitle = pageHeader?.title?.trim() || dict.nav.aboutUs
  const headerSubtitle = pageHeader?.subtitle?.trim() || null
  const headerImage = resolveMediaAsset(pageHeader?.image, headerTitle, 'hero')

  // 2. Our Story (`21:1046`)
  const story = aboutPage?.story
  const storyEnabled = story?.enabled !== false
  const storyEyebrow = story?.eyebrow?.trim() || null
  const storyTitle = story?.title?.trim() || null
  const storyParagraphs = extractLexicalParagraphStrings(story?.text)
  const storyQuote = story?.quote?.trim() || null
  const storyQuoteAuthor = story?.quoteAuthor?.trim() || null
  const storyFallbackAlt = storyTitle || companyName
  const storyImage =
    resolveMediaAsset(story?.image, storyFallbackAlt, 'card') ??
    resolveMediaAsset(pageHeader?.image, storyFallbackAlt, 'card')
  const firstStat: Stat | null = allStats.length > 0 ? (allStats[0] ?? null) : null
  const storyBadgeStat = resolveStatDoc(story?.badgeStat, allStats) ?? firstStat
  const storyBadgeLabel = storyBadgeStat
    ? storyBadgeStat.label === dict.about.yearsOfExperiencePrefix
      ? dict.about.yearsExperienceBadgeLabel
      : storyBadgeStat.label
    : null
  const hasStoryContent = Boolean(
    storyTitle || storyParagraphs.length > 0 || storyQuote || storyImage,
  )

  // 3. Our Core Strengths (`21:1068`)
  const strengths = aboutPage?.strengths
  const strengthsEnabled = strengths?.enabled !== false
  const strengthsEyebrow = strengths?.eyebrow?.trim() || null
  const strengthsTitle = strengths?.title?.trim() || null
  const strengthsIntro = strengths?.intro?.trim() || null
  const strengthsItems = (strengths?.items ?? []).filter((item) => Boolean(item.title.trim()))
  const strengthsFallbackAlt = strengthsTitle || companyName
  const strengthsBgImage =
    resolveMediaAsset(homePage?.statsSection?.backgroundImage, strengthsFallbackAlt, 'hero') ??
    headerImage
  const hasStrengthsContent = Boolean(strengthsItems.length > 0 || strengthsTitle || strengthsIntro)

  // 4. Our Mission & Vision (`108:1576`)
  const missionVision = aboutPage?.missionVision
  const mvEnabled = missionVision?.enabled !== false
  const mvEyebrow = missionVision?.eyebrow?.trim() || null
  const mvTitle = missionVision?.title?.trim() || null
  const mvIntro = missionVision?.intro?.trim() || null

  const mission = missionVision?.mission
  const missionEyebrow = mission?.eyebrow?.trim() || null
  const missionTitle = mission?.title?.trim() || null
  const missionText = mission?.text?.trim() || null
  const missionPillars = (mission?.pillars ?? []).filter((p) => Boolean(p.title.trim()))
  const missionFallbackAlt = missionTitle || companyName
  const missionImage = resolveMediaAsset(mission?.image, missionFallbackAlt, 'card') ?? storyImage

  const vision = missionVision?.vision
  const visionEyebrow = vision?.eyebrow?.trim() || null
  const visionTitle = vision?.title?.trim() || null
  const visionText = vision?.text?.trim() || null
  const visionPillars = (vision?.pillars ?? []).filter((p) => Boolean(p.title.trim()))
  const visionFallbackAlt = visionTitle || companyName
  const visionImage =
    resolveMediaAsset(vision?.image, visionFallbackAlt, 'card') ??
    resolveMediaAsset(missionVision?.image, visionFallbackAlt, 'card') ??
    storyImage

  const hasMissionContent = Boolean(missionTitle || missionText || missionPillars.length > 0)
  const hasVisionContent = Boolean(visionTitle || visionText || visionPillars.length > 0)
  const hasMvContent = Boolean(hasMissionContent || hasVisionContent || mvTitle)

  // 5. Meet Our Team (`21:1162`)
  const team = aboutPage?.team
  const teamEnabled = team?.enabled !== false
  const teamEyebrow = team?.eyebrow?.trim() || null
  const teamTitle = team?.title?.trim() || null
  const rawTeamIntro = team?.intro?.trim() || null
  const [firstTeamIntro = '', secondTeamIntro = ''] = rawTeamIntro ? rawTeamIntro.split(/\n+/) : []
  const teamIntro = firstTeamIntro.trim() || null
  const teamSecondaryIntro =
    secondTeamIntro.trim() || (teamIntro ? dict.about.teamSecondaryIntro : null)
  const staffTitle = team?.staffTitle?.trim() || null
  const staffText = team?.staffText?.trim() || null
  // Empty-state rule (P3-T7 Scope 5): if zero active records in both categories, hide the entire section cleanly.
  const hasTeamRecords = leadershipMembers.length > 0 || staffMembers.length > 0

  const leadershipRow1 =
    leadershipMembers.length >= 4 ? leadershipMembers.slice(0, 2) : leadershipMembers
  const leadershipRow2 = leadershipMembers.length >= 4 ? leadershipMembers.slice(2) : []

  return (
    <DraftImageBypassProvider enabled={isDraftMode}>
      <div className={styles.aboutPage} data-page="about">
        {/* 1. Page Header (`21:1034`) */}
        {pageHeaderEnabled ? (
          <PageHeader
            backgroundImageAlt={headerImage?.alt}
            backgroundImageSrc={headerImage?.url}
            breadcrumbs={[{ label: dict.nav.home, href: `/${locale}` }, { label: headerTitle }]}
            breadcrumbAriaLabel={dict.a11y.breadcrumbNav}
            subtitle={headerSubtitle}
            title={headerTitle}
          />
        ) : null}

        {/* 2. Our Story (`21:1046`) */}
        {storyEnabled && hasStoryContent ? (
          <section className={styles.storySection} data-about-section="our-story" id="our-story">
            <div className={`${gridStyles.container} ${styles.storyContainer}`}>
              <div className={styles.storyVisualCol}>
                <CornerBracketIcon
                  className={styles.storyCornerBracket}
                  size={80}
                  strokeLinecap="round"
                  strokeWidth={4}
                  {...revealAttributes({ variant: 'draw', step: 2 })}
                />
                <div className={styles.storyPhotoWrap} {...revealAttributes({ variant: 'wipe' })}>
                  {storyImage ? (
                    <CspSafeImage
                      alt={storyImage.alt}
                      className={styles.storyPhoto}
                      height={420}
                      sizes="(max-width: 767px) 100vw, 520px"
                      src={storyImage.url}
                      width={520}
                    />
                  ) : null}
                </div>

                {storyBadgeStat ? (
                  <div
                    className={styles.storyBadgeCard}
                    data-story-badge-stat="true"
                    {...revealAttributes({ step: 3 })}
                  >
                    <p className={`${styles.storyBadgeNumber} t-stat-m`}>
                      <bdi dir="ltr">
                        <CountUp value={storyBadgeStat.value} />
                      </bdi>
                    </p>
                    <p className={`${styles.storyBadgeLabel} t-body-s`}>{storyBadgeLabel}</p>
                  </div>
                ) : null}
              </div>

              <div className={styles.storyContentCol} {...revealAttributes({ stagger: true })}>
                <div className={styles.storyHead}>
                  {storyEyebrow ? <Eyebrow label={storyEyebrow} tone="Light" /> : null}
                  {storyTitle ? (
                    <h2 className={`${styles.storyTitle} t-h2`}>
                      {renderAboutAccentHeading(storyTitle, true)}
                    </h2>
                  ) : null}
                  <div aria-hidden="true" className={styles.goldDivider} />
                </div>
                {storyParagraphs.map((paragraph, idx) => (
                  <p className={`${styles.storyParagraph} t-body-m`} key={`story-p-${String(idx)}`}>
                    {paragraph}
                  </p>
                ))}

                {storyQuote || storyQuoteAuthor ? (
                  <blockquote className={styles.storyQuoteBlock}>
                    {storyQuote ? (
                      <p className={`${styles.storyQuoteText} t-body-quote`}>{storyQuote}</p>
                    ) : null}
                    {storyQuoteAuthor ? (
                      <cite className={`${styles.storyQuoteAuthor} t-label-caps`}>
                        {storyQuoteAuthor}
                      </cite>
                    ) : null}
                  </blockquote>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* 3. Our Core Strengths (`21:1068`) */}
        {strengthsEnabled && hasStrengthsContent ? (
          <section
            className={styles.strengthsSection}
            data-about-section="core-strengths"
            data-theme="dark"
            id="core-strengths"
          >
            <div aria-hidden="true" className={styles.strengthsBgLayer}>
              {strengthsBgImage ? (
                <CspSafeImage
                  alt=""
                  className={styles.strengthsBgImage}
                  height={strengthsBgImage.height ?? 586}
                  loading="lazy"
                  sizes="100vw"
                  src={strengthsBgImage.url}
                  width={strengthsBgImage.width ?? 1440}
                />
              ) : null}
              <div className={styles.strengthsBgOverlay} />
            </div>

            <div className={`${gridStyles.container} ${styles.strengthsContainer}`}>
              <div className={styles.centeredSectionHead} {...revealAttributes({ stagger: true })}>
                {strengthsEyebrow ? <Eyebrow label={strengthsEyebrow} tone="Dark" /> : null}
                {strengthsTitle ? (
                  <h2 className={`${styles.strengthsTitle} t-h2`}>
                    {renderAboutAccentHeading(strengthsTitle, false)}
                  </h2>
                ) : null}
                {strengthsIntro ? (
                  <p className={`${styles.strengthsIntro} t-body-l`}>{strengthsIntro}</p>
                ) : null}
                <div aria-hidden="true" className={styles.goldDivider} />
              </div>

              {strengthsItems.length > 0 ? (
                <div className={styles.strengthsGrid}>
                  {strengthsItems.map((item, idx) => (
                    <article
                      className={styles.strengthCard}
                      data-strength-card={formatOneDigitIndex(idx)}
                      key={item.id ?? `strength-${String(idx)}`}
                      {...revealAttributes({ step: (idx % 4) + 1 })}
                    >
                      <div className={styles.strengthCardTop}>
                        <div className={styles.strengthIconBox}>{renderStrengthIcon(idx)}</div>
                        <span aria-hidden="true" className={`${styles.strengthNum} t-stat-m`}>
                          {formatOneDigitIndex(idx)}
                        </span>
                      </div>
                      <h3 className={`${styles.strengthCardTitle} t-h4`}>{item.title}</h3>
                      <div aria-hidden="true" className={styles.strengthMiniBar} />
                      {item.text ? (
                        <p className={`${styles.strengthCardText} t-body-s`}>{item.text}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 4. Our Mission & Vision (`108:1576`) */}
        {mvEnabled && hasMvContent ? (
          <section
            className={styles.mvSection}
            data-about-section="mission-vision"
            id="mission-vision"
          >
            <div className={`${gridStyles.container} ${styles.mvContainer}`}>
              <div
                className={`${styles.centeredSectionHead} ${styles.mvSectionHead}`}
                {...revealAttributes({ stagger: true })}
              >
                {mvEyebrow ? <Eyebrow label={mvEyebrow} tone="Light" /> : null}
                {mvTitle ? (
                  <h2 className={`${styles.mvTitle} t-h2`}>
                    {renderAboutAccentHeading(mvTitle, false)}
                  </h2>
                ) : null}
                {mvIntro ? <p className={`${styles.mvIntro} t-body-l`}>{mvIntro}</p> : null}
                <div aria-hidden="true" className={styles.goldDivider} />
              </div>

              {/* Row 1 — Our Mission (`108:1584`) */}
              {hasMissionContent ? (
                <div className={styles.mvRow} data-mv-row="mission">
                  <div className={styles.mvVisualCol}>
                    <div className={styles.mvPhotoWrap} {...revealAttributes({ variant: 'wipe' })}>
                      {missionImage ? (
                        <CspSafeImage
                          alt={missionImage.alt}
                          className={styles.mvPhoto}
                          height={400}
                          sizes="(max-width: 767px) 100vw, 540px"
                          src={missionImage.url}
                          width={540}
                        />
                      ) : null}
                      <div aria-hidden="true" className={styles.mvPhotoShade} />
                    </div>
                    <div
                      aria-hidden="true"
                      className={`${styles.mvNumberBadge} ${styles.mvNumberBadgeStart}`}
                    >
                      <span className={`${styles.mvBadgeText} t-h3`}>{formatTwoDigitIndex(0)}</span>
                    </div>
                  </div>

                  <div className={styles.mvContentCol} {...revealAttributes({ stagger: true })}>
                    {missionEyebrow ? <Eyebrow label={missionEyebrow} tone="Light" /> : null}
                    {missionTitle ? (
                      <h3 className={`${styles.mvRowTitle} t-h2`}>{missionTitle}</h3>
                    ) : null}
                    <div aria-hidden="true" className={styles.mvGoldBar} />
                    {missionText ? (
                      <p className={`${styles.mvRowText} t-body-l`}>{missionText}</p>
                    ) : null}
                    {missionPillars.length > 0 ? (
                      <ul className={styles.pillarsList}>
                        {missionPillars.map((pillar, idx) => (
                          <li
                            className={styles.pillarItem}
                            key={pillar.id ?? `mission-pillar-${String(idx)}`}
                          >
                            <span aria-hidden="true" className={styles.pillarCheckBox}>
                              {renderPillarCheckIcon()}
                            </span>
                            <p className={`${styles.pillarText} t-body-m`}>
                              <strong className={styles.pillarTitle}>{pillar.title}</strong>
                              {pillar.text ? ` — ${pillar.text}` : null}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Row 2 — Our Vision (`108:1646`) */}
              {hasVisionContent ? (
                <div className={styles.mvRow} data-mv-row="vision">
                  <div className={styles.mvContentCol} {...revealAttributes({ stagger: true })}>
                    {visionEyebrow ? <Eyebrow label={visionEyebrow} tone="Light" /> : null}
                    {visionTitle ? (
                      <h3 className={`${styles.mvRowTitle} t-h2`}>{visionTitle}</h3>
                    ) : null}
                    <div aria-hidden="true" className={styles.mvGoldBar} />
                    {visionText ? (
                      <p className={`${styles.mvRowText} t-body-l`}>{visionText}</p>
                    ) : null}
                    {visionPillars.length > 0 ? (
                      <ul className={styles.pillarsList}>
                        {visionPillars.map((pillar, idx) => (
                          <li
                            className={styles.pillarItem}
                            key={pillar.id ?? `vision-pillar-${String(idx)}`}
                          >
                            <span aria-hidden="true" className={styles.pillarCheckBox}>
                              {renderPillarCheckIcon()}
                            </span>
                            <p className={`${styles.pillarText} t-body-m`}>
                              <strong className={styles.pillarTitle}>{pillar.title}</strong>
                              {pillar.text ? ` — ${pillar.text}` : null}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className={styles.mvVisualCol}>
                    <div className={styles.mvPhotoWrap} {...revealAttributes({ variant: 'wipe' })}>
                      {visionImage ? (
                        <CspSafeImage
                          alt={visionImage.alt}
                          className={styles.mvPhoto}
                          height={400}
                          sizes="(max-width: 767px) 100vw, 540px"
                          src={visionImage.url}
                          width={540}
                        />
                      ) : null}
                      <div aria-hidden="true" className={styles.mvPhotoShade} />
                    </div>
                    <div
                      aria-hidden="true"
                      className={`${styles.mvNumberBadge} ${styles.mvNumberBadgeEnd}`}
                    >
                      <span className={`${styles.mvBadgeText} t-h3`}>{formatTwoDigitIndex(1)}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 5. Meet Our Team (`21:1162`) — hidden cleanly if zero active records */}
        {teamEnabled && hasTeamRecords ? (
          <section
            className={styles.teamSection}
            data-about-section="meet-our-team"
            id="meet-our-team"
          >
            <div className={`${gridStyles.container} ${styles.teamTopContainer}`}>
              <div className={styles.teamHeaderRow} {...revealAttributes({ stagger: true })}>
                <div className={styles.teamHeaderStart}>
                  {teamEyebrow ? <Eyebrow label={teamEyebrow} tone="Light" /> : null}
                  {teamTitle ? (
                    <h2 className={`${styles.teamTitle} t-h2`}>
                      {renderAboutAccentHeading(teamTitle, false)}
                    </h2>
                  ) : null}
                  {teamIntro ? <p className={`${styles.teamIntro} t-body-l`}>{teamIntro}</p> : null}
                </div>
                {teamSecondaryIntro ? (
                  <p className={`${styles.teamIntroSecondary} t-body-m`}>{teamSecondaryIntro}</p>
                ) : null}
              </div>

              {leadershipMembers.length > 0 ? (
                <div className={styles.leadershipGrid} data-team-subsection="leadership">
                  <div className={styles.leadershipRow}>
                    {leadershipRow1.map((member, idx) => (
                      <div
                        className={styles.leadershipCardSlot}
                        key={member.id}
                        {...revealAttributes({ step: (idx % 4) + 1 })}
                      >
                        <TeamCard locale={locale} member={member} />
                      </div>
                    ))}
                  </div>
                  {leadershipRow2.length > 0 ? (
                    <div className={styles.leadershipRow}>
                      {leadershipRow2.map((member, idx) => {
                        const isOffset = idx === 0 || idx === 2
                        return (
                          <div
                            className={`${styles.leadershipCardSlot}${
                              isOffset ? ` ${styles.leadershipCardOffset}` : ''
                            }`}
                            key={member.id}
                            {...revealAttributes({ step: ((idx + 2) % 4) + 1 })}
                          >
                            <TeamCard locale={locale} member={member} />
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {staffMembers.length > 0 ? (
              <div className={styles.widerTeamBlock} data-team-subsection="staff">
                {staffTitle || staffText ? (
                  <div
                    className={`${gridStyles.container} ${styles.widerTeamHead}`}
                    {...revealAttributes({ stagger: true })}
                  >
                    {staffTitle ? (
                      <h3 className={`${styles.staffTitle} t-h3`}>{staffTitle}</h3>
                    ) : null}
                    {staffText ? (
                      <p className={`${styles.staffText} t-body-m`}>{staffText}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className={styles.widerTeamMarqueeWrap}>
                  <TeamMarquee locale={locale} members={staffMembers} />
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </DraftImageBypassProvider>
  )
}
