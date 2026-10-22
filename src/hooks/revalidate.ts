import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  GlobalAfterChangeHook,
  GlobalBeforeChangeHook,
  TypeWithID,
} from 'payload'

export const REVALIDATE_LOCALES = ['ar', 'en'] as const
export type RevalidateLocale = (typeof REVALIDATE_LOCALES)[number]

interface MinimalLogger {
  warn?: (obj: unknown, msg?: string) => void
}

/**
 * Matches only the Next.js outside-request-context error ("static generation store missing")
 * thrown when calling `revalidateTag` / `revalidatePath` from CLI scripts, seeds, or tests (R-4).
 */
export function isOutsideNextRuntimeError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false
  }
  const message = err.message.toLowerCase()
  return (
    message.includes('static generation store missing') ||
    message.includes('workunitasyncstorage') ||
    message.includes('requestasyncstorage')
  )
}

export function safeRevalidateTag(tag: string, logger?: MinimalLogger): void {
  try {
    revalidateTag(tag, 'max')
  } catch (err) {
    if (!isOutsideNextRuntimeError(err)) {
      logger?.warn?.({ err, tag }, 'revalidateTag failed; continuing without throwing')
    }
  }
}

export function safeRevalidatePath(
  path: string,
  type?: 'layout' | 'page',
  logger?: MinimalLogger,
): void {
  try {
    revalidatePath(path, type)
  } catch (err) {
    if (!isOutsideNextRuntimeError(err)) {
      logger?.warn?.({ err, path }, 'revalidatePath failed; continuing without throwing')
    }
  }
}

export function buildCollectionTags(
  collectionSlug: string,
  docSlugs: readonly string[] = [],
): string[] {
  const tags = new Set<string>()
  tags.add(`collection:${collectionSlug}`)
  for (const locale of REVALIDATE_LOCALES) {
    tags.add(`collection:${collectionSlug}:${locale}`)
  }

  for (const rawSlug of docSlugs) {
    const slug = rawSlug.trim()
    if (slug.length > 0) {
      tags.add(`doc:${collectionSlug}:${slug}`)
      for (const locale of REVALIDATE_LOCALES) {
        tags.add(`doc:${collectionSlug}:${slug}:${locale}`)
      }
    }
  }

  return Array.from(tags)
}

export function buildGlobalTags(globalSlug: string): string[] {
  const tags = new Set<string>()
  tags.add(`global:${globalSlug}`)
  for (const locale of REVALIDATE_LOCALES) {
    tags.add(`global:${globalSlug}:${locale}`)
  }
  return Array.from(tags)
}

function extractSlug(doc: unknown): string | undefined {
  if (typeof doc === 'object' && doc !== null && 'slug' in doc) {
    const slug = (doc as { slug?: unknown }).slug
    if (typeof slug === 'string' && slug.trim().length > 0) {
      return slug.trim()
    }
  }
  return undefined
}

function extractStatus(doc: unknown): string | undefined {
  if (typeof doc === 'object' && doc !== null && '_status' in doc) {
    const status = (doc as { _status?: unknown })._status
    if (typeof status === 'string') {
      return status
    }
  }
  return undefined
}

function isExplicitDraftOrAutosaveRequest(req: unknown, context: unknown): boolean {
  if (typeof context === 'object' && context !== null) {
    if ((context as { isSavingDraft?: unknown }).isSavingDraft === true) {
      return true
    }
  }
  const query =
    typeof req === 'object' && req !== null && 'query' in req
      ? (req as { query?: Record<string, unknown> }).query
      : undefined
  if (!query || typeof query !== 'object') {
    return false
  }
  const isUnpublishAll = query.unpublishAllLocales === 'true' || query.unpublishAllLocales === true
  if (isUnpublishAll) {
    return false
  }
  return (
    query.draft === 'true' ||
    query.draft === true ||
    query.autosave === 'true' ||
    query.autosave === true
  )
}

interface MinimalDbAdapter {
  findGlobal?: (args: Record<string, unknown>) => Promise<unknown>
  findOne?: (args: Record<string, unknown>) => Promise<unknown>
}

