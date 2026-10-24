/**
 * Pure cache-tag builders shared between `src/hooks/revalidate.ts` (Payload write hooks)
 * and `src/lib/cms/client.ts` (Next.js `unstable_cache` read wrappers) (`R-20`).
 */

export const REVALIDATE_LOCALES = ['ar', 'en'] as const
export type RevalidateLocale = (typeof REVALIDATE_LOCALES)[number]

export function buildCollectionTags(
  collectionSlug: string,
  docSlugs: readonly (string | null | undefined)[] = [],
): string[] {
  const tags = new Set<string>()
  tags.add(`collection:${collectionSlug}`)
  for (const locale of REVALIDATE_LOCALES) {
    tags.add(`collection:${collectionSlug}:${locale}`)
  }

  for (const rawSlug of docSlugs) {
    if (typeof rawSlug !== 'string') {
      continue
    }
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
