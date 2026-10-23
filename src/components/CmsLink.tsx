import Link from 'next/link'
import React from 'react'

import type { SupportedLocale } from '@/i18n'
import {
  type CmsLinkDataLike,
  resolveSafeCmsLinkData,
  sanitizeCmsHref,
} from '@/lib/link-safety'

export interface CmsLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: string | null | undefined
  link?: CmsLinkDataLike | null | undefined
  locale?: SupportedLocale | undefined
  newTab?: boolean | null | undefined
  nodeEnv?: string | undefined
  children?: React.ReactNode
}

/**
 * `<CmsLink>` (`handoff/PLAN.md` §"Phase 3 rules", `docs/03-security.md` I3):
 *
 * Defence-in-depth wrapper for every CMS-sourced link (including in Live Preview).
 * Re-validates the href at render time:
 * - Allows only `https:`, `http:` outside production, `mailto:`, `tel:`, and internal paths starting with a single `/`.
 * - External links and `newTab` links always receive `rel="noopener noreferrer"`.
 * - Any unsafe or unresolvable href (`javascript:`, `data:`, `//evil.com`, etc.) renders as a plain `<span>` with no `href`.
 */
export function CmsLink({
  href,
  link,
  locale,
  newTab,
  nodeEnv,
  children,
  className,
  ...rest
}: CmsLinkProps): React.ReactElement {
  const content = children ?? link?.label ?? null

  const resolved = link
    ? resolveSafeCmsLinkData(link, { locale, nodeEnv })
    : (() => {
        const safe = sanitizeCmsHref(href, { locale, nodeEnv })
        return safe ? { ...safe, newTab: Boolean(newTab) } : null
      })()

  if (!resolved) {
    return (
      <span className={className} data-cms-link-fallback="plain-text">
        {content}
      </span>
    )
  }

  const openInNewTab = newTab !== null && newTab !== undefined ? newTab : resolved.newTab
  const target = openInNewTab ? '_blank' : rest.target
  const rel =
    resolved.isExternal || openInNewTab ? 'noopener noreferrer' : rest.rel

  if (resolved.isExternal || openInNewTab) {
    return (
      <a
        {...rest}
        href={resolved.href}
        target={target}
        rel={rel}
        className={className}
      >
        {content}
      </a>
    )
  }

  return (
    <Link {...rest} href={resolved.href} className={className}>
      {content}
    </Link>
  )
}

export default CmsLink
