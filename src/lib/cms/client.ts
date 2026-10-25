import 'server-only'

import { unstable_cache } from 'next/cache'
import { draftMode, headers } from 'next/headers'
import { getPayload, type Payload, type Where } from 'payload'

import type { Config } from '@/payload-types'
import configPromise from '@payload-config'

export const CMS_CLIENT_SERVER_ONLY_SENTINEL =
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_CMS_CLIENT__'

/** Alias retained for barrel compatibility (`src/lib/cms/index.ts`). */
export const CMS_SERVER_ONLY_SENTINEL = CMS_CLIENT_SERVER_ONLY_SENTINEL

export type SupportedCmsLocale = 'ar' | 'en'
export type CmsCollectionSlug = keyof Config['collections']
export type CmsGlobalSlug = keyof Config['globals']

/**
 * Maximum `limit` allowed on paginated `cmsFind` queries (`R-23`).
 */
export const MAX_CMS_QUERY_LIMIT = 100

/**
 * Fetch limit used by `cmsFindAllSmallCollection` (`MAX_CMS_QUERY_LIMIT + 1 = 101`) so that
 * `pagination: false` can detect when more than `MAX_CMS_QUERY_LIMIT` (`100`) documents exist,
 * log a warning, and slice to the first `100` documents without throwing (`R-15`).
 */
export const SMALL_COLLECTION_FETCH_LIMIT = MAX_CMS_QUERY_LIMIT + 1

/**
 * Default `limit` applied when `limit` is omitted or invalid on `cmsFind` (`R-23`).
 */
export const DEFAULT_CMS_QUERY_LIMIT = 10

import {
  buildCollectionTags,
  buildGlobalTags,
  REVALIDATE_LOCALES as CMS_REVALIDATE_LOCALES,
} from './tags'

export { buildCollectionTags, buildGlobalTags, CMS_REVALIDATE_LOCALES }

/**
 * Small, known collections permitted to use `pagination: false` through the dedicated
 * named helper `cmsFindAllSmallCollection` (`R-23`).
 */
export const SMALL_UNPAGINATED_COLLECTION_SLUGS = [
  'brands',
  'stats',
  'materials',
  'services',
  'team',
] as const

export type SmallUnpaginatedCollectionSlug = (typeof SMALL_UNPAGINATED_COLLECTION_SLUGS)[number]

/**
 * Explicit property whitelist for `cmsFind`, `cmsFindByID`, and `cmsFindGlobal` (`R-11`, `R-23`).
 * - Any property outside this list (such as `user`, `req`, `showHiddenFields`, `overrideAccess`,
 *   `draft`, or `pagination` smuggled via a non-literal options object) is never copied.
 * - `pagination` is intentionally excluded from `SAFE_CMS_QUERY_WHITELIST_KEYS` (`R-23`);
 *   `pagination: false` is only available via `cmsFindAllSmallCollection`.
 */
export const SAFE_CMS_QUERY_WHITELIST_KEYS = [
  'collection',
  'slug',
  'id',
  'locale',
  'fallbackLocale',
  'where',
  'limit',
  'page',
  'sort',
  'depth',
  'select',
] as const

/**
 * Explicit property whitelist for `cmsFindAllSmallCollection` (`R-11`, `R-23`).
 */
export const SAFE_CMS_SMALL_COLLECTION_WHITELIST_KEYS = [
  'collection',
  'locale',
  'fallbackLocale',
  'where',
  'sort',
  'depth',
  'select',
] as const

/**
 * Explicit property whitelist for `cmsCount` (`R-11`).
 */
export const SAFE_CMS_COUNT_WHITELIST_KEYS = ['collection', 'locale', 'where'] as const