function getDbAdapter(req: unknown): MinimalDbAdapter | undefined {
  if (typeof req !== 'object' || req === null || !('payload' in req)) {
    return undefined
  }
  const payloadObj = (req as { payload?: unknown }).payload
  if (typeof payloadObj !== 'object' || payloadObj === null || !('db' in payloadObj)) {
    return undefined
  }
  const dbObj = (payloadObj as { db?: unknown }).db
  if (typeof dbObj !== 'object' || dbObj === null) {
    return undefined
  }
  return dbObj
}

/**
 * Captures the main-table document row before `updateDocument` writes to the DB, so `afterChange`
 * hooks know the exact prior published state even when intermediate draft versions exist in `_<slug>_v`.
 */
export const captureMainPublishedDocBeforeChange: CollectionBeforeChangeHook = async ({
  collection,
  context,
  data,
  operation,
  originalDoc,
  req,
}) => {
  const safeData = data as Record<string, unknown>
  if (operation !== 'update' || !collection.versions?.drafts) {
    return safeData
  }
  const docId =
    (originalDoc as { id?: unknown } | undefined)?.id ?? (data as { id?: unknown } | undefined)?.id
  const db = getDbAdapter(req)
  if (db?.findOne && docId !== undefined && docId !== null) {
    try {
      const mainDocBefore = await db.findOne({
        collection: collection.slug,
        req,
        where: { id: { equals: docId } },
      })
      ;(context as Record<string, unknown>).__mainDocBeforeChange = mainDocBefore
    } catch {
      // Ignore lookup errors in beforeChange
    }
  }
  return safeData
}

/**
 * Captures the main-table global row before `updateGlobal` writes to the DB.
 */
export const captureMainPublishedGlobalBeforeChange: GlobalBeforeChangeHook = async ({
  context,
  data,
  global,
  req,
}) => {
  const safeData = data as Record<string, unknown>
  if (!global.versions?.drafts) {
    return safeData
  }
  const db = getDbAdapter(req)
  if (db?.findGlobal) {
    try {
      const mainGlobalBefore = await db.findGlobal({
        slug: global.slug,
        req,
      })
      ;(context as Record<string, unknown>).__mainGlobalBeforeChange = mainGlobalBefore
    } catch {
      // Ignore lookup errors in beforeChange
    }
  }
  return safeData
}

/**
 * Determines whether a collection `afterChange` event actually changed the public/published version
 * (publish, update of published, unpublish, or scheduled publish/unpublish).
 * Saving a draft or autosaving on an already-published document leaves the main table row as
 * `_status: 'published'` while `doc._status` is `'draft'`, and must NOT revalidate anything (P2-T4 R-4).
 */
export async function shouldRevalidateCollectionAfterChange({
  collection,
  context,
  doc,
  previousDoc,
  req,
}: {
  collection: { slug: string; versions?: { drafts?: unknown } }
  context?: unknown
  doc: unknown
  previousDoc: unknown
  req?: unknown
}): Promise<boolean> {
  const currentStatus = extractStatus(doc)
  const previousStatus = extractStatus(previousDoc)
  const hasDraftsConfig = Boolean(collection.versions?.drafts)
  const isDraftEnabled =
    hasDraftsConfig || currentStatus !== undefined || previousStatus !== undefined

  if (!isDraftEnabled) {
    return true
  }

  if (currentStatus === 'published') {
    return true
  }

  // `currentStatus` is 'draft'. Check if this was a draft/autosave request rather than an unpublish:
  if (isExplicitDraftOrAutosaveRequest(req, context)) {
    return false
  }

  const db = getDbAdapter(req)
  const docId =
    typeof doc === 'object' && doc !== null && 'id' in doc
      ? (doc as { id?: unknown }).id
      : undefined

  if (db?.findOne && docId !== undefined && docId !== null) {
    try {
      const mainDocNow = await db.findOne({
        collection: collection.slug,
        req,
        where: { id: { equals: docId } },
      })
      const mainStatusNow = extractStatus(mainDocNow)
      // When saving a draft or autosaving on a published document, Payload skips `db.updateOne`
      // on the main table, so `mainStatusNow` remains `'published'` while `doc._status` is `'draft'`.
      if (mainStatusNow === 'published') {
        return false
      }
      const mainDocBefore = (context as { __mainDocBeforeChange?: unknown } | undefined)
        ?.__mainDocBeforeChange
      const mainStatusBefore = extractStatus(mainDocBefore)
      if (mainStatusBefore !== undefined) {
        return mainStatusBefore === 'published'
      }
    } catch {
      // Fall back to previousStatus check below
    }
  }

  return previousStatus === 'published'
}

