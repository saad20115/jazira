import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { env } from '@/env'
import { buildHreflangAlternates } from '@/i18n'
import { getPrivacyPage, getPublishedProjectSlugs, getServices, isArabicEnabled } from '@/lib/cms'

/** Public pages that always exist (P3-T10 §1). Order: home first. */
export const SITEMAP_STATIC_SUBPATHS = ['', '/services', '/about', '/projects', '/contact'] as const

async function safeList<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load()
  } catch {
    return []
  }
}

/** True when a Lexical node tree holds any non-blank text or an upload. */
function lexicalHasContent(node: unknown): boolean {
  if (!node || typeof node !== 'object') {
    return false
  }
  const record = node as { type?: unknown; text?: unknown; value?: unknown; children?: unknown }
  if (typeof record.text === 'string' && record.text.trim().length > 0) {
    return true
  }
  if (record.type === 'upload' && record.value && typeof record.value === 'object') {
    return true
  }
  return Array.isArray(record.children) && record.children.some(lexicalHasContent)
}

async function hasPublishedPrivacyBody(): Promise<boolean> {
  try {
    const privacyPage = await getPrivacyPage('en')
    const root = (privacyPage.body as { root?: unknown } | null | undefined)?.root
    return privacyPage.enabled !== false && lexicalHasContent(root)
  } catch {
    return false
  }
}

/**
 * P3-T10 §1 + H7: every published public page, in English and, only while the admin has Arabic
 * switched on, in Arabic. Each entry carries its `hreflang` alternates with `x-default` → English.
 * Drafts never appear: the CMS reads here are the public, published-only reads. The privacy page
 * is listed only once it has a body (it stays a draft until the client supplies the text).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await headers().catch(() => null)
  const baseUrl = env.SERVER_URL.replace(/\/+$/, '')
  const arabicEnabled = await isArabicEnabled().catch(() => false)

  const [serviceSlugs, projectSlugs, includePrivacy] = await Promise.all([
    safeList(async () =>
      (await getServices('en'))
        .map((service) => (typeof service.slug === 'string' ? service.slug.trim() : ''))
        .filter((slug) => slug.length > 0),
    ),
    safeList(() => getPublishedProjectSlugs()),
    hasPublishedPrivacyBody(),
  ])

  const subpaths: string[] = [
    ...SITEMAP_STATIC_SUBPATHS,
    ...(includePrivacy ? ['/privacy'] : []),
    ...serviceSlugs.map((slug) => `/services/${encodeURIComponent(slug)}`),
    ...projectSlugs.map((slug) => `/projects/${encodeURIComponent(slug)}`),
  ]

  const entries: MetadataRoute.Sitemap = []
  for (const subpath of subpaths) {
    const languages = Object.fromEntries(
      Object.entries(buildHreflangAlternates(subpath || '/', arabicEnabled)).map(
        ([language, path]) => [language, `${baseUrl}${path}`],
      ),
    )
    entries.push({ url: `${baseUrl}/en${subpath}`, alternates: { languages } })
    if (arabicEnabled) {
      entries.push({ url: `${baseUrl}/ar${subpath}`, alternates: { languages } })
    }
  }
  return entries
}
