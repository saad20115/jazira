import { CspSafeImage } from '@/components/CspSafeImage'
import type { ReactElement } from 'react'

import { resolveMediaAsset } from '@/components/media-utils'
import type { Brand } from '@/payload-types'

import styles from './BrandTile.module.css'

export interface BrandTileProps {
  brand: Pick<Brand, 'name' | 'origin' | 'logo' | 'website'>
  className?: string
}

/**
 * Figma component `BrandTile` (`156:890`, `design/context/components/brand-tile.md`, CTO §12).
 * Renders a brand marquee tile: the brand name and origin, always. Owner 2026-11-11: an uploaded
 * logo no longer replaces the name; it sits in a round badge at the start of the tile.
 */
export function BrandTile({ brand, className }: BrandTileProps): ReactElement {
  const logoAsset = resolveMediaAsset(brand.logo, brand.name, 'thumb')
  const tileClasses = [styles.tile, logoAsset ? styles.withLogo : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={tileClasses} data-component="brand-tile">
      {logoAsset ? (
        <span className={styles.logoBadge} data-brand-logo="true">
          {/* The name is the text next to it, so the logo is decorative. */}
          <CspSafeImage
            src={logoAsset.url}
            alt=""
            width={48}
            height={48}
            className={styles.logoImage}
          />
        </span>
      ) : null}
      <span className={styles.text}>
        <span className={`${styles.name} t-h5`}>{brand.name}</span>
        {brand.origin ? (
          <span className={`${styles.origin} t-caption-s`}>{brand.origin}</span>
        ) : null}
      </span>
    </div>
  )
}
