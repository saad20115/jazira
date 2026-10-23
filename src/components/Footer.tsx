import type { ReactElement } from 'react'

import { Button } from '@/components/Button'
import { CmsLink } from '@/components/CmsLink'
import {
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SocialIcon,
} from '@/components/icons'
import { Logo } from '@/components/Logo'
import { getDictionary, type SupportedLocale } from '@/i18n'
import {
  type CmsLinkDataLike,
  resolveSafeCmsLinkData,
  sanitizeCmsHref,
} from '@/lib/link-safety'

import styles from './Footer.module.css'

export interface FooterQuickLinkItem {
  href?: string | null | undefined
  id?: string | null | undefined
  label: string
  link?: CmsLinkDataLike | null | undefined
}

export interface FooterColumnItem {
  id?: string | null | undefined
  links?: readonly FooterQuickLinkItem[] | null | undefined
  title?: string | null | undefined
}

export interface FooterSocialItem {
  id?: string | null | undefined
  label?: string | null | undefined
  platform: string
  url: string
}

export interface FooterProps {
  address?: string | null | undefined
  className?: string
  copyright?: string | null | undefined
  ctaBody?: string | null | undefined
  ctaButtonHref?: string | null | undefined
  ctaButtonLabel?: string | null | undefined
  ctaButtonLink?: CmsLinkDataLike | null | undefined
  ctaEyebrow?: string | null | undefined
  ctaTitle?: string | null | undefined
  ctaWhatsappLabel?: string | null | undefined
  description?: string | null | undefined
  emails?: readonly string[] | null | undefined
  footerColumns?: readonly FooterColumnItem[] | null | undefined
  locale: SupportedLocale
  phones?: readonly string[] | null | undefined
  privacyLink?: CmsLinkDataLike | null | undefined
  quickLinks?: readonly FooterQuickLinkItem[] | null | undefined
  quickLinksTitle?: string | null | undefined
  siteName?: string | null | undefined
  socialLinks?: readonly FooterSocialItem[] | null | undefined
  whatsapp?: string | null | undefined
}

