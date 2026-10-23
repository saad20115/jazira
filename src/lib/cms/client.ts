import 'server-only'

import { draftMode, headers } from 'next/headers'
import { getPayload, type Payload, type Where } from 'payload'

import type { Config } from '@/payload-types'
import configPromise from '@payload-config'

export const CMS_CLIENT_SERVER_ONLY_SENTINEL =
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_CMS_CLIENT__'

export type SupportedCmsLocale = 'ar' | 'en'
export type CmsCollectionSlug = keyof Config['collections']
export type CmsGlobalSlug = keyof Config['globals']

/**
 * Explicit property whitelist for `cmsFind`, `cmsFindByID`, and `cmsFindGlobal` (`R-11`).
 * Any property outside this list (such as `user`, `req`, `showHiddenFields`, `overrideAccess`,
 * or `draft` smuggled via a non-literal options object) is never copied into the Payload call.
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
  'pagination',
  'select',
] as const

/**
 * Explicit property whitelist for `cmsCount` (`R-11`).
 */
export const SAFE_CMS_COUNT_WHITELIST_KEYS = ['collection', 'locale', 'where'] as const

/**
 * Options accepted by `cmsFind`.
 *
 * `Z6`, `R-6`, & `R-11`:
 * - `overrideAccess`, `draft`, `user`, `req`, and `showHiddenFields` are omitted and typed as
 *   `never`, and `buildSafeCmsQueryArgs` copies only `SAFE_CMS_QUERY_WHITELIST_KEYS`.
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
  pagination?: boolean
  select?: Record<string, boolean>
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

/**
 * Resolves the authenticated Payload `users` session (`admin` or `editor`) from
 * request headers when verifying `draftMode()`.
 */
export async function resolveAuthenticatedStaffUser(
  reqHeaders: Headers,
): Promise<{ id: number | string; role: 'admin' | 'editor'; email?: string } | null> {
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
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Resolves whether Next.js `draftMode()` is active AND backed by an authenticated
 * `admin` or `editor` session (`Z2`, `Z6`, `R-6`).
 */
export async function resolvePublicDraftFlag(): Promise<boolean> {
  try {
    const dm = await draftMode()
    if (!dm.isEnabled) {
      return false
    }
    const reqHeaders = await headers()
    const staffUser = await resolveAuthenticatedStaffUser(reqHeaders)
    return staffUser !== null
  } catch {
    return false
  }
}

/**
 * Builds Payload query arguments strictly from `SAFE_CMS_QUERY_WHITELIST_KEYS` (`R-11`)
 * and attaches `draft: draftFromDraftMode` and `overrideAccess: false`.
 * Any non-whitelisted property (`user`, `req`, `showHiddenFields`, `overrideAccess`, `draft`)
 * on a non-literal options object is ignored.
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
  return {
    ...whitelisted,
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
 * Single typed `Z6` wrapper around `payload.find` (`R-6`, `R-11`).
 * Copies only `SAFE_CMS_QUERY_WHITELIST_KEYS`, sets `overrideAccess: false` unconditionally,
 * and resolves `draft` only from `draftMode()`.
 */
export async function cmsFind<TSlug extends CmsCollectionSlug>(
  options: CmsFindOptions<TSlug>,
): Promise<CmsPaginatedDocs<Config['collections'][TSlug]>> {
  const [payload, draft] = await Promise.all([getInternalPayload(), resolvePublicDraftFlag()])
  const safeArgs = buildSafeCmsQueryArgs(options as unknown as Record<string, unknown>, draft)
  const result = await payload.find({
    ...(safeArgs as unknown as Parameters<Payload['find']>[0]),
    draft,
    overrideAccess: false,
  })
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
  const [payload, draft] = await Promise.all([getInternalPayload(), resolvePublicDraftFlag()])
  const safeArgs = buildSafeCmsQueryArgs(options as unknown as Record<string, unknown>, draft)
  try {
    const doc = await payload.findByID({
      ...(safeArgs as unknown as Parameters<Payload['findByID']>[0]),
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
  const [payload, draft] = await Promise.all([getInternalPayload(), resolvePublicDraftFlag()])
  const safeArgs = buildSafeCmsQueryArgs(options as unknown as Record<string, unknown>, draft)
  const doc = await payload.findGlobal({
    ...(safeArgs as unknown as Parameters<Payload['findGlobal']>[0]),
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
