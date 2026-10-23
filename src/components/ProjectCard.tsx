import Image from 'next/image'
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
  project: Pick<Project, 'title' | 'slug' | 'category' | 'location' | 'status' | 'coverImage'>
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
  const resolvedCategoryLabel = categoryLabel ?? dict.cards.projectCategories[project.category]
  const resolvedStatusLabel = statusLabel ?? dict.cards.projectStatus[project.status]
  const resolvedCtaLabel = ctaLabel ?? dict.cards.viewProject
  const mediaAsset = resolveMediaAsset(project.coverImage, project.title, 'card')
  const imageSrc = mediaAsset?.url ?? fallbackImageUrl ?? null
  const imageAlt = mediaAsset?.alt ?? project.title

  const cardClasses = [
    styles.card,
    state === 'Hover' ? styles.stateHover : '',
    className ?? '',
  ]
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
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 370px"
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
              <MapPinIcon size={13} />
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