/**
 * Options accepted by `cmsFind`.
 *
 * `Z6`, `R-6`, `R-11`, & `R-23`:
 * - `overrideAccess`, `draft`, `user`, `req`, `showHiddenFields`, and `pagination` are omitted
 *   and typed as `never`, and `buildSafeCmsQueryArgs` copies only `SAFE_CMS_QUERY_WHITELIST_KEYS`.
 * - `limit` is capped at `MAX_CMS_QUERY_LIMIT` (`<= 100`).
 * - `cmsFind` unconditionally sets `overrideAccess: false` and resolves `draft` from `draftMode()`.
 */
export interface CmsFindOptions<TSlug extends CmsCollectionSlug> {
  collection: TSlug
  locale?: SupportedCmsLocale
  fallbackLocale?: SupportedCmsLocale | false
  where?: Where
  limit?: number
  page?: number
  sort?: string | string[]
  depth?: number
  select?: Record<string, boolean>
  pagination?: never
  overrideAccess?: never
  draft?: never
  user?: never
  req?: never
  showHiddenFields?: never
}

/**
 * Options accepted by `cmsFindAllSmallCollection` (`R-23`).
 */
export interface CmsFindAllSmallCollectionOptions<TSlug extends SmallUnpaginatedCollectionSlug> {
  collection: TSlug
  locale?: SupportedCmsLocale
  fallbackLocale?: SupportedCmsLocale | false
  where?: Where
  sort?: string | string[]
  depth?: number
  select?: Record<string, boolean>
  limit?: never
  page?: never
  pagination?: never
  overrideAccess?: never
  draft?: never
  user?: never
  req?: never
  showHiddenFields?: never
}

export interface CmsFindByIDOptions<TSlug extends CmsCollectionSlug> {
  collection: TSlug
  id: number | string
  locale?: SupportedCmsLocale
  fallbackLocale?: SupportedCmsLocale | false
  depth?: number
  select?: Record<string, boolean>
  overrideAccess?: never
  draft?: never
  user?: never
  req?: never
  showHiddenFields?: never
}

export interface CmsFindGlobalOptions<TSlug extends CmsGlobalSlug> {
  slug: TSlug
  locale?: SupportedCmsLocale
  fallbackLocale?: SupportedCmsLocale | false
  depth?: number
  select?: Record<string, boolean>
  overrideAccess?: never
  draft?: never
  user?: never
  req?: never
  showHiddenFields?: never
}

export interface CmsCountOptions<TSlug extends CmsCollectionSlug> {
  collection: TSlug
  locale?: SupportedCmsLocale
  where?: Where
  overrideAccess?: never
  user?: never
  req?: never
  showHiddenFields?: never
}

export interface CmsPaginatedDocs<TDoc> {
  docs: TDoc[]
  totalDocs: number
  limit: number
  totalPages: number
  page?: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage?: number | null
  nextPage?: number | null
}

/**
 * Returns `'en'` as fallback for `'ar'`, and `false` (no fallback) for `'en'` (`R-7`).
 * `en` never falls back to `ar`, so empty `en` fields with filled `ar` fields never leak
 * Arabic onto `/en`.
 */
export function getFallbackLocale(locale: SupportedCmsLocale): SupportedCmsLocale | false {
  return locale === 'ar' ? 'en' : false
}

/**
 * Wraps an async CMS fetcher in Next.js `unstable_cache` with the provided cache key and tags.
 * Falls back to direct execution outside the Next.js incremental cache runtime (e.g. unit/integration tests).
 */
export function withCmsCache<TResult>(
  fn: () => Promise<TResult>,
  keyParts: string[],
  tags: string[],
): () => Promise<TResult> {
  const cachedFn = unstable_cache(fn, keyParts, { tags })
  return async () => {
    try {
      return await cachedFn()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('incrementalCache missing') || msg.includes('unstable_cache')) {
        return fn()
      }
      throw error
    }
  }
}

/**
 * Returns the singleton Payload Local API instance for server-side queries.
 */
