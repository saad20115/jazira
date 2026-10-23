import 'server-only'

import type { Where } from 'payload'

import { buildCollectionTags } from '@/hooks/revalidate'
import type { SupportedLocale } from '@/i18n'
import type { Brand, Material, Project, Service, Stat, Team, User } from '@/payload-types'

import {
  getFallbackLocale,
  getPayloadClient,
  resolveDraftAccess,
  withCmsCache,
} from './client'

export interface GetServicesOptions {
  tier?: Service['tier']
  featuredOnly?: boolean
  limit?: number
}

async function queryServicesDirect(
  locale: SupportedLocale,
  options: GetServicesOptions,
  draftCtx: { draft: boolean; user?: User },
): Promise<Service[]> {
  const payload = await getPayloadClient()
  const fallbackLocale = getFallbackLocale(locale)
  const clauses: Where[] = []

  if (options.tier) {
    clauses.push({ tier: { equals: options.tier } })
  }
  if (options.featuredOnly) {
    clauses.push({ featured: { equals: true } })
  }

  const where: Where | undefined =
    clauses.length === 1 ? clauses[0] : clauses.length > 1 ? { and: clauses } : undefined

  const result = await payload.find({
    collection: 'services',
    locale,
    fallbackLocale,
    where,
    sort: 'order',
    limit: options.limit ?? 100,
    depth: 2,
    draft: draftCtx.draft,
    user: draftCtx.user,
    overrideAccess: false,
  })
  return result.docs
}

export async function getServices(
  locale: SupportedLocale,
  options: GetServicesOptions = {},
): Promise<Service[]> {
  const { draft, user } = await resolveDraftAccess()
  if (draft && user) {
    return queryServicesDirect(locale, options, { draft: true, user })
  }

  const tags = [
    ...buildCollectionTags({ collection: 'services' }),
    `collection:services:${locale}`,
  ]
  const keyParts = [
    'cms-services',
    locale,
    options.tier ?? 'all',
    options.featuredOnly ? 'featured' : 'all',
    String(options.limit ?? 100),
  ]
  const cachedGetter = withCmsCache(
    async () => queryServicesDirect(locale, options, { draft: false }),
    keyParts,
    tags,
  )
  return cachedGetter()
}

async function queryServiceBySlugDirect(
  locale: SupportedLocale,
  slug: string,
  draftCtx: { draft: boolean; user?: User },
): Promise<Service | null> {
  const payload = await getPayloadClient()
  const fallbackLocale = getFallbackLocale(locale)
  const result = await payload.find({
    collection: 'services',
    locale,
    fallbackLocale,
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 2,
    draft: draftCtx.draft,
    user: draftCtx.user,
    overrideAccess: false,
  })
  return result.docs[0] ?? null
}

export async function getServiceBySlug(
  locale: SupportedLocale,
  slug: string,
): Promise<Service | null> {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return null

  const { draft, user } = await resolveDraftAccess()
  if (draft && user) {
    return queryServiceBySlugDirect(locale, normalizedSlug, { draft: true, user })
  }

  const tags = [
    ...buildCollectionTags({ collection: 'services', slug: normalizedSlug }),
    `collection:services:${locale}`,
  ]
  const cachedGetter = withCmsCache(
    async () => queryServiceBySlugDirect(locale, normalizedSlug, { draft: false }),
    ['cms-service-by-slug', locale, normalizedSlug],
    tags,
  )
  return cachedGetter()
}

export interface GetProjectsOptions {
  featuredOnly?: boolean
  category?: Project['category']
  status?: Project['status']
  discipline?: NonNullable<Project['scope']>[number]
  limit?: number
  page?: number
}

export interface PaginatedProjectsResult {
  docs: Project[]
  totalDocs: number
  totalPages: number
  page: number
}

async function queryProjectsDirect(
  locale: SupportedLocale,
  options: GetProjectsOptions,
  draftCtx: { draft: boolean; user?: User },
): Promise<PaginatedProjectsResult> {
  const payload = await getPayloadClient()
  const fallbackLocale = getFallbackLocale(locale)
  const clauses: Where[] = []

  if (options.featuredOnly) {
    clauses.push({ featured: { equals: true } })
  }
  if (options.category) {
    clauses.push({ category: { equals: options.category } })
  }
  if (options.status) {
    clauses.push({ status: { equals: options.status } })
  }
  if (options.discipline) {
    clauses.push({ scope: { equals: options.discipline } })
  }

  const where: Where | undefined =
    clauses.length === 1 ? clauses[0] : clauses.length > 1 ? { and: clauses } : undefined

  const result = await payload.find({
    collection: 'projects',
    locale,
    fallbackLocale,
    where,
    sort: 'order',
    limit: options.limit ?? 24,
    page: options.page ?? 1,
    depth: 2,
    draft: draftCtx.draft,
    user: draftCtx.user,
    overrideAccess: false,
  })

  return {
    docs: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page ?? 1,
  }
}

export async function getProjects(
  locale: SupportedLocale,
  options: GetProjectsOptions = {},
): Promise<PaginatedProjectsResult> {
  const { draft, user } = await resolveDraftAccess()
  if (draft && user) {
    return queryProjectsDirect(locale, options, { draft: true, user })
  }

  const tags = [
    ...buildCollectionTags({ collection: 'projects' }),
    `collection:projects:${locale}`,
  ]
  const keyParts = [
    'cms-projects',
    locale,
    options.featuredOnly ? 'featured' : 'all',
    options.category ?? 'all',
    options.status ?? 'all',
    options.discipline ?? 'all',
    String(options.limit ?? 24),
    String(options.page ?? 1),
  ]
  const cachedGetter = withCmsCache(
    async () => queryProjectsDirect(locale, options, { draft: false }),
    keyParts,
    tags,
  )
  return cachedGetter()
}

