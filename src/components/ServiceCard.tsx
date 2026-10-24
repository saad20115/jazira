import { CspSafeImage } from '@/components/CspSafeImage'
import type { ReactElement } from 'react'

import { CmsLink } from '@/components/CmsLink'
import { ArrowRightIcon, ServiceIcon } from '@/components/icons'
import { formatServiceNumber, resolveMediaAsset } from '@/components/media-utils'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'
import type { Service } from '@/payload-types'

import styles from './ServiceCard.module.css'

export type ServiceCardState = 'Default' | 'Hover'

export interface ServiceCardProps {
  className?: string
  ctaLabel?: string
  fallbackImageUrl?: string
  href?: string
  index?: number
  locale?: SupportedLocale
  service: Pick<Service, 'title' | 'slug' | 'icon' | 'shortDescription' | 'image' | 'order'>
  state?: ServiceCardState
}

/**
 * Figma component `ServiceCard` (`15:320`, `design/context/components/service-card.md`).
 * Renders a primary service photo card (`275×360`) in `Default` or `Hover` state from CMS `Service` data.
 */
export function ServiceCard({
  service,
  locale = DEFAULT_LOCALE,
  state = 'Default',
  index,
  href,
  ctaLabel,
  fallbackImageUrl,
  className,
}: ServiceCardProps): ReactElement {
  const dict = getDictionary(locale)
  const resolvedNumber = formatServiceNumber(index ?? service.order + 1)
  const resolvedHref = href ?? `/${locale}/services#${service.slug}`
  const resolvedCtaLabel = ctaLabel ?? dict.cards.viewAllServices
  const mediaAsset = resolveMediaAsset(service.image, service.title, 'card')
  const imageSrc = mediaAsset?.url ?? fallbackImageUrl ?? null
  const hasDescription = Boolean(
    service.shortDescription && service.shortDescription.trim().length > 0,
  )

  const cardClasses = [
    styles.card,
    state === 'Hover' ? styles.stateHover : '',
    !hasDescription ? styles.noDescription : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <CmsLink
      href={resolvedHref}
      className={cardClasses}
      data-component="service-card"
      data-state={state}
    >
      <div className={styles.mediaLayer}>
        {imageSrc ? (
          <CspSafeImage
            src={imageSrc}
            alt=""
            width={275}
            height={360}
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 275px"
            className={styles.photo}
          />
        ) : null}
        <div className={styles.overlayDefault} aria-hidden="true" />
        <div className={styles.overlayHover} aria-hidden="true" />
      </div>

      <span className={`${styles.numberBadge} t-label-link`}>{resolvedNumber}</span>

      <span className={styles.iconBadge}>
        <ServiceIcon name={service.icon} size={18} />
      </span>

      <div className={styles.body}>
        <div className={styles.textGroup}>
          <h3 className={`${styles.title} t-h4`}>{service.title}</h3>
          {hasDescription ? (
            <p className={`${styles.description} t-caption`}>{service.shortDescription}</p>
          ) : null}
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.footerRow}>
          <span className={`${styles.ctaLabel} t-label-tag`}>{resolvedCtaLabel}</span>
          <span className={styles.ctaCircle} aria-hidden="true">
            <ArrowRightIcon size={14} />
          </span>
        </div>
      </div>
    </CmsLink>
  )
}
