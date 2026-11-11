import 'server-only'

import type { CollectionSlug, GlobalSlug, PayloadRequest } from 'payload'

/**
 * P2-T7 §4 — the numbers and lists of the dashboard home. Every read goes through the Local API
 * with `overrideAccess: false` and the viewer as `user`, so a member of staff only ever sees what
 * their role may read. A read the viewer may not make yields `null` (the card is not shown).
 */

export const QUOTE_WINDOW_DAYS = 7
export const RECENT_ITEMS_LIMIT = 5

const DRAFT_COLLECTIONS = ['projects', 'services'] as const satisfies readonly CollectionSlug[]

const PAGE_GLOBALS = [
  'home-page',
  'services-page',
  'about-page',
  'projects-page',
  'contact-page',
  'privacy-page',
] as const satisfies readonly GlobalSlug[]

/** Collections listed under "last edited", with the field that names a document. */
const RECENT_COLLECTIONS = [
  { slug: 'projects', titleField: 'title' },
  { slug: 'services', titleField: 'title' },
  { slug: 'team', titleField: 'name' },
  { slug: 'brands', titleField: 'name' },
  { slug: 'materials', titleField: 'description' },
  { slug: 'stats', titleField: 'label' },
  { slug: 'videos', titleField: 'title' },
] as const satisfies readonly { slug: CollectionSlug; titleField: string }[]

export interface QuoteSummary {
  new: number
  contacted: number
  quoted: number
  failedEmail: number
}

export interface DraftSummary {
  collections: { slug: (typeof DRAFT_COLLECTIONS)[number]; count: number }[]
  globals: (typeof PAGE_GLOBALS)[number][]
}

export interface RecentItem {
  collection: (typeof RECENT_COLLECTIONS)[number]['slug']
  id: number | string
  title: string
  updatedAt: string
}

export interface DashboardData {
  quotes: QuoteSummary | null
  drafts: DraftSummary | null
  scheduledPublishes: number | null
  recent: RecentItem[]
}

/** A denied or failed read hides its card; it never breaks the dashboard. */
async function orNull<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read()
  } catch {
    return null
  }
}

export function quoteWindowStart(now: Date): string {
  return new Date(now.getTime() - QUOTE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

/** Newest first, capped. Exported for the unit test. */
export function pickMostRecent(items: readonly RecentItem[], limit: number): RecentItem[] {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit)
}

function readTitle(doc: unknown, field: string): string {
  if (typeof doc !== 'object' || doc === null) {
    return ''
  }
  const value = (doc as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : ''
}

async function readQuotes(req: PayloadRequest, now: Date): Promise<QuoteSummary> {
  const since = quoteWindowStart(now)
  const countStatus = async (status: 'new' | 'contacted' | 'quoted'): Promise<number> => {
    const { totalDocs } = await req.payload.count({
      collection: 'quote-requests',
      overrideAccess: false,
      req,
      user: req.user,
      where: {
        and: [{ status: { equals: status } }, { createdAt: { greater_than_equal: since } }],
      },
    })
    return totalDocs
  }
  const [fresh, contacted, quoted, failed] = await Promise.all([
    countStatus('new'),
    countStatus('contacted'),
    countStatus('quoted'),
    req.payload.count({
      collection: 'quote-requests',
      overrideAccess: false,
      req,
      user: req.user,
      where: { emailStatus: { equals: 'failed' } },
    }),
  ])
  return { new: fresh, contacted, quoted, failedEmail: failed.totalDocs }
}

async function readDrafts(req: PayloadRequest): Promise<DraftSummary> {
  const collections = await Promise.all(
    DRAFT_COLLECTIONS.map(async (slug) => {
      const { totalDocs } = await req.payload.count({
        collection: slug,
        overrideAccess: false,
        req,
        user: req.user,
        where: { _status: { equals: 'draft' } },
      })
      return { slug, count: totalDocs }
    }),
  )
  const globalStates = await Promise.all(
    PAGE_GLOBALS.map(async (slug) => {
      const doc = await req.payload.findGlobal({
        slug,
        depth: 0,
        draft: true,
        overrideAccess: false,
        req,
        user: req.user,
      })
      return { slug, draft: (doc as { _status?: string | null })._status === 'draft' }
    }),
  )
  return {
    collections,
    globals: globalStates.filter((state) => state.draft).map((state) => state.slug),
  }
}

async function readScheduledPublishes(req: PayloadRequest): Promise<number> {
  const { totalDocs } = await req.payload.count({
    collection: 'payload-jobs',
    overrideAccess: false,
    req,
    user: req.user,
    where: {
      and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }],
    },
  })
  return totalDocs
}

async function readRecent(req: PayloadRequest): Promise<RecentItem[]> {
  const perCollection = await Promise.all(
    RECENT_COLLECTIONS.map(async ({ slug, titleField }) => {
      const result = await orNull(() =>
        req.payload.find({
          collection: slug,
          depth: 0,
          draft: true,
          limit: RECENT_ITEMS_LIMIT,
          overrideAccess: false,
          pagination: false,
          req,
          sort: '-updatedAt',
          user: req.user,
        }),
      )
      return (result?.docs ?? []).map((doc): RecentItem => ({
        collection: slug,
        id: doc.id,
        title: readTitle(doc, titleField),
        updatedAt: doc.updatedAt,
      }))
    }),
  )
  return pickMostRecent(perCollection.flat(), RECENT_ITEMS_LIMIT)
}

export async function loadDashboardData(
  req: PayloadRequest,
  now: Date = new Date(),
): Promise<DashboardData> {
  const [quotes, drafts, scheduledPublishes, recent] = await Promise.all([
    orNull(() => readQuotes(req, now)),
    orNull(() => readDrafts(req)),
    orNull(() => readScheduledPublishes(req)),
    readRecent(req),
  ])
  return { quotes, drafts, scheduledPublishes, recent }
}
