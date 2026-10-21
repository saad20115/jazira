import type { CollectionConfig, GlobalConfig } from 'payload'

export const publishableVersions = {
  drafts: {
    autosave: {
      interval: 800,
    },
    schedulePublish: true,
  },
  maxPerDoc: 25,
} satisfies NonNullable<CollectionConfig['versions']>

export const PUBLISHABLE_VERSIONS = publishableVersions

export const publishableGlobalVersions = {
  drafts: {
    autosave: {
      interval: 800,
    },
    schedulePublish: true,
  },
  max: 25,
} satisfies NonNullable<GlobalConfig['versions']>

export const PUBLISHABLE_GLOBAL_VERSIONS = publishableGlobalVersions

export function withPublishable<T extends CollectionConfig>(config: T): T {
  return {
    ...config,
    versions: publishableVersions,
  }
}
