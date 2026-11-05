import fs from 'node:fs'
import path from 'node:path'

import { NextRequest } from 'next/server'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const draftModeState = {
  isEnabled: false,
  enableCalled: false,
  disableCalled: false,
}

let mockRequestHeaders = new Headers()

vi.mock('next/headers', () => ({
  draftMode: () =>
    Promise.resolve({
      get isEnabled() {
        return draftModeState.isEnabled
      },
      enable: () => {
        draftModeState.isEnabled = true
        draftModeState.enableCalled = true
      },
      disable: () => {
        draftModeState.isEnabled = false
        draftModeState.disableCalled = true
      },
    }),
  headers: () => Promise.resolve(mockRequestHeaders),
}))

import { GET as exitPreviewGet } from '../../src/app/api/preview/exit/route'
import { GET as previewGet } from '../../src/app/api/preview/route'
import robots from '../../src/app/robots'
import sitemap from '../../src/app/sitemap'
import {
  cmsFind,
  cmsFindAllSmallCollection,
  getBrands,
  getHomePage,
  getMaterials,
  getProjects,
  getServiceBySlug,
  getServices,
  getSiteSettings,
  getStats,
  getTeamMembers,
  MAX_CMS_QUERY_LIMIT,
  resolvePublicDraftFlag,
} from '../../src/lib/cms'
import { getPreviewSecret } from '../../src/lib/preview'
import type { Service, User } from '../../src/payload-types'
import payloadConfig from '../../src/payload.config'
import { proxy } from '../../src/proxy'

let payload: Payload
let editorUser: User | undefined
let editorToken = ''
let createdDraftOnlyServiceId: number | string | null = null
let createdPublishedServiceId: number | string | null = null

