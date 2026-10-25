import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type React from 'react'

import { Button } from '@/components/Button'
import { CspSafeImage } from '@/components/CspSafeImage'
import { Eyebrow } from '@/components/Eyebrow'
import { HomeScrollHintButton } from '@/components/HomeScrollHintButton'
import { CornerBracketIcon } from '@/components/icons'
import { IntroSplash } from '@/components/IntroSplash'
import { LogoMarquee } from '@/components/LogoMarquee'
import { normalizeLocalMediaUrl, resolveMediaAsset } from '@/components/media-utils'
import { ProjectCard } from '@/components/ProjectCard'
import { ServicesCarousel } from '@/components/ServicesCarousel'
import { InteractiveSystemsSection } from '@/components/systems3d/InteractiveSystemsSection'
import {
  buildHreflangAlternates,
  DEFAULT_LOCALE,
  getDictionary,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import {
  getBrands,
  getHomePage,
  getProjects,
  getServices,
  getSiteSettings,
  getStats,
} from '@/lib/cms'
import { type CmsLinkDataLike, resolveSafeCmsLinkData } from '@/lib/link-safety'
import type { Project, Stat, Video } from '@/payload-types'
import gridStyles from '@/styles/grid.module.css'

import { canServeArabicLocaleForCurrentRequest, enforceArabicEnabledOrRedirect } from './layout'
import styles from './page.module.css'

interface LocaleHomePageProps {
  params: Promise<{ locale: string }>
}

/**
 * Extracts plain-text paragraphs from a Payload Lexical richText object (or newline-separated string).
 */
export function extractLexicalParagraphs(richText: unknown, maxParagraphs = 2): string[] {
  if (!richText) {
    return []
  }
  if (typeof richText === 'string') {
    return richText
      .split(/\n{2,}|\r\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, maxParagraphs)
  }
  if (typeof richText !== 'object') {
    return []
  }

  const collectNodeText = (node: unknown): string => {
    if (!node || typeof node !== 'object') {
      return ''
    }
    const rec = node as { text?: unknown; type?: unknown; children?: unknown[] }
    if (typeof rec.text === 'string') {
      return rec.text
    }
    if (rec.type === 'linebreak') {
      return '\n'
    }
    if (Array.isArray(rec.children)) {
      return rec.children.map(collectNodeText).join('')
    }
    return ''
  }

  const root = (richText as { root?: { children?: unknown[] } }).root
  if (!root || !Array.isArray(root.children)) {
    return []
  }

  const paragraphs: string[] = []
  for (const child of root.children) {
    const text = collectNodeText(child).trim()
    if (text.length > 0) {
      paragraphs.push(text)
      if (paragraphs.length >= maxParagraphs) {
        break
      }
    }
  }
  return paragraphs
}

/**
 * Splits a `Stat.value` string (e.g. `"9+"`, `"30+"`, `"85%"`) into its leading figure
 * and trailing symbol (`+` or `%`) so the symbol can be styled in `--gold-500`.
 */
export function splitStatValueAndSuffix(rawValue: string): {
  numberPart: string
  suffixPart: string | null
} {
  const trimmed = rawValue.trim()
  const match = trimmed.match(/^(.+?)([+%]+)$/)
  if (match && match[1] && match[2]) {
    return {
      numberPart: match[1],
      suffixPart: match[2],
    }
  }
  return {
    numberPart: trimmed,
    suffixPart: null,
  }
}

export type AccentHeadingMode = 'who' | 'services' | 'interactive' | 'projects'

export function splitAccentHeadingParts(
  rawTitle: string,
  mode: AccentHeadingMode = 'who',
): { before: string; accent: string | null; after: string } {
  const trimmed = rawTitle.trim()
  if (!trimmed) {
    return { before: '', accent: null, after: '' }
  }
  if (trimmed.includes('\n')) {
    const [first = '', ...rest] = trimmed.split('\n')
    const second = rest.join(' ').trim()
    return {
      before: second ? `${first.trim()} ` : first.trim(),
      accent: second || null,
      after: '',
    }
  }

  const words = trimmed.split(/\s+/)
  if (words.length < 2) {
    return { before: trimmed, accent: null, after: '' }
  }
  if (words.length === 2) {
    return {
      before: `${words[0] ?? ''} `,
      accent: words[1] ?? null,
      after: '',
    }
  }
  if (words.length === 3) {
    return {
      before: `${words[0] ?? ''} `,
      accent: words.slice(1).join(' '),
      after: '',
    }
  }

  if (mode === 'who') {
    const splitAt = words.length === 4 ? 2 : Math.max(1, words.length - 3)
    return {
      before: `${words.slice(0, splitAt).join(' ')} `,
      accent: words.slice(splitAt).join(' '),
      after: '',
    }
  }

  if (mode === 'services') {
    const isArabic = /^[\u0600-\u06FF]/.test(trimmed)
    if (isArabic) {
      const splitAt = Math.min(3, words.length - 1)
      return {
        before: `${words.slice(0, splitAt).join(' ')} `,
        accent: words.slice(splitAt).join(' '),
        after: '',
      }
    }
    if (words.length >= 6) {
      const splitAt = words.length - 3
      return {
        before: `${words.slice(0, splitAt).join(' ')} `,
        accent: words.slice(splitAt).join(' '),
        after: '',
      }
    }
    return {
      before: `${words[0] ?? ''} `,
      accent: words.slice(1, -1).join(' '),
      after: ` ${words[words.length - 1] ?? ''}`,
    }
  }

  if (mode === 'interactive') {
    const commaMatch = /^([^,،]+[,،])\s*(.+)$/.exec(trimmed)
    if (commaMatch && commaMatch[1] && commaMatch[2]) {
      return {
        before: `${commaMatch[1]} `,
        accent: commaMatch[2],
        after: '',
      }
    }
    const splitAt = Math.min(3, words.length - 1)
    return {
      before: `${words.slice(0, splitAt).join(' ')} `,
      accent: words.slice(splitAt).join(' '),
      after: '',
    }
  }

  const splitAt = Math.min(2, words.length - 1)
  return {
    before: `${words.slice(0, splitAt).join(' ')} `,
    accent: words.slice(splitAt).join(' '),
    after: '',
  }
}

/**
 * Renders a section `H2` title, styling its gold accent segment in `--gold-500`
 * while keeping the exact CMS string in DOM textContent.
 */
export function renderAccentHeading(
  title: string,
  mode: AccentHeadingMode = 'who',
): React.ReactNode {
  const { before, accent, after } = splitAccentHeadingParts(title, mode)
  if (!accent) {
    return before
  }
  return (
    <>
      {before}
      <span className={styles.goldText}>{accent}</span>
      {after}
    </>
  )
}

function resolveButtonGroupHref(
  button: { link?: CmsLinkDataLike | null } | null | undefined,
  locale: 'ar' | 'en',
): string | null {
  if (!button?.link) {
    return null
  }
  return resolveSafeCmsLinkData(button.link, { locale })?.href ?? null
}

function resolveVideoUrl(video: number | Video | null | undefined): string | null {
  if (!video || typeof video !== 'object') {
    return null
  }
  const url = typeof video.url === 'string' ? normalizeLocalMediaUrl(video.url) : ''
  return url.length > 0 ? url : null
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

export async function generateMetadata({ params }: LocaleHomePageProps): Promise<Metadata> {
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
  const [siteSettings, homePage] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getHomePage(locale).catch(() => null),
  ])
  const arabicEnabled = siteSettings?.arabicEnabled === true
  const effectiveLocale: SupportedLocale = locale === 'ar' && arabicEnabled ? 'ar' : 'en'
  const siteName = siteSettings?.companyName || undefined
  const title = homePage?.meta?.title || siteSettings?.defaultSeo?.title || siteName || undefined
  const description =
    homePage?.meta?.description ||
    siteSettings?.defaultSeo?.description ||
    siteSettings?.tagline ||
    undefined
  const ogImageAsset =
    resolveMediaAsset(homePage?.meta?.image, title ?? '', 'og') ??
    resolveMediaAsset(siteSettings?.defaultSeo?.image, title ?? '', 'og')

  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: `/${effectiveLocale}`,
      languages: buildHreflangAlternates('/', arabicEnabled),
    },
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(siteName ? { siteName } : {}),
      url: `/${effectiveLocale}`,
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

