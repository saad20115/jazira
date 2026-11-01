import { sql } from '@payloadcms/db-postgres'
import { REST_GET } from '@payloadcms/next/routes'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  DEFAULT_INTERACTIVE_SYSTEMS_AR,
  DEFAULT_INTERACTIVE_SYSTEMS_EN,
} from '../../src/globals/HomePage'
import payloadConfig from '../../src/payload.config'
import { SEED_ADMIN_USER } from '../../src/seed/materials'
import {
  clearGlobalsReferencesBeforeReseed,
  formatP4T2SummaryLines,
  seedP4T2Content,
} from '../../src/seed/p4-t2'
import { OWNER_MARQUEE_BRANDS_20 } from '../../src/seed/p4-t2-data'

const getHandler = REST_GET(Promise.resolve(payloadConfig))
let payload: Payload

describe('P4-T2 Integration — Settings, services, projects (91 + 17 photos), marquee (20), copy & placeholders seed', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: payloadConfig })
    await payload.db.migrate()

    // Clean any raw-SQL or published rows left on the 6 page globals by earlier test suites
    const db = (
      payload.db as unknown as {
        drizzle: { execute: (q: ReturnType<typeof sql>) => Promise<unknown> }
      }
    ).drizzle
    await db.execute(sql`
      DELETE FROM "_home_page_v";
      DELETE FROM "home_page";
      DELETE FROM "_services_page_v";
      DELETE FROM "services_page";
      DELETE FROM "_about_page_v";
      DELETE FROM "about_page";
      DELETE FROM "_projects_page_v";
      DELETE FROM "projects_page";
      DELETE FROM "_contact_page_v";
      DELETE FROM "contact_page";
      DELETE FROM "_privacy_page_v";
      DELETE FROM "privacy_page";
    `)

    await clearGlobalsReferencesBeforeReseed(payload)
    for (const collection of [
      'projects',
      'services',
      'team',
      'stats',
      'materials',
      'brands',
      'videos',
      'media',
    ] as const) {
      await payload.delete({
        collection,
        where: { id: { exists: true } },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }
  }, 120_000)

  afterAll(async () => {
    await clearGlobalsReferencesBeforeReseed(payload)
    for (const collection of [
      'projects',
      'services',
      'team',
      'stats',
      'materials',
      'brands',
      'media',
    ] as const) {
      await payload.delete({
        collection,
        where: { id: { exists: true } },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }
  }, 60_000)

  it('seeds the full Phase 4 baseline (P4-T1 + P4-T2) via --reseed and verifies all counts, locales, marquee order, and home-page interactiveSystems in both en & ar', async () => {
    const summary = await seedP4T2Content(payload, {
      nodeEnv: 'test',
      argv: ['node', 'scripts/seed.ts', '--reseed'],
      reseed: true,
    })

    expect(summary.mediaUploaded).toEqual({
      projectPhotos: 17,
      designAssets: 9,
      total: 26,
    })
    expect(summary.marqueeBrands).toEqual({
      created: 16,
      existingMatched: 4,
      oldCleared: 16,
      totalMarquee: 20,
      totalBrands: 99,
    })
    expect(summary.statsCreated).toBe(5)
    expect(summary.servicesCreatedDraft).toBe(10)
    expect(summary.projectsCreated).toEqual({
      publishedWithPhoto: 17,
      draftWithoutPhoto: 74,
      featured: 6,
      total: 91,
    })
    expect(summary.teamPlaceholdersCreatedInactive).toBe(13)
    expect(summary.homeCopySource).toBe('design/copy/01-home.md')

    // Verify the 20 marquee brands in exact order 1..20
    const marqueeEn = await payload.find({
      collection: 'brands',
      where: { showInMarquee: { equals: true } },
      sort: 'order',
      limit: 50,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    expect(marqueeEn.totalDocs).toBe(20)
    expect(marqueeEn.docs.map((b) => b.order)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    expect(marqueeEn.docs.map((b) => b.name.toLowerCase())).toEqual(
      OWNER_MARQUEE_BRANDS_20.map((b) => b.name.toLowerCase()),
    )

    // Verify site-settings has arabicEnabled=false and empty socials
    const siteSettingsEn = await payload.findGlobal({
      slug: 'site-settings',
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    const siteSettingsAr = await payload.findGlobal({
      slug: 'site-settings',
      locale: 'ar',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    expect(siteSettingsEn.arabicEnabled).toBe(false)
    expect(siteSettingsEn.phone).toBe('+966 57 353 4185')
    expect(siteSettingsEn.whatsapp).toBe('966573534185')
    expect(siteSettingsEn.email).toBe('info@aljazira.co')
    expect(siteSettingsEn.socials ?? []).toHaveLength(0)
    expect(siteSettingsAr.companyName).toBe('شركة الجزيرة الإمداد الذكي')

    // Verify home-page interactiveSystems.systems has all 5 rows in both en and ar
    const homeEn = await payload.findGlobal({
      slug: 'home-page',
      locale: 'en',
      draft: true,
      fallbackLocale: false,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    const homeAr = await payload.findGlobal({
      slug: 'home-page',
      locale: 'ar',
      draft: true,
      fallbackLocale: false,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    expect(homeEn._status).toBe('draft')
    expect(homeAr._status).toBe('draft')
    expect(homeEn.interactiveSystems?.systems?.map((s) => s.title)).toEqual(
      DEFAULT_INTERACTIVE_SYSTEMS_EN.map((s) => s.title),
    )
    expect(homeAr.interactiveSystems?.systems?.map((s) => s.title)).toEqual(
      DEFAULT_INTERACTIVE_SYSTEMS_AR.map((s) => s.title),
    )
    expect(homeEn.interactiveSystems?.relatedProjectsLabel).toBe('Related projects')
    expect(homeAr.interactiveSystems?.relatedProjectsLabel).toBe('مشاريع ذات صلة')
    expect(homeEn.statsSection?.backgroundImage).toBeTruthy()

    // D-10: Exactly one Zamil brand exists ("Zamil Air Conditioners"), and no separate "Zamil" brand remains
    const zamilBrands = await payload.find({
      collection: 'brands',
      where: { name: { contains: 'Zamil' } },
      limit: 10,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    expect(zamilBrands.docs.map((b) => b.name)).toEqual(['Zamil Air Conditioners'])

    // D-01: Verify live globals/stats and draft globals contain zero owner-rejected claims
    const [navEn, navAr, statsEn, aboutEn, aboutAr, projectsPageEn, projectsPageAr] =
      await Promise.all([
        payload.findGlobal({
          slug: 'navigation',
          locale: 'en',
          overrideAccess: false,
          user: SEED_ADMIN_USER,
        }),
        payload.findGlobal({
          slug: 'navigation',
          locale: 'ar',
          overrideAccess: false,
          user: SEED_ADMIN_USER,
        }),
        payload.find({
          collection: 'stats',
          sort: 'order',
          limit: 20,
          locale: 'en',
          overrideAccess: false,
          user: SEED_ADMIN_USER,
        }),
        payload.findGlobal({
          slug: 'about-page',
          locale: 'en',
          draft: true,
          overrideAccess: false,
          user: SEED_ADMIN_USER,
        }),
        payload.findGlobal({
          slug: 'about-page',
          locale: 'ar',
          draft: true,
          overrideAccess: false,
          user: SEED_ADMIN_USER,
        }),
        payload.findGlobal({
          slug: 'projects-page',
          locale: 'en',
          draft: true,
          overrideAccess: false,
          user: SEED_ADMIN_USER,
        }),
        payload.findGlobal({
          slug: 'projects-page',
          locale: 'ar',
          draft: true,
          overrideAccess: false,
          user: SEED_ADMIN_USER,
        }),
      ])

    const liveAndDraftCopyBlob = JSON.stringify({
      siteSettingsEn,
      siteSettingsAr,
      navEn,
      navAr,
      statsEn: statsEn.docs,
      aboutEn,
      aboutAr,
      projectsPageEn,
      projectsPageAr,
    })
    expect(liveAndDraftCopyBlob).not.toMatch(/within one working day/i)
    expect(liveAndDraftCopyBlob).not.toContain('خلال يوم عمل')
    expect(liveAndDraftCopyBlob).not.toMatch(/Rashwan/i)
    expect(liveAndDraftCopyBlob).not.toContain('رشوان')
    expect(liveAndDraftCopyBlob).not.toMatch(/formerly known as IMDAD/i)
    expect(liveAndDraftCopyBlob).not.toContain('المعروفة سابقاً')
    expect(liveAndDraftCopyBlob).not.toMatch(/100\+\s+completed/i)
    expect(liveAndDraftCopyBlob).not.toMatch(/Over 100 completed/i)
    expect(JSON.stringify({ siteSettingsEn, siteSettingsAr, navEn, navAr })).not.toContain(
      '[placeholder]',
    )
  }, 180_000)

  it('refuses a second run without --reseed (first-run baseline guard) and leaves the database unchanged', async () => {
    const beforeProjects = await payload.find({
      collection: 'projects',
      sort: 'order',
      limit: 200,
      depth: 0,
      draft: true,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    const beforeDigest = beforeProjects.docs.map((p) => `${p.slug}:${p.updatedAt}`).join('\n')

    await expect(
      seedP4T2Content(payload, {
        nodeEnv: 'test',
        argv: ['node', 'scripts/seed.ts'],
        reseed: false,
      }),
    ).rejects.toThrow(/Refusing to run seed on a non-empty database/)

    const afterProjects = await payload.find({
      collection: 'projects',
      sort: 'order',
      limit: 200,
      depth: 0,
      draft: true,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    const afterDigest = afterProjects.docs.map((p) => `${p.slug}:${p.updatedAt}`).join('\n')
    expect(afterDigest).toBe(beforeDigest)
  }, 60_000)

  it('hides all drafts, [placeholder] items, and admin-only review fields (needsClientReview, reviewNote) from anonymous visitors across Local API and REST endpoints', async () => {
    // 1. Anonymous Local API (`overrideAccess: false`, `user: undefined`, `draft: false`)
    const [anonServices, anonTeam, anonProjects] = await Promise.all([
      payload.find({
        collection: 'services',
        draft: false,
        overrideAccess: false,
      }),
      payload.find({
        collection: 'team',
        overrideAccess: false,
      }),
      payload.find({
        collection: 'projects',
        draft: false,
        limit: 200,
        overrideAccess: false,
      }),
    ])

    expect(anonServices.totalDocs).toBe(0)
    expect(anonTeam.totalDocs).toBe(0)
    expect(anonProjects.totalDocs).toBe(17)

    for (const proj of anonProjects.docs) {
      expect(proj._status).toBe('published')
      expect(proj.coverImage).toBeTruthy()
      expect(JSON.stringify(proj)).not.toContain('[placeholder]')
      expect((proj as unknown as Record<string, unknown>).needsClientReview).toBeUndefined()
      expect((proj as unknown as Record<string, unknown>).reviewNote).toBeUndefined()
    }

    // 2. Anonymous REST API (`GET /api/services`, `/api/team`, `/api/projects`, `/api/globals/*`)
    const callRestGet = async (
      urlPath: string,
    ): Promise<{ status: number; body: Record<string, unknown> }> => {
      const cleanPath = urlPath.replace(/^\/api\//, '').split('?')[0] ?? ''
      const slug = cleanPath.split('/').filter(Boolean)
      const req = new Request(`http://localhost:3000${urlPath}`, {
        method: 'GET',
      })
      const res = await getHandler(req, {
        params: Promise.resolve({ slug }),
      })
      const body = (await res.json()) as Record<string, unknown>
      return { status: res.status, body }
    }

    const restServices = await callRestGet('/api/services?limit=200')
    expect(restServices.status).toBe(200)
    expect((restServices.body as { totalDocs: number }).totalDocs).toBe(0)

    const restTeam = await callRestGet('/api/team?limit=200')
    expect(restTeam.status).toBe(200)
    expect((restTeam.body as { totalDocs: number }).totalDocs).toBe(0)

    const restProjects = await callRestGet('/api/projects?limit=200')
    expect(restProjects.status).toBe(200)
    const restProjectDocs = (
      restProjects.body as { docs: Array<Record<string, unknown>>; totalDocs: number }
    ).docs
    expect((restProjects.body as { totalDocs: number }).totalDocs).toBe(17)
    expect(JSON.stringify(restProjectDocs)).not.toContain('[placeholder]')
    for (const doc of restProjectDocs) {
      expect(doc.needsClientReview).toBeUndefined()
      expect(doc.reviewNote).toBeUndefined()
    }

    for (const pageGlobalSlug of [
      'home-page',
      'services-page',
      'about-page',
      'projects-page',
      'contact-page',
      'privacy-page',
    ] as const) {
      const res = await callRestGet(`/api/globals/${pageGlobalSlug}`)
      expect(res.status).toBe(200)
      expect(res.body._status).toBeUndefined()
      expect(res.body.hero).toBeUndefined()
      expect(res.body.pageHeader).toBeUndefined()
      expect(JSON.stringify(res.body)).not.toContain('[placeholder]')

      const draftAttempt = await callRestGet(`/api/globals/${pageGlobalSlug}?draft=true`)
      expect(draftAttempt.status).toBe(200)
      expect(draftAttempt.body._status).toBeUndefined()
      expect(draftAttempt.body.hero).toBeUndefined()
      expect(draftAttempt.body.pageHeader).toBeUndefined()

      const versionsAttempt = await callRestGet(`/api/globals/${pageGlobalSlug}/versions`)
      expect(versionsAttempt.status).toBe(403)
    }

    // 3. M-172 / D-05 / A-05: Verify `reviewNote` is strictly admin-only (editors cannot read or update `reviewNote`, while `needsClientReview` remains staff-readable)
    const editorUser = {
      ...SEED_ADMIN_USER,
      id: 999,
      email: 'editor-test@aljazira.co',
      name: 'Editor Test',
      role: 'editor' as const,
    }
    const [editorProjects, adminProjects] = await Promise.all([
      payload.find({
        collection: 'projects',
        draft: true,
        limit: 5,
        sort: 'order',
        overrideAccess: false,
        user: editorUser,
      }),
      payload.find({
        collection: 'projects',
        draft: true,
        limit: 5,
        sort: 'order',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
    ])
    expect(editorProjects.docs.length).toBeGreaterThan(0)
    const firstEditorProj = editorProjects.docs[0]
    const firstAdminProj = adminProjects.docs[0]
    expect(firstEditorProj.needsClientReview).toBe(true)
    expect((firstEditorProj as unknown as Record<string, unknown>).reviewNote).toBeUndefined()
    expect(typeof firstAdminProj.reviewNote).toBe('string')
    expect((firstAdminProj.reviewNote ?? '').length).toBeGreaterThan(20)

    const originalNote = firstAdminProj.reviewNote
    await payload.update({
      collection: 'projects',
      id: firstAdminProj.id,
      draft: true,
      data: {
        reviewNote: 'EDITOR_UNAUTHORIZED_WRITE_ATTEMPT',
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: editorUser,
    })
    const afterEditorUpdate = await payload.findByID({
      collection: 'projects',
      id: firstAdminProj.id,
      draft: true,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    expect(afterEditorUpdate.reviewNote).toBe(originalNote)
  }, 60_000)

  it('logs all deleted counts on --reseed when rebuilding a populated Phase 4 database', async () => {
    const reseedSummary = await seedP4T2Content(payload, {
      nodeEnv: 'test',
      argv: ['node', 'scripts/seed.ts', '--reseed'],
      reseed: true,
    })

    expect(reseedSummary.reseeded).toBe(true)
    expect(reseedSummary.deletedCounts).toEqual({
      projects: 91,
      services: 10,
      team: 13,
      stats: 5,
      materials: 73,
      brands: 99,
      media: 26,
    })

    const lines = formatP4T2SummaryLines(reseedSummary).join('\n')
    expect(lines).toContain(
      'mode: reseed (--reseed, deleted projects=91, services=10, team=13, stats=5, materials=73, brands=99, media=26)',
    )
  }, 180_000)
})
