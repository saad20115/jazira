import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { previewQuerySchema, resolvePreviewTargetPath, verifyPreviewSecret } from '../lib/preview'
import {
  buildLivePreviewUrl,
  LIVE_PREVIEW_BREAKPOINTS,
  LIVE_PREVIEW_COLLECTIONS,
  LIVE_PREVIEW_GLOBALS,
  livePreviewConfig,
} from './livePreview'

function parse(url: string | null): ReturnType<typeof previewQuerySchema.parse> {
  expect(url).not.toBeNull()
  const parsed = new URL(url as string)
  expect(parsed.pathname).toBe('/api/preview')
  return previewQuerySchema.parse(Object.fromEntries(parsed.searchParams.entries()))
}

describe('P2-T7 §3 Live Preview URL', () => {
  it('builds a URL the /api/preview route accepts, for a project in each locale', () => {
    for (const locale of ['en', 'ar'] as const) {
      const query = parse(
        buildLivePreviewUrl({ collectionSlug: 'projects', locale, slug: 'sofitel-makkah' }),
      )
      expect(verifyPreviewSecret(query.secret)).toBe(true)
      expect(query.locale).toBe(locale)
      expect(resolvePreviewTargetPath(query)).toBe(`/${locale}/projects/sofitel-makkah`)
    }
  })

  it('builds a URL for a service and for every page global', () => {
    const service = parse(
      buildLivePreviewUrl({ collectionSlug: 'services', locale: 'en', slug: 'mep-works' }),
    )
    expect(resolvePreviewTargetPath(service)).toBe('/en/services/mep-works')

    const expected: Record<(typeof LIVE_PREVIEW_GLOBALS)[number], string> = {
      'home-page': '/ar',
      'services-page': '/ar/services',
      'about-page': '/ar/about',
      'projects-page': '/ar/projects',
      'contact-page': '/ar/contact',
      'privacy-page': '/ar/privacy',
    }
    for (const globalSlug of LIVE_PREVIEW_GLOBALS) {
      const query = parse(buildLivePreviewUrl({ globalSlug, locale: 'ar' }))
      expect(resolvePreviewTargetPath(query)).toBe(expected[globalSlug])
    }
  })

  it('gives no preview without a usable slug, or for anything without a public page', () => {
    expect(buildLivePreviewUrl({ collectionSlug: 'projects', locale: 'en' })).toBeNull()
    expect(buildLivePreviewUrl({ collectionSlug: 'projects', locale: 'en', slug: '' })).toBeNull()
    expect(
      buildLivePreviewUrl({ collectionSlug: 'projects', locale: 'en', slug: '../admin' }),
    ).toBeNull()
    expect(buildLivePreviewUrl({ collectionSlug: 'projects', locale: 'en', slug: 42 })).toBeNull()
    expect(buildLivePreviewUrl({ collectionSlug: 'users', locale: 'en', slug: 'x' })).toBeNull()
    expect(buildLivePreviewUrl({ globalSlug: 'site-settings', locale: 'en' })).toBeNull()
    expect(buildLivePreviewUrl({ locale: 'en' })).toBeNull()
  })

  it('falls back to English for an unknown locale code', () => {
    const query = parse(buildLivePreviewUrl({ globalSlug: 'home-page', locale: 'fr' }))
    expect(query.locale).toBe('en')
  })

  it('offers the three design widths and covers projects, services and the six pages', () => {
    expect(LIVE_PREVIEW_BREAKPOINTS.map((b) => b.width)).toEqual([1440, 768, 390])
    expect(livePreviewConfig.collections).toEqual([...LIVE_PREVIEW_COLLECTIONS])
    expect(livePreviewConfig.globals).toEqual([...LIVE_PREVIEW_GLOBALS])
    expect(LIVE_PREVIEW_COLLECTIONS).toEqual(['projects', 'services'])
    expect(LIVE_PREVIEW_GLOBALS).toHaveLength(6)
  })
})
