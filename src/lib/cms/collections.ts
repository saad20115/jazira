import 'server-only'

import type { Where } from 'payload'

import type { SupportedLocale } from '@/i18n'
import type { Brand, Material, Project, Service, Stat, Team } from '@/payload-types'

import {
  buildCollectionTags,
  cmsFind,
  cmsFindAllSmallCollection,
  getFallbackLocale,
  resolvePublicDraftFlag,
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
): Promise<Service[]> {
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

  if (options.limit !== undefined) {
    const result = await cmsFind({
      collection: 'services',
      locale,
      fallbackLocale,
      where,
      sort: 'order',
      limit: options.limit,
      depth: 2,
    })
    return result.docs
  }

  const result = await cmsFindAllSmallCollection({
    collection: 'services',
    locale,
    fallbackLocale,
    where,
    sort: 'order',
    depth: 2,
  })
  return result.docs
}

export async function getServices(
  locale: SupportedLocale,
  options: GetServicesOptions = {},
): Promise<Service[]> {
  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return queryServicesDirect(locale, options)
  }

  const tags = [...buildCollectionTags('services'), `collection:services:${locale}`]
  const keyParts = [
    'cms-services',
    locale,
    options.tier ?? 'all',
    options.featuredOnly ? 'featured' : 'all',
    String(options.limit ?? 'all'),
  ]
  const cachedGetter = withCmsCache(() => queryServicesDirect(locale, options), keyParts, tags)
  return cachedGetter()
}

