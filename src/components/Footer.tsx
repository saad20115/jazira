import type { ReactElement } from 'react'

import { Button } from '@/components/Button'
import { CmsLink } from '@/components/CmsLink'
import {
  isSocialIconKey,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SOCIAL_ICON_KEYS,
  SocialIcon,
  type SocialIconKey,
} from '@/components/icons'
import { Logo } from '@/components/Logo'
import { getDictionary, type SupportedLocale } from '@/i18n'
import type { CmsLinkDataLike } from '@/lib/link-safety'

import styles from './Footer.module.css'

export interface FooterQuickLinkItem {
  href?: string | null | undefined
  id?: string | null | undefined
  label: string
  link?: CmsLinkDataLike | null | undefined
}

export interface FooterSocialItem {
  id?: string | null | undefined
  label?: string | null | undefined
  platform: SocialIconKey | (string & {})
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
  description?: string | null | undefined
  emails?: readonly string[] | undefined
  locale: SupportedLocale
  phones?: readonly string[] | undefined
  quickLinks?: readonly FooterQuickLinkItem[] | undefined
  siteName?: string | null | undefined
  socialLinks?: readonly FooterSocialItem[] | undefined
  whatsapp?: string | null | undefined
}

export function normalizeWhatsappDigits(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.startsWith('00')) {
    return digits.slice(2)
  }
  if (digits.startsWith('05') && digits.length === 10) {
    return `966${digits.slice(1)}`
  }
  return digits || '966573534185'
}

export function buildDefaultFooterQuickLinks(locale: SupportedLocale): FooterQuickLinkItem[] {
  const dict = getDictionary(locale)
  return [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.services, href: `/${locale}/services` },
    { label: dict.nav.aboutUs, href: `/${locale}/about` },
    { label: dict.nav.projects, href: `/${locale}/projects` },
    { label: dict.nav.contactUs, href: `/${locale}/contact` },
  ]
}

export function buildDefaultFooterSocialLinks(
  whatsappNumber: string,
): FooterSocialItem[] {
  const cleanWa = normalizeWhatsappDigits(whatsappNumber)
  return [
    { platform: 'linkedin', url: 'https://www.linkedin.com' },
    { platform: 'x', url: 'https://x.com' },
    { platform: 'instagram', url: 'https://www.instagram.com' },
    { platform: 'facebook', url: 'https://www.facebook.com' },
    { platform: 'whatsapp', url: `https://wa.me/${cleanWa}` },
  ]
}

export function getSocialAriaLabel(
  locale: SupportedLocale,
  platform: SocialIconKey,
): string {
  const dict = getDictionary(locale)
  switch (platform) {
    case 'linkedin':
      return dict.footer.socialAriaLinkedin
    case 'x':
      return dict.footer.socialAriaX
    case 'instagram':
      return dict.footer.socialAriaInstagram
    case 'facebook':
      return dict.footer.socialAriaFacebook
    case 'whatsapp':
    default:
      return dict.footer.socialAriaWhatsapp
  }
}