export async function shouldRevalidateGlobalAfterChange({
  context,
  doc,
  global,
  previousDoc,
  req,
}: {
  context?: unknown
  doc: unknown
  global: { slug: string; versions?: { drafts?: unknown } }
  previousDoc: unknown
  req?: unknown
}): Promise<boolean> {
  const currentStatus = extractStatus(doc)
  const previousStatus = extractStatus(previousDoc)
  const hasDraftsConfig = Boolean(global.versions?.drafts)
  const isDraftEnabled =
    hasDraftsConfig || currentStatus !== undefined || previousStatus !== undefined

  if (!isDraftEnabled) {
    return true
  }

  if (currentStatus === 'published') {
    return true
  }

  if (isExplicitDraftOrAutosaveRequest(req, context)) {
    return false
  }

  const db = getDbAdapter(req)

  if (db?.findGlobal) {
    try {
      const mainGlobalNow = await db.findGlobal({
        slug: global.slug,
        req,
      })
      const mainStatusNow = extractStatus(mainGlobalNow)
      if (mainStatusNow === 'published') {
        return false
      }
      const mainGlobalBefore =
        typeof context === 'object' && context !== null
          ? (context as { __mainGlobalBeforeChange?: unknown }).__mainGlobalBeforeChange
          : undefined
      const mainStatusBefore = extractStatus(mainGlobalBefore)
      if (mainStatusBefore !== undefined) {
        return mainStatusBefore === 'published'
      }
    } catch {
      // Fall back to previousStatus check below
    }
  }

  return previousStatus === 'published'
}

export interface RevalidateCollectionHookOptions {
  collection?: string
  collectionSlug?: string
  /**
   * Optional route prefix under `/{locale}` (e.g. `'/projects'` or `'/services'`).
   * Revalidates `/{locale}{routePrefix}` and `/{locale}{routePrefix}/{slug}`.
   */
  routePrefix?: string
  /**
   * Additional localized paths (without `/{locale}` prefix, e.g. `['/', '/services']`)
   * to revalidate across both `ar` and `en`.
   */
  localizedPaths?: readonly string[]
  /**
   * Explicit paths (either already locale-prefixed like `'/ar/services'` or locale-relative like `'/services'`).
   */
  paths?: readonly string[]
}

function collectLocalizedPaths(
  options: RevalidateCollectionHookOptions,
  docSlugs: readonly string[],
): string[] {
  const paths = new Set<string>()
  const basePaths = options.localizedPaths ?? options.paths ?? ['/']

  for (const rel of basePaths) {
    if (rel === '/ar' || rel === '/en' || rel.startsWith('/ar/') || rel.startsWith('/en/')) {
      paths.add(rel)
    } else {
      const normalizedRel = rel === '/' ? '' : rel.startsWith('/') ? rel : `/${rel}`
      for (const locale of REVALIDATE_LOCALES) {
        paths.add(`/${locale}${normalizedRel}`)
      }
    }
  }

  if (options.routePrefix) {
    const prefix = options.routePrefix.startsWith('/')
      ? options.routePrefix
      : `/${options.routePrefix}`
    for (const locale of REVALIDATE_LOCALES) {
      paths.add(`/${locale}${prefix}`)
      for (const slug of docSlugs) {
        if (slug.trim().length > 0) {
          paths.add(`/${locale}${prefix}/${slug.trim()}`)
        }
      }
    }
  }

  return Array.from(paths)
}