async function queryServiceBySlugDirect(
  locale: SupportedLocale,
  slug: string,
): Promise<Service | null> {
  const fallbackLocale = getFallbackLocale(locale)
  const result = await cmsFind({
    collection: 'services',
    locale,
    fallbackLocale,
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export async function getServiceBySlug(
  locale: SupportedLocale,
  slug: string,
): Promise<Service | null> {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return null

  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return queryServiceBySlugDirect(locale, normalizedSlug)
  }

  const tags = [
    ...buildCollectionTags('services', [normalizedSlug]),
    `collection:services:${locale}`,
  ]
  const cachedGetter = withCmsCache(
    () => queryServiceBySlugDirect(locale, normalizedSlug),
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
  requireCoverImage?: boolean
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
): Promise<PaginatedProjectsResult> {
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
  if (options.requireCoverImage) {
    clauses.push({ coverImage: { exists: true } })
  }

  const where: Where | undefined =
    clauses.length === 1 ? clauses[0] : clauses.length > 1 ? { and: clauses } : undefined

  const result = await cmsFind({
    collection: 'projects',
    locale,
    fallbackLocale,
    where,
    sort: 'order',
    limit: options.limit ?? 24,
    page: options.page ?? 1,
    depth: 2,
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
  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return queryProjectsDirect(locale, options)
  }

  const tags = [...buildCollectionTags('projects'), `collection:projects:${locale}`]
  const keyParts = [
    'cms-projects',
    locale,
    options.featuredOnly ? 'featured' : 'all',
    options.category ?? 'all',
    options.status ?? 'all',
    options.discipline ?? 'all',
    options.requireCoverImage ? 'with-cover' : 'any-cover',
    String(options.limit ?? 24),
    String(options.page ?? 1),
  ]
  const cachedGetter = withCmsCache(() => queryProjectsDirect(locale, options), keyParts, tags)
  return cachedGetter()
}

async function queryProjectBySlugDirect(
  locale: SupportedLocale,
  slug: string,
): Promise<Project | null> {
  const fallbackLocale = getFallbackLocale(locale)
  const result = await cmsFind({
    collection: 'projects',
    locale,
    fallbackLocale,
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export async function getProjectBySlug(
  locale: SupportedLocale,
  slug: string,
): Promise<Project | null> {
  const normalizedSlug = slug.trim()
  if (!normalizedSlug) return null

  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return queryProjectBySlugDirect(locale, normalizedSlug)
  }

  const tags = [
    ...buildCollectionTags('projects', [normalizedSlug]),
    `collection:projects:${locale}`,
  ]
  const cachedGetter = withCmsCache(
    () => queryProjectBySlugDirect(locale, normalizedSlug),
    ['cms-project-by-slug', locale, normalizedSlug],
    tags,
  )
  return cachedGetter()
}

export interface ProjectCategoryCounts {
  all: number
  mep: number
  'fire-fighting': number
  'low-current': number
  'data-center': number
  'civil-mep': number
}

export interface GetProjectCategoryCountsOptions {
  status?: Project['status']
  discipline?: NonNullable<Project['scope']>[number]
  requireCoverImage?: boolean
}

async function queryProjectCategoryCountsDirect(
  locale: SupportedLocale,
  options: GetProjectCategoryCountsOptions,
): Promise<ProjectCategoryCounts> {
  const fallbackLocale = getFallbackLocale(locale)
  const clauses: Where[] = []
  if (options.status) {
    clauses.push({ status: { equals: options.status } })
  }
  if (options.discipline) {
    clauses.push({ scope: { equals: options.discipline } })
  }
  if (options.requireCoverImage) {
    clauses.push({ coverImage: { exists: true } })
  }
  const where: Where | undefined =
    clauses.length === 1 ? clauses[0] : clauses.length > 1 ? { and: clauses } : undefined

  const result = await cmsFind({
    collection: 'projects',
    locale,
    fallbackLocale,
    where,
    sort: 'order',
    limit: 100,
    page: 1,
    depth: 0,
  })

  const counts: ProjectCategoryCounts = {
    all: result.totalDocs,
    mep: 0,
    'fire-fighting': 0,
    'low-current': 0,
    'data-center': 0,
    'civil-mep': 0,
  }

  for (const doc of result.docs) {
    if (doc.category in counts) {
      counts[doc.category] += 1
    }
  }

  return counts
}

export async function getProjectCategoryCounts(
  locale: SupportedLocale,
  options: GetProjectCategoryCountsOptions = {},
): Promise<ProjectCategoryCounts> {
  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return queryProjectCategoryCountsDirect(locale, options)
  }

  const tags = [...buildCollectionTags('projects'), `collection:projects:${locale}`]
  const keyParts = [
    'cms-project-category-counts',
    locale,
    options.status ?? 'all',
    options.discipline ?? 'all',
    options.requireCoverImage ? 'with-cover' : 'any-cover',
  ]
  const cachedGetter = withCmsCache(
    () => queryProjectCategoryCountsDirect(locale, options),
    keyParts,
    tags,
  )
  return cachedGetter()
}

async function queryRelatedProjectsDirect(
  locale: SupportedLocale,
  category: Project['category'],
  excludeSlug: string,
  limit: number,
): Promise<Project[]> {
  const fallbackLocale = getFallbackLocale(locale)
  const result = await cmsFind({
    collection: 'projects',
    locale,
    fallbackLocale,
    where: {
      and: [
        { category: { equals: category } },
        { slug: { not_equals: excludeSlug } },
        { coverImage: { exists: true } },
      ],
    },
    sort: 'order',
    limit,
    page: 1,
    depth: 2,
  })
  return result.docs
}

export async function getRelatedProjects(
  locale: SupportedLocale,
  category: Project['category'],
  excludeSlug: string,
  limit = 3,
): Promise<Project[]> {
  const normalizedSlug = excludeSlug.trim()
  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return queryRelatedProjectsDirect(locale, category, normalizedSlug, limit)
  }

  const tags = [...buildCollectionTags('projects'), `collection:projects:${locale}`]
  const keyParts = ['cms-related-projects', locale, category, normalizedSlug, String(limit)]
  const cachedGetter = withCmsCache(
    () => queryRelatedProjectsDirect(locale, category, normalizedSlug, limit),
    keyParts,
    tags,
  )
  return cachedGetter()
}

export async function getPublishedProjectSlugs(): Promise<string[]> {
  const fetchDirect = async (): Promise<string[]> => {
    const result = await cmsFind({
      collection: 'projects',
      locale: 'en',
      fallbackLocale: false,
      sort: 'order',
      limit: 100,
      page: 1,
      depth: 0,
    })
    return result.docs
      .map((doc) => (typeof doc.slug === 'string' ? doc.slug.trim() : ''))
      .filter((s) => s.length > 0)
  }

  const tags = buildCollectionTags('projects')
  const cachedGetter = withCmsCache(fetchDirect, ['cms-published-project-slugs'], tags)
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
    const fallbackLocale = getFallbackLocale(locale)
    const where: Where | undefined = options.marqueeOnly
      ? { showInMarquee: { equals: true } }
      : undefined
    const result = await cmsFindAllSmallCollection({
      collection: 'brands',
      locale,
      fallbackLocale,
      where,
      sort: 'order',
      depth: 1,
    })
    return result.docs
  }

  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return fetchDirect()
  }

  const tags = [...buildCollectionTags('brands'), `collection:brands:${locale}`]
  const cachedGetter = withCmsCache(
    fetchDirect,
    ['cms-brands', locale, options.marqueeOnly ? 'marquee' : 'all'],
    tags,
  )
  return cachedGetter()
}

export async function getMaterials(locale: SupportedLocale): Promise<Material[]> {
  const fetchDirect = async (): Promise<Material[]> => {
    const fallbackLocale = getFallbackLocale(locale)
    const result = await cmsFindAllSmallCollection({
      collection: 'materials',
      locale,
      fallbackLocale,
      sort: 'itemNo',
      depth: 2,
    })
    return result.docs
  }

  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return fetchDirect()
  }

  const tags = [
    ...buildCollectionTags('materials'),
    `collection:materials:${locale}`,
    'collection:brands',
  ]
  const cachedGetter = withCmsCache(fetchDirect, ['cms-materials', locale], tags)
  return cachedGetter()
}

export async function getStats(locale: SupportedLocale): Promise<Stat[]> {
  const fetchDirect = async (): Promise<Stat[]> => {
    const fallbackLocale = getFallbackLocale(locale)
    const result = await cmsFindAllSmallCollection({
      collection: 'stats',
      locale,
      fallbackLocale,
      sort: 'order',
      depth: 1,
    })
    return result.docs
  }

  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return fetchDirect()
  }

  const tags = [...buildCollectionTags('stats'), `collection:stats:${locale}`]
  const cachedGetter = withCmsCache(fetchDirect, ['cms-stats', locale], tags)
  return cachedGetter()
}

