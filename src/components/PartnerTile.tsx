import { CspSafeImage } from '@/components/CspSafeImage'
import type { ReactElement } from 'react'

import { resolveMediaAsset } from '@/components/media-utils'
import type { Brand } from '@/payload-types'

import styles from './PartnerTile.module.css'

export type PartnerTileState = 'Default' | 'Hover'

export interface PartnerTileProps {
  brand: Pick<Brand, 'name' | 'origin' | 'logo' | 'website'>
  className?: string
  state?: PartnerTileState
  subtitle?: string
  wordmark?: string
}

/**
 * Figma component `PartnerTile` (`15:332`, `design/context/components/partner-tile.md`).
 * Renders a partner card (`275×158`) in `Default` or `Hover` state from CMS `Brand` data.
 */
export function PartnerTile({
  brand,
  state = 'Default',
  subtitle,
  wordmark,
  className,
}: PartnerTileProps): ReactElement {
  const logoAsset = resolveMediaAsset(brand.logo, brand.name, 'thumb')
  const resolvedWordmark = wordmark ?? brand.name.toUpperCase()
  const resolvedSubtitle = subtitle ?? brand.origin ?? ''

  const tileClasses = [
    styles.tile,
    state === 'Hover' ? styles.stateHover : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={tileClasses}
      data-component="partner-tile"
      data-state={state}
    >
      <div className={styles.logoSlot}>
        {logoAsset ? (
          <CspSafeImage
            src={logoAsset.url}
            alt={logoAsset.alt}
            width={150}
            height={52}
            className={styles.logoImage}
          />
        ) : (
          <span className={`${styles.wordmark} t-h3`}>{resolvedWordmark}</span>
        )}
      </div>
      <p className={`${styles.name} t-h5`}>{brand.name}</p>
      {resolvedSubtitle ? (
        <p className={`${styles.subtitle} t-caption-s`}>{resolvedSubtitle}</p>
      ) : null}
    </article>
  )
}
