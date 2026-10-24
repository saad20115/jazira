import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react'

import { CmsLink } from '@/components/CmsLink'
import type { SupportedLocale } from '@/i18n'
import type { CmsLinkDataLike } from '@/lib/link-safety'

import styles from './NavLink.module.css'

export const NAV_LINK_THEMES = ['Light', 'Dark'] as const
export type NavLinkTheme = (typeof NAV_LINK_THEMES)[number]

export const NAV_LINK_STATES = ['Default', 'Hover', 'Active'] as const
export type NavLinkState = (typeof NAV_LINK_STATES)[number]

export interface NavLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'children' | 'href'
> {
  active?: boolean
  children?: ReactNode
  className?: string
  href?: string | null | undefined
  label?: string
  link?: CmsLinkDataLike | null | undefined
  locale?: SupportedLocale | undefined
  newTab?: boolean | null | undefined
  state?: NavLinkState
  theme?: NavLinkTheme
}

export function NavLink({
  theme = 'Light',
  state = 'Default',
  active = false,
  href = '/',
  link,
  locale,
  newTab,
  label,
  children,
  className,
  ...anchorProps
}: NavLinkProps): ReactElement {
  const effectiveState: NavLinkState = active ? 'Active' : state
  const isCurrentPage = effectiveState === 'Active'
  const content = children ?? label ?? link?.label ?? null

  const classes = [
    styles.navLink,
    theme === 'Dark' ? styles.themeDark : styles.themeLight,
    effectiveState === 'Hover' ? styles.stateHover : '',
    effectiveState === 'Active' ? styles.stateActive : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <CmsLink
      {...anchorProps}
      aria-current={isCurrentPage ? 'page' : anchorProps['aria-current']}
      className={classes}
      data-component="nav-link"
      data-nav-link-state={effectiveState}
      data-nav-link-theme={theme}
      href={href}
      link={link}
      locale={locale}
      newTab={newTab}
    >
      <span className={styles.label}>{content}</span>
      <span aria-hidden="true" className={styles.underline} />
    </CmsLink>
  )
}
