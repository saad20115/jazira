import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/font/google', () => ({
  Poppins: () => ({ variable: '--font-poppins' }),
  Noto_Kufi_Arabic: () => ({ variable: '--font-noto-kufi-arabic' }),
}))

import {
  buildProjectsFilterHref,
  parseProjectsSearchParams,
  PROJECTS_PAGE_SIZE,
} from './app/(frontend)/[locale]/projects/page'
import { resolveSafeVideoEmbedUrl } from './app/(frontend)/[locale]/projects/[slug]/page'
import { Lightbox, type LightboxSlide, ProjectGallery } from './components/Lightbox'

const SAMPLE_SLIDES: readonly LightboxSlide[] = [
  {
    id: 'slide-1',
    src: '/images/seed/projects/sofitel-makkah-hotel.jpg',
    alt: 'Sofitel Makkah Hotel',
    caption: 'Main Mechanical Plant Room',
    width: 1100,
    height: 640,
  },
  {
    id: 'slide-2',
    src: '/images/seed/projects/jabal-omar-development.jpg',
    alt: 'Jabal Omar Development',
    caption: 'Chilled Water Network',
    width: 1100,
    height: 640,
  },
  {
    id: 'slide-3',
    src: '/images/seed/projects/al-rajhi-bank-headquarters.jpg',
    alt: 'Al Rajhi Bank Headquarters',
    caption: null,
    width: 1100,
    height: 640,
  },
]

describe('P3-T8 — Projects list, Project detail, and Lightbox', () => {
  it('validates search params with zod (I1), stripping unknown keys and ignoring invalid values', () => {
    expect(PROJECTS_PAGE_SIZE).toBe(15)

    // Valid filter combinations
    expect(
      parseProjectsSearchParams({
        category: 'mep',
        status: 'completed',
        scope: 'electrical',
        page: '2',
      }),
    ).toEqual({
      category: 'mep',
      status: 'completed',
      scope: 'electrical',
      page: 2,
    })

    // Array values pick first element
    expect(
      parseProjectsSearchParams({
        category: ['fire-fighting', 'mep'],
        page: ['3', '4'],
      }),
    ).toEqual({
      category: 'fire-fighting',
      status: undefined,
      scope: undefined,
      page: 3,
    })

    // Invalid enum values and out-of-range page fall back cleanly without throwing
    expect(
      parseProjectsSearchParams({
        category: 'invalid-category; DROP TABLE projects;',
        status: 'archived',
        scope: 'nuclear',
        page: '-5',
        unexpectedKey: 'malicious',
      }),
    ).toEqual({
      category: undefined,
      status: undefined,
      scope: undefined,
      page: 1,
    })

    expect(parseProjectsSearchParams(null)).toEqual({
      category: undefined,
      status: undefined,
      scope: undefined,
      page: 1,
    })
  })

  it('builds clean filter and pagination URLs for en and ar', () => {
    expect(buildProjectsFilterHref('en', {})).toBe('/en/projects')
    expect(buildProjectsFilterHref('en', { category: 'mep', page: 1 })).toBe(
      '/en/projects?category=mep',
    )
    expect(
      buildProjectsFilterHref('ar', {
        category: 'low-current',
        status: 'in-progress',
        scope: 'hvac',
        page: 2,
      }),
    ).toBe('/ar/projects?category=low-current&status=in-progress&scope=hvac&page=2')
  })

  it('validates and normalizes video embed URLs to youtube-nocookie.com and player.vimeo.com (I4)', () => {
    expect(resolveSafeVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
    expect(resolveSafeVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
    expect(resolveSafeVideoEmbedUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
    expect(resolveSafeVideoEmbedUrl('https://vimeo.com/76979871')).toBe(
      'https://player.vimeo.com/video/76979871',
    )
    expect(resolveSafeVideoEmbedUrl('https://player.vimeo.com/video/76979871')).toBe(
      'https://player.vimeo.com/video/76979871',
    )

    // Rejects non-HTTPS, credentials, custom ports, and non-allowlisted hosts
    expect(resolveSafeVideoEmbedUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(resolveSafeVideoEmbedUrl('javascript:alert(1)')).toBeNull()
    expect(resolveSafeVideoEmbedUrl('https://evil.example.com/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(resolveSafeVideoEmbedUrl('https://www.youtube.com:8443/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(
      resolveSafeVideoEmbedUrl('https://user:pass@www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBeNull()
    expect(resolveSafeVideoEmbedUrl('')).toBeNull()
    expect(resolveSafeVideoEmbedUrl(null)).toBeNull()
  })

  it('renders ProjectGallery thumbnails and Lightbox modal with localized ARIA labels and counter', () => {
    const galleryHtmlEn = renderToStaticMarkup(
      React.createElement(ProjectGallery, {
        slides: SAMPLE_SLIDES,
        locale: 'en',
      }),
    )
    expect(galleryHtmlEn).toContain('data-component="project-gallery"')
    expect(galleryHtmlEn).toContain('data-gallery-item="0"')
    expect(galleryHtmlEn).toContain('data-gallery-item="1"')
    expect(galleryHtmlEn).toContain('data-gallery-item="2"')
    expect(galleryHtmlEn).toContain('aria-label="Open image 1 of 3 in lightbox"')
    expect(galleryHtmlEn).not.toContain('style=')

    const lightboxHtmlEn = renderToStaticMarkup(
      React.createElement(Lightbox, {
        slides: SAMPLE_SLIDES,
        activeIndex: 0,
        locale: 'en',
        onClose: () => {},
        onChangeIndex: () => {},
      }),
    )
    expect(lightboxHtmlEn).toContain('role="dialog"')
    expect(lightboxHtmlEn).toContain('aria-modal="true"')
    expect(lightboxHtmlEn).toContain('data-component="lightbox"')
    expect(lightboxHtmlEn).toContain('1 / 3  ·  Main Mechanical Plant Room')
    expect(lightboxHtmlEn).not.toContain('style=')
    expect(lightboxHtmlEn).toContain('data-lightbox-close')
    expect(lightboxHtmlEn).toContain('data-lightbox-prev')
    expect(lightboxHtmlEn).toContain('data-lightbox-next')

    const lightboxHtmlAr = renderToStaticMarkup(
      React.createElement(Lightbox, {
        slides: SAMPLE_SLIDES,
        activeIndex: 2,
        locale: 'ar',
        onClose: () => {},
        onChangeIndex: () => {},
      }),
    )
    expect(lightboxHtmlAr).toContain('3 / 3')
    expect(lightboxHtmlAr).toContain('aria-label="إغلاق عارض الصور"')

    // Single-slide lightbox omits prev/next buttons
    const singleSlideHtml = renderToStaticMarkup(
      React.createElement(Lightbox, {
        slides: SAMPLE_SLIDES.slice(0, 1),
        activeIndex: 0,
        locale: 'en',
        onClose: () => {},
        onChangeIndex: () => {},
      }),
    )
    expect(singleSlideHtml).not.toContain('data-lightbox-prev')
    expect(singleSlideHtml).not.toContain('data-lightbox-next')
  })
})
