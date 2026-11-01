import 'server-only'

import type { SupportedLocale } from '@/i18n'
import type { HomePage } from '@/payload-types'

import { getRelatedProjectsBySystem, type RelatedProjectsBySystem } from './relatedProjects'

/**
 * Starts the related-projects read (all five systems in parallel, cached CMS reads) and returns its
 * promise without awaiting it (C3-1, CTO 2026-11-01). The section passes the promise to the client
 * explorer, which suspends only the panels on it, so late data never delays the page or remounts the
 * card. The promise never rejects: a failure is logged once on the server, without PII, and resolves
 * to no related projects (the panel is not shown).
 */
export function loadRelatedProjects(
  locale: SupportedLocale,
  data: HomePage['interactiveSystems'] | null | undefined,
): Promise<RelatedProjectsBySystem> {
  return getRelatedProjectsBySystem(locale, data).catch((err: unknown) => {
    const reason = err instanceof Error ? err.name : 'unknown'
    console.warn(
      `[systems3d] related projects unavailable (${reason}); rendering without the panel`,
    )
    return {}
  })
}
