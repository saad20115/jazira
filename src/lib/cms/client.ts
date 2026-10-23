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
 * Options accepted by `cmsFind`.
 *
 * `Z6` & `R-6` (CTO decision):
 * - `overrideAccess` is omitted and typed as `never` so callers cannot pass it;
 *   `cmsFind` unconditionally sets `overrideAccess: false` itself.
 * - `draft` is omitted and typed as `never`; `cmsFind` resolves `draft` exclusively
 *   from Next.js `draftMode()` (verified against an authenticated `admin`/`editor` session).
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
}

export interface CmsFindGlobalOptions<TSlug extends CmsGlobalSlug> {
  slug: TSlug
  locale?: SupportedCmsLocale
  fallbackLocale?: SupportedCmsLocale | false
  depth?: number
  select?: Record<string, boolean>
  overrideAccess?: never
  draft?: never
}

export interface CmsCountOptions<TSlug extends CmsCollectionSlug> {
  collection: TSlug
  locale?: SupportedCmsLocale
  where?: Where
  overrideAccess?: never
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
 * request headers when verifying Live Preview / `draftMode()`.
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
 *
 * Returns `false` whenever called outside a request context, when `draftMode()` is off,
 * or when the request does not carry an authenticated staff session.
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
 * Strip any runtime `overrideAccess` or `draft` keys even if a caller bypassed TypeScript
 * via `as unknown as ...`, and attach `overrideAccess: false` + `draft` from `draftMode()`.
 */
export function buildSafeCmsQueryArgs<T extends Record<string, unknown>>(
  rawOptions: T,
  draftFromDraftMode: boolean,
): Omit<T, 'overrideAccess' | 'draft'> & { draft: boolean; overrideAccess: false } {
  const rest = { ...rawOptions }
  delete rest.overrideAccess
  delete rest.draft
  return {
    ...rest,
    draft: draftFromDraftMode,
    overrideAccess: false,
  }
}

/**
 * Single typed `Z6` wrapper around `payload.find` (`R-6`).
 * Sets `overrideAccess: false` unconditionally and resolves `draft` only from `draftMode()`.
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
 * Single typed `Z6` wrapper around `payload.findByID` (`R-6`).
 * Sets `overrideAccess: false` unconditionally and resolves `draft` only from `draftMode()`.
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
 * Single typed `Z6` wrapper around `payload.findGlobal` (`R-6`).
 * Sets `overrideAccess: false` unconditionally and resolves `draft` only from `draftMode()`.
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
 * Single typed `Z6` wrapper around `payload.count` (`R-6`).
 * Sets `overrideAccess: false` unconditionally.
 */
export async function cmsCount<TSlug extends CmsCollectionSlug>(
  options: CmsCountOptions<TSlug>,
): Promise<{ totalDocs: number }> {
  const payload = await getInternalPayload()
  const rest = { ...(options as unknown as Record<string, unknown>) }
  delete rest.overrideAccess
  return payload.count({
    ...(rest as unknown as Parameters<Payload['count']>[0]),
    overrideAccess: false,
  })
}
