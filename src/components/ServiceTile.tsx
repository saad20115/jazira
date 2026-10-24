import type { ReactElement } from 'react'

import { CmsLink } from '@/components/CmsLink'
import { ArrowRightIcon, ServiceIcon } from '@/components/icons'
import { DEFAULT_LOCALE, getDictionary, type SupportedLocale } from '@/i18n'
import type { Service } from '@/payload-types'

import styles from './ServiceTile.module.css'

export type ServiceTileState = 'Default' | 'Featured'
export type ServiceTileVariant = 'grid' | 'carousel'

export interface ServiceTileProps {
  className?: string
  href?: string
  learnMoreLabel?: string
  locale?: SupportedLocale
  service: Pick<Service, 'title' | 'slug' | 'icon' | 'shortDescription' | 'featured'>
  state?: ServiceTileState
  variant?: ServiceTileVariant
}

/**
 * Figma component `ServiceTile` (`109:333`, `design/context/components/service-tile.md`).
 * Renders a specialist service tile in `Default` or `Featured` state from CMS `Service` data.
 */
export function ServiceTile({
  service,
  locale = DEFAULT_LOCALE,
  state,
  variant = 'grid',
  href,
  learnMoreLabel,
  className,
}: ServiceTileProps): ReactElement {
  const dict = getDictionary(locale)
  const resolvedState: ServiceTileState = state ?? (service.featured ? 'Featured' : 'Default')
  const resolvedHref = href ?? `/${locale}/services#${service.slug}`
  const resolvedLinkLabel = learnMoreLabel ?? dict.cards.learnMore

  const tileClasses = [
    styles.tile,
    resolvedState === 'Featured' ? styles.stateFeatured : styles.stateDefault,
    variant === 'carousel' ? styles.variantCarousel : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={tileClasses}
      data-component="service-tile"
      data-state={resolvedState}
      data-variant={variant}
    >
      <div className={styles.topGroup}>
        <span className={styles.iconBox}>
          <ServiceIcon name={service.icon} size={20} />
        </span>
        <div className={styles.textBlock}>
          <h3 className={`${styles.title} t-h4`}>{service.title}</h3>
          {service.shortDescription ? (
            <p className={`${styles.description} t-body-s`}>{service.shortDescription}</p>
          ) : null}
        </div>
      </div>

      <CmsLink href={resolvedHref} className={`${styles.linkRow} t-label-link`}>
        <span>{resolvedLinkLabel}</span>
        <span className="sr-only">{` — ${service.title}`}</span>
        <span className={styles.linkIcon}>
          <ArrowRightIcon size={14} />
        </span>
      </CmsLink>
    </article>
  )
}
