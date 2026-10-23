import type { ReactElement } from 'react'

import styles from './Logo.module.css'

export const LOGO_TYPES = ['Full', 'Compact', 'Icon'] as const
export type LogoType = (typeof LOGO_TYPES)[number]

export const LOGO_COLORS = ['Primary', 'Reversed', 'Dark', 'Navy', 'White'] as const
export type LogoColor = (typeof LOGO_COLORS)[number]

export interface LogoProps {
  alt?: string
  className?: string
  color?: LogoColor
  size?: 'default' | 'shell'
  type?: LogoType
}

const LOGO_DIMENSIONS: Record<
  'default' | 'shell',
  Record<LogoType, { height: number; width: number }>
> = {
  default: {
    Full: { width: 199, height: 58 },
    Compact: { width: 199, height: 56 },
    Icon: { width: 57, height: 56 },
  },
  shell: {
    Full: { width: 172, height: 50 },
    Compact: { width: 172, height: 48 },
    Icon: { width: 48, height: 48 },
  },
}

const TYPE_CLASS_MAP: Record<LogoType, string> = {
  Full: styles.typeFull,
  Compact: styles.typeCompact,
  Icon: styles.typeIcon,
}

export function getLogoAssetSrc(type: LogoType = 'Full', color: LogoColor = 'Primary'): string {
  return `/brand/${type.toLowerCase()}-${color.toLowerCase()}.svg`
}

export function Logo({
  type = 'Full',
  color = 'Primary',
  size = 'default',
  alt = '',
  className,
}: LogoProps): ReactElement {
  const dimensions = LOGO_DIMENSIONS[size][type]
  const src = getLogoAssetSrc(type, color)
  const classes = [
    styles.logo,
    TYPE_CLASS_MAP[type],
    size === 'shell' ? styles.sizeShell : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={classes}
      data-component="logo"
      data-logo-color={color}
      data-logo-size={size}
      data-logo-type={type}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image injects inline style="color:transparent" which violates strict H3 nonce-only style-src CSP on SVG brand assets */}
      <img
        alt={alt}
        className={styles.image}
        decoding="async"
        height={dimensions.height}
        src={src}
        width={dimensions.width}
      />
    </span>
  )
}
