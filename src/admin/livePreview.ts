import type { Config } from 'payload'

import { env } from '../env'
import { getPreviewSecret } from '../previewSecret'

type RootLivePreview = NonNullable<NonNullable<Config['admin']>['livePreview']>

/** Collections whose documents have their own public page (`/[locale]/<collection>/<slug>`). */
export const LIVE_PREVIEW_COLLECTIONS = ['projects', 'services'] as const

/** The page globals; each one is a public page. */
export const LIVE_PREVIEW_GLOBALS = [
  'home-page',
  'services-page',
  'about-page',
  'projects-page',
  'contact-page',
  'privacy-page',
] as const

/** P2-T7 §3: the three widths of the design (desktop, tablet, phone). */
export const LIVE_PREVIEW_BREAKPOINTS = [
  { name: 'desktop', label: 'Desktop — 1440', width: 1440, height: 900 },
  { name: 'tablet', label: 'Tablet — 768', width: 768, height: 1024 },
  { name: 'mobile', label: 'Mobile — 390', width: 390, height: 844 },
] as const

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isOneOf<T extends string>(list: readonly T[], value: string | undefined): value is T {
  return value !== undefined && (list as readonly string[]).includes(value)
}

/**
 * Builds the Live Preview URL: the existing `/api/preview` route (P3-T1 §7), which checks the
 * secret and the staff session, turns draft mode on and redirects to the page. Returns `null`
 * (no Live Preview) for anything that has no public page yet, such as a document without a slug.
 */
export function buildLivePreviewUrl(input: {
  collectionSlug?: string | undefined
  globalSlug?: string | undefined
  locale: string
  slug?: unknown
}): string | null {
  const params = new URLSearchParams({
    secret: getPreviewSecret(),
    locale: input.locale === 'ar' ? 'ar' : 'en',
  })
  if (isOneOf(LIVE_PREVIEW_COLLECTIONS, input.collectionSlug)) {
    if (typeof input.slug !== 'string' || !SLUG_PATTERN.test(input.slug)) {
      return null
    }
    params.set('collection', input.collectionSlug)
    params.set('slug', input.slug)
  } else if (isOneOf(LIVE_PREVIEW_GLOBALS, input.globalSlug)) {
    params.set('global', input.globalSlug)
  } else {
    return null
  }
  return `${env.SERVER_URL}/api/preview?${params.toString()}`
}

export const livePreviewConfig: RootLivePreview = {
  collections: [...LIVE_PREVIEW_COLLECTIONS],
  globals: [...LIVE_PREVIEW_GLOBALS],
  breakpoints: LIVE_PREVIEW_BREAKPOINTS.map((breakpoint) => ({ ...breakpoint })),
  url: ({ collectionConfig, data, globalConfig, locale }) =>
    buildLivePreviewUrl({
      collectionSlug: collectionConfig?.slug,
      globalSlug: globalConfig?.slug,
      locale: locale.code,
      slug: (data as { slug?: unknown }).slug,
    }),
}
