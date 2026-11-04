import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { ReactElement } from 'react'

import { Accordion, type AccordionEntry } from '@/components/Accordion'
import { Button } from '@/components/Button'
import { CmsLink } from '@/components/CmsLink'
import { CspSafeImage, DraftImageBypassProvider } from '@/components/CspSafeImage'
import { CtaBand } from '@/components/CtaBand'
import { Eyebrow } from '@/components/Eyebrow'
import { type LightboxSlide, ProjectGallery } from '@/components/Lightbox'
import { resolveMediaAsset } from '@/components/media-utils'
import { ProjectCard } from '@/components/ProjectCard'
import { revealAttributes } from '@/components/Reveal'
import { hasLexicalContent, RichTextRenderer } from '@/components/RichTextRenderer'
import {
  buildHreflangAlternates,
  formatDefaultProjectAboutSummary,
  getDictionary,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'
import {
  getHomePage,
  getProjectBySlug,
  getProjectsPage,
  getRelatedProjects,
  getSiteSettings,
} from '@/lib/cms'
import type { Media, Video } from '@/payload-types'

import { canServeArabicLocaleForCurrentRequest, enforceArabicEnabledOrRedirect } from '../../layout'
import styles from './page.module.css'

const YOUTUBE_VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/
const VIMEO_VIDEO_ID_REGEX = /^\d{1,20}$/

/**
 * Converts a validated `videoUrl` (`docs/03-security.md` I4) into a privacy-enhanced embed URL
 * restricted strictly to `https://www.youtube-nocookie.com/embed/<id>` or
 * `https://player.vimeo.com/video/<id>` (`src/security/csp.ts` `I4_VIDEO_FRAME_SOURCES`).
 * Returns `null` for any invalid or non-allowlisted URL.
 */
export function resolveSafeVideoEmbedUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') {
    return null
  }
  const trimmed = rawUrl.trim()
  if (trimmed.length === 0 || trimmed.length > 512) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  if (
    parsed.protocol.toLowerCase() !== 'https:' ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    parsed.port.length > 0
  ) {
    return null
  }

  const host = parsed.hostname.toLowerCase()
  const segments = parsed.pathname.split('/').filter(Boolean)

  if (
    host === 'youtube.com' ||
    host === 'www.youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtube-nocookie.com' ||
    host === 'www.youtube-nocookie.com'
  ) {
    if (parsed.pathname === '/watch') {
      const queryId = parsed.searchParams.get('v')?.trim() ?? ''
      if (YOUTUBE_VIDEO_ID_REGEX.test(queryId)) {
        return `https://www.youtube-nocookie.com/embed/${queryId}`
      }
      return null
    }
    if (
      segments.length === 2 &&
      (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'v') &&
      typeof segments[1] === 'string' &&
      YOUTUBE_VIDEO_ID_REGEX.test(segments[1])
    ) {
      return `https://www.youtube-nocookie.com/embed/${segments[1]}`
    }
    return null
  }

  if (host === 'youtu.be') {
    if (segments.length === 1 && typeof segments[0] === 'string') {
      const firstSeg = segments[0]
      if (YOUTUBE_VIDEO_ID_REGEX.test(firstSeg)) {
        return `https://www.youtube-nocookie.com/embed/${firstSeg}`
      }
    }
    return null
  }

  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    if (segments.length >= 1 && typeof segments[0] === 'string') {
      const firstSeg = segments[0]
      if (VIMEO_VIDEO_ID_REGEX.test(firstSeg)) {
        return `https://player.vimeo.com/video/${firstSeg}`
      }
    }
    return null
  }

  if (host === 'player.vimeo.com') {
    if (
      segments.length === 2 &&
      segments[0] === 'video' &&
      typeof segments[1] === 'string' &&
      VIMEO_VIDEO_ID_REGEX.test(segments[1])
    ) {
      return `https://player.vimeo.com/video/${segments[1]}`
    }
    return null
  }

  return null
}

