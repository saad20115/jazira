import Image from 'next/image'
import type { ReactElement } from 'react'

import { resolveMediaAsset } from '@/components/media-utils'
import type { Team } from '@/payload-types'

import styles from './Portrait.module.css'

export interface PortraitProps {
  className?: string
  fallbackImageUrl?: string
  member?: Pick<Team, 'name' | 'photo'>
}

/**
 * Figma component `PortraitPlaceholder` (`154:890`, `design/context/components/portrait-placeholder.md`).
 * Renders a `264×340` leadership portrait (`next/image` when `member.photo` is populated,
 * or the navy gradient + executive silhouette placeholder `154:890`).
 */
export function Portrait({
  member,
  fallbackImageUrl,
  className,
}: PortraitProps): ReactElement {
  const photoAsset = resolveMediaAsset(member?.photo, member?.name ?? '', 'card')
  const imageSrc = photoAsset?.url ?? fallbackImageUrl ?? null
  const imageAlt = photoAsset?.alt ?? member?.name ?? ''

  const portraitClasses = [styles.portrait, className ?? ''].filter(Boolean).join(' ')

  return (
    <div
      className={portraitClasses}
      data-component="portrait"
      data-fallback={imageSrc ? 'photo' : 'silhouette'}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 767px) 100vw, 264px"
          className={styles.photo}
        />
      ) : (
        <>
          <div className={styles.cornerGlow} aria-hidden="true" />
          <svg
            width={264}
            height={340}
            viewBox="0 0 264 340"
            fill="none"
            aria-hidden="true"
            focusable="false"
            className={styles.silhouetteSvg}
          >
            <path
              d="M132 168C157.405 168 178 147.405 178 122C178 96.5949 157.405 76 132 76C106.595 76 86 96.5949 86 122C86 147.405 106.595 168 132 168Z"
              fill="currentColor"
              fillOpacity={0.16}
            />
            <path
              d="M40 340C44 266 84 222 132 222C180 222 220 266 224 340H40Z"
              fill="currentColor"
              fillOpacity={0.16}
            />
          </svg>
        </>
      )}
    </div>
  )
}
