import type { MetadataRoute } from 'next'

import { env } from '@/env'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.SERVER_URL.replace(/\/+$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    // P3-T1 review R-22 (carried into P3-T10): point crawlers at the sitemap.
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
