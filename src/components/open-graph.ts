import type { Metadata } from 'next'

import type { ResolvedMediaAsset } from '@/components/media-utils'
import type { SupportedLocale } from '@/i18n'

export interface PageOpenGraphInput {
  title?: string
  description?: string
  siteName?: string
  /** Locale-prefixed path, for example `/en/projects/foo`. Resolved against `metadataBase`. */
  path: string
  locale: SupportedLocale
  image?: ResolvedMediaAsset | null
  type?: 'website' | 'article'
}

/**
 * P3-T10 (H7 / SEO): one Open Graph block for every public page, so each page shares its own
 * title, description, canonical URL and CMS `og`-size image instead of only the site default.
 */
export function buildPageOpenGraph(input: PageOpenGraphInput): NonNullable<Metadata['openGraph']> {
  const { title, description, siteName, path, locale, image, type = 'website' } = input
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(siteName ? { siteName } : {}),
    url: path,
    locale: locale === 'ar' ? 'ar_SA' : 'en_US',
    type,
    ...(image
      ? {
          images: [
            {
              url: image.url,
              ...(image.width ? { width: image.width } : {}),
              ...(image.height ? { height: image.height } : {}),
              alt: image.alt,
            },
          ],
        }
      : {}),
  }
}