export function createRevalidateAfterChangeHook<T extends TypeWithID = TypeWithID>(
  options: RevalidateCollectionHookOptions = {},
): CollectionAfterChangeHook<T> {
  return async ({ collection, context, doc, previousDoc, req }) => {
    try {
      if ((context as { disableRevalidate?: boolean } | undefined)?.disableRevalidate === true) {
        return doc
      }

      const shouldRevalidate = await shouldRevalidateCollectionAfterChange({
        collection,
        context,
        doc,
        previousDoc,
        req,
      })
      if (!shouldRevalidate) {
        return doc
      }

      const mainDocBefore = (context as { __mainDocBeforeChange?: unknown } | undefined)
        ?.__mainDocBeforeChange

      const collectionSlug = options.collectionSlug ?? options.collection ?? collection.slug
      const slugs = [extractSlug(doc), extractSlug(previousDoc), extractSlug(mainDocBefore)].filter(
        (s): s is string => typeof s === 'string',
      )

      const logger = (req as { payload?: { logger?: MinimalLogger } }).payload?.logger
      for (const tag of buildCollectionTags(collectionSlug, slugs)) {
        safeRevalidateTag(tag, logger)
      }

      for (const path of collectLocalizedPaths(options, slugs)) {
        safeRevalidatePath(path, undefined, logger)
      }
    } catch {
      // Never throw into the editor's save
    }

    return doc
  }
}

export function createRevalidateAfterDeleteHook<T extends TypeWithID = TypeWithID>(
  options: RevalidateCollectionHookOptions = {},
): CollectionAfterDeleteHook<T> {
  return ({ collection, context, doc, req }) => {
    try {
      if ((context as { disableRevalidate?: boolean } | undefined)?.disableRevalidate === true) {
        return doc
      }

      const hasDraftsConfig = Boolean(collection.versions?.drafts)
      const deletedStatus = extractStatus(doc)
      if (hasDraftsConfig && deletedStatus === 'draft') {
        return doc
      }

      const collectionSlug = options.collectionSlug ?? options.collection ?? collection.slug
      const slugs = [extractSlug(doc)].filter((s): s is string => typeof s === 'string')

      const logger = (req as { payload?: { logger?: MinimalLogger } }).payload?.logger
      for (const tag of buildCollectionTags(collectionSlug, slugs)) {
        safeRevalidateTag(tag, logger)
      }

      for (const path of collectLocalizedPaths(options, slugs)) {
        safeRevalidatePath(path, undefined, logger)
      }
    } catch {
      // Never throw into the editor's delete
    }

    return doc
  }
}

export interface RevalidateGlobalHookOptions {
  extraTags?: readonly string[]
  globalSlug?: string
  layoutPaths?: readonly string[]
  localizedPaths?: readonly string[]
}

export function createRevalidateGlobalAfterChangeHook(
  options: RevalidateGlobalHookOptions = {},
): GlobalAfterChangeHook {
  return async ({ context, doc, global, previousDoc, req }): Promise<unknown> => {
    const safeDoc: unknown = doc
    try {
      if ((context as { disableRevalidate?: boolean } | undefined)?.disableRevalidate === true) {
        return safeDoc
      }

      const shouldRevalidate = await shouldRevalidateGlobalAfterChange({
        context,
        doc,
        global,
        previousDoc,
        req,
      })
      if (!shouldRevalidate) {
        return safeDoc
      }

      const globalSlug = options.globalSlug ?? global.slug
      const logger = (req as { payload?: { logger?: MinimalLogger } }).payload?.logger

      for (const tag of buildGlobalTags(globalSlug)) {
        safeRevalidateTag(tag, logger)
      }

      if (options.extraTags) {
        for (const extraTag of options.extraTags) {
          safeRevalidateTag(extraTag, logger)
          for (const locale of REVALIDATE_LOCALES) {
            safeRevalidateTag(`${extraTag}:${locale}`, logger)
          }
        }
      }

      const basePaths = options.localizedPaths ?? ['/']
      for (const locale of REVALIDATE_LOCALES) {
        for (const rel of basePaths) {
          const normalizedRel = rel === '/' ? '' : rel.startsWith('/') ? rel : `/${rel}`
          safeRevalidatePath(`/${locale}${normalizedRel}`, undefined, logger)
        }
      }

      if (options.layoutPaths) {
        for (const locale of REVALIDATE_LOCALES) {
          for (const rel of options.layoutPaths) {
            const normalizedRel = rel === '/' ? '' : rel.startsWith('/') ? rel : `/${rel}`
            safeRevalidatePath(`/${locale}${normalizedRel}`, 'layout', logger)
          }
        }
      }
    } catch {
      // Never throw into the editor's save
    }

    return safeDoc
  }
}
