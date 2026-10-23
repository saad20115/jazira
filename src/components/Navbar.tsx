'use client'

import { usePathname } from 'next/navigation'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import { Button } from '@/components/Button'
import { CmsLink } from '@/components/CmsLink'
import { CloseIcon, MenuIcon } from '@/components/icons'
import { Logo } from '@/components/Logo'
import { NavLink } from '@/components/NavLink'
import { getAlternateLocale, getDictionary, type SupportedLocale } from '@/i18n'
import {
  type CmsLinkDataLike,
  resolveSafeCmsLinkData,
  sanitizeCmsHref,
} from '@/lib/link-safety'

import styles from './Navbar.module.css'

export const NAVBAR_THEMES = ['Light', 'Dark'] as const
export type NavbarTheme = (typeof NAVBAR_THEMES)[number]

export const NAVBAR_PAGES = ['Home', 'Services', 'About Us', 'Projects', 'Contact Us'] as const
export type NavbarPage = (typeof NAVBAR_PAGES)[number]

export interface NavbarNavItem {
  href?: string | null | undefined
  id?: string | null | undefined
  label: string
  link?: CmsLinkDataLike | null | undefined
  page?: NavbarPage | undefined
}

export interface NavbarProps {
  className?: string
  ctaHref?: string | null | undefined
  ctaLabel?: string | null | undefined
  ctaLink?: CmsLinkDataLike | null | undefined
  defaultDrawerOpen?: boolean
  items?: readonly NavbarNavItem[] | null | undefined
  locale: SupportedLocale
  page?: NavbarPage | undefined
  pathnameOverride?: string | undefined
  siteName?: string | null | undefined
  staticPreview?: boolean
  theme?: NavbarTheme | undefined
}

export function buildDefaultNavbarItems(locale: SupportedLocale): NavbarNavItem[] {
  const dict = getDictionary(locale)
  return [
    {
      id: 'home',
      page: 'Home',
      label: dict.nav.home,
      href: `/${locale}`,
      link: { type: 'internal', internalRoute: '/' },
    },
    {
      id: 'services',
      page: 'Services',
      label: dict.nav.services,
      href: `/${locale}/services`,
      link: { type: 'internal', internalRoute: '/services' },
    },
    {
      id: 'about',
      page: 'About Us',
      label: dict.nav.aboutUs,
      href: `/${locale}/about`,
      link: { type: 'internal', internalRoute: '/about' },
    },
    {
      id: 'projects',
      page: 'Projects',
      label: dict.nav.projects,
      href: `/${locale}/projects`,
      link: { type: 'internal', internalRoute: '/projects' },
    },
    {
      id: 'contact',
      page: 'Contact Us',
      label: dict.nav.contactUs,
      href: `/${locale}/contact`,
      link: { type: 'internal', internalRoute: '/contact' },
    },
  ]
}

export function resolveNavbarPageFromPathname(
  pathname: string,
  locale: SupportedLocale,
): NavbarPage | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  if (normalized === `/${locale}` || normalized === '/') {
    return 'Home'
  }
  if (normalized === `/${locale}/services` || normalized.startsWith(`/${locale}/services/`)) {
    return 'Services'
  }
  if (normalized === `/${locale}/about` || normalized.startsWith(`/${locale}/about/`)) {
    return 'About Us'
  }
  if (normalized === `/${locale}/projects` || normalized.startsWith(`/${locale}/projects/`)) {
    return 'Projects'
  }
  if (normalized === `/${locale}/contact` || normalized.startsWith(`/${locale}/contact/`)) {
    return 'Contact Us'
  }
  return undefined
}

