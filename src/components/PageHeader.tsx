import Link from 'next/link'
import type { JSX, ReactNode } from 'react'

import { CspSafeImage } from '@/components/CspSafeImage'
import { revealAttributes } from '@/components/Reveal'

import styles from './PageHeader.module.css'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  subtitle?: string | null
  backgroundImageSrc?: string | null
  backgroundImageAlt?: string
  breadcrumbs: BreadcrumbItem[]
  breadcrumbAriaLabel: string
  waveFill?: 'white' | 'surface'
  children?: ReactNode
}

/**
 * Shared inner-page header (`24:1478`, `21:1034`, `19:556`, `23:1366`) built once in `P3-T6`
 * and reused across Services, Service Detail, About, Projects, Contact, and Privacy pages.
 */
export function PageHeader({
  title,
  subtitle,
  backgroundImageSrc,
  backgroundImageAlt = '',
  breadcrumbs,
  breadcrumbAriaLabel,
  waveFill = 'white',
  children,
}: PageHeaderProps): JSX.Element {
  const resolvedBg =
    typeof backgroundImageSrc === 'string' && backgroundImageSrc.trim().length > 0
      ? backgroundImageSrc
      : null

  return (
    <section className={styles.pageHeader} data-page-header="true" data-theme="dark">
      <div className={styles.bgMedia} aria-hidden="true">
        {resolvedBg ? (
          <CspSafeImage
            src={resolvedBg}
            alt={backgroundImageAlt}
            width={1440}
            height={537}
            preload
            fetchPriority="high"
            loading="eager"
            sizes="100vw"
            className={styles.bgImage}
          />
        ) : null}
        <div className={styles.bgOverlay} />
      </div>

      <div className={styles.inner}>
        <span className={styles.goldBar} aria-hidden="true" />
        <h1 className={`${styles.title} t-display-l`} {...revealAttributes({ variant: 'rise' })}>
          {title}
        </h1>
        {subtitle ? (
          <p
            className={`${styles.subtitle} t-body-l`}
            {...revealAttributes({ variant: 'rise', step: 1 })}
          >
            {subtitle}
          </p>
        ) : null}

        {breadcrumbs.length > 0 ? (
          <nav
            aria-label={breadcrumbAriaLabel}
            className={styles.breadcrumbNav}
            {...revealAttributes({ variant: 'fade', step: 2 })}
          >
            <ol className={styles.breadcrumbList}>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <li key={`${crumb.label}-${String(index)}`} className={styles.breadcrumbItem}>
                    {index > 0 ? (
                      <span className={styles.breadcrumbDot} aria-hidden="true" />
                    ) : null}
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className={`${styles.breadcrumbLink} t-label-caps`}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={`${styles.breadcrumbCurrent} t-label-caps`}
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        ) : null}

        {children}
      </div>

      <div
        className={`${styles.waveWrap} ${waveFill === 'surface' ? styles.waveSurface : styles.waveWhite}`}
        aria-hidden="true"
      >
        <svg
          className={styles.waveSvg}
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M0 60C240 10 480 0 720 30C960 60 1200 80 1440 40V90H0V60Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  )
}
