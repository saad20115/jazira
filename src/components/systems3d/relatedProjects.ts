import 'server-only'

import type { SupportedLocale } from '@/i18n'
import { getProjects } from '@/lib/cms'
import type { HomePage, Project } from '@/payload-types'

import { isSystemId, type SystemId } from './contract'

/**
 * Related projects per system (`handoff/tasks/P3-T5.md` §6): up to 3 published projects whose
 * `scope` contains one of the system's `disciplines`, read through the cached, tagged CMS reader
 * (`getProjects`, published only). Plain data, passed to the client card. Errors propagate; the
 * caller (`loadRelatedProjects`) logs once and resolves to no related projects.
 */

export const RELATED_PROJECTS_LIMIT = 3

export interface RelatedProject {
  id: string
  title: string
  href: string
}

export interface SystemRelatedProjects {
  projects: RelatedProject[]
  /** `/<locale>/projects?scope=<first discipline>`. */
  allHref: string
}

export type RelatedProjectsBySystem = Partial<Record<SystemId, SystemRelatedProjects>>

type Discipline = NonNullable<Project['scope']>[number]
type SystemsData = NonNullable<HomePage['interactiveSystems']>

export async function getRelatedProjectsBySystem(
  locale: SupportedLocale,
  data: SystemsData | null | undefined,
): Promise<RelatedProjectsBySystem> {
  const systems = data?.systems ?? []
  const entries = await Promise.all(
    systems.map(async (system) => {
      const id = system.shot
      const disciplines: Discipline[] = system.disciplines
      if (!isSystemId(id) || disciplines.length === 0) {
        return null
      }
      const results = await Promise.all(
        disciplines.map((discipline) =>
          getProjects(locale, { discipline, limit: RELATED_PROJECTS_LIMIT }),
        ),
      )
      const seen = new Set<string>()
      const projects: RelatedProject[] = []
      for (const doc of results.flatMap((result) => result.docs)) {
        const key = String(doc.id)
        if (seen.has(key) || !doc.slug || projects.length >= RELATED_PROJECTS_LIMIT) {
          continue
        }
        seen.add(key)
        projects.push({ id: key, title: doc.title, href: `/${locale}/projects/${doc.slug}` })
      }
      const value: SystemRelatedProjects = {
        projects,
        allHref: `/${locale}/projects?scope=${encodeURIComponent(disciplines[0] ?? '')}`,
      }
      return [id, value] as const
    }),
  )
  const out: RelatedProjectsBySystem = {}
  for (const entry of entries) {
    if (entry) {
      out[entry[0]] = entry[1]
    }
  }
  return out
}
