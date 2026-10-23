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
import {
  getDictionary,
  type SupportedLocale,
  switchLocaleInPathname,
} from '@/i18n'
import type { CmsLinkDataLike } from '@/lib/link-safety'

import styles from './Navbar.module.css'

export const NAVBAR_THEMES = ['Light', 'Dark'] as const
export type NavbarTheme = (typeof NAVBAR_THEMES)[number]

export const NAVBAR_PAGES = [
  'Home',
  'Services',
  'About Us',
  'Projects',
  'Contact Us',
] as const
export type NavbarPage = (typeof NAVBAR_PAGES)[number]

export interface NavbarNavItem {
  href?: string | null | undefined
  id?: string | null | undefined
  label: string
  link?: CmsLinkDataLike | null | undefined
  pageKey?: NavbarPage
}

export interface NavbarProps {
  className?: string
  ctaHref?: string | null | undefined
  ctaLabel?: string | null | undefined
  ctaLink?: CmsLinkDataLike | null | undefined
  defaultDrawerOpen?: boolean
  items?: readonly NavbarNavItem[]
  locale: SupportedLocale
  page?: NavbarPage
  siteName?: string | null | undefined
  staticPreview?: boolean
  theme?: NavbarTheme
  transparentOnHero?: boolean
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function buildDefaultNavbarItems(locale: SupportedLocale): NavbarNavItem[] {
  const dict = getDictionary(locale)
  return [
    {
      label: dict.nav.home,
      href: `/${locale}`,
      pageKey: 'Home',
    },
    {
      label: dict.nav.services,
      href: `/${locale}/services`,
      pageKey: 'Services',
    },
    {
      label: dict.nav.aboutUs,
      href: `/${locale}/about`,
      pageKey: 'About Us',
    },
    {
      label: dict.nav.projects,
      href: `/${locale}/projects`,
      pageKey: 'Projects',
    },
    {
      label: dict.nav.contactUs,
      href: `/${locale}/contact`,
      pageKey: 'Contact Us',
    },
  ]
}

function isNavItemActive(
  item: NavbarNavItem,
  index: number,
  locale: SupportedLocale,
  pathname: string,
  overridePage?: NavbarPage,
): boolean {
  if (overridePage) {
    if (item.pageKey) {
      return item.pageKey === overridePage
    }
    const pageIndex = NAVBAR_PAGES.indexOf(overridePage)
    return pageIndex === index
  }

  const rawPath = item.href ?? item.link?.internalPath ?? item.link?.url ?? ''
  if (!rawPath.startsWith('/')) {
    return false
  }

  const normalizedTarget =
    rawPath.startsWith(`/${locale}`) || rawPath === '/'
      ? rawPath === '/'
        ? `/${locale}`
        : rawPath
      : `/${locale}${rawPath}`

  const cleanTarget =
    normalizedTarget.length > 1 && normalizedTarget.endsWith('/')
      ? normalizedTarget.slice(0, -1)
      : normalizedTarget
  const cleanPathname =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  if (cleanTarget === `/${locale}`) {
    return cleanPathname === `/${locale}` || cleanPathname === ''
  }

  return cleanPathname === cleanTarget || cleanPathname.startsWith(`${cleanTarget}/`)
}

export function Navbar({
  locale,
  theme,
  page,
  transparentOnHero,
  staticPreview = false,
  defaultDrawerOpen = false,
  items,
  ctaLabel,
  ctaHref,
  ctaLink,
  siteName,
  className,
}: NavbarProps): ReactElement {
  const dict = getDictionary(locale)
  const pathname = usePathname() || `/${locale}`
  const drawerId = useId()

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(defaultDrawerOpen)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const drawerPanelRef = useRef<HTMLDivElement | null>(null)

  // Determine theme automatically from route if not explicitly provided
  const isHomeRoute =
    page === 'Home' || (!page && (pathname === `/${locale}` || pathname === `/${locale}/`))
  const resolvedTheme: NavbarTheme = theme ?? (isHomeRoute ? 'Dark' : 'Light')
  const resolvedTransparentOnHero =
    transparentOnHero !== undefined ? transparentOnHero : resolvedTheme === 'Dark' && isHomeRoute

  const navItems = items && items.length > 0 ? items : buildDefaultNavbarItems(locale)
  const resolvedCtaLabel = ctaLabel || ctaLink?.label || dict.nav.requestQuote
  const resolvedCtaHref =
    ctaHref ?? (ctaLink ? undefined : `/${locale}/contact#quote`)
  const resolvedSiteName = siteName || dict.nav.brandName

  const targetLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar'
  const languageSwitchHref = switchLocaleInPathname(pathname, targetLocale)

  useEffect(() => {
    if (staticPreview) {
      return
    }
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 24)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [staticPreview])

  const closeDrawerAndRestoreFocus = useCallback((): void => {
    setIsDrawerOpen(false)
    queueMicrotask(() => {
      triggerButtonRef.current?.focus()
    })
  }, [])

  useEffect(() => {
    if (!isDrawerOpen) {
      return
    }
    const previousOverflow = document.body.style.overflow
    if (!staticPreview) {
      document.body.style.overflow = 'hidden'
    }
    closeButtonRef.current?.focus()

    const handleWindowKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDrawerAndRestoreFocus()
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [isDrawerOpen, staticPreview, closeDrawerAndRestoreFocus])

  const handleDrawerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDrawerAndRestoreFocus()
      return
    }

    if (event.key !== 'Tab' || !drawerPanelRef.current) {
      return
    }

    const focusables = Array.from(
      drawerPanelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    )
    if (focusables.length === 0) {
      return
    }

    const firstElement = focusables[0]
    const lastElement = focusables[focusables.length - 1]
    const activeElement = document.activeElement as HTMLElement | null

    if (event.shiftKey) {
      if (activeElement === firstElement || !drawerPanelRef.current.contains(activeElement)) {
        event.preventDefault()
        lastElement.focus()
      }
    } else if (activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  const headerClasses = [
    styles.navbar,
    staticPreview ? styles.staticPreview : styles.sticky,
    resolvedTheme === 'Dark' ? styles.themeDark : styles.themeLight,
    resolvedTransparentOnHero ? styles.transparentHero : '',
    isScrolled ? styles.scrolled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header
      className={headerClasses}
      data-component="navbar"
      data-navbar-page={page ?? ''}
      data-navbar-scrolled={isScrolled ? 'true' : 'false'}
      data-navbar-theme={resolvedTheme}
      data-theme={resolvedTheme === 'Dark' ? 'dark' : 'light'}
    >
      <div className={styles.inner}>
        <CmsLink
          aria-label={resolvedSiteName}
          className={styles.brandLink}
          href={`/${locale}`}
          locale={locale}
        >
          <Logo
            alt={resolvedSiteName}
            color={resolvedTheme === 'Dark' ? 'Reversed' : 'Primary'}
            size="shell"
            type="Full"
          />
        </CmsLink>

        <nav aria-label={dict.nav.mainNavAriaLabel} className={styles.desktopNav}>
          {navItems.map((item, idx) => {
            const active = isNavItemActive(item, idx, locale, pathname, page)
            return (
              <NavLink
                active={active}
                href={item.href}
                key={item.id ?? `${item.label}-${String(idx)}`}
                label={item.label}
                link={item.link}
                locale={locale}
                state={active ? 'Active' : 'Default'}
                theme={resolvedTheme}
              />
            )
          })}
        </nav>

        <div className={styles.desktopActions}>
          <NavLink
            aria-label={dict.nav.languageSwitcherAriaLabel}
            data-language-switcher="desktop"
            href={languageSwitchHref}
            hrefLang={targetLocale}
            label={dict.nav.languageSwitcherShort}
            lang={targetLocale}
            state="Default"
            theme={resolvedTheme}
          />
          <Button
            href={resolvedCtaHref}
            label={resolvedCtaLabel}
            link={ctaLink}
            locale={locale}
            size="sm"
            variant={resolvedTheme === 'Dark' ? 'Glass' : 'Gold'}
          />
        </div>

        <div className={styles.mobileControls}>
          <button
            aria-controls={drawerId}
            aria-expanded={isDrawerOpen}
            aria-label={isDrawerOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            className={styles.menuButton}
            data-navbar-drawer-trigger="true"
            onClick={() => {
              if (isDrawerOpen) {
                closeDrawerAndRestoreFocus()
              } else {
                setIsDrawerOpen(true)
              }
            }}
            ref={triggerButtonRef}
            type="button"
          >
            {isDrawerOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {isDrawerOpen ? (
        <div
          className={styles.drawerBackdrop}
          data-navbar-drawer-backdrop="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDrawerAndRestoreFocus()
            }
          }}
        >
          <div
            aria-label={dict.nav.mobileDrawerAriaLabel}
            aria-modal="true"
            className={styles.drawerPanel}
            data-navbar-drawer="open"
            data-theme="dark"
            id={drawerId}
            onKeyDown={handleDrawerKeyDown}
            ref={drawerPanelRef}
            role="dialog"
          >
            <div>
              <div className={styles.drawerHeader}>
                <CmsLink
                  aria-label={resolvedSiteName}
                  className={styles.brandLink}
                  href={`/${locale}`}
                  locale={locale}
                  onClick={() => {
                    setIsDrawerOpen(false)
                  }}
                >
                  <Logo alt={resolvedSiteName} color="Reversed" size="shell" type="Full" />
                </CmsLink>
                <button
                  aria-label={dict.nav.closeMenu}
                  className={styles.drawerCloseButton}
                  data-navbar-drawer-close="true"
                  onClick={closeDrawerAndRestoreFocus}
                  ref={closeButtonRef}
                  type="button"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <nav aria-label={dict.nav.mainNavAriaLabel}>
                <ul className={styles.drawerNavList}>
                  {navItems.map((item, idx) => {
                    const active = isNavItemActive(item, idx, locale, pathname, page)
                    return (
                      <li
                        className={styles.drawerNavItem}
                        key={item.id ?? `${item.label}-${String(idx)}`}
                      >
                        <NavLink
                          active={active}
                          href={item.href}
                          label={item.label}
                          link={item.link}
                          locale={locale}
                          onClick={() => {
                            setIsDrawerOpen(false)
                          }}
                          state={active ? 'Active' : 'Default'}
                          theme="Dark"
                        />
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>

            <div className={styles.drawerFooter}>
              <CmsLink
                aria-label={dict.nav.languageSwitcherAriaLabel}
                className={styles.drawerLangSwitcher}
                data-language-switcher="drawer"
                href={languageSwitchHref}
                hrefLang={targetLocale}
                lang={targetLocale}
                onClick={() => {
                  setIsDrawerOpen(false)
                }}
              >
                <span>{dict.nav.languageSwitcherLabel}</span>
                <span className={styles.drawerLangBadge}>{dict.nav.languageSwitcherShort}</span>
              </CmsLink>

              <Button
                fullWidth
                href={resolvedCtaHref}
                label={resolvedCtaLabel}
                link={ctaLink}
                locale={locale}
                size="md"
                variant="Gold"
              />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