function resolveUploadedVideoUrl(rawVideo: unknown): string | null {
  if (!rawVideo || typeof rawVideo !== 'object') {
    return null
  }
  const vid = rawVideo as Partial<Video>
  if (typeof vid.url === 'string' && vid.url.trim().length > 0) {
    return vid.url.trim()
  }
  if (typeof vid.filename === 'string' && vid.filename.trim().length > 0) {
    return `/media/videos/${vid.filename.trim()}`
  }
  return null
}

function lexicalStartsWithHeading(content: unknown): boolean {
  if (!content || typeof content !== 'object' || !('root' in content)) {
    return false
  }
  const root = (content as { root?: { children?: Array<{ type?: string }> } }).root
  const firstChild = Array.isArray(root?.children) ? root.children[0] : undefined
  return firstChild?.type === 'heading'
}

function formatYearValue(year: number): string {
  return year.toLocaleString('en-US', { useGrouping: false })
}

function formatTwoDigitBadge(indexZeroBased: number): string {
  return (indexZeroBased + 1).toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  })
}

function BackArrowSvg(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={styles.backArrowIcon}
    >
      <path
        d="M12.6667 8H3.33334M3.33334 8L7.33334 12M3.33334 8L7.33334 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeliverableCheckCircleSvg(): ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M18.3333 9.23333V10C18.3323 11.797 17.7504 13.5456 16.6744 14.9849C15.5985 16.4241 14.0861 17.4771 12.3628 17.9866C10.6395 18.4961 8.79772 18.4349 7.11206 17.8122C5.4264 17.1894 3.98721 16.0384 3.00913 14.5309C2.03105 13.0234 1.56649 11.2401 1.68473 9.44693C1.80297 7.6538 2.49767 5.94694 3.66523 4.58089C4.83279 3.21485 6.41065 2.26282 8.16349 1.86679C9.91633 1.47076 11.7502 1.65195 13.3917 2.38333"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.3333 3.33333L10 11.675L7.5 9.175"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeroWaveSvg(): ReactElement {
  return (
    <svg
      className={styles.heroWaveSvg}
      viewBox="0 0 1440 90"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 60C240 10 480 0 720 30C960 60 1200 80 1440 40V90H0V60Z" fill="var(--surface)" />
    </svg>
  )
}

interface ProjectDetailPageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  if (!isSupportedLocale(rawLocale)) {
    return {}
  }
  if (rawLocale === 'ar' && !(await canServeArabicLocaleForCurrentRequest())) {
    return {}
  }

  const [siteSettings, project] = await Promise.all([
    getSiteSettings(rawLocale).catch(() => null),
    getProjectBySlug(rawLocale, slug).catch(() => null),
  ])

  if (!project) {
    return {}
  }

  const companyName = siteSettings?.companyName.trim() || project.title
  const title = project.meta?.title?.trim() || `${project.title} | ${companyName}`
  const description =
    project.meta?.description?.trim() ||
    project.summary?.trim() ||
    project.scopeSummary?.trim() ||
    siteSettings?.defaultSeo?.description ||
    undefined

  return {
    title,
    description,
    alternates: {
      canonical: `/${rawLocale}/projects/${project.slug}`,
      languages: buildHreflangAlternates(
        `/projects/${project.slug}`,
        siteSettings?.arabicEnabled === true,
      ),
    },
  }
}