describe(
  'P3-T1 Integration — Z6 data layer, R-23 pagination/limit caps, draft isolation, and /api/preview',
  { shuffle: false },
  () => {
    beforeAll(async () => {
      const { assertTestDatabaseIsolation } = await import('./_helpers/testDbIsolation')
      assertTestDatabaseIsolation()
      payload = await getPayload({ config: payloadConfig })
      await payload.db.migrate()

      const email = `p3-t1-editor-${String(Date.now())}@aljazira.co`
      const password = 'ValidEditorPassword!2026#Strong'
      editorUser = await payload.create({
        collection: 'users',
        data: {
          name: 'P3-T1 Preview Editor',
          email,
          password,
          role: 'editor',
        },
        overrideAccess: true,
      })

      const loginRes = await payload.login({
        collection: 'users',
        data: { email, password },
      })
      editorToken = loginRes.token ?? ''
      expect(editorToken.length).toBeGreaterThan(20)

      await payload
        .updateGlobal({
          slug: 'site-settings',
          locale: 'ar',
          data: {
            companyName: 'شركة الجزيرة للإمداد الذكي',
          },
          overrideAccess: true,
        })
        .catch(() => null)
      await payload
        .updateGlobal({
          slug: 'site-settings',
          locale: 'en',
          data: {
            companyName: 'Al Jazira for Imdad Smart Co.',
          },
          overrideAccess: true,
        })
        .catch(() => null)
    })

    beforeEach(() => {
      draftModeState.isEnabled = false
      draftModeState.enableCalled = false
      draftModeState.disableCalled = false
      mockRequestHeaders = new Headers()
    })

    afterAll(async () => {
      if (createdDraftOnlyServiceId !== null) {
        await payload
          .delete({
            collection: 'services',
            id: createdDraftOnlyServiceId,
            overrideAccess: true,
          })
          .catch(() => null)
      }
      if (createdPublishedServiceId !== null) {
        await payload
          .delete({
            collection: 'services',
            id: createdPublishedServiceId,
            overrideAccess: true,
          })
          .catch(() => null)
      }
      if (editorUser?.id !== undefined) {
        await payload
          .delete({
            collection: 'users',
            id: editorUser.id,
            overrideAccess: true,
          })
          .catch(() => null)
      }
    })

    it('R-23: clamps cmsFind limit <= 100, strips pagination: false on cmsFind, and restricts cmsFindAllSmallCollection to the 5 small collections', async () => {
      const smuggledOptions = {
        collection: 'projects',
        locale: 'ar',
        limit: 999999,
        pagination: false,
      } as unknown as Parameters<typeof cmsFind<'projects'>>[0]

      const paginatedRes = await cmsFind(smuggledOptions)
      expect(paginatedRes.limit).toBe(MAX_CMS_QUERY_LIMIT)

      // Small known collections succeed via cmsFindAllSmallCollection
      const [brands, stats, materials, services, team] = await Promise.all([
        cmsFindAllSmallCollection({ collection: 'brands', locale: 'ar' }),
        cmsFindAllSmallCollection({ collection: 'stats', locale: 'ar' }),
        cmsFindAllSmallCollection({ collection: 'materials', locale: 'ar' }),
        cmsFindAllSmallCollection({ collection: 'services', locale: 'ar' }),
        cmsFindAllSmallCollection({ collection: 'team', locale: 'ar' }),
      ])
      expect(Array.isArray(brands.docs)).toBe(true)
      expect(Array.isArray(stats.docs)).toBe(true)
      expect(Array.isArray(materials.docs)).toBe(true)
      expect(Array.isArray(services.docs)).toBe(true)
      expect(Array.isArray(team.docs)).toBe(true)

      // Non-small / restricted collections throw at runtime
      await expect(
        cmsFindAllSmallCollection({
          collection: 'projects' as unknown as 'brands',
          locale: 'ar',
        }),
      ).rejects.toThrow(/not an allowed small unpaginated collection.*R-23/i)

      await expect(
        cmsFindAllSmallCollection({
          collection: 'quote-requests' as unknown as 'brands',
          locale: 'ar',
        }),
      ).rejects.toThrow(/not an allowed small unpaginated collection.*R-23/i)
    })

    it('Z6 & Draft Isolation: hides unpublished drafts when draftMode is off or unauthenticated, and returns drafts only in authenticated editor draftMode', async () => {
      const uniqueSuffix = String(Date.now())
      const draftOnlySlug = `p3-t1-draft-only-${uniqueSuffix}`
      const publishedSlug = `p3-t1-pub-${uniqueSuffix}`

      const draftOnlyDoc: Service = await payload.create({
        collection: 'services',
        locale: 'ar',
        draft: true,
        data: {
          title: 'خدمة مسودة فقط P3-T1',
          slug: draftOnlySlug,
          tier: 'additional',
          icon: 'hvac',
          shortDescription: 'وصف مسودة غير منشورة',
          order: 90,
          featured: false,
          _status: 'draft',
        },
        overrideAccess: true,
      })
      createdDraftOnlyServiceId = draftOnlyDoc.id

      const publishedDoc: Service = await payload.create({
        collection: 'services',
        locale: 'ar',
        draft: false,
        data: {
          title: 'خدمة منشورة للعامة P3-T1',
          slug: publishedSlug,
          tier: 'additional',
          icon: 'hvac',
          shortDescription: 'وصف الخدمة المنشورة',
          order: 91,
          featured: false,
          _status: 'published',
        },
        overrideAccess: true,
      })
      createdPublishedServiceId = publishedDoc.id

      // Save a newer draft revision on top of the published service
      await payload.update({
        collection: 'services',
        id: publishedDoc.id,
        locale: 'ar',
        draft: true,
        data: {
          title: 'خدمة منشورة — تعديل مسودة قيد المراجعة P3-T1',
          _status: 'draft',
        },
        overrideAccess: true,
      })

      // 1. Public visitor (draftMode = false): sees published version only, never draft-only doc
      draftModeState.isEnabled = false
      expect(await resolvePublicDraftFlag()).toBe(false)

      const publicDraftLookup = await getServiceBySlug('ar', draftOnlySlug)
      expect(publicDraftLookup).toBeNull()

      const publicPublishedLookup = await getServiceBySlug('ar', publishedSlug)
      expect(publicPublishedLookup?.title).toBe('خدمة منشورة للعامة P3-T1')

      // 2. Forged draftMode = true WITHOUT staff auth cookie: still treated as public (draft = false)
      draftModeState.isEnabled = true
      mockRequestHeaders = new Headers()
      expect(await resolvePublicDraftFlag()).toBe(false)
      expect(await getServiceBySlug('ar', draftOnlySlug)).toBeNull()
      expect((await getServiceBySlug('ar', publishedSlug))?.title).toBe('خدمة منشورة للعامة P3-T1')

      // 3. Authenticated editor in draftMode = true: sees draft-only doc AND latest draft revision!
      draftModeState.isEnabled = true
      mockRequestHeaders = new Headers({
        cookie: `payload-token=${editorToken}`,
        authorization: `JWT ${editorToken}`,
      })
      expect(await resolvePublicDraftFlag()).toBe(true)

      const previewDraftLookup = await getServiceBySlug('ar', draftOnlySlug)
      expect(previewDraftLookup?.title).toBe('خدمة مسودة فقط P3-T1')

      const previewUpdatedLookup = await getServiceBySlug('ar', publishedSlug)
      expect(previewUpdatedLookup?.title).toBe('خدمة منشورة — تعديل مسودة قيد المراجعة P3-T1')
    })

    it('fetches localized globals and collections via src/lib/cms/* in both ar and en', async () => {
      const [
        siteAr,
        siteEn,
        homeAr,
        servicesAr,
        projectsAr,
        brandsAr,
        materialsAr,
        statsAr,
        teamAr,
      ] = await Promise.all([
        getSiteSettings('ar'),
        getSiteSettings('en'),
        getHomePage('ar'),
        getServices('ar'),
        getProjects('ar', { limit: 6 }),
        getBrands('ar'),
        getMaterials('ar'),
        getStats('ar'),
        getTeamMembers('ar'),
      ])

      expect(siteAr).toBeDefined()
      expect(siteEn).toBeDefined()
      expect(homeAr).toBeDefined()
      expect(Array.isArray(servicesAr)).toBe(true)
      expect(Array.isArray(projectsAr.docs)).toBe(true)
      expect(Array.isArray(brandsAr)).toBe(true)
      expect(Array.isArray(materialsAr)).toBe(true)
      expect(Array.isArray(statsAr)).toBe(true)
      expect(Array.isArray(teamAr)).toBe(true)
    })

    it('GET /api/preview and GET /api/preview/exit enforce secret + staff session (Z2, I1) and toggle draftMode()', async () => {
      const secret = getPreviewSecret()

      // 1. Missing / invalid query parameters -> 400
      const badParamsReq = new NextRequest('http://localhost:3000/api/preview?secret=short')
      const badParamsRes = await previewGet(badParamsReq)
      expect(badParamsRes.status).toBe(400)

      // 2. Wrong secret -> 401
      const wrongSecretReq = new NextRequest(
        `http://localhost:3000/api/preview?secret=${'x'.repeat(64)}&locale=ar&path=/services`,
      )
      const wrongSecretRes = await previewGet(wrongSecretReq)
      expect(wrongSecretRes.status).toBe(401)

      // 3. Unsafe redirect path -> 400
      const unsafePathReq = new NextRequest(
        `http://localhost:3000/api/preview?secret=${secret}&locale=ar&path=//evil.com`,
      )
      const unsafePathRes = await previewGet(unsafePathReq)
      expect(unsafePathRes.status).toBe(400)

      // 4. Valid secret + path, but unauthenticated caller -> 403
      const unauthReq = new NextRequest(
        `http://localhost:3000/api/preview?secret=${secret}&locale=ar&collection=services&slug=hvac`,
      )
      const unauthRes = await previewGet(unauthReq)
      expect(unauthRes.status).toBe(403)
      expect(draftModeState.enableCalled).toBe(false)

      // 5. Valid secret + authenticated editor session -> 307 redirect + draftMode().enable()
      const authReq = new NextRequest(
        `http://localhost:3000/api/preview?secret=${secret}&locale=en&collection=services&slug=hvac`,
        {
          headers: {
            cookie: `payload-token=${editorToken}`,
            authorization: `JWT ${editorToken}`,
          },
        },
      )
      const authRes = await previewGet(authReq)
      expect(authRes.status).toBe(307)
      expect(authRes.headers.get('location')).toBe('http://localhost:3000/en/services/hvac')
      expect(draftModeState.enableCalled).toBe(true)
      expect(draftModeState.isEnabled).toBe(true)

      // 6. Exit preview route -> 307 redirect + draftMode().disable()
      const exitReq = new NextRequest(
        'http://localhost:3000/api/preview/exit?returnTo=/en/services',
      )
      const exitRes = await exitPreviewGet(exitReq)
      expect(exitRes.status).toBe(307)
      expect(exitRes.headers.get('location')).toBe('http://localhost:3000/en/services')
      expect(draftModeState.disableCalled).toBe(true)
      expect(draftModeState.isEnabled).toBe(false)
    })

    it('R-15: when 101 docs exist in a small collection (stats), cmsFindAllSmallCollection logs a warning, never throws, and returns the first 100 docs', async () => {
      const createdStatIds: Array<number | string> = []
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        for (let i = 1; i <= 101; i += 1) {
          const created = await payload.create({
            collection: 'stats',
            locale: 'ar',
            data: {
              value: `${String(i)}+`,
              label: `إحصائية اختبار ${String(i)}`,
              order: i,
            },
            overrideAccess: true,
          })
          createdStatIds.push(created.id)
        }

        const result = await cmsFindAllSmallCollection({
          collection: 'stats',
          locale: 'ar',
          sort: 'order',
        })

        expect(result.docs).toHaveLength(MAX_CMS_QUERY_LIMIT)
        expect(result.docs).toHaveLength(100)
        expect(result.totalDocs).toBe(100)
        expect(
          warnSpy.mock.calls.some((args) =>
            String(args[0]).includes('Collection "stats" has at least 101 documents'),
          ),
        ).toBe(true)
      } finally {
        warnSpy.mockRestore()
        if (createdStatIds.length > 0) {
          await payload.delete({
            collection: 'stats',
            where: { id: { in: createdStatIds } },
            overrideAccess: true,
          })
        }
      }
    })

    it('R-12: /robots.txt, /sitemap.xml, /favicon.ico, /.well-known/*, and public assets pass through proxy without rewriting to /__not_found__', async () => {
      const robotsCfg = robots()
      expect(robotsCfg.rules).toEqual({
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      })

      const sitemapEntries = await sitemap()
      expect(sitemapEntries.map((e) => e.url)).toEqual(['http://localhost:3000/en'])

      expect(fs.existsSync(path.resolve(process.cwd(), 'public/favicon.ico'))).toBe(true)
      expect(fs.existsSync(path.resolve(process.cwd(), 'public/icon.svg'))).toBe(true)

      for (const rootOrPublicPath of [
        '/robots.txt',
        '/sitemap.xml',
        '/favicon.ico',
        '/icon.svg',
        '/.well-known/security.txt',
        '/brand/full-primary.svg',
        '/basis_transcoder.wasm',
        '/draco/draco_decoder.wasm',
      ]) {
        const res = proxy(new NextRequest(`http://localhost:3000${rootOrPublicPath}`))
        expect(res.headers.get('x-middleware-rewrite')).toBeNull()
      }
    })
  },
)