export function Footer({
  locale,
  siteName,
  description,
  quickLinks,
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
  copyright,
  className,
}: FooterProps): ReactElement {
  const dict = getDictionary(locale)
  const resolvedSiteName = siteName || dict.nav.brandName
  const resolvedDescription = description || dict.footer.brandDescription
  const resolvedQuickLinks =
    quickLinks && quickLinks.length > 0
      ? quickLinks
      : buildDefaultFooterQuickLinks(locale)

  const resolvedPhones =
    phones && phones.length > 0 ? phones.join('  |  ') : dict.footer.defaultPhone
  const resolvedEmail =
    emails && emails.length > 0 ? emails[0] : dict.footer.defaultEmail
  const resolvedAddress = address || dict.footer.defaultLocation
  const resolvedWhatsapp = whatsapp || '+966573534185'
  const whatsappUrl = `https://wa.me/${normalizeWhatsappDigits(resolvedWhatsapp)}`

  const resolvedSocialLinks =
    socialLinks && socialLinks.length > 0
      ? socialLinks
      : buildDefaultFooterSocialLinks(resolvedWhatsapp)

  const targetLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'

  const footerClasses = [styles.footer, className ?? ''].filter(Boolean).join(' ')

  return (
    <footer
      className={footerClasses}
      data-component="footer"
      data-theme="dark"
    >
      <div className={styles.container}>
        <div className={styles.topGrid}>
          {/* 1. Brand Column */}
          <div className={styles.brandColumn}>
            <CmsLink
              aria-label={resolvedSiteName}
              className={styles.brandLink}
              href={`/${locale}`}
              locale={locale}
            >
              <Logo alt={resolvedSiteName} color="Reversed" size="shell" type="Full" />
            </CmsLink>
            <p className={styles.brandDescription}>{resolvedDescription}</p>
            <div className={styles.socialRow}>
              {resolvedSocialLinks.map((social, idx) => {
                const iconKey: SocialIconKey = isSocialIconKey(social.platform)
                  ? social.platform
                  : SOCIAL_ICON_KEYS[idx % SOCIAL_ICON_KEYS.length]
                const ariaLabel =
                  social.label || getSocialAriaLabel(locale, iconKey)
                return (
                  <CmsLink
                    aria-label={ariaLabel}
                    className={styles.socialButton}
                    data-social-platform={iconKey}
                    href={social.url}
                    key={social.id ?? `${iconKey}-${String(idx)}`}
                    locale={locale}
                    newTab
                  >
                    <SocialIcon name={iconKey} size={20} />
                  </CmsLink>
                )
              })}
            </div>
          </div>

          {/* 2. Quick Links Column */}
          <div className={styles.linkColumn}>
            <h2 className={styles.columnHeading}>{dict.footer.quickLinksTitle}</h2>
            <ul className={styles.quickLinksList}>
              {resolvedQuickLinks.map((item, idx) => (
                <li
                  className={styles.quickLinkItem}
                  key={item.id ?? `${item.label}-${String(idx)}`}
                >
                  <span aria-hidden="true" className={styles.quickLinkDot} />
                  <CmsLink
                    className={styles.quickLink}
                    href={item.href}
                    link={item.link}
                    locale={locale}
                  >
                    {item.label}
                  </CmsLink>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Contact Info Column */}
          <div className={styles.linkColumn}>
            <h2 className={styles.columnHeading}>{dict.footer.contactInfoTitle}</h2>
            <ul className={styles.contactList}>
              <li className={styles.contactRow}>
                <PhoneIcon className={styles.contactIcon} size={18} />
                <span className={styles.contactText} dir="ltr">
                  {resolvedPhones}
                </span>
              </li>
              <li className={styles.contactRow}>
                <MailIcon className={styles.contactIcon} size={18} />
                <CmsLink
                  className={styles.contactText}
                  dir="ltr"
                  href={`mailto:${resolvedEmail}`}
                  locale={locale}
                >
                  {resolvedEmail}
                </CmsLink>
              </li>
              <li className={styles.contactRow}>
                <MapPinIcon className={styles.contactIcon} size={18} />
                <span className={styles.contactText}>{resolvedAddress}</span>
              </li>
            </ul>
          </div>

          {/* 4. CTA Card Column */}
          <div className={styles.ctaCard}>
            <span className={styles.columnHeading}>
              {ctaEyebrow || dict.footer.ctaEyebrow}
            </span>
            <p className={styles.ctaTitle}>{ctaTitle || dict.footer.ctaTitle}</p>
            <p className={styles.ctaBody}>{ctaBody || dict.footer.ctaBody}</p>
            <Button
              fullWidth
              href={ctaButtonHref ?? (ctaButtonLink ? undefined : `/${locale}/contact#quote`)}
              label={ctaButtonLabel || dict.footer.ctaButton}
              link={ctaButtonLink}
              locale={locale}
              size="md"
              variant="Gold"
            />
            <CmsLink
              className={styles.ctaWhatsappLink}
              href={whatsappUrl}
              locale={locale}
              newTab
            >
              {dict.footer.ctaWhatsappLink}
            </CmsLink>
          </div>
        </div>

        <div aria-hidden="true" className={styles.divider} />

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>{copyright || dict.footer.copyright}</p>
          <div className={styles.bottomLinks}>
            <CmsLink
              aria-label={dict.nav.languageSwitcherAriaLabel}
              className={styles.bottomLink}
              href={`/${targetLocale}`}
              hrefLang={targetLocale}
              lang={targetLocale}
            >
              {dict.footer.languageToggle}
            </CmsLink>
            <CmsLink
              className={styles.bottomLink}
              href={`/${locale}/contact`}
              locale={locale}
            >
              {dict.footer.privacyPolicy}
            </CmsLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
