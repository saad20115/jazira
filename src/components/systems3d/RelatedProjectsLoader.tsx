import 'server-only'

import type React from 'react'

import type { SupportedLocale } from '@/i18n'
import type { HomePage } from '@/payload-types'

import { getRelatedProjectsBySystem, type RelatedProjectsBySystem } from './relatedProjects'
import { SystemsExplorer, type SystemsExplorerProps } from './SystemsExplorer'

type LoaderProps = Omit<SystemsExplorerProps, 'related'> & {
  data: HomePage['interactiveSystems'] | null | undefined
  locale: SupportedLocale
}

/**
 * Fetches the related projects (all five systems in parallel, cached CMS reads) and renders the
 * explorer with them (C3-1). Rendered inside a Suspense boundary whose fallback is the same explorer
 * without related projects, so a slow or failed read never delays or breaks the section; a failure
 * is logged once on the server, without PII.
 */
export async function RelatedProjectsLoader({
  data,
  ...explorer
}: LoaderProps): Promise<React.JSX.Element> {
  let related: RelatedProjectsBySystem = {}
  try {
    related = await getRelatedProjectsBySystem(explorer.locale, data)
  } catch (err) {
    const reason = err instanceof Error ? err.name : 'unknown'
    console.warn(
      `[systems3d] related projects unavailable (${reason}); rendering without the panel`,
    )
  }
  return <SystemsExplorer {...explorer} related={related} />
}
