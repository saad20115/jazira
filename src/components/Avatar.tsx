import { CspSafeImage } from '@/components/CspSafeImage'
import type { ReactElement } from 'react'

import { extractInitials, resolveMediaAsset } from '@/components/media-utils'
import type { Team } from '@/payload-types'

import styles from './Avatar.module.css'

export type AvatarFallbackMode = 'silhouette' | 'initials'

export interface AvatarProps {
  className?: string
  fallbackMode?: AvatarFallbackMode
  member?: Pick<Team, 'name' | 'photo'>
  size?: 52 | 120
}

/**
 * Figma component `AvatarPlaceholder` (`150:318`, `design/context/components/avatar-placeholder.md`).
 * Renders a circular team member avatar (`52×52` in `TeamMember` or `120×120` standalone),
 * falling back to the Figma geometric silhouette (`150:318`) or initials when no photo is uploaded.
 */
export function Avatar({
  member,
  size = 52,
  fallbackMode = 'silhouette',
  className,
}: AvatarProps): ReactElement {
  const photoAsset = resolveMediaAsset(member?.photo, member?.name ?? '', 'thumb')
  const initials = member?.name ? extractInitials(member.name) : ''

  const avatarClasses = [
    styles.avatar,
    size === 120 ? styles.size120 : styles.size52,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={avatarClasses}
      data-component="avatar"
      data-size={size}
      data-fallback={photoAsset ? 'photo' : fallbackMode}
    >
      {photoAsset ? (
        <CspSafeImage
          src={photoAsset.url}
          alt={photoAsset.alt}
          width={size}
          height={size}
          className={styles.photo}
        />
      ) : fallbackMode === 'initials' && initials ? (
        <span className={`${styles.initials} t-body-s-medium`} aria-hidden="true">
          {initials}
        </span>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className={styles.silhouetteSvg}
        >
          <path
            d="M60 68C71.0457 68 80 59.0457 80 48C80 36.9543 71.0457 28 60 28C48.9543 28 40 36.9543 40 48C40 59.0457 48.9543 68 60 68Z"
            fill="currentColor"
            fillOpacity={0.28}
          />
          <path
            d="M22 112C25 90 41 76 60 76C79 76 95 90 98 112"
            fill="currentColor"
            fillOpacity={0.28}
          />
        </svg>
      )}
    </span>
  )
}