export function isNavItemActive(
  item: NavbarNavItem,
  pathname: string,
  locale: SupportedLocale,
): boolean {
  const resolvedFromLink = resolveSafeCmsLinkData(item.link, { locale })?.href
  const resolvedFromHref = item.href ? sanitizeCmsHref(item.href, { locale })?.href : undefined
  const rawTarget = (resolvedFromLink || resolvedFromHref || item.href || item.link?.url || '')
    .split(/[?#]/)[0]
    ?.trim()
  if (!rawTarget) return false

  const cleanHref = rawTarget.replace(/\/+$/, '') || '/'
  const cleanPathname = pathname.replace(/\/+$/, '') || '/'

  if (cleanHref === `/${locale}` || cleanHref === '/') {
    return cleanPathname === `/${locale}` || cleanPathname === '/'
  }
  return cleanPathname === cleanHref || cleanPathname.startsWith(`${cleanHref}/`)
}

export function buildLanguageSwitchHref(
  pathname: string,
  currentLocale: SupportedLocale,
): string {
  const targetLocale = getAlternateLocale(currentLocale)
  const clean = pathname.trim() || `/${currentLocale}`
  if (clean === `/${currentLocale}`) {
    return `/${targetLocale}`
  }
  if (clean.startsWith(`/${currentLocale}/`)) {
    return `/${targetLocale}${clean.slice(currentLocale.length + 1)}`
  }
  return `/${targetLocale}`
}

export function trapDrawerFocusOnTab(
  panel: HTMLElement,
  activeEl: HTMLElement | null,
  shiftKey: boolean,
): HTMLElement | null {
  const focusable = Array.from(
    panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')

  if (focusable.length === 0) return null

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (shiftKey) {
    if (!activeEl || activeEl === first || !panel.contains(activeEl)) {
      last.focus()
      return last
    }
    return null
  }

  if (!activeEl || activeEl === last || !panel.contains(activeEl)) {
    first.focus()
    return first
  }

  return null
}

export function Navbar({
  locale,
  theme,
  page,
  items,
  ctaLabel,
  ctaHref,
  ctaLink,
  siteName,
  pathnameOverride,
  staticPreview = false,
  defaultDrawerOpen = false,
  className,
}: NavbarProps): ReactElement {
  const livePathname = usePathname()
  const currentPath = pathnameOverride ?? (livePathname || `/${locale}`)
  const dict = getDictionary(locale)

  const resolvedActivePage = page ?? resolveNavbarPageFromPathname(currentPath, locale)
  // R-1: Home navbar in Figma (`01-home/10-navbar.md`, `18:749`) is Light; Dark is used only when explicitly requested.
  const resolvedTheme: NavbarTheme = theme ?? 'Light'

  const [isScrolled, setIsScrolled] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(defaultDrawerOpen)

  const drawerId = useId()
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const drawerPanelRef = useRef<HTMLDivElement | null>(null)

  // R-3: Never invent fallback nav items or CTA buttons on public pages when CMS `navigation` is empty.
  // On the dev-only `/[locale]/styleguide` route (unreachable in production), populate the layout's top
  // navbar with specimen items when CMS `navigation` is empty so responsive/drawer/keyboard checks run
  // against a single top `<header>` landmark.
  const isDevStyleguideShell =
    process.env.NODE_ENV !== 'production' &&
    !staticPreview &&
    (currentPath === '/ar/styleguide' || currentPath === '/en/styleguide')
  const navItems: readonly NavbarNavItem[] =
    items && items.length > 0
      ? items
      : isDevStyleguideShell
        ? buildDefaultNavbarItems(locale)
        : []
  const resolvedCtaLabel = (
    ctaLabel ||
    ctaLink?.label ||
    (isDevStyleguideShell ? dict.nav.getAQuote : '')
  ).trim()
  const resolvedCtaHref =
    resolveSafeCmsLinkData(ctaLink, { locale })?.href ||
    (ctaHref ? sanitizeCmsHref(ctaHref, { locale })?.href : undefined) ||
    (isDevStyleguideShell ? `/${locale}/contact#quote` : undefined)
  const hasCta = Boolean(resolvedCtaLabel && (ctaLink || resolvedCtaHref))

  const languageSwitchHref = buildLanguageSwitchHref(currentPath, locale)
  const logoColor = resolvedTheme === 'Dark' ? 'Reversed' : 'Primary'
  const ctaButtonVariant = resolvedTheme === 'Dark' ? 'Glass' : 'Gold'
  const brandAriaLabel = siteName || dict.nav.brandName

  const closeDrawer = useCallback((restoreFocus = true) => {
    setIsDrawerOpen(false)
    if (restoreFocus) {
      requestAnimationFrame(() => {
        menuButtonRef.current?.focus()
      })
    }
  }, [])

  useEffect(() => {
    if (staticPreview) return
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return (): void => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [staticPreview])

  useEffect(() => {
    if (!isDrawerOpen || staticPreview) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })
    return (): void => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDrawerOpen, staticPreview])

  useEffect(() => {
    if (!isDrawerOpen || staticPreview) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDrawer(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return (): void => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isDrawerOpen, staticPreview, closeDrawer])

  const handleDrawerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDrawer(true)
      return
    }
    if (event.key !== 'Tab') return
    const panel = drawerPanelRef.current
    if (!panel) return

    const activeEl = document.activeElement as HTMLElement | null
    const wrappedTarget = trapDrawerFocusOnTab(panel, activeEl, event.shiftKey)
    if (wrappedTarget) {
      event.preventDefault()
    }
  }

  const headerClasses = [
    styles.navbar,
    resolvedTheme === 'Dark' ? styles.themeDark : styles.themeLight,
    isScrolled ? styles.scrolled : '',
    staticPreview ? styles.staticPreview : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header
      className={headerClasses}
      data-component="navbar"
      data-navbar-page={resolvedActivePage ?? 'none'}
      data-navbar-scrolled={isScrolled ? 'true' : 'false'}
      data-navbar-theme={resolvedTheme}
      data-theme={resolvedTheme === 'Dark' ? 'dark' : 'light'}
    >
      <div className={styles.inner}>
        <CmsLink
          aria-label={brandAriaLabel}
          className={styles.brandLink}
          href={`/${locale}`}
          locale={locale}
        >
          <Logo alt={brandAriaLabel} color={logoColor} type="Full" />
        </CmsLink>

        {navItems.length > 0 ? (
          <nav aria-label={dict.nav.mainNavAriaLabel} className={styles.desktopNav}>
            <ul className={styles.navList}>
              {navItems.map((item, idx) => {
                const isActive = page
                  ? item.page === page
                  : isNavItemActive(item, currentPath, locale)
                return (
                  <li className={styles.navItem} key={item.id ?? `${item.label}-${String(idx)}`}>
                    <NavLink
                      active={isActive}
                      href={item.href}
                      label={item.label}
                      link={item.link}
                      locale={locale}
                      theme={resolvedTheme}
                    />
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null}

        <div className={styles.desktopActions}>
          <CmsLink
            aria-label={dict.nav.languageSwitcherAriaLabel}
            className={styles.langSwitch}
            href={languageSwitchHref}
            hrefLang={getAlternateLocale(locale)}
            locale={getAlternateLocale(locale)}
          >
            {dict.nav.languageSwitcherShort}
          </CmsLink>

          {hasCta ? (
            <Button
              href={ctaLink ? undefined : resolvedCtaHref}
              label={resolvedCtaLabel}
              link={ctaLink}
              locale={locale}
              size="md"
              variant={ctaButtonVariant}
            />
          ) : null}
        </div>

        {!staticPreview ? (
          <div className={styles.mobileTriggerWrap}>
            <button
              aria-controls={drawerId}
              aria-expanded={isDrawerOpen}
              aria-label={isDrawerOpen ? dict.nav.closeMenu : dict.nav.openMenu}
              className={styles.menuButton}
              onClick={() => {
                if (isDrawerOpen) {
                  closeDrawer(true)
                } else {
                  setIsDrawerOpen(true)
                }
              }}
              ref={menuButtonRef}
              type="button"
            >
              {isDrawerOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        ) : null}
      </div>

      {!staticPreview ? (
        <div
          aria-hidden={!isDrawerOpen}
          aria-label={dict.nav.mobileDrawerAriaLabel}
          aria-modal={isDrawerOpen ? 'true' : undefined}
          className={`${styles.drawerBackdrop} ${isDrawerOpen ? styles.drawerBackdropOpen : ''}`}
          data-navbar-drawer={isDrawerOpen ? 'open' : 'closed'}
          data-theme="dark"
          hidden={!isDrawerOpen}
          id={drawerId}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDrawer(true)
            }
          }}
          onKeyDown={handleDrawerKeyDown}
          role="dialog"
        >
          <div className={styles.drawerPanel} ref={drawerPanelRef}>
            <div className={styles.drawerHeader}>
              <CmsLink
                aria-label={brandAriaLabel}
                className={styles.brandLink}
                href={`/${locale}`}
                locale={locale}
                onClick={() => {
                  closeDrawer(false)
                }}
              >
                <Logo alt={brandAriaLabel} color="Reversed" type="Compact" />
              </CmsLink>

              <button
                aria-label={dict.nav.closeMenu}
                className={styles.drawerCloseButton}
                onClick={() => {
                  closeDrawer(true)
                }}
                ref={closeButtonRef}
                type="button"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            {navItems.length > 0 ? (
              <nav aria-label={dict.nav.mobileDrawerAriaLabel} className={styles.drawerNav}>
                <ul className={styles.drawerNavList}>
                  {navItems.map((item, idx) => {
                    const isActive = page
                      ? item.page === page
                      : isNavItemActive(item, currentPath, locale)
                    return (
                      <li
                        className={styles.drawerNavItem}
                        key={item.id ?? `drawer-${item.label}-${String(idx)}`}
                        onClick={() => {
                          closeDrawer(false)
                        }}
                      >
                        <NavLink
                          active={isActive}
                          href={item.href}
                          label={item.label}
                          link={item.link}
                          locale={locale}
                          theme="Dark"
                        />
                      </li>
                    )
                  })}
                </ul>
              </nav>
            ) : null}

            <div className={styles.drawerFooter}>
              <CmsLink
                aria-label={dict.nav.languageSwitcherAriaLabel}
                className={styles.drawerLangSwitch}
                href={languageSwitchHref}
                hrefLang={getAlternateLocale(locale)}
                locale={getAlternateLocale(locale)}
                onClick={() => {
                  closeDrawer(false)
                }}
              >
                {dict.nav.languageSwitcherLabel}
              </CmsLink>

              {hasCta ? (
                <div
                  onClick={() => {
                    closeDrawer(false)
                  }}
                >
                  <Button
                    fullWidth
                    href={ctaLink ? undefined : resolvedCtaHref}
                    label={resolvedCtaLabel}
                    link={ctaLink}
                    locale={locale}
                    size="md"
                    variant="Gold"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
