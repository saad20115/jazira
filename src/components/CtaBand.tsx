import type { JSX, ReactNode } from 'react'

import { Button } from '@/components/Button'
import { CspSafeImage } from '@/components/CspSafeImage'
import { normalizeLocalMediaUrl, resolveMediaAsset } from '@/components/media-utils'
import { revealAttributes } from '@/components/Reveal'
import { splitHeadingForGoldAccent, type SupportedLocale } from '@/i18n'
import { type CmsLinkDataLike, resolveSafeCmsLinkData } from '@/lib/link-safety'
import type { Media } from '@/payload-types'

import styles from './CtaBand.module.css'

export interface MediaDisplay {
  url: string
  alt: string
  width: number
  height: number
}

export function extractMediaDisplay(
  value: number | Media | null | undefined,
  fallbackAlt = '',
  defaultWidth = 800,
  defaultHeight = 600,
): MediaDisplay | null {
  const asset = resolveMediaAsset(value, fallbackAlt)
  if (!asset) {
    return null
  }
  return {
    url: normalizeLocalMediaUrl(asset.url),
    alt: asset.alt,
    width:
      typeof asset.width === 'number' && Number.isFinite(asset.width) && asset.width > 0
        ? asset.width
        : defaultWidth,
    height:
      typeof asset.height === 'number' && Number.isFinite(asset.height) && asset.height > 0
        ? asset.height
        : defaultHeight,
  }
}

export function renderAccentHeading(
  rawTitle: string | null | undefined,
  accentClassName: string = styles.headingAccentGold,
): ReactNode {
  const { mainPart, accentPart } = splitHeadingForGoldAccent(rawTitle)
  if (!mainPart && !accentPart) {
    return null
  }
  if (!accentPart) {
    return mainPart
  }
  return (
    <>
      {mainPart}
      <span className={accentClassName}>{accentPart}</span>
    </>
  )
}

export interface CtaButtonFieldLike {
  label?: string | null
  link?: CmsLinkDataLike | null
}

export interface CtaBandData {
  enabled?: boolean | null
  title?: string | null
  titleAccent?: string | null
  text?: string | null
  backgroundImage?: (number | null) | Media
  button?: CtaButtonFieldLike | null
  secondaryButton?: CtaButtonFieldLike | null
}

export interface CtaBandProps {
  cta?: CtaBandData | null
  locale: SupportedLocale
  fallbackBackgroundSrc?: string
  compact?: boolean
}

/**
 * Shared CTA Band section (`18:660`, `24:1677`, `19:639`, `20:1013`) used on
 * Services, Service Detail, Projects, and Project Detail pages.
 */
export function CtaBand({
  cta,
  locale,
  fallbackBackgroundSrc,
  compact = false,
}: CtaBandProps): JSX.Element | null {
  if (!cta || cta.enabled === false) {
    return null
  }

  const bgMedia = extractMediaDisplay(cta.backgroundImage, '', 1440, 484)
  const bgSrc = bgMedia?.url ?? fallbackBackgroundSrc ?? null
  const primaryLabel = cta.button?.label?.trim() || null
  const primaryHref = cta.button?.link
    ? (resolveSafeCmsLinkData(cta.button.link, { locale })?.href ?? null)
    : null
  const secondaryLabel = cta.secondaryButton?.label?.trim() || null
  const secondaryHref = cta.secondaryButton?.link
    ? (resolveSafeCmsLinkData(cta.secondaryButton.link, { locale })?.href ?? null)
    : null

  const titleLine = cta.title?.trim() || null
  const titleAccentLine = cta.titleAccent?.trim() || null
  const subtitleText = cta.text?.trim() || null

  if (!titleLine && !titleAccentLine && !subtitleText && !primaryLabel && !secondaryLabel) {
    return null
  }

  return (
    <section
      className={`${styles.ctaSection}${compact ? ` ${styles.ctaSectionCompact}` : ''}`}
      data-theme="dark"
    >
      <div className={styles.ctaBgLayer} aria-hidden="true">
        {bgSrc ? (
          <CspSafeImage
            src={bgSrc}
            alt=""
            width={1440}
            height={484}
            sizes="100vw"
            loading="lazy"
            className={styles.ctaBgImage}
          />
        ) : null}
        <div className={styles.ctaBgOverlay} />
      </div>

      <div className={styles.ctaSquareTopStart} aria-hidden="true" />
      <div className={styles.ctaSquareBottomStart} aria-hidden="true" />
      <div className={styles.ctaSquareTopEnd} aria-hidden="true" />
      <div className={styles.ctaSquareBottomEnd} aria-hidden="true" />

      <div className={styles.ctaContent} {...revealAttributes({ stagger: true })}>
        {titleLine || titleAccentLine ? (
          <h2 className={`${styles.ctaTitle} t-display-l`}>
            {titleLine ? <span>{titleLine}</span> : null}
            {titleLine && titleAccentLine ? <br /> : null}
            {titleAccentLine ? (
              <span className={styles.headingAccentGold}>{titleAccentLine}</span>
            ) : null}
          </h2>
        ) : null}

        {subtitleText ? <p className={`${styles.ctaSubtitle} t-body-l`}>{subtitleText}</p> : null}

        {primaryLabel || secondaryLabel ? (
          <div className={styles.ctaButtonsRow}>
            {primaryLabel ? (
              <Button
                variant="Gold"
                label={primaryLabel}
                href={primaryHref}
                link={cta.button?.link}
                locale={locale}
                showArrow
              />
            ) : null}
            {secondaryLabel ? (
              <Button
                variant="Glass"
                className={styles.ctaSecondaryButton}
                label={secondaryLabel}
                href={secondaryHref}
                link={cta.secondaryButton?.link}
                locale={locale}
                showArrow={false}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
