import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { ReactElement } from 'react'
import { z } from 'zod'

import { Button } from '@/components/Button'
import { CmsLink } from '@/components/CmsLink'
import { CountUp } from '@/components/CountUp'
import { CspSafeImage, DraftImageBypassProvider } from '@/components/CspSafeImage'
import { CtaBand } from '@/components/CtaBand'
import { Eyebrow } from '@/components/Eyebrow'
import { CornerBracketIcon } from '@/components/icons'
import { resolveMediaAsset } from '@/components/media-utils'
import { PageHeader } from '@/components/PageHeader'
import { ProjectCard } from '@/components/ProjectCard'
import { revealAttributes } from '@/components/Reveal'
import { extractLexicalParagraphStrings } from '@/components/RichTextRenderer'
import {
  buildHreflangAlternates,
  formatPageNumberLabel,
  getDictionary,
  isSupportedLocale,
  splitHeadingForGoldAccent,
  type SupportedLocale,
} from '@/i18n'
import {
  getHomePage,
  getProjectCategoryCounts,
  getProjects,
  getProjectsPage,
  getSiteSettings,
  getStats,
  type ProjectCategoryCounts,
} from '@/lib/cms'
import type { Project, Stat } from '@/payload-types'

import { canServeArabicLocaleForCurrentRequest, enforceArabicEnabledOrRedirect } from '../layout'
import styles from './page.module.css'

export const PROJECTS_PAGE_SIZE = 15

export const PROJECT_CATEGORY_VALUES = [
  'mep',
  'fire-fighting',
  'low-current',
  'data-center',
  'civil-mep',
] as const satisfies readonly Project['category'][]

export const PROJECT_STATUS_VALUES = [
  'completed',
  'in-progress',
] as const satisfies readonly Project['status'][]

export const PROJECT_SCOPE_VALUES = [
  'mep',
  'fire-fighting',
  'low-current',
  'data-center',
  'hvac',
  'plumbing',
  'electrical',
  'civil',
] as const satisfies readonly NonNullable<Project['scope']>[number][]

export type ProjectCategory = Project['category']
export type ProjectStatus = Project['status']
export type ProjectScope = NonNullable<Project['scope']>[number]

const rawSearchParamsObjectSchema = z
  .object({
    category: z.enum(PROJECT_CATEGORY_VALUES).optional().catch(undefined),
    status: z.enum(PROJECT_STATUS_VALUES).optional().catch(undefined),
    scope: z.enum(PROJECT_SCOPE_VALUES).optional().catch(undefined),
    page: z.coerce.number().int().min(1).max(500).optional().catch(1),
  })
  .strip()

export interface ValidatedProjectsFilters {
  category?: ProjectCategory
  status?: ProjectStatus
  scope?: ProjectScope
  page: number
}

