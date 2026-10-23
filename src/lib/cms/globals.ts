import 'server-only'

import { buildGlobalTags } from '@/hooks/revalidate'
import type { SupportedLocale } from '@/i18n'
import type {
  AboutPage,
  Config,
  ContactPage,
  HomePage,
  Navigation,
  PrivacyPage,
  ProjectsPage,
  ServicesPage,
  SiteSetting,
} from '@/payload-types'

import {
  getFallbackLocale,
  getPayloadClient,
  resolveDraftAccess,
  withCmsCache,
} from './client'

type GlobalSlug = keyof Config['globals']

async function fetchGlobalDirect<TSlug extends GlobalSlug>(
  slug: TSlug,
  locale: SupportedLocale,
  options: { depth?: number; draft?: boolean; user?: Config['collections']['users'] } = {},
): Promise<Config['globals'][TSlug]> {
  const payload = await getPayloadClient()
  const fallbackLocale = getFallbackLocale(locale)
  const doc = await payload.findGlobal({
    slug,
    locale,
    fallbackLocale,
    depth: options.depth ?? 2,
    draft: Boolean(options.draft),
    user: options.user,
    overrideAccess: false,
  })
  return doc
}

async function getCachedOrDraftGlobal<TSlug extends GlobalSlug>(
  slug: TSlug,
  locale: SupportedLocale,
  extraTags: string[] = [],
  depth = 2,
): Promise<Config['globals'][TSlug]> {
  const { draft, user } = await resolveDraftAccess()
  if (draft && user) {
    return fetchGlobalDirect(slug, locale, { depth, draft: true, user })
  }

  const tags = Array.from(
    new Set([...buildGlobalTags(slug), `global:${slug}:${locale}`, ...extraTags]),
  )
  const cachedGetter = withCmsCache(
    async () => fetchGlobalDirect(slug, locale, { depth, draft: false }),
    ['cms-global', slug, locale, `depth-${String(depth)}`],
    tags,
  )
  return cachedGetter()
}

export async function getSiteSettings(locale: SupportedLocale): Promise<SiteSetting> {
  return getCachedOrDraftGlobal('site-settings', locale, [], 2)
}

export async function getNavigation(locale: SupportedLocale): Promise<Navigation> {
  return getCachedOrDraftGlobal('navigation', locale, [], 2)
}

export async function getHomePage(locale: SupportedLocale): Promise<HomePage> {
  return getCachedOrDraftGlobal(
    'home-page',
    locale,
    ['collection:services', 'collection:projects', 'collection:stats', 'collection:brands'],
    2,
  )
}

export async function getServicesPage(locale: SupportedLocale): Promise<ServicesPage> {
  return getCachedOrDraftGlobal(
    'services-page',
    locale,
    ['collection:services', 'collection:materials', 'collection:brands'],
    2,
  )
}

export async function getAboutPage(locale: SupportedLocale): Promise<AboutPage> {
  return getCachedOrDraftGlobal('about-page', locale, ['collection:team'], 2)
}

export async function getProjectsPage(locale: SupportedLocale): Promise<ProjectsPage> {
  return getCachedOrDraftGlobal(
    'projects-page',
    locale,
    ['collection:projects', 'collection:stats'],
    2,
  )
}

export async function getContactPage(locale: SupportedLocale): Promise<ContactPage> {
  return getCachedOrDraftGlobal('contact-page', locale, ['collection:services'], 2)
}

export async function getPrivacyPage(locale: SupportedLocale): Promise<PrivacyPage> {
  return getCachedOrDraftGlobal('privacy-page', locale, [], 2)
}
