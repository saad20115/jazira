import type { Access, AccessArgs } from 'payload'
import { describe, expect, it } from 'vitest'

import { Brands } from '../collections/Brands'
import { Materials } from '../collections/Materials'
import { assertCollectionRichTextFieldsHaveBodyMediaSibling, Media } from '../collections/Media'
import { Projects } from '../collections/Projects'
import { QuoteRequests } from '../collections/QuoteRequests'
import { Services } from '../collections/Services'
import { Stats } from '../collections/Stats'
import { Team } from '../collections/Team'
import { Users } from '../collections/Users'
import { Videos } from '../collections/Videos'
import { ALL_GLOBALS } from '../globals/index'
import payloadConfig from '../payload.config'

const RAW_APPLICATION_COLLECTIONS = [
  Users,
  Media,
  Videos,
  Brands,
  Stats,
  Materials,
  Services,
  Team,
  Projects,
  QuoteRequests,
] as const

const INTERNAL_PAYLOAD_SYSTEM_SLUGS = new Set([
  'payload-kv',
  'payload-locked-documents',
  'payload-preferences',
  'payload-migrations',
])

const COLLECTION_ACCESS_OPS = ['read', 'create', 'update', 'delete'] as const
const GLOBAL_ACCESS_OPS = ['read', 'update'] as const
const JOBS_ACCESS_OPS = ['run', 'queue', 'cancel'] as const

const PAYLOAD_DEFAULT_ACCESS_NAMES = new Set(['defaultAccess', 'defaultUnlockAccess'])

export function assertExplicitAccessFunction(
  fn: Access | undefined,
  targetLabel: string,
  op: string,
): asserts fn is Access {
  expect(
    typeof fn,
    `${targetLabel}.access.${op} is missing (must be an explicit Access function per Z1)`,
  ).toBe('function')
  const fnName = fn?.name ?? ''
  expect(
    PAYLOAD_DEFAULT_ACCESS_NAMES.has(fnName) || /^default.*Access$/i.test(fnName),
    `${targetLabel}.access.${op} must not use Payload default access function "${fnName}" (Z1, R-19)`,
  ).toBe(false)
}

const makeAccessArgs = (
  user: { id: number; role: 'admin' | 'editor'; email: string } | null,
  id?: number,
): AccessArgs =>
  ({
    req: {
      user,
    },
    id,
  }) as unknown as AccessArgs