export default async function ProjectDetailPageRoute({
  params,
}: ProjectDetailPageProps): Promise<ReactElement> {
  const { locale: rawLocale, slug } = await params
  if (!isSupportedLocale(rawLocale)) {
    notFound()
  }
  const locale: SupportedLocale = rawLocale

  if (locale === 'ar') {
    const requestHeaders = await headers()
    const activePathname = requestHeaders.get('x-aljazira-pathname') || `/ar/projects/${slug}`
    const activeSearch = requestHeaders.get('x-aljazira-search') || ''
    await enforceArabicEnabledOrRedirect(requestHeaders, activePathname, activeSearch)
  }

  const project = await getProjectBySlug(locale, slug)
  if (!project) {
    notFound()
  }

  const { isEnabled: isDraftMode } = await draftMode()

  const [projectsPage, homePage, relatedProjects] = await Promise.all([
    getProjectsPage(locale),
    getHomePage(locale),
    getRelatedProjects(locale, project.category, project.slug, 3),
  ])

  const dict = getDictionary(locale)

  // 1. Hero (`20:880`)
  const coverMedia = resolveMediaAsset(project.coverImage, project.title, 'hero')
  const scopeBadgeText =
    project.scopeSummary?.trim() || dict.cards.projectCategories[project.category]
  const statusBadgeText = dict.cards.projectStatus[project.status]

  // 2. Information & About (`20:895`)
  const summaryText = project.summary?.trim() || null
  const bodyHasContent = hasLexicalContent(project.body)
  const bodyStartsWithHeading = bodyHasContent && lexicalStartsWithHeading(project.body)
  const defaultSummaryParagraph = formatDefaultProjectAboutSummary(
    dict.projects.detail.defaultAboutSummaryTemplate,
    dict.projects.detail.defaultAboutSummaryWithClientTemplate,
    scopeBadgeText,
    project.location,
    project.client,
  )

  const detailPillars = Array.isArray(project.details) ? project.details : []
  const accordionItems: AccordionEntry[] = detailPillars.map((pillar, idx) => ({
    id: pillar.id ?? `detail-${String(idx)}`,
    numberBadge: formatTwoDigitBadge(idx),
    title: pillar.title,
    body: <p className={styles.accordionBodyText}>{pillar.text}</p>,
    defaultExpanded: idx === 0,
  }))

  // Project sheet rows (omit any row whose value is empty)
  const scopeDisplayValue =
    project.scopeSummary?.trim() ||
    (Array.isArray(project.scope) && project.scope.length > 0
      ? project.scope.map((s) => dict.projects.disciplines[s]).join(', ')
      : dict.cards.projectCategories[project.category])

  const sheetRows: Array<{ key: string; label: string; value: string }> = []
  if (typeof project.client === 'string' && project.client.trim().length > 0) {
    sheetRows.push({
      key: 'client',
      label: dict.projects.detail.sheetClient,
      value: project.client.trim(),
    })
  }
  if (typeof project.location === 'string' && project.location.trim().length > 0) {
    sheetRows.push({
      key: 'location',
      label: dict.projects.detail.sheetLocation,
      value: project.location.trim(),
    })
  }
  if (typeof project.year === 'number' && Number.isFinite(project.year)) {
    sheetRows.push({
      key: 'year',
      label: dict.projects.detail.sheetYear,
      value: formatYearValue(project.year),
    })
  }
  if (scopeDisplayValue.trim().length > 0) {
    sheetRows.push({
      key: 'scope',
      label: dict.projects.detail.sheetScope,
      value: scopeDisplayValue.trim(),
    })
  }
  if (typeof project.deliveredBy === 'string' && project.deliveredBy.trim().length > 0) {
    sheetRows.push({
      key: 'deliveredBy',
      label: dict.projects.detail.sheetDeliveredBy,
      value: project.deliveredBy.trim(),
    })
  }
  sheetRows.push({
    key: 'status',
    label: dict.projects.detail.sheetStatus,
    value: statusBadgeText,
  })

  // 3. Key Deliverables (`20:947`)
  const deliverables = Array.isArray(project.deliverables)
    ? project.deliverables.filter((d) => typeof d.text === 'string' && d.text.trim().length > 0)
    : []
  const deliverablesBgMedia = resolveMediaAsset(
    homePage.statsSection?.backgroundImage,
    dict.projects.detail.deliverablesHeading,
    'hero',
  )

  // 4. Gallery (`20:976`)
  const rawGallery = Array.isArray(project.gallery) ? project.gallery : []
  const gallerySlides: LightboxSlide[] = []
  for (let i = 0; i < rawGallery.length; i += 1) {
    const item = rawGallery[i]
    const resolved = resolveMediaAsset(item, project.title, 'hero')
    if (resolved) {
      const mediaDoc = typeof item === 'object' ? (item as Partial<Media>) : null
      gallerySlides.push({
        id: mediaDoc?.id ? String(mediaDoc.id) : `gallery-${String(i)}`,
        src: resolved.url,
        alt: resolved.alt,
        caption: typeof mediaDoc?.caption === 'string' ? mediaDoc.caption : null,
        width: resolved.width,
        height: resolved.height,
      })
    }
  }

  // 4b. Video (self-hosted upload or validated I4 embed)
  const uploadedVideoUrl = resolveUploadedVideoUrl(project.video)
  const safeVideoEmbedUrl = resolveSafeVideoEmbedUrl(project.videoUrl)

  return (
    <DraftImageBypassProvider enabled={isDraftMode}>
      <div
        className={styles.page}
        data-page="project-detail"
        data-project-slug={project.slug}
        data-locale={locale}
      >
        {/* Section 1: Project Hero (20:880) */}
        <section
          className={styles.heroSection}
          aria-labelledby="project-detail-title"
          data-section="project-hero"
          data-theme="dark"
        >
          <div className={styles.heroMediaLayer} aria-hidden="true">
            {coverMedia ? (
              <CspSafeImage
                src={coverMedia.url}
                alt={coverMedia.alt}
                width={coverMedia.width ?? 1440}
                height={coverMedia.height ?? 560}
                preload
                fetchPriority="high"
                sizes="100vw"
                className={styles.heroImage}
              />
            ) : null}
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.heroContent}>
            <CmsLink
              href={`/${locale}/projects`}
              className={`${styles.backLink} t-body-s`}
              {...revealAttributes({ variant: 'fade' })}
            >
              <BackArrowSvg />
              <span>{dict.projects.detail.backToProjects}</span>
            </CmsLink>

            <div
              className={styles.heroBadgesRow}
              {...revealAttributes({ variant: 'fade', step: 1 })}
            >
              <span className={`${styles.heroScopePill} t-label-caps`}>{scopeBadgeText}</span>
              <span className={`${styles.heroStatusPill} t-label-caps`}>{statusBadgeText}</span>
            </div>

            <h1 id="project-detail-title" className={`${styles.heroTitle} t-display-l`}>
              {project.title}
            </h1>
          </div>

          <div className={styles.heroWaveWrap}>
            <HeroWaveSvg />
          </div>
        </section>

        {/* Section 2: Information & About (20:895) */}
        <section
          className={styles.infoSection}
          aria-label={dict.projects.detail.aboutEyebrow}
          data-section="information-about"
        >
          <div className={styles.container}>
            <div className={styles.infoGrid}>
              {/* Left / Inline-Start Column: About the project + Accordion (106:1539) */}
              <div className={styles.aboutColumn} {...revealAttributes({ variant: 'fade' })}>
                <Eyebrow tone="Light">{dict.projects.detail.aboutEyebrow}</Eyebrow>

                {bodyStartsWithHeading ? (
                  <>
                    {summaryText ? (
                      <p className={`${styles.aboutLead} t-body-l`}>{summaryText}</p>
                    ) : null}
                    <RichTextRenderer
                      content={project.body}
                      locale={locale}
                      className={styles.aboutRichText}
                    />
                  </>
                ) : summaryText && bodyHasContent ? (
                  <>
                    <h2 className={`${styles.aboutHeading} t-h2`}>{summaryText}</h2>
                    <RichTextRenderer
                      content={project.body}
                      locale={locale}
                      className={styles.aboutRichText}
                    />
                  </>
                ) : summaryText ? (
                  <>
                    <h2 className={`${styles.aboutHeading} t-h2`}>
                      {dict.projects.detail.defaultAboutHeading}
                    </h2>
                    <p className={`${styles.aboutLead} t-body-l`}>{summaryText}</p>
                  </>
                ) : bodyHasContent ? (
                  <>
                    <h2 className={`${styles.aboutHeading} t-h2`}>
                      {dict.projects.detail.defaultAboutHeading}
                    </h2>
                    <RichTextRenderer
                      content={project.body}
                      locale={locale}
                      className={styles.aboutRichText}
                    />
                  </>
                ) : (
                  <>
                    <h2 className={`${styles.aboutHeading} t-h2`}>
                      {dict.projects.detail.defaultAboutHeading}
                    </h2>
                    <p className={`${styles.aboutLead} t-body-l`}>{defaultSummaryParagraph}</p>
                  </>
                )}

                {accordionItems.length > 0 ? (
                  <div className={styles.accordionWrap}>
                    <Accordion locale={locale} items={accordionItems} singleExpand={false} />
                  </div>
                ) : null}
              </div>

              {/* Right / Inline-End Column: Project Sheet + CTA Card (106:1582) */}
              <aside
                className={styles.sidebarColumn}
                aria-label={dict.projects.detail.projectSheetTitle}
                {...revealAttributes({ variant: 'fade', step: 1 })}
              >
                <div className={styles.projectSheetCard} data-project-sheet>
                  <h2 className={`${styles.projectSheetTitle} t-label-caps`}>
                    {dict.projects.detail.projectSheetTitle}
                  </h2>
                  <div className={styles.projectSheetSpacer} aria-hidden="true" />
                  <dl className={styles.projectSheetList}>
                    {sheetRows.map((row, idx) => (
                      <div
                        key={row.key}
                        className={`${styles.projectSheetRow} ${idx < sheetRows.length - 1 ? styles.projectSheetRowBordered : ''} t-body-s`}
                        data-sheet-row={row.key}
                      >
                        <dt className={styles.projectSheetLabel}>{row.label}</dt>
                        <dd className={`${styles.projectSheetValue} t-body-s-medium`}>
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className={styles.planningCard} data-planning-card>
                  <h3 className={`${styles.planningTitle} t-h4`}>
                    {dict.projects.detail.planningTitle}
                  </h3>
                  <p className={`${styles.planningSubtitle} t-body-s`}>
                    {dict.projects.detail.planningSubtitle}
                  </p>
                  <div className={styles.planningSpacer} aria-hidden="true" />
                  <Button
                    href={`/${locale}/contact?project=${project.slug}#quote`}
                    variant="Dark"
                    size="md"
                    showArrow
                    className={styles.planningButton}
                  >
                    {dict.projects.detail.requestQuote}
                  </Button>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Section 3: Key Deliverables (20:947) */}
        {deliverables.length > 0 ? (
          <section
            className={styles.deliverablesSection}
            aria-labelledby="project-deliverables-heading"
            data-section="key-deliverables"
            data-theme="dark"
          >
            <div className={styles.deliverablesBgLayer} aria-hidden="true">
              {deliverablesBgMedia?.url ? (
                <CspSafeImage
                  src={deliverablesBgMedia.url}
                  alt=""
                  width={deliverablesBgMedia.width ?? 1440}
                  height={deliverablesBgMedia.height ?? 425}
                  sizes="100vw"
                  className={styles.deliverablesBgImage}
                />
              ) : null}
              <div className={styles.deliverablesOverlay} />
            </div>

            <div className={styles.container}>
              <div className={styles.deliverablesHead} {...revealAttributes({ variant: 'fade' })}>
                <Eyebrow tone="Dark">{dict.projects.detail.deliverablesEyebrow}</Eyebrow>
                <h2
                  id="project-deliverables-heading"
                  className={`${styles.deliverablesTitle} t-h2`}
                >
                  {dict.projects.detail.deliverablesHeading}
                </h2>
              </div>

              <div className={styles.deliverablesGrid}>
                {deliverables.map((item, idx) => (
                  <div
                    key={item.id ?? idx}
                    className={styles.deliverableCard}
                    {...revealAttributes({ variant: 'fade', step: idx % 2 })}
                  >
                    <span className={styles.deliverableIconBox} aria-hidden="true">
                      <DeliverableCheckCircleSvg />
                    </span>
                    <p className={`${styles.deliverableText} t-body-m-medium`}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Section 4: Gallery (20:976) */}
        {gallerySlides.length > 0 ? (
          <section
            className={styles.gallerySection}
            aria-labelledby="project-gallery-heading"
            data-section="gallery"
          >
            <div className={styles.container}>
              <div className={styles.galleryHead} {...revealAttributes({ variant: 'fade' })}>
                <Eyebrow tone="Light">{dict.projects.detail.galleryEyebrow}</Eyebrow>
                <h2 id="project-gallery-heading" className={`${styles.galleryTitle} t-h2`}>
                  {dict.projects.detail.galleryHeading}
                </h2>
              </div>

              <ProjectGallery slides={gallerySlides} locale={locale} />
            </div>
          </section>
        ) : null}

        {/* Section 4b: Video Showcase (rendered when video upload or safe videoUrl is present) */}
        {uploadedVideoUrl || safeVideoEmbedUrl ? (
          <section
            className={styles.videoSection}
            aria-labelledby="project-video-heading"
            data-section="video"
          >
            <div className={styles.container}>
              <div className={styles.galleryHead} {...revealAttributes({ variant: 'fade' })}>
                <Eyebrow tone="Light">{dict.projects.detail.videoEyebrow}</Eyebrow>
                <h2 id="project-video-heading" className={`${styles.galleryTitle} t-h2`}>
                  {dict.projects.detail.videoHeading}
                </h2>
              </div>

              <div
                className={styles.videoStage}
                {...revealAttributes({ variant: 'fade', step: 1 })}
              >
                {uploadedVideoUrl ? (
                  <video
                    controls
                    preload="metadata"
                    src={uploadedVideoUrl}
                    className={styles.videoPlayer}
                    data-project-video="upload"
                  />
                ) : safeVideoEmbedUrl ? (
                  <iframe
                    src={safeVideoEmbedUrl}
                    title={project.title}
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    loading="lazy"
                    className={styles.videoIframe}
                    data-project-video="embed"
                  />
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* Section 5: CTA (20:995) */}
        <CtaBand
          cta={projectsPage.cta}
          locale={locale}
          fallbackBackgroundSrc={coverMedia?.url}
          compact
        />

        {/* Section 6: Related Projects (20:1009) */}
        {relatedProjects.length > 0 ? (
          <section
            className={styles.relatedSection}
            aria-labelledby="project-related-heading"
            data-section="related-projects"
          >
            <div className={styles.container}>
              <div className={styles.relatedHead} {...revealAttributes({ variant: 'fade' })}>
                <h2 id="project-related-heading" className={`${styles.relatedTitle} t-h2`}>
                  {dict.projects.detail.relatedHeading}
                </h2>
                <p className={`${styles.relatedSubtitle} t-body-l`}>
                  {dict.projects.detail.relatedSubtitle}
                </p>
              </div>

              <div className={styles.relatedGrid}>
                {relatedProjects.map((relProject, idx) => (
                  <div
                    key={relProject.id}
                    className={styles.relatedCardCell}
                    {...revealAttributes({ variant: 'fade', step: idx % 3 })}
                  >
                    <ProjectCard project={relProject} locale={locale} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </DraftImageBypassProvider>
  )
}