async function queryProjectBySlugDirect(
  locale: SupportedLocale,
  slug: string,
  draftCtx: { draft: boolean; user?: User },
): Promise<Project | null> {
  const payload = await getPayloadClient()
  const fallbackLocale = getFallbackLocale(locale)
  const result = await payload.find({
    collection: 'projects',
    locale,
    fallbackLocale,
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 2,
    draft: draftCtx.draft,
    user: draftCtx.user,
    overrideAccess: false,
  })
  return result.docs[0] ?? null
}

export async function getProjectBySlug(
  locale: SupportedLocale,
  slug: string,
): Promise<Project | null> {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return null

  const { draft, user } = await resolveDraftAccess()
  if (draft && user) {
    return queryProjectBySlugDirect(locale, normalizedSlug, { draft: true, user })
  }

  const tags = [
    ...buildCollectionTags({ collection: 'projects', slug: normalizedSlug }),
    `collection:projects:${locale}`,
  ]
  const cachedGetter = withCmsCache(
    async () => queryProjectBySlugDirect(locale, normalizedSlug, { draft: false }),
    ['cms-project-by-slug', locale, normalizedSlug],
    tags,
  )
  return cachedGetter()
}

export interface GetBrandsOptions {
  marqueeOnly?: boolean
}

export async function getBrands(
  locale: SupportedLocale,
  options: GetBrandsOptions = {},
): Promise<Brand[]> {
  const fetchDirect = async (): Promise<Brand[]> => {
    const payload = await getPayloadClient()
    const fallbackLocale = getFallbackLocale(locale)
    const where: Where | undefined = options.marqueeOnly
      ? { showInMarquee: { equals: true } }
      : undefined
    const result = await payload.find({
      collection: 'brands',
      locale,
      fallbackLocale,
      where,
      sort: 'order',
      limit: 200,
      depth: 1,
      overrideAccess: false,
    })
    return result.docs
  }

  const { draft } = await resolveDraftAccess()
  if (draft) {
    return fetchDirect()
  }

  const tags = [...buildCollectionTags({ collection: 'brands' }), `collection:brands:${locale}`]
  const cachedGetter = withCmsCache(
    fetchDirect,
    ['cms-brands', locale, options.marqueeOnly ? 'marquee' : 'all'],
    tags,
  )
  return cachedGetter()
}

export async function getMaterials(locale: SupportedLocale): Promise<Material[]> {
  const fetchDirect = async (): Promise<Material[]> => {
    const payload = await getPayloadClient()
    const fallbackLocale = getFallbackLocale(locale)
    const result = await payload.find({
      collection: 'materials',
      locale,
      fallbackLocale,
      sort: 'order',
      limit: 200,
      depth: 2,
      overrideAccess: false,
    })
    return result.docs
  }

  const { draft } = await resolveDraftAccess()
  if (draft) {
    return fetchDirect()
  }

  const tags = [
    ...buildCollectionTags({ collection: 'materials' }),
    `collection:materials:${locale}`,
    'collection:brands',
  ]
  const cachedGetter = withCmsCache(fetchDirect, ['cms-materials', locale], tags)
  return cachedGetter()
}

export async function getStats(locale: SupportedLocale): Promise<Stat[]> {
  const fetchDirect = async (): Promise<Stat[]> => {
    const payload = await getPayloadClient()
    const fallbackLocale = getFallbackLocale(locale)
    const result = await payload.find({
      collection: 'stats',
      locale,
      fallbackLocale,
      sort: 'order',
      limit: 50,
      depth: 1,
      overrideAccess: false,
    })
    return result.docs
  }

  const { draft } = await resolveDraftAccess()
  if (draft) {
    return fetchDirect()
  }

  const tags = [...buildCollectionTags({ collection: 'stats' }), `collection:stats:${locale}`]
  const cachedGetter = withCmsCache(fetchDirect, ['cms-stats', locale], tags)
  return cachedGetter()
}

export interface GetTeamOptions {
  tier?: Team['tier']
}

export async function getTeamMembers(
  locale: SupportedLocale,
  options: GetTeamOptions = {},
): Promise<Team[]> {
  const fetchDirect = async (): Promise<Team[]> => {
    const payload = await getPayloadClient()
    const fallbackLocale = getFallbackLocale(locale)
    const clauses: Where[] = [{ active: { equals: true } }]
    if (options.tier) {
      clauses.push({ tier: { equals: options.tier } })
    }
    const where: Where = clauses.length === 1 ? clauses[0] : { and: clauses }
    const result = await payload.find({
      collection: 'team',
      locale,
      fallbackLocale,
      where,
      sort: 'order',
      limit: 200,
      depth: 1,
      overrideAccess: false,
    })
    return result.docs
  }

  const { draft } = await resolveDraftAccess()
  if (draft) {
    return fetchDirect()
  }

  const tags = [...buildCollectionTags({ collection: 'team' }), `collection:team:${locale}`]
  const cachedGetter = withCmsCache(
    fetchDirect,
    ['cms-team', locale, options.tier ?? 'all'],
    tags,
  )
  return cachedGetter()
}
