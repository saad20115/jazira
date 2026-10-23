import type { AccessArgs, CollectionConfig, Where } from 'payload'
import { describe, expect, it } from 'vitest'

import { withPublishable } from '../collections/_shared/publishable'
import { isAdminOrEditor } from './isAdminOrEditor'
import { publishedOrLoggedIn } from './publishedOrLoggedIn'

const makeArgs = (user: { id: number; role: 'admin' | 'editor' } | null): AccessArgs =>
  ({ req: { user } }) as unknown as AccessArgs

const fakePublishableCollection: CollectionConfig = withPublishable({
  slug: 'fake-articles',
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
})

interface FakeDoc {
  id: number
  title: string
  _status: 'draft' | 'published'
}

function filterDocsByAccessResult(
  docs: readonly FakeDoc[],
  accessResult: boolean | Where,
): FakeDoc[] {
  if (accessResult === true) {
    return [...docs]
  }
  if (accessResult === false) {
    return []
  }
  const expectedStatus = (accessResult as { _status?: { equals?: string } })._status?.equals
  return docs.filter((doc) => doc._status === expectedStatus)
}

describe('publishedOrLoggedIn access helper (Z2)', () => {
  it('returns published filter for anonymous requests', () => {
    expect(publishedOrLoggedIn(makeArgs(null))).toEqual({
      _status: {
        equals: 'published',
      },
    })
  })

  it('returns true for editor users', () => {
    expect(publishedOrLoggedIn(makeArgs({ id: 2, role: 'editor' }))).toBe(true)
  })

  it('returns true for admin users', () => {
    expect(publishedOrLoggedIn(makeArgs({ id: 1, role: 'admin' }))).toBe(true)
  })

  it('enforces Z2 on a publishable collection: anonymous sees only published docs, while editor/admin sees drafts too', async () => {
    expect(fakePublishableCollection.versions).toEqual({
      drafts: {
        autosave: { interval: 800 },
        schedulePublish: true,
      },
      maxPerDoc: 25,
    })

    const sampleDocs: readonly FakeDoc[] = [
      { id: 1, title: 'Sofitel Makkah Hotel', _status: 'published' },
      { id: 2, title: '[placeholder] Upcoming Tower', _status: 'draft' },
    ]

    const readAccess = fakePublishableCollection.access?.read
    if (!readAccess) {
      throw new Error('Expected readAccess to be defined on fakePublishableCollection')
    }

    const anonResult = await readAccess(makeArgs(null))
    expect(filterDocsByAccessResult(sampleDocs, anonResult)).toEqual([
      { id: 1, title: 'Sofitel Makkah Hotel', _status: 'published' },
    ])

    const editorResult = await readAccess(makeArgs({ id: 2, role: 'editor' }))
    expect(filterDocsByAccessResult(sampleDocs, editorResult)).toHaveLength(2)

    const adminResult = await readAccess(makeArgs({ id: 1, role: 'admin' }))
    expect(filterDocsByAccessResult(sampleDocs, adminResult)).toHaveLength(2)
  })
})
