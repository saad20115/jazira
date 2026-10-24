import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { env } from '@/env'
import { isArabicEnabled } from '@/lib/cms'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await headers().catch(() => null)
  const baseUrl = env.SERVER_URL.replace(/\/+$/, '')
  const arabicEnabled = await isArabicEnabled().catch(() => false)

  if (!arabicEnabled) {
    return [
      {
        url: `${baseUrl}/en`,
        alternates: {
          languages: {
            en: `${baseUrl}/en`,
            'x-default': `${baseUrl}/en`,
          },
        },
      },
    ]
  }

  const bilingualAlternates = {
    languages: {
      en: `${baseUrl}/en`,
      ar: `${baseUrl}/ar`,
      'x-default': `${baseUrl}/en`,
    },
  }

  return [
    {
      url: `${baseUrl}/en`,
      alternates: bilingualAlternates,
    },
    {
      url: `${baseUrl}/ar`,
      alternates: bilingualAlternates,
    },
  ]
}
