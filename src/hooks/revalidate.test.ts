import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  TypeWithID,
} from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  buildCollectionTags,
  buildGlobalTags,
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
  createRevalidateGlobalAfterChangeHook,
} from './revalidate'

interface SampleDoc extends TypeWithID {
  id: number
  slug: string
  title?: string
}

describe('revalidate hooks & tag builders', () => {
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

  it('acts as a safe no-op outside the Next runtime (CLI, seed, tests) without throwing or warning', () => {
    const warnSpy = vi.fn()
    const doc: SampleDoc = { id: 1, slug: 'sofitel-makkah-hotel', title: 'Sofitel Makkah Hotel' }
    const previousDoc: SampleDoc = {
      id: 1,
      slug: 'old-sofitel-slug',
      title: 'Sofitel Makkah Hotel',
    }

    const afterChange = createRevalidateAfterChangeHook<SampleDoc>({
      routePrefix: '/projects',
      localizedPaths: ['/', '/projects'],
    })
    const afterDelete = createRevalidateAfterDeleteHook<SampleDoc>({
      routePrefix: '/projects',
    })
    const globalAfterChange = createRevalidateGlobalAfterChangeHook({
      localizedPaths: ['/'],
    })

    const changeResult: unknown = afterChange({
      collection: { slug: 'projects' },
      context: {},
      data: doc,
      doc,
      operation: 'update',
      previousDoc,
      req: { payload: { logger: { warn: warnSpy } } },
    } as unknown as Parameters<CollectionAfterChangeHook<SampleDoc>>[0])

    expect(changeResult).toBe(doc)
    expect(warnSpy).not.toHaveBeenCalled()

    const deleteResult: unknown = afterDelete({
      collection: { slug: 'projects' },
      context: {},
      doc,
      id: 1,
      req: { payload: { logger: { warn: warnSpy } } },
    } as unknown as Parameters<CollectionAfterDeleteHook<SampleDoc>>[0])

    expect(deleteResult).toBe(doc)
    expect(warnSpy).not.toHaveBeenCalled()

    const globalDoc = { id: 1, hero: { title: 'Al Jazira' } }
    const globalResult: unknown = globalAfterChange({
      context: {},
      data: globalDoc,
      doc: globalDoc,
      global: { slug: 'home-page' },
      previousDoc: globalDoc,
      req: { payload: { logger: { warn: warnSpy } } },
    } as unknown as Parameters<GlobalAfterChangeHook>[0])

    expect(globalResult).toBe(globalDoc)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('skips revalidation when context.disableRevalidate is true', () => {
    const doc: SampleDoc = { id: 1, slug: 'general-contracting' }
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
  })
})
