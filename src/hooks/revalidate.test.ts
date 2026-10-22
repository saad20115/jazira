import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  TypeWithID,
} from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRevalidatePath, mockRevalidateTag } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
  mockRevalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
}))

import {
  buildCollectionTags,
  buildGlobalTags,
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
  createRevalidateGlobalAfterChangeHook,
} from './revalidate'

interface SampleDoc extends TypeWithID {
  _status?: 'draft' | 'published'
  id: number
  slug: string
  title?: string
}

describe('revalidate hooks & tag builders', () => {
  beforeEach(() => {
    mockRevalidateTag.mockReset()
    mockRevalidatePath.mockReset()
  })

  it('builds collection tags per collection, per doc slug, and per locale (ar, en)', () => {
    const tags = buildCollectionTags('projects', ['sofitel-makkah-hotel'])
    expect(tags).toEqual([
      'collection:projects',
      'collection:projects:ar',
      'collection:projects:en',
      'doc:projects:sofitel-makkah-hotel',
      'doc:projects:sofitel-makkah-hotel:ar',
      'doc:projects:sofitel-makkah-hotel:en',
    ])
  })

  it('builds global tags per global and per locale (ar, en)', () => {
    const tags = buildGlobalTags('home-page')
    expect(tags).toEqual(['global:home-page', 'global:home-page:ar', 'global:home-page:en'])
  })

  it('skips revalidation on draft creation, draft-to-draft autosave, and draft/autosave on a published doc, and revalidates only on publish, unpublish, and published delete (R-3, R-4, R-5)', async () => {
    const afterChange = createRevalidateAfterChangeHook<SampleDoc>({
      routePrefix: '/projects',
      localizedPaths: ['/'],
    })
    const afterDelete = createRevalidateAfterDeleteHook<SampleDoc>({
      routePrefix: '/projects',
      localizedPaths: ['/'],
    })

    const draftDoc: SampleDoc = {
      id: 1,
      slug: 'sofitel-makkah-hotel',
      _status: 'draft',
    }

    // 1. Draft creation (undefined -> 'draft'): 0 revalidations
    await afterChange({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: {},
      data: draftDoc,
      doc: draftDoc,
      operation: 'create',
      previousDoc: {} as SampleDoc,
      req: {},
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    // 2. Draft autosave ('draft' -> 'draft'): 0 revalidations
    await afterChange({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: {},
      data: draftDoc,
      doc: draftDoc,
      operation: 'update',
      previousDoc: draftDoc,
      req: {},
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    // 3. Publish ('draft' -> 'published'): revalidates exact tags and paths
    const publishedDoc: SampleDoc = {
      id: 1,
      slug: 'sofitel-makkah-hotel',
      _status: 'published',
    }
    await afterChange({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: {},
      data: publishedDoc,
      doc: publishedDoc,
      operation: 'update',
      previousDoc: draftDoc,
      req: {},
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(mockRevalidateTag.mock.calls.map((c: unknown[]) => String(c[0]))).toEqual([
      'collection:projects',
      'collection:projects:ar',
      'collection:projects:en',
      'doc:projects:sofitel-makkah-hotel',
      'doc:projects:sofitel-makkah-hotel:ar',
      'doc:projects:sofitel-makkah-hotel:en',
    ])
    expect(mockRevalidatePath.mock.calls.map((c: unknown[]) => String(c[0]))).toEqual([
      '/ar',
      '/en',
      '/ar/projects',
      '/ar/projects/sofitel-makkah-hotel',
      '/en/projects',
      '/en/projects/sofitel-makkah-hotel',
    ])

    mockRevalidateTag.mockReset()
    mockRevalidatePath.mockReset()

    // 4. Draft save or autosave on an already-published document (main table still 'published' or ?draft=true): 0 revalidations (P2-T4 R-4)
    await afterChange({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: {},
      data: draftDoc,
      doc: draftDoc,
      operation: 'update',
      previousDoc: publishedDoc,
      req: {
        query: { draft: 'true', autosave: 'true' },
      },
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    await afterChange({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: { __mainDocBeforeChange: publishedDoc },
      data: draftDoc,
      doc: draftDoc,
      operation: 'update',
      previousDoc: publishedDoc,
      req: {
        payload: {
          db: {
            findOne: vi.fn().mockResolvedValue(publishedDoc),
          },
        },
      },
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    // 5. Unpublish ('published' -> 'draft' in main table): revalidates so the unpublished item leaves the public cache
    await afterChange({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: { __mainDocBeforeChange: publishedDoc },
      data: draftDoc,
      doc: draftDoc,
      operation: 'update',
      previousDoc: publishedDoc,
      req: {
        payload: {
          db: {
            findOne: vi.fn().mockResolvedValue(draftDoc),
          },
        },
      },
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(mockRevalidateTag).toHaveBeenCalledTimes(6)
    expect(mockRevalidatePath).toHaveBeenCalledTimes(6)

    mockRevalidateTag.mockReset()
    mockRevalidatePath.mockReset()

    // 6. Delete of draft-only doc: 0 revalidations; delete of published doc: revalidates
    afterDelete({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: {},
      doc: draftDoc,
      id: 1,
      req: {},
    } as unknown as Parameters<CollectionAfterDeleteHook<SampleDoc>>[0])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    afterDelete({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: {},
      doc: publishedDoc,
      id: 1,
      req: {},
    } as unknown as Parameters<CollectionAfterDeleteHook<SampleDoc>>[0])

    expect(mockRevalidateTag).toHaveBeenCalledTimes(6)
    expect(mockRevalidatePath).toHaveBeenCalledTimes(6)
  })

  it('skips global revalidation on draft-to-draft autosave and draft save over published global, and revalidates when published (R-3, R-4, R-5)', async () => {
    const globalAfterChange = createRevalidateGlobalAfterChangeHook({
      localizedPaths: ['/'],
    })

    // Draft autosave on global -> skipped
    await globalAfterChange({
      context: {},
      data: { _status: 'draft' },
      doc: { _status: 'draft' },
      global: { slug: 'home-page', versions: { drafts: true } },
      previousDoc: { _status: 'draft' },
      req: {},
    } as unknown as Parameters<GlobalAfterChangeHook>[0])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    // Draft save on already-published global -> skipped (P2-T4 R-4)
    await globalAfterChange({
      context: {},
      data: { _status: 'draft' },
      doc: { _status: 'draft' },
      global: { slug: 'home-page', versions: { drafts: true } },
      previousDoc: { _status: 'published' },
      req: {
        payload: {
          db: {
            findGlobal: vi.fn().mockResolvedValue({ _status: 'published' }),
          },
        },
      },
    } as unknown as Parameters<GlobalAfterChangeHook>[0])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    // Publish on global -> revalidates
    await globalAfterChange({
      context: {},
      data: { _status: 'published' },
      doc: { _status: 'published' },
      global: { slug: 'home-page', versions: { drafts: true } },
      previousDoc: { _status: 'draft' },
      req: {},
    } as unknown as Parameters<GlobalAfterChangeHook>[0])

    expect(mockRevalidateTag.mock.calls.map((c: unknown[]) => String(c[0]))).toEqual([
      'global:home-page',
      'global:home-page:ar',
      'global:home-page:en',
    ])
    expect(mockRevalidatePath.mock.calls.map((c: unknown[]) => String(c[0]))).toEqual([
      '/ar',
      '/en',
    ])
  })

  it('silently ignores "static generation store missing" outside Next runtime, but logs unexpected Invariant errors without throwing (R-4, R-5)', async () => {
    const warnSpy = vi.fn()
    const doc: SampleDoc = { id: 1, slug: 'sofitel-makkah-hotel', _status: 'published' }
    const afterChange = createRevalidateAfterChangeHook<SampleDoc>({
      routePrefix: '/projects',
    })

    // 1. Outside Next runtime ("static generation store missing") -> silent no-op
    mockRevalidateTag.mockImplementation(() => {
      throw new Error(
        'Invariant: static generation store missing in revalidateTag collection:projects',
      )
    })
    mockRevalidatePath.mockImplementation(() => {
      throw new Error('Invariant: static generation store missing in revalidatePath /ar')
    })

    const res1: unknown = await afterChange({
      collection: { slug: 'projects' },
      context: {},
      data: doc,
      doc,
      operation: 'update',
      previousDoc: doc,
      req: { payload: { logger: { warn: warnSpy } } },
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(res1).toBe(doc)
    expect(warnSpy).not.toHaveBeenCalled()

    // 2. Different Invariant error -> logged via logger.warn without throwing into editor save
    mockRevalidateTag.mockImplementation(() => {
      throw new Error('Invariant: unexpected cache backend corruption')
    })
    mockRevalidatePath.mockReset()

    const res2: unknown = await afterChange({
      collection: { slug: 'projects' },
      context: {},
      data: doc,
      doc,
      operation: 'update',
      previousDoc: doc,
      req: { payload: { logger: { warn: warnSpy } } },
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(res2).toBe(doc)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('skips revalidation when context.disableRevalidate is true (R-5)', async () => {
    const doc: SampleDoc = { id: 1, slug: 'general-contracting', _status: 'published' }
    const afterChange = createRevalidateAfterChangeHook<SampleDoc>()

    const result: unknown = await afterChange({
      collection: { slug: 'services' },
      context: { disableRevalidate: true },
      data: doc,
      doc,
      operation: 'create',
      previousDoc: doc,
      req: {},
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(result).toBe(doc)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