export interface GetTeamOptions {
  tier?: Team['tier']
  includeInactive?: boolean
}

export async function getTeamMembers(
  locale: SupportedLocale,
  options: GetTeamOptions = {},
): Promise<Team[]> {
  const fetchDirect = async (includeInactive = false): Promise<Team[]> => {
    const fallbackLocale = getFallbackLocale(locale)
    const clauses: Where[] = includeInactive ? [] : [{ active: { equals: true } }]
    if (options.tier) {
      clauses.push({ tier: { equals: options.tier } })
    }
    const where: Where | undefined =
      clauses.length === 1 ? clauses[0] : clauses.length > 1 ? { and: clauses } : undefined
    const result = await cmsFindAllSmallCollection({
      collection: 'team',
      locale,
      fallbackLocale,
      where,
      sort: 'order',
      depth: 1,
    })
    return result.docs
  }

  const isDraft = await resolvePublicDraftFlag()
  if (isDraft) {
    return fetchDirect(Boolean(options.includeInactive))
  }

  const tags = [...buildCollectionTags('team'), `collection:team:${locale}`]
  const cachedGetter = withCmsCache(
    () => fetchDirect(Boolean(options.includeInactive)),
    ['cms-team', locale, options.tier ?? 'all', options.includeInactive ? 'all' : 'active'],
    tags,
  )
  return cachedGetter()
}
