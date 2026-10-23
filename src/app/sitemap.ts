import type { MetadataRoute } from 'next'

import { env } from '@/env'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.SERVER_URL.replace(/\/+$/, '')

  return [
    {
      url: `${baseUrl}/ar`,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar`,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/en`,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar`,
          en: `${baseUrl}/en`,
        },
      },
    },
  ]
}
