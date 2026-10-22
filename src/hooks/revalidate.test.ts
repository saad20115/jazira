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

  it('skips revalidation on draft creation and draft-to-draft autosave, and revalidates on publish, unpublish, and delete (R-3, R-5)', () => {
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
    afterChange({
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
    afterChange({
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
    afterChange({
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

    // 4. Unpublish ('published' -> 'draft'): revalidates so the unpublished item leaves the public cache
    afterChange({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: {},
      data: draftDoc,
      doc: draftDoc,
      operation: 'update',
      previousDoc: publishedDoc,
      req: {},
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(mockRevalidateTag).toHaveBeenCalledTimes(6)
    expect(mockRevalidatePath).toHaveBeenCalledTimes(6)

    mockRevalidateTag.mockReset()
    mockRevalidatePath.mockReset()

    // 5. Delete: always revalidates
    afterDelete({
      collection: { slug: 'projects', versions: { drafts: true } },
      context: {},
      doc: draftDoc,
      id: 1,
      req: {},
    } as unknown as Parameters<CollectionAfterDeleteHook<SampleDoc>>[0])

    expect(mockRevalidateTag).toHaveBeenCalledTimes(6)
    expect(mockRevalidatePath).toHaveBeenCalledTimes(6)
  })

  it('skips global revalidation on draft-to-draft autosave and revalidates when published (R-3, R-5)', () => {
    const globalAfterChange = createRevalidateGlobalAfterChangeHook({
      localizedPaths: ['/'],
    })

    // Draft autosave on global -> skipped
    globalAfterChange({
      context: {},
      data: { _status: 'draft' },
      doc: { _status: 'draft' },
      global: { slug: 'home-page', versions: { drafts: true } },
      previousDoc: { _status: 'draft' },
      req: {},
    } as unknown as Parameters<GlobalAfterChangeHook>[0])

    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()

    // Publish on global -> revalidates
    globalAfterChange({
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

  it('silently ignores "static generation store missing" outside Next runtime, but logs unexpected Invariant errors without throwing (R-4, R-5)', () => {
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

    const res1: unknown = afterChange({
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

    const res2: unknown = afterChange({
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

  it('skips revalidation when context.disableRevalidate is true (R-5)', () => {
    const doc: SampleDoc = { id: 1, slug: 'general-contracting', _status: 'published' }
    const afterChange = createRevalidateAfterChangeHook<SampleDoc>()

    const result: unknown = afterChange({
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
