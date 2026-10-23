import Image from 'next/image'
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
 * Renders a `200×76` brand marquee tile: uploaded logo image if present, or styled wordmark fallback (`name` + `origin`).
 */
export function BrandTile({ brand, className }: BrandTileProps): ReactElement {
  const logoAsset = resolveMediaAsset(brand.logo, brand.name, 'thumb')
  const tileClasses = [styles.tile, className ?? ''].filter(Boolean).join(' ')

  return (
    <div className={tileClasses} data-component="brand-tile">
      {logoAsset ? (
        <Image
          src={logoAsset.url}
          alt={logoAsset.alt}
          width={152}
          height={46}
          className={styles.logoImage}
        />
      ) : (
        <>
          <p className={`${styles.name} t-h5`}>{brand.name}</p>
          {brand.origin ? (
            <p className={`${styles.origin} t-caption-s`}>{brand.origin}</p>
          ) : null}
        </>
      )}
    </div>
  )
}
