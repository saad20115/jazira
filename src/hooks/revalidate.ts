import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  TypeWithID,
} from 'payload'

export const REVALIDATE_LOCALES = ['ar', 'en'] as const
export type RevalidateLocale = (typeof REVALIDATE_LOCALES)[number]

interface MinimalLogger {
  warn?: (obj: unknown, msg?: string) => void
}

function isOutsideNextRuntimeError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false
  }
  const message = err.message.toLowerCase()
  return (
    message.includes('static generation store missing') ||
    message.includes('workunitasyncstorage') ||
    message.includes('invariant:') ||
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

export interface RevalidateCollectionHookOptions {
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
}

function collectLocalizedPaths(
  options: RevalidateCollectionHookOptions,
  docSlugs: readonly string[],
): string[] {
  const paths = new Set<string>()
  const basePaths = options.localizedPaths ?? ['/']

  for (const locale of REVALIDATE_LOCALES) {
    for (const rel of basePaths) {
      const normalizedRel = rel === '/' ? '' : rel.startsWith('/') ? rel : `/${rel}`
      paths.add(`/${locale}${normalizedRel}`)
    }

    if (options.routePrefix) {
      const prefix = options.routePrefix.startsWith('/')
        ? options.routePrefix
        : `/${options.routePrefix}`
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
  return ({ collection, context, doc, previousDoc, req }) => {
    try {
      if ((context as { disableRevalidate?: boolean } | undefined)?.disableRevalidate === true) {
        return doc
      }

      const collectionSlug = options.collectionSlug ?? collection.slug
      const slugs = [extractSlug(doc), extractSlug(previousDoc)].filter(
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

      const collectionSlug = options.collectionSlug ?? collection.slug
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
  globalSlug?: string
  localizedPaths?: readonly string[]
}

export function createRevalidateGlobalAfterChangeHook(
  options: RevalidateGlobalHookOptions = {},
): GlobalAfterChangeHook {
  return ({ context, doc, global, req }): unknown => {
    const safeDoc: unknown = doc
    try {
      if ((context as { disableRevalidate?: boolean } | undefined)?.disableRevalidate === true) {
        return safeDoc
      }

      const globalSlug = options.globalSlug ?? global.slug
      const logger = (req as { payload?: { logger?: MinimalLogger } }).payload?.logger

      for (const tag of buildGlobalTags(globalSlug)) {
        safeRevalidateTag(tag, logger)
      }

      const basePaths = options.localizedPaths ?? ['/']
      for (const locale of REVALIDATE_LOCALES) {
        for (const rel of basePaths) {
          const normalizedRel = rel === '/' ? '' : rel.startsWith('/') ? rel : `/${rel}`
          safeRevalidatePath(`/${locale}${normalizedRel}`, undefined, logger)
        }
      }
    } catch {
      // Never throw into the editor's save
    }

    return safeDoc
  }
}