describe('Z1 Config-Enumeration Access Control Suite (P2-T8 Scope 1)', () => {
  it('verifies every raw collection and global config defines explicit non-default access functions for all operations (Z1)', () => {
    expect(RAW_APPLICATION_COLLECTIONS).toHaveLength(10)
    for (const col of RAW_APPLICATION_COLLECTIONS) {
      expect(col.access, `collection "${col.slug}" is missing access object`).toBeDefined()
      for (const op of COLLECTION_ACCESS_OPS) {
        assertExplicitAccessFunction(col.access?.[op], `collection:${col.slug}`, op)
      }
      if (col.auth) {
        assertExplicitAccessFunction(col.access?.unlock, `collection:${col.slug}`, 'unlock')
      }
    }

    expect(ALL_GLOBALS).toHaveLength(8)
    for (const globalConfig of ALL_GLOBALS) {
      expect(
        globalConfig.access,
        `global "${globalConfig.slug}" is missing access object`,
      ).toBeDefined()
      for (const op of GLOBAL_ACCESS_OPS) {
        assertExplicitAccessFunction(globalConfig.access?.[op], `global:${globalConfig.slug}`, op)
      }
    }
  })

  it('loads the built Payload config, iterates every application collection and global, and fails if any read/create/update/delete (globals: read/update) is missing or has function name defaultAccess (Z1, R-5, R-10)', async () => {
    const config = await payloadConfig

    const appCollections = config.collections.filter(
      (c) => !INTERNAL_PAYLOAD_SYSTEM_SLUGS.has(c.slug),
    )
    expect(appCollections.length).toBeGreaterThanOrEqual(10)
    assertCollectionRichTextFieldsHaveBodyMediaSibling(config.collections)

    for (const col of appCollections) {
      for (const op of COLLECTION_ACCESS_OPS) {
        assertExplicitAccessFunction(col.access[op], `sanitized collection:${col.slug}`, op)
      }
      if (Boolean(col.auth)) {
        assertExplicitAccessFunction(
          col.access.unlock,
          `sanitized collection:${col.slug}`,
          'unlock',
        )
      }
    }

    expect(config.globals.length).toBeGreaterThanOrEqual(8)

    for (const globalConfig of config.globals) {
      for (const op of GLOBAL_ACCESS_OPS) {
        assertExplicitAccessFunction(
          globalConfig.access[op],
          `sanitized global:${globalConfig.slug}`,
          op,
        )
      }
    }

    // Verify payload-jobs is included in enumerated collections and config.jobs.access defines explicit non-default access functions (A-06)
    expect(appCollections.some((c) => c.slug === 'payload-jobs')).toBe(true)
    expect(config.jobs?.access, 'config.jobs.access is missing').toBeDefined()
    for (const op of JOBS_ACCESS_OPS) {
      assertExplicitAccessFunction(config.jobs?.access?.[op], 'config.jobs', op)
    }

    // Negative self-test: prove assertExplicitAccessFunction catches missing, defaultAccess, and defaultUnlockAccess (R-19)
    const simulatedDefaultAccess: Access = function defaultAccess({ req: { user } }) {
      return Boolean(user)
    }
    const simulatedDefaultUnlockAccess: Access = function defaultUnlockAccess({ req: { user } }) {
      return Boolean(user)
    }
    expect(() => {
      assertExplicitAccessFunction(undefined, 'synthetic:broken', 'delete')
    }).toThrow(/missing/)
    expect(() => {
      assertExplicitAccessFunction(simulatedDefaultAccess, 'synthetic:broken', 'update')
    }).toThrow(/defaultAccess/)
    expect(() => {
      assertExplicitAccessFunction(simulatedDefaultUnlockAccess, 'synthetic:broken', 'unlock')
    }).toThrow(/defaultUnlockAccess/)
  })

  it('evaluates every collection and global access function across anonymous, editor, and admin callers (Z1–Z4)', async () => {
    const config = await payloadConfig
    const appCollections = Object.fromEntries(
      config.collections
        .filter((c) => !INTERNAL_PAYLOAD_SYSTEM_SLUGS.has(c.slug))
        .map((c) => [c.slug, c]),
    )

    const anonArgs = makeAccessArgs(null, 99)
    const editorSelfArgs = makeAccessArgs(
      { id: 10, role: 'editor', email: 'editor@aljazira.co' },
      10,
    )
    const editorOtherArgs = makeAccessArgs(
      { id: 10, role: 'editor', email: 'editor@aljazira.co' },
      99,
    )
    const adminArgs = makeAccessArgs({ id: 1, role: 'admin', email: 'admin@aljazira.co' }, 99)

    // 1. users: read staff (isAdminOrEditor, with email/role/sessions restricted to adminOrSelf per R-11); update admin or self; create/delete/unlock admin only (R-13)
    expect(await appCollections['users'].access.read(anonArgs)).toBe(false)
    expect(await appCollections['users'].access.read(editorOtherArgs)).toBe(true)
    expect(await appCollections['users'].access.read(adminArgs)).toBe(true)
    expect(await appCollections['users'].access.create(anonArgs)).toBe(false)
    expect(await appCollections['users'].access.create(editorSelfArgs)).toBe(false)
    expect(await appCollections['users'].access.create(adminArgs)).toBe(true)
    expect(await appCollections['users'].access.update(anonArgs)).toBe(false)
    expect(await appCollections['users'].access.update(editorOtherArgs)).toEqual({
      id: { equals: 10 },
    })
    expect(await appCollections['users'].access.update(adminArgs)).toBe(true)
    expect(await appCollections['users'].access.delete(anonArgs)).toBe(false)
    expect(await appCollections['users'].access.delete(editorSelfArgs)).toBe(false)
    expect(await appCollections['users'].access.delete(adminArgs)).toBe(true)
    expect(await appCollections['users'].access.unlock(anonArgs)).toBe(false)
    expect(await appCollections['users'].access.unlock(editorSelfArgs)).toBe(false)
    expect(await appCollections['users'].access.unlock(editorOtherArgs)).toBe(false)
    expect(await appCollections['users'].access.unlock(adminArgs)).toBe(true)

    // 2. Always-public read, editor/admin write/delete: media, videos, brands, stats, materials, team
    for (const slug of ['media', 'videos', 'brands', 'stats', 'materials', 'team'] as const) {
      const col = appCollections[slug]
      if (slug === 'team') {
        expect(await col.access.read(anonArgs), `${slug}.read(anon)`).toEqual({
          active: { equals: true },
        })
      } else if (slug === 'media') {
        expect(await col.access.read(anonArgs), `${slug}.read(anon)`).toEqual({
          placeholder: { equals: false },
        })
      } else {
        expect(await col.access.read(anonArgs), `${slug}.read(anon)`).toBe(true)
      }
      expect(await col.access.read(editorOtherArgs), `${slug}.read(editor)`).toBe(true)
      expect(await col.access.read(adminArgs), `${slug}.read(admin)`).toBe(true)

      for (const writeOp of ['create', 'update', 'delete'] as const) {
        expect(await col.access[writeOp](anonArgs), `${slug}.${writeOp}(anon)`).toBe(false)
        expect(await col.access[writeOp](editorOtherArgs), `${slug}.${writeOp}(editor)`).toBe(true)
        expect(await col.access[writeOp](adminArgs), `${slug}.${writeOp}(admin)`).toBe(true)
      }
    }

    // 3. Versioned publishable collections (Z2): services, projects
    for (const slug of ['services', 'projects'] as const) {
      const col = appCollections[slug]
      expect(await col.access.read(anonArgs), `${slug}.read(anon)`).toEqual({
        _status: { equals: 'published' },
      })
      expect(await col.access.read(editorOtherArgs), `${slug}.read(editor)`).toBe(true)
      expect(await col.access.read(adminArgs), `${slug}.read(admin)`).toBe(true)

      for (const writeOp of ['create', 'update', 'delete'] as const) {
        expect(await col.access[writeOp](anonArgs), `${slug}.${writeOp}(anon)`).toBe(false)
        expect(await col.access[writeOp](editorOtherArgs), `${slug}.${writeOp}(editor)`).toBe(true)
        expect(await col.access[writeOp](adminArgs), `${slug}.${writeOp}(admin)`).toBe(true)
      }
    }

    // 4. quote-requests (Z4): create is false for all; read/update editor+admin; delete admin only
    const qr = appCollections['quote-requests']
    expect(await qr.access.create(anonArgs)).toBe(false)
    expect(await qr.access.create(editorOtherArgs)).toBe(false)
    expect(await qr.access.create(adminArgs)).toBe(false)
    expect(await qr.access.read(anonArgs)).toBe(false)
    expect(await qr.access.read(editorOtherArgs)).toBe(true)
    expect(await qr.access.read(adminArgs)).toBe(true)
    expect(await qr.access.update(anonArgs)).toBe(false)
    expect(await qr.access.update(editorOtherArgs)).toBe(true)
    expect(await qr.access.update(adminArgs)).toBe(true)
    expect(await qr.access.delete(anonArgs)).toBe(false)
    expect(await qr.access.delete(editorOtherArgs)).toBe(false)
    expect(await qr.access.delete(adminArgs)).toBe(true)

    // 5. Globals: site-settings & navigation (public read, editor/admin update; site-settings admin update only per content model)
    for (const g of config.globals) {
      const anonRead = await g.access.read(anonArgs)
      const editorRead = await g.access.read(editorOtherArgs)
      const adminRead = await g.access.read(adminArgs)

      if (g.slug === 'site-settings' || g.slug === 'navigation') {
        expect(anonRead, `global:${g.slug}.read(anon)`).toBe(true)
      } else {
        expect(anonRead, `global:${g.slug}.read(anon)`).toEqual({
          _status: { equals: 'published' },
        })
      }
      expect(editorRead, `global:${g.slug}.read(editor)`).toBe(true)
      expect(adminRead, `global:${g.slug}.read(admin)`).toBe(true)

      expect(await g.access.update(anonArgs), `global:${g.slug}.update(anon)`).toBe(false)
      if (g.slug === 'site-settings') {
        expect(await g.access.update(editorOtherArgs), `global:${g.slug}.update(editor)`).toBe(
          false,
        )
      } else {
        expect(await g.access.update(editorOtherArgs), `global:${g.slug}.update(editor)`).toBe(true)
      }
      expect(await g.access.update(adminArgs), `global:${g.slug}.update(admin)`).toBe(true)
    }

    // 6. payload-jobs collection & config.jobs.access (A-06): collection ops deny all direct REST/GQL access; jobs.access (run/queue/cancel) is admin-only
    const payloadJobsCol = appCollections['payload-jobs']
    expect(payloadJobsCol, 'payload-jobs collection must be present').toBeDefined()
    for (const op of COLLECTION_ACCESS_OPS) {
      expect(await payloadJobsCol.access[op](anonArgs), `payload-jobs.${op}(anon)`).toBe(false)
      expect(await payloadJobsCol.access[op](editorOtherArgs), `payload-jobs.${op}(editor)`).toBe(
        false,
      )
      expect(await payloadJobsCol.access[op](adminArgs), `payload-jobs.${op}(admin)`).toBe(false)
    }
    for (const op of JOBS_ACCESS_OPS) {
      const fn = config.jobs?.access?.[op]
      expect(typeof fn, `config.jobs.access.${op} must be a function`).toBe('function')
      expect(await fn!(anonArgs), `jobs.access.${op}(anon)`).toBe(false)
      expect(await fn!(editorOtherArgs), `jobs.access.${op}(editor)`).toBe(false)
      expect(await fn!(adminArgs), `jobs.access.${op}(admin)`).toBe(true)
    }

    // 7. projects.reviewNote field-level access (A-05 / D-05): read, create, update are admin-only
    const projectsCol = appCollections['projects']
    const reviewNoteField = projectsCol.flattenedFields.find((f) => f.name === 'reviewNote')
    expect(reviewNoteField, 'projects.reviewNote field must exist').toBeDefined()
    for (const fieldOp of ['read', 'create', 'update'] as const) {
      const fieldAccessFn = reviewNoteField?.access?.[fieldOp]
      expect(typeof fieldAccessFn, `projects.reviewNote.access.${fieldOp} must be a function`).toBe(
        'function',
      )
      expect(await fieldAccessFn!(anonArgs as never), `projects.reviewNote.${fieldOp}(anon)`).toBe(
        false,
      )
      expect(
        await fieldAccessFn!(editorOtherArgs as never),
        `projects.reviewNote.${fieldOp}(editor)`,
      ).toBe(false)
      expect(
        await fieldAccessFn!(adminArgs as never),
        `projects.reviewNote.${fieldOp}(admin)`,
      ).toBe(true)
    }
  })
})