function pickSingleParam(val: string | string[] | undefined): string | undefined {
  if (typeof val === 'string') {
    const trimmed = val.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (Array.isArray(val) && typeof val[0] === 'string') {
    const trimmed = val[0].trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  return undefined
}

/**
 * Validates and normalizes URL search params for `/[locale]/projects` (`docs/03-security.md` I1, `P3-T8` Scope 1).
 * Unknown keys and invalid enum/page values are safely stripped/ignored without throwing.
 */
export function parseProjectsSearchParams(
  raw: Record<string, string | string[] | undefined> | null | undefined,
): ValidatedProjectsFilters {
  const safeInput = {
    category: pickSingleParam(raw?.category),
    status: pickSingleParam(raw?.status),
    scope: pickSingleParam(raw?.scope),
    page: pickSingleParam(raw?.page),
  }
  const parsed = rawSearchParamsObjectSchema.safeParse(safeInput)
  if (!parsed.success) {
    return { page: 1 }
  }
  return {
    category: parsed.data.category,
    status: parsed.data.status,
    scope: parsed.data.scope,
    page: parsed.data.page ?? 1,
  }
}

export function buildProjectsFilterHref(
  locale: SupportedLocale,
  params: {
    category?: ProjectCategory
    status?: ProjectStatus
    scope?: ProjectScope
    page?: number
  },
): string {
  const search = new URLSearchParams()
  if (params.category) {
    search.set('category', params.category)
  }
  if (params.status) {
    search.set('status', params.status)
  }
  if (params.scope) {
    search.set('scope', params.scope)
  }
  if (params.page && params.page > 1) {
    search.set('page', params.page.toLocaleString('en-US', { useGrouping: false }))
  }
  const qs = search.toString()
  return qs.length > 0 ? `/${locale}/projects?${qs}` : `/${locale}/projects`
}

function formatCountNumber(n: number): string {
  return n.toLocaleString('en-US', { useGrouping: false })
}

function PaginationChevronPrevSvg(): ReactElement {
  return (
    <span aria-hidden="true" className={styles.paginationChevron}>
      ‹
    </span>
  )
}

function PaginationChevronNextSvg(): ReactElement {
  return (
    <span aria-hidden="true" className={styles.paginationChevron}>
      ›
    </span>
  )
}

function resolvePopulatedStats(rawStats: unknown, fallbackStats: readonly Stat[]): Stat[] {
  if (Array.isArray(rawStats) && rawStats.length > 0) {
    const populated = rawStats.filter(
      (item): item is Stat =>
        typeof item === 'object' &&
        item !== null &&
        'value' in item &&
        typeof (item as Stat).value === 'string' &&
        'label' in item &&
        typeof (item as Stat).label === 'string',
    )
    if (populated.length > 0) {
      return populated
    }
  }
  return fallbackStats.slice(0, 4)
}

function resolvePopulatedSingleStat(rawStat: unknown, fallbackStat: Stat | null): Stat | null {
  if (
    typeof rawStat === 'object' &&
    rawStat !== null &&
    'value' in rawStat &&
    typeof (rawStat as Stat).value === 'string' &&
    'label' in rawStat &&
    typeof (rawStat as Stat).label === 'string'
  ) {
    return rawStat as Stat
  }
  return fallbackStat
}

interface ProjectsPageProps {
  params: Promise<{ locale: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: ProjectsPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  if (!isSupportedLocale(rawLocale)) {
    return {}
  }
  if (rawLocale === 'ar' && !(await canServeArabicLocaleForCurrentRequest())) {
    return {}
  }

  const [siteSettings, projectsPage] = await Promise.all([
    getSiteSettings(rawLocale).catch(() => null),
    getProjectsPage(rawLocale).catch(() => null),
  ])

  const dict = getDictionary(rawLocale)
  const companyName = siteSettings?.companyName.trim() || dict.nav.projects
  const title =
    projectsPage?.meta?.title?.trim() ||
    projectsPage?.pageHeader?.title?.trim() ||
    `${dict.nav.projects} | ${companyName}`
  const description =
    projectsPage?.meta?.description?.trim() ||
    projectsPage?.pageHeader?.subtitle?.trim() ||
    siteSettings?.defaultSeo?.description ||
    undefined

  return {
    title,
    description,
    alternates: {
      canonical: `/${rawLocale}/projects`,
      languages: buildHreflangAlternates('/projects', siteSettings?.arabicEnabled === true),
    },
  }
}

export default async function ProjectsPageRoute({
  params,
  searchParams,
}: ProjectsPageProps): Promise<ReactElement> {
  const { locale: rawLocale } = await params
  if (!isSupportedLocale(rawLocale)) {
    notFound()
  }
  const locale: SupportedLocale = rawLocale

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const activePathname = requestHeaders.get('x-aljazira-pathname') || '/ar/projects'
    const activeSearch = requestHeaders.get('x-aljazira-search') || ''
    await enforceArabicEnabledOrRedirect(requestHeaders, activePathname, activeSearch)
  }

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const filters = parseProjectsSearchParams(resolvedSearchParams)

  const { isEnabled: isDraftMode } = await draftMode()

  const [siteSettings, projectsPage, homePage, allStats, categoryCounts, projectsResult] =
    await Promise.all([
      getSiteSettings(locale).catch(() => null),
      getProjectsPage(locale).catch(() => null),
      getHomePage(locale).catch(() => null),
      getStats(locale).catch(() => []),
      getProjectCategoryCounts(locale, {
        status: filters.status,
        discipline: filters.scope,
        requireCoverImage: true,
      }),
      getProjects(locale, {
        category: filters.category,
        status: filters.status,
        discipline: filters.scope,
        requireCoverImage: true,
        limit: PROJECTS_PAGE_SIZE,
        page: filters.page,
      }),
    ])

  const dict = getDictionary(locale)

  // 1. Page Header (`19:556`)
  const headerEnabled = projectsPage?.pageHeader?.enabled !== false
  const headerTitle = projectsPage?.pageHeader?.title?.trim() || dict.nav.projects
  const headerSubtitle = projectsPage?.pageHeader?.subtitle?.trim() || null
  const headerImage = resolveMediaAsset(projectsPage?.pageHeader?.image, headerTitle, 'hero')

  // 2. Explore Projects (`19:568`)
  const categoryTabs: Array<{
    key: 'all' | ProjectCategory
    value?: ProjectCategory
    label: string
    count: number
  }> = [
    {
      key: 'all',
      value: undefined,
      label: dict.projects.allProjects,
      count: categoryCounts.all,
    },
    ...PROJECT_CATEGORY_VALUES.map((cat) => ({
      key: cat,
      value: cat,
      label: dict.projects.categories[cat],
      count: categoryCounts[cat as keyof ProjectCategoryCounts],
    })),
  ]

  const currentPage = projectsResult.page
  const totalPages = projectsResult.totalPages
  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1)

  // 3. Impact in Numbers (`19:884`)
  const impactEnabled = projectsPage?.impact?.enabled !== false
  const impactTitle = projectsPage?.impact?.title?.trim() || ''
  const impactText = projectsPage?.impact?.text?.trim() || null
  const impactStats = resolvePopulatedStats(projectsPage?.impact?.stats, allStats)
  const impactBgMedia = resolveMediaAsset(
    homePage?.statsSection?.backgroundImage,
    impactTitle,
    'hero',
  )

  // 4. Portfolio (`19:904`)
  const portfolioEnabled = projectsPage?.portfolio?.enabled !== false
  const portfolioEyebrow = projectsPage?.portfolio?.eyebrow?.trim() || null
  const { mainPart: portfolioMainTitle, accentPart: portfolioAccentTitle } =
    splitHeadingForGoldAccent(projectsPage?.portfolio?.title)
  const portfolioParagraphs = extractLexicalParagraphStrings(projectsPage?.portfolio?.text)
  const portfolioQuote = projectsPage?.portfolio?.quote?.trim() || null
  const portfolioQuoteAuthor =
    projectsPage?.portfolio?.quoteAuthor?.trim() || siteSettings?.companyName || ''
  const portfolioImage = resolveMediaAsset(
    projectsPage?.portfolio?.image,
    projectsPage?.portfolio?.title || dict.nav.projects,
    'card',
  )
  const fallbackProjectsStat =
    allStats.find((s) => s.value.includes('100')) ??
    (allStats.length > 0 ? (allStats[0] ?? null) : null)
  const portfolioBadgeStat = resolvePopulatedSingleStat(
    projectsPage?.portfolio?.badgeStat,
    fallbackProjectsStat,
  )

  return (
    <DraftImageBypassProvider enabled={isDraftMode}>
      <div className={styles.page} data-page="projects" data-locale={locale}>
        {/* Section 1: Page Header (19:556) */}
        {headerEnabled ? (
          <PageHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            breadcrumbs={[{ label: dict.nav.home, href: `/${locale}` }, { label: headerTitle }]}
            breadcrumbAriaLabel={dict.a11y.breadcrumbNav}
            backgroundImageSrc={headerImage?.url}
            backgroundImageAlt={headerImage?.alt}
            waveFill="surface"
          />
        ) : null}

        {/* Section 2: Explore Projects (19:568) */}
        <section
          className={styles.exploreSection}
          aria-label={headerTitle}
          data-section="explore-projects"
        >
          <div className={styles.container}>
            {/* Category Filter Tabs (19:576) */}
            <nav
              aria-label={dict.projects.filterNavLabel}
              className={styles.filtersBar}
              data-projects-filters
              {...revealAttributes({ variant: 'fade' })}
            >
              {categoryTabs.map((tab) => {
                const isSelected =
                  tab.value === undefined
                    ? filters.category === undefined
                    : filters.category === tab.value
                const tabHref = buildProjectsFilterHref(locale, {
                  category: tab.value,
                  status: filters.status,
                  scope: filters.scope,
                })

                return (
                  <CmsLink
                    key={tab.key}
                    href={tabHref}
                    aria-current={isSelected ? 'page' : undefined}
                    className={`${styles.filterTab} ${isSelected ? styles.filterTabActive : ''} t-label-link`}
                    data-filter-category={tab.key}
                    data-active={isSelected ? 'true' : 'false'}
                  >
                    <span className={styles.filterTabLabel}>{tab.label}</span>
                    <span
                      className={`${styles.filterTabCount} ${isSelected ? styles.filterTabCountActive : ''} t-caption-s`}
                    >
                      {formatCountNumber(tab.count)}
                    </span>
                  </CmsLink>
                )
              })}
            </nav>

            {/* Active discipline / status chip bar (shown when ?scope= or ?status= is active) */}
            {filters.scope || filters.status ? (
              <div className={styles.activeFiltersRow} data-active-subfilters>
                <span className={`${styles.activeFilterPrefix} t-body-s`}>
                  {dict.projects.activeFilterPrefix}
                </span>
                {filters.scope ? (
                  <span
                    className={`${styles.activeFilterChip} t-label-tag`}
                    data-active-scope={filters.scope}
                  >
                    {dict.projects.disciplines[filters.scope]}
                  </span>
                ) : null}
                {filters.status ? (
                  <span
                    className={`${styles.activeFilterChip} t-label-tag`}
                    data-active-status={filters.status}
                  >
                    {dict.cards.projectStatus[filters.status]}
                  </span>
                ) : null}
                <CmsLink
                  href={buildProjectsFilterHref(locale, { category: filters.category })}
                  className={`${styles.clearFilterLink} t-label-link`}
                >
                  {dict.projects.clearFilter}
                </CmsLink>
              </div>
            ) : null}

            {/* Projects Grid (19:601) */}
            {projectsResult.docs.length > 0 ? (
              <div className={styles.projectsGrid} data-projects-grid>
                {projectsResult.docs.map((project, idx) => (
                  <div
                    key={project.id}
                    className={styles.projectCardCell}
                    {...revealAttributes({ variant: 'fade', step: idx % 3 })}
                  >
                    <ProjectCard project={project} locale={locale} />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={styles.emptyState}
                data-projects-empty
                {...revealAttributes({ variant: 'fade' })}
              >
                <h2 className={`${styles.emptyTitle} t-h3`}>{dict.projects.emptyTitle}</h2>
                <p className={`${styles.emptyDescription} t-body-m`}>
                  {dict.projects.emptyDescription}
                </p>
                <Button href={`/${locale}/projects`} variant="Gold" size="md" showArrow>
                  {dict.projects.showAllProjects}
                </Button>
              </div>
            )}

            {/* Pagination (19:875) */}
            {totalPages > 1 ? (
              <nav
                aria-label={dict.projects.paginationNavLabel}
                className={styles.pagination}
                data-projects-pagination
              >
                {currentPage > 1 ? (
                  <CmsLink
                    href={buildProjectsFilterHref(locale, {
                      category: filters.category,
                      status: filters.status,
                      scope: filters.scope,
                      page: currentPage - 1,
                    })}
                    aria-label={dict.projects.previousPage}
                    className={`${styles.pageButton} t-label-button`}
                    data-page-prev
                  >
                    <PaginationChevronPrevSvg />
                  </CmsLink>
                ) : (
                  <span
                    aria-disabled="true"
                    className={`${styles.pageButton} ${styles.pageButtonDisabled} t-label-button`}
                    data-page-prev
                  >
                    <PaginationChevronPrevSvg />
                  </span>
                )}

                {pageNumbers.map((pageNum) => {
                  const isCurrent = pageNum === currentPage
                  const pageLabel = formatPageNumberLabel(dict.projects.pageNumberTemplate, pageNum)
                  return (
                    <CmsLink
                      key={pageNum}
                      href={buildProjectsFilterHref(locale, {
                        category: filters.category,
                        status: filters.status,
                        scope: filters.scope,
                        page: pageNum,
                      })}
                      aria-label={pageLabel}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`${styles.pageButton} ${isCurrent ? styles.pageButtonActive : ''} t-label-button`}
                      data-page-number={pageNum}
                    >
                      {formatCountNumber(pageNum)}
                    </CmsLink>
                  )
                })}

                {currentPage < totalPages ? (
                  <CmsLink
                    href={buildProjectsFilterHref(locale, {
                      category: filters.category,
                      status: filters.status,
                      scope: filters.scope,
                      page: currentPage + 1,
                    })}
                    aria-label={dict.projects.nextPage}
                    className={`${styles.pageButton} t-label-button`}
                    data-page-next
                  >
                    <PaginationChevronNextSvg />
                  </CmsLink>
                ) : (
                  <span
                    aria-disabled="true"
                    className={`${styles.pageButton} ${styles.pageButtonDisabled} t-label-button`}
                    data-page-next
                  >
                    <PaginationChevronNextSvg />
                  </span>
                )}
              </nav>
            ) : null}
          </div>
        </section>

        {/* Section 3: Impact in Numbers (19:884) */}
        {impactEnabled && impactStats.length > 0 ? (
          <section
            className={styles.impactSection}
            aria-labelledby="projects-impact-heading"
            data-section="impact-in-numbers"
            data-theme="dark"
          >
            <div className={styles.impactBgLayer} aria-hidden="true">
              {impactBgMedia?.url ? (
                <CspSafeImage
                  src={impactBgMedia.url}
                  alt=""
                  fill
                  sizes="100vw"
                  className={styles.impactBgImage}
                />
              ) : null}
              <div className={styles.impactOverlay} />
            </div>

            <div className={styles.container}>
              <div className={styles.impactHead} {...revealAttributes({ variant: 'fade' })}>
                <h2 id="projects-impact-heading" className={`${styles.impactTitle} t-h2`}>
                  {impactTitle}
                </h2>
                {impactText ? (
                  <p className={`${styles.impactSubtitle} t-body-l`}>{impactText}</p>
                ) : null}
                <div className={styles.goldDivider} aria-hidden="true" />
              </div>

              <div className={styles.impactStatsGrid}>
                {impactStats.map((stat, idx) => (
                  <div
                    key={stat.id}
                    className={styles.impactStatItem}
                    {...revealAttributes({ variant: 'fade', step: idx % 4 })}
                  >
                    <bdi dir="ltr" className={`${styles.impactStatValue} t-stat-number`}>
                      <CountUp value={stat.value} />
                    </bdi>
                    <p className={`${styles.impactStatLabel} t-body-m`}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Section 4: Portfolio (19:904) */}
        {portfolioEnabled ? (
          <section
            className={styles.portfolioSection}
            aria-labelledby="projects-portfolio-heading"
            data-section="portfolio"
          >
            <div className={styles.container}>
              <div className={styles.portfolioGrid}>
                {/* Visual Column (19:905) */}
                <div className={styles.portfolioVisual}>
                  <div
                    className={styles.portfolioCornerBracket}
                    {...revealAttributes({ variant: 'draw' })}
                  >
                    <CornerBracketIcon size={80} strokeWidth={4} strokeLinecap="round" />
                  </div>

                  <div
                    className={styles.portfolioPhotoFrame}
                    {...revealAttributes({ variant: 'wipe' })}
                  >
                    {portfolioImage ? (
                      <CspSafeImage
                        src={portfolioImage.url}
                        alt={portfolioImage.alt}
                        width={520}
                        height={400}
                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 80vw, 520px"
                        className={styles.portfolioPhoto}
                      />
                    ) : null}
                  </div>

                  {portfolioBadgeStat ? (
                    <div
                      className={styles.portfolioBadge}
                      {...revealAttributes({ variant: 'fade', step: 2 })}
                    >
                      <bdi dir="ltr" className={`${styles.portfolioBadgeValue} t-stat-m`}>
                        <CountUp value={portfolioBadgeStat.value} />
                      </bdi>
                      <span className={`${styles.portfolioBadgeLabel} t-body-s`}>
                        {portfolioBadgeStat.label}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Content Column (19:912) */}
                <div
                  className={styles.portfolioContent}
                  {...revealAttributes({ variant: 'fade', step: 1 })}
                >
                  <div className={styles.portfolioHead}>
                    {portfolioEyebrow ? <Eyebrow tone="Light">{portfolioEyebrow}</Eyebrow> : null}
                    <h2 id="projects-portfolio-heading" className={`${styles.sectionHeading} t-h2`}>
                      <span>{portfolioMainTitle}</span>
                      {portfolioAccentTitle ? (
                        <span className={styles.headingGoldLine}>{portfolioAccentTitle}</span>
                      ) : null}
                    </h2>
                    <div className={styles.goldDivider} aria-hidden="true" />
                  </div>

                  {portfolioParagraphs.map((paragraph, idx) => (
                    <p key={idx} className={`${styles.portfolioParagraph} t-body-m`}>
                      {paragraph}
                    </p>
                  ))}

                  {portfolioQuote ? (
                    <blockquote className={styles.portfolioQuoteBlock}>
                      <div className={styles.portfolioQuoteBar} aria-hidden="true" />
                      <div className={styles.portfolioQuoteInner}>
                        <p className={`${styles.portfolioQuoteText} t-body-quote`}>
                          {portfolioQuote}
                        </p>
                        <footer className={`${styles.portfolioQuoteAuthor} t-label-caps`}>
                          {portfolioQuoteAuthor}
                        </footer>
                      </div>
                    </blockquote>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Section 5: CTA (19:926) */}
        <CtaBand cta={projectsPage?.cta} locale={locale} fallbackBackgroundSrc={headerImage?.url} />
      </div>
    </DraftImageBypassProvider>
  )
}
