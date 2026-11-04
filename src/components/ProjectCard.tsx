import { CspSafeImage } from '@/components/CspSafeImage'
import type { ReactElement } from 'react'

import { CmsLink } from '@/components/CmsLink'
import { ArrowRightIcon, MapPinIcon } from '@/components/icons'
import { resolveMediaAsset } from '@/components/media-utils'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'
import type { Project } from '@/payload-types'

import styles from './ProjectCard.module.css'

export type ProjectCardState = 'Default' | 'Hover'

export interface ProjectCardProps {
  categoryLabel?: string
  className?: string
  ctaLabel?: string
  fallbackImageUrl?: string
  href?: string
  locale?: SupportedLocale
  project: Pick<Project, 'title' | 'slug' | 'category' | 'location' | 'status' | 'coverImage'> & {
    scopeSummary?: string | null
  }
  state?: ProjectCardState
  statusLabel?: string
}

/**
 * Figma component `ProjectCard` (`15:269`, `design/context/components/project-card.md`).
 * Renders a project showcase card (`370×280`) across `status` (`completed` / `in-progress`)
 * and `state` (`Default` / `Hover`) from CMS `Project` data.
 */
export function ProjectCard({
  project,
  locale = DEFAULT_LOCALE,
  state = 'Default',
  categoryLabel,
  statusLabel,
  ctaLabel,
  href,
  fallbackImageUrl,
  className,
}: ProjectCardProps): ReactElement {
  const dict = getDictionary(locale)
  const resolvedHref = href ?? `/${locale}/projects/${project.slug}`
  const trimmedScopeSummary =
    typeof project.scopeSummary === 'string' && project.scopeSummary.trim().length > 0
      ? project.scopeSummary.trim()
      : null
  const resolvedCategoryLabel =
    categoryLabel ?? trimmedScopeSummary ?? dict.cards.projectCategories[project.category]
  const resolvedStatusLabel = statusLabel ?? dict.cards.projectStatus[project.status]
  const resolvedCtaLabel = ctaLabel ?? dict.cards.viewProject
  const mediaAsset = resolveMediaAsset(project.coverImage, project.title, 'card')
  const imageSrc = mediaAsset?.url ?? fallbackImageUrl ?? null
  const maxPixelWidth =
    typeof mediaAsset?.width === 'number' && mediaAsset.width > 0 ? mediaAsset.width : null
  const cardSizes = maxPixelWidth
    ? `(max-width: 767px) min(100vw, ${String(maxPixelWidth)}px), (max-width: 1279px) min(50vw, ${String(maxPixelWidth)}px), ${String(Math.min(370, maxPixelWidth))}px`
    : '(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 370px'

  const cardClasses = [styles.card, state === 'Hover' ? styles.stateHover : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <CmsLink
      href={resolvedHref}
      className={cardClasses}
      data-component="project-card"
      data-status={project.status}
      data-state={state}
    >
      <div className={styles.mediaLayer}>
        {imageSrc ? (
          <CspSafeImage
            src={imageSrc}
            alt=""
            width={370}
            height={280}
            sizes={cardSizes}
            className={styles.photo}
          />
        ) : null}
        <div className={styles.overlayDefault} aria-hidden="true" />
        <div className={styles.overlayHover} aria-hidden="true" />
      </div>

      <div className={styles.topBadges}>
        <span className={`${styles.categoryPill} t-label-tag`}>{resolvedCategoryLabel}</span>
        {project.status === 'in-progress' ? (
          <span className={`${styles.statusPillInProgress} t-label-tag`}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span>{resolvedStatusLabel}</span>
          </span>
        ) : (
          <span className={`${styles.statusPillCompleted} t-label-tag`}>{resolvedStatusLabel}</span>
        )}
      </div>

      <div className={styles.bottomGroup}>
        <div className={styles.infoBlock}>
          <h3 className={`${styles.title} t-h4`}>{project.title}</h3>
          <div className={styles.locationRow}>
            <span className={styles.pinIcon} aria-hidden="true">
              <MapPinIcon size={14} />
            </span>
            <span className={`${styles.locationText} t-caption`}>{project.location}</span>
          </div>
        </div>

        <div className={`${styles.ctaRow} t-label-tag`}>
          <span>{resolvedCtaLabel}</span>
          <ArrowRightIcon size={13} />
        </div>
      </div>

      <div className={styles.progressBar} aria-hidden="true" />
    </CmsLink>
  )
}