export default async function LocaleHomePage({
  params,
}: LocaleHomePageProps): Promise<React.JSX.Element> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const activePathname = requestHeaders.get('x-aljazira-pathname') || '/ar'
    const activeSearch = requestHeaders.get('x-aljazira-search') || ''
    await enforceArabicEnabledOrRedirect(requestHeaders, activePathname, activeSearch)
  }

  const dict = getDictionary(locale)

  const [siteSettings, homePage, mainServices, allStats, featuredProjectsResult, marqueeBrands] =
    await Promise.all([
      getSiteSettings(locale).catch(() => null),
      getHomePage(locale).catch(() => null),
      getServices(locale, { tier: 'main' }).catch(() => []),
      getStats(locale).catch(() => []),
      getProjects(locale, { featuredOnly: true, limit: 6 }).catch(() => ({
        docs: [] as Project[],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
      })),
      getBrands(locale, { marqueeOnly: true }).catch(() => []),
    ])

  const companyName = siteSettings?.companyName || null
  const tagline = siteSettings?.tagline || null

  // 1. Hero section data (`17:199`)
  const hero = homePage?.hero
  const heroEnabled = hero?.enabled !== false
  const heroEyebrow = hero?.eyebrow?.trim() || null
  const heroTitle = hero?.title?.trim() || null
  const heroTitleAccent = hero?.titleAccent?.trim() || null
  const heroSubtitle = hero?.subtitle?.trim() || null
  const heroPrimaryLabel = hero?.primaryCta?.label?.trim() || null
  const heroPrimaryHref = resolveButtonGroupHref(hero?.primaryCta, locale)
  const heroSecondaryLabel = hero?.secondaryCta?.label?.trim() || null
  const heroSecondaryHref = resolveButtonGroupHref(hero?.secondaryCta, locale)
  const heroBgImage = resolveMediaAsset(hero?.background, heroTitle ?? companyName ?? '', 'hero')
  const heroBgVideoUrl = resolveVideoUrl(hero?.backgroundVideo)
  const hasHeroContent = Boolean(
    heroEyebrow ||
    heroTitle ||
    heroTitleAccent ||
    heroSubtitle ||
    heroPrimaryLabel ||
    heroSecondaryLabel,
  )

  // 2. Who We Are section data (`17:222`)
  const whoWeAre = homePage?.whoWeAre
  const whoEnabled = whoWeAre?.enabled !== false
  const whoEyebrow = whoWeAre?.eyebrow?.trim() || null
  const whoTitle = whoWeAre?.title?.trim() || null
  const whoParagraphs = extractLexicalParagraphs(whoWeAre?.text, 2)
  const whoButtonLabel = whoWeAre?.button?.label?.trim() || null
  const whoButtonHref = resolveButtonGroupHref(whoWeAre?.button, locale)
  const whoImage = resolveMediaAsset(whoWeAre?.image, whoTitle ?? companyName ?? '', 'card')
  const whoBadgeStat = resolveStatDoc(whoWeAre?.badgeStat, allStats)
  const hasWhoContent = Boolean(
    whoEyebrow || whoTitle || whoParagraphs.length > 0 || whoButtonLabel || whoImage,
  )

  // 3. Core Services section data (`17:254`)
  const coreServices = homePage?.coreServices
  const coreServicesEnabled = coreServices?.enabled !== false
  const coreServicesEyebrow = coreServices?.eyebrow?.trim() || null
  const coreServicesTitle = coreServices?.title?.trim() || null
  const coreServicesIntro = coreServices?.intro?.trim() || null
  const coreServicesButtonLabel = coreServices?.button?.label?.trim() || undefined
  const coreServicesButtonHref =
    resolveButtonGroupHref(coreServices?.button, locale) ?? `/${locale}/services`
  const hasCoreServicesContent = Boolean(
    mainServices.length > 0 || coreServicesTitle || coreServicesIntro,
  )

  // 5. Trusted by Industry Leaders / Stats section data (`18:285`)
  const statsSection = homePage?.statsSection
  const statsEnabled = statsSection?.enabled !== false
  const statsTitle = statsSection?.title?.trim() || null
  const statsText = statsSection?.text?.trim() || null
  const statsBgImage = resolveMediaAsset(
    statsSection?.backgroundImage,
    statsTitle ?? companyName ?? '',
    'hero',
  )
  const resolvedSectionStats: Stat[] = (() => {
    const rawRel = statsSection?.stats
    if (Array.isArray(rawRel) && rawRel.length > 0) {
      const mapped = rawRel
        .map((item) => resolveStatDoc(item, allStats))
        .filter((item): item is Stat => item !== null)
      if (mapped.length > 0) {
        return mapped.slice(0, 4)
      }
    }
    return allStats.slice(0, 4)
  })()
  const hasStatsContent = Boolean(resolvedSectionStats.length > 0 && (statsTitle || statsText))

  // 6. Featured Projects section data (`18:308`)
  const featuredProjects = homePage?.featuredProjects
  const featuredProjectsEnabled = featuredProjects?.enabled !== false
  const featuredProjectsEyebrow = featuredProjects?.eyebrow?.trim() || null
  const featuredProjectsTitle = featuredProjects?.title?.trim() || null
  const featuredProjectsIntro = featuredProjects?.intro?.trim() || null
  const featuredProjectsButtonLabel = featuredProjects?.button?.label?.trim() || null
  const featuredProjectsButtonHref =
    resolveButtonGroupHref(featuredProjects?.button, locale) ?? `/${locale}/projects`
  const featuredProjectDocs = featuredProjectsResult.docs
  const hasFeaturedProjectsContent = Boolean(
    featuredProjectDocs.length > 0 || featuredProjectsTitle,
  )

  // 7. Trusted Partners section data (`18:579`)
  const partners = homePage?.partners
  const partnersEnabled = partners?.enabled !== false
  const partnersEyebrow = partners?.eyebrow?.trim() || null
  const partnersTitle = partners?.title?.trim() || null
  const partnersIntro = partners?.intro?.trim() || null
  const hasPartnersContent = Boolean(marqueeBrands.length > 0 && (partnersTitle || partnersIntro))

  // 8. CTA section data (`18:660`)
  const cta = homePage?.cta
  const ctaEnabled = cta?.enabled !== false
  const ctaTitle = cta?.title?.trim() || null
  const ctaTitleAccent = cta?.titleAccent?.trim() || null
  const ctaText = cta?.text?.trim() || null
  const ctaPrimaryLabel = cta?.button?.label?.trim() || null
  const ctaPrimaryHref = resolveButtonGroupHref(cta?.button, locale) ?? `/${locale}/contact#quote`
  const ctaSecondaryLabel = cta?.secondaryButton?.label?.trim() || null
  const ctaSecondaryHref =
    resolveButtonGroupHref(cta?.secondaryButton, locale) ??
    (siteSettings?.phone ? `tel:${siteSettings.phone.replace(/\s+/g, '')}` : `/${locale}/contact`)
  const ctaBgImage = resolveMediaAsset(cta?.backgroundImage, ctaTitle ?? companyName ?? '', 'hero')
  const hasCtaContent = Boolean(
    ctaTitle || ctaTitleAccent || ctaText || ctaPrimaryLabel || ctaSecondaryLabel,
  )

  return (
    <div className={styles.homePage} data-page="home">
      <IntroSplash locale={locale} siteName={companyName} tagline={tagline} />

      <div className={styles.homeContent} data-home-content="true">
        {/* 1. Hero Section (17:199) */}
        {heroEnabled && hasHeroContent ? (
          <section
            className={styles.heroSection}
            data-home-section="hero"
            data-theme="dark"
            id="hero"
          >
            <div aria-hidden="true" className={styles.heroMediaLayer}>
              {heroBgVideoUrl ? (
                <video
                  autoPlay
                  className={styles.heroBgMedia}
                  loop
                  muted
                  playsInline
                  src={heroBgVideoUrl}
                />
              ) : heroBgImage ? (
                <CspSafeImage
                  alt=""
                  className={styles.heroBgMedia}
                  fetchPriority="high"
                  height={heroBgImage.height ?? 864}
                  loading="eager"
                  sizes="100vw"
                  src={heroBgImage.url}
                  width={heroBgImage.width ?? 1440}
                />
              ) : null}
              <div className={styles.heroOverlay} />
              <div className={styles.heroGoldGlow} />
            </div>

            <div className={styles.heroContent}>
              {heroEyebrow ? <Eyebrow label={heroEyebrow} tone="Dark" /> : null}

              {heroTitle || heroTitleAccent ? (
                <h1 className={`${styles.heroTitle} t-display-xl`}>
                  {heroTitle ? <span className={styles.blockLine}>{heroTitle}</span> : null}
                  {heroTitle && heroTitleAccent ? ' ' : null}
                  {heroTitleAccent ? (
                    <span className={`${styles.blockLine} ${styles.goldText}`}>
                      {heroTitleAccent}
                    </span>
                  ) : null}
                </h1>
              ) : null}

              {heroSubtitle ? (
                <p className={`${styles.heroSubtitle} t-body-l`}>{heroSubtitle}</p>
              ) : null}

              {heroPrimaryLabel || heroSecondaryLabel ? (
                <div className={styles.heroCtaGroup}>
                  {heroPrimaryLabel ? (
                    <Button
                      href={heroPrimaryHref ?? `/${locale}/services`}
                      label={heroPrimaryLabel}
                      link={hero?.primaryCta?.link}
                      locale={locale}
                      showArrow
                      variant="Gold"
                    />
                  ) : null}
                  {heroSecondaryLabel ? (
                    <Button
                      href={heroSecondaryHref ?? `/${locale}/projects`}
                      label={heroSecondaryLabel}
                      link={hero?.secondaryCta?.link}
                      locale={locale}
                      showArrow
                      variant="Glass"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            <HomeScrollHintButton
              className={styles.scrollHintButton}
              iconClassName={styles.scrollHintIcon}
              label={dict.home.scrollToExplore}
              labelClassName={`${styles.scrollHintLabel} t-label-caps`}
              targetId="who-we-are"
            />
          </section>
        ) : null}

        {/* 2. Who We Are Section (17:222) */}
        {whoEnabled && hasWhoContent ? (
          <section className={styles.whoSection} data-home-section="who-we-are" id="who-we-are">
            <div className={`${gridStyles.container} ${styles.whoContainer}`}>
              <div className={styles.whoVisualCol}>
                <CornerBracketIcon className={styles.whoCornerBracket} size={80} />
                <div className={styles.whoPhotoWrap}>
                  {whoImage ? (
                    <CspSafeImage
                      alt={whoImage.alt}
                      className={styles.whoPhoto}
                      height={410}
                      sizes="(max-width: 767px) 100vw, 540px"
                      src={whoImage.url}
                      width={540}
                    />
                  ) : null}
                </div>
                {whoBadgeStat ? (
                  <div className={styles.whoBadgeCard} data-who-badge-stat="true">
                    <p className={`${styles.whoBadgeNumber} t-stat-m`}>{whoBadgeStat.value}</p>
                    <p className={`${styles.whoBadgeLabel} t-body-s`}>{whoBadgeStat.label}</p>
                  </div>
                ) : null}
              </div>

              <div className={styles.whoContentCol}>
                {whoEyebrow ? <Eyebrow label={whoEyebrow} tone="Light" /> : null}
                {whoTitle ? (
                  <h2 className={`${styles.whoTitle} t-h2`}>
                    {renderAccentHeading(whoTitle, 'who')}
                  </h2>
                ) : null}
                {whoParagraphs.map((paragraph, idx) => (
                  <p className={`${styles.whoParagraph} t-body-m`} key={`who-p-${String(idx)}`}>
                    {paragraph}
                  </p>
                ))}
                {whoButtonLabel ? (
                  <div className={styles.whoButtonWrap}>
                    <Button
                      href={whoButtonHref ?? `/${locale}/about`}
                      label={whoButtonLabel}
                      link={whoWeAre?.button?.link}
                      locale={locale}
                      showArrow
                      variant="Dark"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* 3. Core Services Section (17:254) */}
        {coreServicesEnabled && hasCoreServicesContent ? (
          <section
            className={styles.servicesSection}
            data-home-section="core-services"
            id="core-services"
          >
            <div className={styles.servicesStack}>
              <div className={gridStyles.container}>
                <div className={styles.splitSectionHead}>
                  <div className={styles.splitHeadLeft}>
                    {coreServicesEyebrow ? (
                      <Eyebrow label={coreServicesEyebrow} tone="Light" />
                    ) : null}
                    {coreServicesTitle ? (
                      <h2 className={`${styles.sectionHeadingDark} t-h2`}>
                        {renderAccentHeading(coreServicesTitle, 'services')}
                      </h2>
                    ) : null}
                  </div>
                  {coreServicesIntro ? (
                    <p className={`${styles.servicesIntroText} t-body-m`}>{coreServicesIntro}</p>
                  ) : null}
                </div>
              </div>

              {mainServices.length > 0 ? (
                <div className={styles.carouselOuter}>
                  <ServicesCarousel
                    locale={locale}
                    services={mainServices.map((s) => ({
                      id: s.id,
                      title: s.title,
                      slug: s.slug,
                      icon: s.icon,
                      shortDescription: s.shortDescription,
                      featured: s.featured,
                    }))}
                    viewAllHref={coreServicesButtonHref}
                    viewAllLabel={coreServicesButtonLabel}
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 4. Interactive Systems Section (111:1608) */}
        <InteractiveSystemsSection
          companyName={companyName}
          data={homePage?.interactiveSystems}
          headClassNames={{
            head: styles.splitSectionHead,
            headLeft: styles.splitHeadLeft,
            heading: styles.sectionHeadingDark,
          }}
          locale={locale}
          renderHeading={(title) => renderAccentHeading(title, 'interactive')}
        />

        {/* 5. Trusted by Industry Leaders / Stats Section (18:285) */}
        {statsEnabled && hasStatsContent ? (
          <section
            className={styles.statsSection}
            data-home-section="stats"
            data-theme="dark"
            id="stats"
          >
            {statsBgImage ? (
              <div aria-hidden="true" className={styles.statsBgLayer}>
                <CspSafeImage
                  alt=""
                  className={styles.statsBgImage}
                  height={statsBgImage.height ?? 425}
                  sizes="100vw"
                  src={statsBgImage.url}
                  width={statsBgImage.width ?? 1440}
                />
                <div className={styles.statsBgOverlay} />
              </div>
            ) : null}

            <div className={`${gridStyles.container} ${styles.statsStack}`}>
              <div className={styles.statsHead}>
                {statsTitle ? <h2 className={`${styles.statsTitle} t-h2`}>{statsTitle}</h2> : null}
                {statsText ? (
                  <p className={`${styles.statsSubtitle} t-body-l`}>{statsText}</p>
                ) : null}
                <div aria-hidden="true" className={styles.goldDivider} />
              </div>

              <div className={styles.statsRow}>
                {resolvedSectionStats.map((statDoc, idx) => {
                  const { numberPart, suffixPart } = splitStatValueAndSuffix(statDoc.value)
                  return (
                    <div className={styles.statItemGroup} key={String(statDoc.id)}>
                      {idx > 0 ? <div aria-hidden="true" className={styles.statDivider} /> : null}
                      <div className={styles.statCol} data-stat-item={String(idx + 1)}>
                        <p className={`${styles.statNumber} t-stat-number`}>
                          <span>{numberPart}</span>
                          {suffixPart ? (
                            <span className={styles.statSuffix}>{suffixPart}</span>
                          ) : null}
                        </p>
                        <p className={`${styles.statLabel} t-body-m`}>{statDoc.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* 6. Featured Projects Section (18:308) */}
        {featuredProjectsEnabled && hasFeaturedProjectsContent ? (
          <section
            className={styles.projectsSection}
            data-home-section="featured-projects"
            id="featured-projects"
          >
            <div className={`${gridStyles.container} ${styles.projectsStack}`}>
              <div className={styles.centeredSectionHead}>
                {featuredProjectsEyebrow ? (
                  <Eyebrow label={featuredProjectsEyebrow} tone="Light" />
                ) : null}
                {featuredProjectsTitle ? (
                  <h2 className={`${styles.sectionHeadingDark} t-h2`}>
                    {renderAccentHeading(featuredProjectsTitle, 'projects')}
                  </h2>
                ) : null}
                {featuredProjectsIntro ? (
                  <p className={`${styles.centeredSectionIntro} t-body-l`}>
                    {featuredProjectsIntro}
                  </p>
                ) : null}
                <div aria-hidden="true" className={styles.goldDivider} />
              </div>

              {featuredProjectDocs.length > 0 ? (
                <div className={styles.projectsGrid}>
                  {featuredProjectDocs.map((projectDoc) => (
                    <ProjectCard key={projectDoc.slug} locale={locale} project={projectDoc} />
                  ))}
                </div>
              ) : null}

              {featuredProjectsButtonLabel ? (
                <Button
                  href={featuredProjectsButtonHref}
                  label={featuredProjectsButtonLabel}
                  link={featuredProjects?.button?.link}
                  locale={locale}
                  showArrow
                  variant="Dark"
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 7. Trusted Partners Section (18:579) */}
        {partnersEnabled && hasPartnersContent ? (
          <section className={styles.partnersSection} data-home-section="partners" id="partners">
            <div className={styles.partnersStack}>
              <div className={gridStyles.container}>
                <div className={styles.partnersHead}>
                  {partnersEyebrow ? <Eyebrow label={partnersEyebrow} tone="Light" /> : null}
                  {partnersTitle ? (
                    <h2 className={`${styles.sectionHeadingDark} t-h2`}>{partnersTitle}</h2>
                  ) : null}
                  {partnersIntro ? (
                    <p className={`${styles.centeredSectionIntro} t-body-l`}>{partnersIntro}</p>
                  ) : null}
                </div>
              </div>

              <div className={styles.marqueeOuter}>
                <LogoMarquee brands={marqueeBrands} locale={locale} />
              </div>
            </div>
          </section>
        ) : null}

        {/* 8. CTA Section (18:660) */}
        {ctaEnabled && hasCtaContent ? (
          <section className={styles.ctaSection} data-home-section="cta" data-theme="dark" id="cta">
            <div aria-hidden="true" className={styles.ctaBgLayer}>
              {ctaBgImage ? (
                <CspSafeImage
                  alt=""
                  className={styles.ctaBgImage}
                  height={484}
                  sizes="100vw"
                  src={ctaBgImage.url}
                  width={1440}
                />
              ) : null}
              <div className={styles.ctaBgOverlay} />
            </div>

            <div aria-hidden="true" className={styles.ctaSquareTopStart} />
            <div aria-hidden="true" className={styles.ctaSquareBottomStart} />
            <div aria-hidden="true" className={styles.ctaSquareTopEnd} />
            <div aria-hidden="true" className={styles.ctaSquareBottomEnd} />

            <div className={styles.ctaContent}>
              {ctaTitle || ctaTitleAccent ? (
                <h2 className={`${styles.ctaTitle} t-display-l`}>
                  {ctaTitle ? <span className={styles.blockLine}>{ctaTitle}</span> : null}
                  {ctaTitle && ctaTitleAccent ? ' ' : null}
                  {ctaTitleAccent ? (
                    <span className={`${styles.blockLine} ${styles.goldText}`}>
                      {ctaTitleAccent}
                    </span>
                  ) : null}
                </h2>
              ) : null}

              {ctaText ? <p className={`${styles.ctaSubtitle} t-body-l`}>{ctaText}</p> : null}

              {ctaPrimaryLabel || ctaSecondaryLabel ? (
                <div className={styles.ctaButtonsRow}>
                  {ctaPrimaryLabel ? (
                    <Button
                      href={ctaPrimaryHref}
                      label={ctaPrimaryLabel}
                      link={cta?.button?.link}
                      locale={locale}
                      showArrow
                      variant="Gold"
                    />
                  ) : null}
                  {ctaSecondaryLabel ? (
                    <Button
                      href={ctaSecondaryHref}
                      label={ctaSecondaryLabel}
                      link={cta?.secondaryButton?.link}
                      locale={locale}
                      showArrow={false}
                      variant="Glass"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
