import type { CollectionConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { publishableGlobalVersions, publishableVersions, withPublishable } from './publishable'

describe('publishable versions config', () => {
  it('matches the exact content model specification (autosave 800ms, schedulePublish true, maxPerDoc 25)', () => {
    expect(publishableVersions).toEqual({
      drafts: {
        autosave: {
          interval: 800,
        },
        schedulePublish: true,
      },
      maxPerDoc: 25,
    })

    expect(publishableGlobalVersions).toEqual({
      drafts: {
        autosave: {
          interval: 800,
        },
        schedulePublish: true,
      },
      max: 25,
    })
  })

  it('attaches publishable versions config to a CollectionConfig', () => {
    const base: CollectionConfig = {
      slug: 'fake-publishable',
      fields: [{ name: 'title', type: 'text' }],
    }
    const result = withPublishable(base)
    expect(result.versions).toEqual(publishableVersions)
  })
})