export function normalizeWhatsappDigits(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

export function buildDefaultFooterQuickLinks(locale: SupportedLocale): FooterQuickLinkItem[] {
  const dict = getDictionary(locale)
  return [
    {
      id: 'home',
      label: dict.nav.home,
      href: `/${locale}`,
      link: { type: 'internal', internalRoute: '/' },
    },
    {
      id: 'services',
      label: dict.nav.services,
      href: `/${locale}/services`,
      link: { type: 'internal', internalRoute: '/services' },
    },
    {
      id: 'about',
      label: dict.nav.aboutUs,
      href: `/${locale}/about`,
      link: { type: 'internal', internalRoute: '/about' },
    },
    {
      id: 'projects',
      label: dict.nav.projects,
      href: `/${locale}/projects`,
      link: { type: 'internal', internalRoute: '/projects' },
    },
    {
      id: 'contact',
      label: dict.nav.contactUs,
      href: `/${locale}/contact`,
      link: { type: 'internal', internalRoute: '/contact' },
    },
  ]
}

export function getSocialAriaLabel(
  locale: SupportedLocale,
  platform: string,
  labelOverride?: string | null,
): string {
  if (labelOverride && labelOverride.trim().length > 0) {
    return labelOverride.trim()
  }
  const dict = getDictionary(locale)
  const normalized = platform.trim().toLowerCase()
  switch (normalized) {
    case 'linkedin':
      return dict.footer.socialAriaLinkedin
    case 'x':
    case 'twitter':
      return dict.footer.socialAriaX
    case 'instagram':
      return dict.footer.socialAriaInstagram
    case 'facebook':
      return dict.footer.socialAriaFacebook
    case 'youtube':
      return dict.footer.socialAriaYoutube
    case 'tiktok':
      return dict.footer.socialAriaTiktok
    case 'snapchat':
      return dict.footer.socialAriaSnapchat
    case 'whatsapp':
      return dict.footer.socialAriaWhatsapp
    default:
      return platform.trim()
  }
}

export function Footer({
  locale,
  siteName,
  description,
  footerColumns,
  quickLinks,
  quickLinksTitle,
  phones,
  emails,
  address,
  whatsapp,
  socialLinks,
  ctaEyebrow,
  ctaTitle,
  ctaBody,
  ctaButtonLabel,
  ctaButtonHref,
  ctaButtonLink,
  ctaWhatsappLabel,
  copyright,
  privacyLink,
  className,
}: FooterProps): ReactElement {
  const dict = getDictionary(locale)
  const brandAriaLabel = siteName || dict.nav.brandName

  // R-3 & R-4: Render all CMS `navigation.footer` columns with their CMS `title`;
  // never fall back to invented dictionary links when CMS is empty.
  const resolvedColumns: FooterColumnItem[] =
    footerColumns && footerColumns.length > 0
      ? footerColumns.filter((col) => Boolean(col.title || (col.links && col.links.length > 0)))
      : quickLinks && quickLinks.length > 0
        ? [
            {
              id: 'quick-links',
              title: quickLinksTitle || dict.footer.quickLinksTitle,
              links: quickLinks,
            },
          ]
        : []

  const validSocials = (socialLinks ?? []).filter(
    (s) => Boolean(s.url && s.url.trim().length > 0 && s.platform && s.platform.trim().length > 0),
  )

  const validPhones = (phones ?? []).filter((p) => p.trim().length > 0)
  const validEmails = (emails ?? []).filter((e) => e.trim().length > 0)
  const hasAddress = Boolean(address && address.trim().length > 0)
  const hasContactColumn = validPhones.length > 0 || validEmails.length > 0 || hasAddress

  const cleanWhatsappDigits = whatsapp ? normalizeWhatsappDigits(whatsapp) : ''
  const whatsappUrl = cleanWhatsappDigits ? `https://wa.me/${cleanWhatsappDigits}` : undefined

  const resolvedCtaBtnLabel = (ctaButtonLabel || ctaButtonLink?.label || '').trim()
  const resolvedCtaBtnHref =
    resolveSafeCmsLinkData(ctaButtonLink, { locale })?.href ||
    (ctaButtonHref ? sanitizeCmsHref(ctaButtonHref, { locale })?.href : undefined) ||
    undefined
  const hasCtaButton = Boolean(resolvedCtaBtnLabel && (ctaButtonLink || resolvedCtaBtnHref))

  // R-3: Do NOT render the CTA card when only `whatsapp` is set from `SiteSettings`.
  const hasCtaCard = Boolean(
    ctaEyebrow || ctaTitle || ctaBody || hasCtaButton || ctaWhatsappLabel,
  )

  const resolvedPrivacyHref = resolveSafeCmsLinkData(privacyLink, { locale })?.href
  const hasPrivacyLink = Boolean(privacyLink && resolvedPrivacyHref)

  const footerClasses = [styles.footer, className ?? ''].filter(Boolean).join(' ')

  return (
    <footer className={footerClasses} data-component="footer" data-theme="dark">
      <div className={styles.container}>
        <div className={styles.topGrid}>
          {/* Column 1: Brand, description, and icon-only socials */}
          <div className={styles.brandColumn}>
            <CmsLink
              aria-label={brandAriaLabel}
              className={styles.brandLogoLink}
              href={`/${locale}`}
              locale={locale}
            >
              <Logo alt={brandAriaLabel} color="Reversed" type="Full" />
            </CmsLink>

            {description ? <p className={styles.description}>{description}</p> : null}

            {validSocials.length > 0 ? (
              <ul className={styles.socialRow}>
                {validSocials.map((social, idx) => {
                  const ariaLabel = getSocialAriaLabel(locale, social.platform, social.label)
                  return (
                    <li
                      className={styles.socialItem}
                      key={social.id ?? `${social.platform}-${String(idx)}`}
                    >
                      <CmsLink
                        aria-label={ariaLabel}
                        className={styles.socialButton}
                        href={social.url}
                        locale={locale}
                        newTab
                      >
                        <SocialIcon name={social.platform} size={20} />
                      </CmsLink>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>

          {/* Column 2+: CMS Footer Link Columns (Quick Links, etc.) */}
          {resolvedColumns.map((col, colIdx) => {
            const colLinks = col.links ?? []
            const colHeading = col.title || quickLinksTitle || dict.footer.quickLinksTitle
            return (
              <div
                className={styles.linksColumn}
                key={col.id ?? `footer-col-${String(colIdx)}`}
              >
                {colHeading ? <h2 className={styles.columnHeading}>{colHeading}</h2> : null}
                {colLinks.length > 0 ? (
                  <nav aria-label={colHeading || dict.a11y.footerNavigation}>
                    <ul className={styles.quickLinksList}>
                      {colLinks.map((item, idx) => (
                        <li
                          className={styles.quickLinkItem}
                          key={item.id ?? `${item.label}-${String(idx)}`}
                        >
                          <CmsLink
                            className={styles.quickLink}
                            href={item.href}
                            link={item.link}
                            locale={locale}
                          >
                            <span aria-hidden="true" className={styles.quickLinkDot} />
                            <span>{item.label}</span>
                          </CmsLink>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ) : null}
              </div>
            )
          })}

          {/* Column 3: Contact Info (Figma 13:553 order: Phone, Email, Address) */}
          {hasContactColumn ? (
            <div className={styles.contactColumn}>
              <h2 className={styles.columnHeading}>{dict.footer.contactInfoTitle}</h2>
              <ul className={styles.contactList}>
                {validPhones.length > 0 ? (
                  <li className={styles.contactRow}>
                    <span className={styles.contactIconWrap}>
                      <PhoneIcon size={18} />
                    </span>
                    <div className={styles.contactStack}>
                      {validPhones.map((phone) => {
                        const cleanTel = phone.replace(/[^\d+]/g, '')
                        return (
                          <CmsLink
                            className={styles.contactLink}
                            dir="ltr"
                            href={`tel:${cleanTel}`}
                            key={phone}
                            locale={locale}
                          >
                            {phone}
                          </CmsLink>
                        )
                      })}
                    </div>
                  </li>
                ) : null}

                {validEmails.length > 0 ? (
                  <li className={styles.contactRow}>
                    <span className={styles.contactIconWrap}>
                      <MailIcon size={18} />
                    </span>
                    <div className={styles.contactStack}>
                      {validEmails.map((email) => (
                        <CmsLink
                          className={styles.contactLink}
                          dir="ltr"
                          href={`mailto:${email.trim()}`}
                          key={email}
                          locale={locale}
                        >
                          {email}
                        </CmsLink>
                      ))}
                    </div>
                  </li>
                ) : null}

                {hasAddress ? (
                  <li className={styles.contactRow}>
                    <span className={styles.contactIconWrap}>
                      <MapPinIcon size={18} />
                    </span>
                    <span className={styles.contactText}>{address}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {/* Column 4: Footer CTA Card */}
          {hasCtaCard ? (
            <div className={styles.ctaCard}>
              {ctaEyebrow ? <span className={styles.ctaEyebrow}>{ctaEyebrow}</span> : null}
              {ctaTitle ? <h2 className={styles.ctaTitle}>{ctaTitle}</h2> : null}
              {ctaBody ? <p className={styles.ctaBody}>{ctaBody}</p> : null}

              {hasCtaButton ? (
                <div className={styles.ctaActionWrap}>
                  <Button
                    fullWidth
                    href={ctaButtonLink ? undefined : resolvedCtaBtnHref}
                    label={resolvedCtaBtnLabel}
                    link={ctaButtonLink}
                    locale={locale}
                    size="md"
                    variant="Gold"
                  />
                </div>
              ) : null}

              {whatsappUrl ? (
                <CmsLink
                  className={styles.ctaWhatsappLink}
                  href={whatsappUrl}
                  locale={locale}
                  newTab
                >
                  <SocialIcon name="whatsapp" size={18} />
                  <span>{ctaWhatsappLabel || dict.footer.chatOnWhatsapp}</span>
                </CmsLink>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Bottom bar: copyright only (plus optional CMS privacyLink if explicitly provided) */}
        {copyright || hasPrivacyLink ? (
          <div className={styles.bottomBar}>
            {copyright ? <p className={styles.copyright}>{copyright}</p> : null}
            {hasPrivacyLink ? (
              <div className={styles.bottomLinks}>
                <CmsLink
                  className={styles.bottomLink}
                  link={privacyLink}
                  locale={locale}
                >
                  {privacyLink?.label || dict.footer.privacyPolicy}
                </CmsLink>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </footer>
  )
}