async function getInternalPayload(): Promise<Payload> {
  if (typeof window !== 'undefined') {
    throw new Error(
      `CMS Local API client must never execute in the browser (${CMS_CLIENT_SERVER_ONLY_SENTINEL}).`,
    )
  }
  return getPayload({ config: configPromise })
}

export interface AuthenticatedStaffPreviewUser {
  id: number | string
  role: 'admin' | 'editor'
  email?: string
  collection: 'users'
}

/**
 * Resolves the authenticated Payload `users` session (`admin` or `editor`) from
 * request headers when verifying `draftMode()`.
 */
export async function resolveAuthenticatedStaffUser(
  reqHeaders: Headers,
): Promise<AuthenticatedStaffPreviewUser | null> {
  try {
    const payload = await getInternalPayload()
    const authResult = await payload.auth({ headers: reqHeaders })
    const user = authResult.user as
      | { id?: number | string; role?: string; email?: string; collection?: string }
      | null
      | undefined
    if (user && user.id !== undefined && (user.role === 'admin' || user.role === 'editor')) {
      return {
        id: user.id,
        role: user.role,
        email: typeof user.email === 'string' ? user.email : undefined,
        collection: 'users',
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Resolves whether Next.js `draftMode()` is active AND backed by an authenticated
 * `admin` or `editor` session (`Z2`, `Z6`, `R-6`), returning both the `draft` flag
 * and the verified staff user for `publishedOrLoggedIn` under `overrideAccess: false`.
 */
export async function resolvePublicDraftContext(): Promise<{
  draft: boolean
  staffUser?: AuthenticatedStaffPreviewUser
}> {
  try {
    const dm = await draftMode()
    if (!dm.isEnabled) {
      return { draft: false }
    }
    const reqHeaders = await headers()
    const staffUser = await resolveAuthenticatedStaffUser(reqHeaders)
    if (!staffUser) {
      return { draft: false }
    }
    return { draft: true, staffUser }
  } catch {
    return { draft: false }
  }
}

/**
 * Resolves whether Next.js `draftMode()` is active AND backed by an authenticated
 * `admin` or `editor` session (`Z2`, `Z6`, `R-6`).
 */
export async function resolvePublicDraftFlag(): Promise<boolean> {
  const ctx = await resolvePublicDraftContext()
  return ctx.draft
}

export function resolveExpectedRequestOrigin(): string {
  const configuredUrl =
    process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  try {
    return new URL(configuredUrl).origin
  } catch {
    return 'http://localhost:3000'
  }
}

export function isSameOriginAdminReferer(
  referer: string,
  _reqHeaders?: { get(name: string): string | null | undefined },
): boolean {
  if (!referer) {
    return false
  }
  try {
    const refUrl = new URL(referer)
    const expectedOrigin = resolveExpectedRequestOrigin()
    return (
      refUrl.origin === expectedOrigin &&
      (refUrl.pathname === '/admin' || refUrl.pathname.startsWith('/admin/'))
    )
  } catch {
    return false
  }
}

/**
 * Returns `true` when the incoming request is an authenticated `admin` or `editor`
 * previewing Arabic via Next.js `draftMode()` (`/api/preview`) or Payload Live Preview
 * (`<iframe>` / `?livePreview=true` / `?preview=true`) (`handoff/tasks/P3-T12.md` §3, `R-6`).
 */
export async function isAuthorizedArabicPreviewRequest(
  reqHeaders: { get(name: string): string | null | undefined },
  isDraftModeEnabled: boolean,
  search = '',
): Promise<boolean> {
  const cookieHeader = reqHeaders.get('cookie') ?? ''
  const hasAuthCookieOrHeader =
    Boolean(reqHeaders.get('authorization')) || cookieHeader.includes('payload-token=')
  if (!hasAuthCookieOrHeader && !isDraftModeEnabled) {
    return false
  }
  const secFetchDest = reqHeaders.get('sec-fetch-dest')
  const referer = reqHeaders.get('referer') ?? ''
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const hasPreviewParam =
    searchParams.get('preview') === 'true' || searchParams.get('livePreview') === 'true'
  const isLivePreviewContext =
    secFetchDest === 'iframe' || isSameOriginAdminReferer(referer, reqHeaders) || hasPreviewParam
  if (!isDraftModeEnabled && !isLivePreviewContext) {
    return false
  }
  const staffUser = await resolveAuthenticatedStaffUser(reqHeaders as Headers)
  return Boolean(staffUser)
}

/**
 * Clamps a requested `limit` to `[1, MAX_CMS_QUERY_LIMIT]` (`1..100`) (`R-23`).
 */
export function clampCmsQueryLimit(
  rawLimit: unknown,
  defaultLimit: number = DEFAULT_CMS_QUERY_LIMIT,
): number {
  if (typeof rawLimit === 'number' && Number.isFinite(rawLimit)) {
    const truncated = Math.trunc(rawLimit)
    if (truncated < 1) {
      return 1
    }
    if (truncated > MAX_CMS_QUERY_LIMIT) {
      return MAX_CMS_QUERY_LIMIT
    }
    return truncated
  }
  return defaultLimit
}

/**
 * Builds Payload query arguments strictly from `SAFE_CMS_QUERY_WHITELIST_KEYS` (`R-11`, `R-23`),
 * clamps `limit` to `<= MAX_CMS_QUERY_LIMIT` (`100`), strips `pagination`, and attaches
 * `draft: draftFromDraftMode` and `overrideAccess: false`.
 */
export function buildSafeCmsQueryArgs(
  rawOptions: Record<string, unknown>,
  draftFromDraftMode: boolean,
): Record<string, unknown> & { draft: boolean; overrideAccess: false } {
  const whitelisted: Record<string, unknown> = {}
  for (const key of SAFE_CMS_QUERY_WHITELIST_KEYS) {
    if (Object.prototype.hasOwnProperty.call(rawOptions, key) && rawOptions[key] !== undefined) {
      whitelisted[key] = rawOptions[key]
    }
  }
  const isCollectionFind =
    Object.prototype.hasOwnProperty.call(whitelisted, 'collection') &&
    !Object.prototype.hasOwnProperty.call(whitelisted, 'id')
  if (isCollectionFind || Object.prototype.hasOwnProperty.call(rawOptions, 'limit')) {
    whitelisted.limit = clampCmsQueryLimit(rawOptions.limit, DEFAULT_CMS_QUERY_LIMIT)
  }
  return {
    ...whitelisted,
    draft: draftFromDraftMode,
    overrideAccess: false,
  }
}

/**
 * Validates and builds unpaginated query arguments (`pagination: false`, `limit: MAX_CMS_QUERY_LIMIT`)
 * strictly for `SMALL_UNPAGINATED_COLLECTION_SLUGS` (`R-23`).
 */
export function buildSafeCmsSmallCollectionArgs(
  rawOptions: Record<string, unknown>,
  draftFromDraftMode: boolean,
): Record<string, unknown> & {
  pagination: false
  limit: number
  draft: boolean
  overrideAccess: false
} {
  const collection = rawOptions.collection
  if (
    typeof collection !== 'string' ||
    !(SMALL_UNPAGINATED_COLLECTION_SLUGS as readonly string[]).includes(collection)
  ) {
    throw new Error(
      `Collection "${String(collection)}" is not an allowed small unpaginated collection (${SMALL_UNPAGINATED_COLLECTION_SLUGS.join(', ')}) (R-23).`,
    )
  }
  const whitelisted: Record<string, unknown> = {}
  for (const key of SAFE_CMS_SMALL_COLLECTION_WHITELIST_KEYS) {
    if (Object.prototype.hasOwnProperty.call(rawOptions, key) && rawOptions[key] !== undefined) {
      whitelisted[key] = rawOptions[key]
    }
  }
  return {
    ...whitelisted,
    limit: SMALL_COLLECTION_FETCH_LIMIT,
    pagination: false,
    draft: draftFromDraftMode,
    overrideAccess: false,
  }
}

/**
 * Builds Payload `count` arguments strictly from `SAFE_CMS_COUNT_WHITELIST_KEYS` (`R-11`)
 * and attaches `overrideAccess: false`.
 */
export function buildSafeCmsCountArgs(
  rawOptions: Record<string, unknown>,
): Record<string, unknown> & { overrideAccess: false } {
  const whitelisted: Record<string, unknown> = {}
  for (const key of SAFE_CMS_COUNT_WHITELIST_KEYS) {
    if (Object.prototype.hasOwnProperty.call(rawOptions, key) && rawOptions[key] !== undefined) {
      whitelisted[key] = rawOptions[key]
    }
  }
  return {
    ...whitelisted,
    overrideAccess: false,
  }
}

/**
 * Single typed `Z6` wrapper around `payload.find` (`R-6`, `R-11`, `R-23`).
 * Copies only `SAFE_CMS_QUERY_WHITELIST_KEYS`, clamps `limit <= 100`, never allows
 * `pagination: false`, sets `overrideAccess: false` unconditionally, and resolves `draft`
 * only from `draftMode()`.
 */
export async function cmsFind<TSlug extends CmsCollectionSlug>(
  options: CmsFindOptions<TSlug>,
): Promise<CmsPaginatedDocs<Config['collections'][TSlug]>> {
  const [payload, { draft, staffUser }] = await Promise.all([
    getInternalPayload(),
    resolvePublicDraftContext(),
  ])
  const safeArgs = buildSafeCmsQueryArgs(options as unknown as Record<string, unknown>, draft)
  const result = await payload.find({
    ...(safeArgs as unknown as Parameters<Payload['find']>[0]),
    ...(draft && staffUser ? { user: staffUser } : {}),
    draft,
    overrideAccess: false,
  })
  return result as unknown as CmsPaginatedDocs<Config['collections'][TSlug]>
}

/**
 * Checks whether a `cmsFindAllSmallCollection` result exceeded `MAX_CMS_QUERY_LIMIT` (`100`)
 * (`R-10`, `R-15`, `R-23`). When more than `100` documents are returned (`SMALL_COLLECTION_FETCH_LIMIT = 101`),
 * logs a warning and returns `true` without throwing so public renders never crash (`R-15`).
 */
export function assertSmallCollectionNotTruncated(
  collection: string,
  docCount: number,
  warnLogger?: (msg: string) => void,
): boolean {
  if (docCount > MAX_CMS_QUERY_LIMIT) {
    const message = `[cmsFindAllSmallCollection] Collection "${collection}" has at least ${String(docCount)} documents, exceeding MAX_CMS_QUERY_LIMIT (${String(MAX_CMS_QUERY_LIMIT)}). Rendering the first ${String(MAX_CMS_QUERY_LIMIT)} documents (R-10, R-15, R-23).`
    if (warnLogger) {
      warnLogger(message)
    } else {
      console.warn(message)
    }
    return true
  }
  return false
}

/**
 * Dedicated named helper for unpaginated (`pagination: false`) fetches of small, known
 * collections (`brands`, `stats`, `materials`, `services`, `team`) (`R-23`, `R-10`, `R-15`).
 * Queries `limit: SMALL_COLLECTION_FETCH_LIMIT` (`101`); when more than `100` docs exist,
 * logs a warning and returns the first `100` docs without throwing (`R-15`).
 */
export async function cmsFindAllSmallCollection<TSlug extends SmallUnpaginatedCollectionSlug>(
  options: CmsFindAllSmallCollectionOptions<TSlug>,
): Promise<CmsPaginatedDocs<Config['collections'][TSlug]>> {
  const [payload, { draft, staffUser }] = await Promise.all([
    getInternalPayload(),
    resolvePublicDraftContext(),
  ])
  const safeArgs = buildSafeCmsSmallCollectionArgs(
    options as unknown as Record<string, unknown>,
    draft,
  )
  const result = await payload.find({
    ...(safeArgs as unknown as Parameters<Payload['find']>[0]),
    ...(draft && staffUser ? { user: staffUser } : {}),
    pagination: false,
    limit: SMALL_COLLECTION_FETCH_LIMIT,
    draft,
    overrideAccess: false,
  })
  const observedCount = Math.max(result.docs.length, result.totalDocs)
  const wasCapped = assertSmallCollectionNotTruncated(options.collection, observedCount, (msg) => {
    payload.logger.warn(msg)
    console.warn(msg)
  })
  if (wasCapped || result.docs.length > MAX_CMS_QUERY_LIMIT) {
    const cappedDocs = result.docs.slice(0, MAX_CMS_QUERY_LIMIT)
    return {
      ...result,
      docs: cappedDocs,
      totalDocs: cappedDocs.length,
    } as unknown as CmsPaginatedDocs<Config['collections'][TSlug]>
  }
  return result as unknown as CmsPaginatedDocs<Config['collections'][TSlug]>
}

/**
 * Single typed `Z6` wrapper around `payload.findByID` (`R-6`, `R-11`).
 * Copies only `SAFE_CMS_QUERY_WHITELIST_KEYS`, sets `overrideAccess: false` unconditionally,
 * and resolves `draft` only from `draftMode()`.
 */
export async function cmsFindByID<TSlug extends CmsCollectionSlug>(
  options: CmsFindByIDOptions<TSlug>,
): Promise<Config['collections'][TSlug] | null> {
  const [payload, { draft, staffUser }] = await Promise.all([
    getInternalPayload(),
    resolvePublicDraftContext(),
  ])
  const safeArgs = buildSafeCmsQueryArgs(options as unknown as Record<string, unknown>, draft)
  try {
    const doc = await payload.findByID({
      ...(safeArgs as unknown as Parameters<Payload['findByID']>[0]),
      ...(draft && staffUser ? { user: staffUser } : {}),
      draft,
      overrideAccess: false,
    })
    return doc as unknown as Config['collections'][TSlug]
  } catch {
    return null
  }
}

/**
 * Single typed `Z6` wrapper around `payload.findGlobal` (`R-6`, `R-11`).
 * Copies only `SAFE_CMS_QUERY_WHITELIST_KEYS`, sets `overrideAccess: false` unconditionally,
 * and resolves `draft` only from `draftMode()`.
 */
export async function cmsFindGlobal<TSlug extends CmsGlobalSlug>(
  options: CmsFindGlobalOptions<TSlug>,
): Promise<Config['globals'][TSlug]> {
  const [payload, { draft, staffUser }] = await Promise.all([
    getInternalPayload(),
    resolvePublicDraftContext(),
  ])
  const safeArgs = buildSafeCmsQueryArgs(options as unknown as Record<string, unknown>, draft)
  const doc = await payload.findGlobal({
    ...(safeArgs as unknown as Parameters<Payload['findGlobal']>[0]),
    ...(draft && staffUser ? { user: staffUser } : {}),
    draft,
    overrideAccess: false,
  })
  return doc as unknown as Config['globals'][TSlug]
}

/**
 * Single typed `Z6` wrapper around `payload.count` (`R-6`, `R-11`).
 * Copies only `SAFE_CMS_COUNT_WHITELIST_KEYS` and sets `overrideAccess: false` unconditionally.
 */
export async function cmsCount<TSlug extends CmsCollectionSlug>(
  options: CmsCountOptions<TSlug>,
): Promise<{ totalDocs: number }> {
  const payload = await getInternalPayload()
  const safeArgs = buildSafeCmsCountArgs(options as unknown as Record<string, unknown>)
  return payload.count({
    ...(safeArgs as unknown as Parameters<Payload['count']>[0]),
    overrideAccess: false,
  })
}
