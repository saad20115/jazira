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

describe(
  'P4-T2 Integration — Settings, services, projects (91 + 17 photos), marquee (20), copy & placeholders seed',
  { shuffle: false },
  () => {
  beforeAll(async () => {
      const { assertTestDatabaseIsolation } = await import('./_helpers/testDbIsolation')
      assertTestDatabaseIsolation()
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

  it('refuses to run seedP4T2Content without --reseed when P4-T1 is half-empty (brands only or materials only) and leaves the database unchanged (R-14)', async () => {
    // 1. Half-empty case A: brands > 0, materials === 0
    const createdBrand = await payload.create({
      collection: 'brands',
      locale: 'en',
      data: {
        name: 'Half Empty Guard Brand',
        order: 1,
        showInMarquee: false,
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    await expect(
      seedP4T2Content(payload, {
        nodeEnv: 'test',
        argv: ['node', 'scripts/seed.ts'],
        reseed: false,
      }),
    ).rejects.toThrow(
      /Refusing to run seed on a non-empty database \(brands=1, materials=0, stats=0, services=0, projects=0, team=0\)/,
    )

      const [
        brandsAfterA,
        materialsAfterA,
        statsAfterA,
        servicesAfterA,
        projectsAfterA,
        teamAfterA,
      ] = await Promise.all([
        payload.count({ collection: 'brands', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'materials', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'stats', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'services', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'projects', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'team', overrideAccess: false, user: SEED_ADMIN_USER }),
      ])
    expect(brandsAfterA.totalDocs).toBe(1)
    expect(materialsAfterA.totalDocs).toBe(0)
    expect(statsAfterA.totalDocs).toBe(0)
    expect(servicesAfterA.totalDocs).toBe(0)
    expect(projectsAfterA.totalDocs).toBe(0)
    expect(teamAfterA.totalDocs).toBe(0)

    await payload.delete({
      collection: 'brands',
      id: createdBrand.id,
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    // 2. Half-empty case B: brands === 0, materials > 0
    const createdMaterial = (await payload.db.create({
      collection: 'materials',
      data: {
        itemNo: 1,
        system: 'electrical',
        description: {
          en: 'Half Empty Guard Material',
          ar: 'مادة اختبار',
        },
      },
    })) as { id: number | string }

    await expect(
      seedP4T2Content(payload, {
        nodeEnv: 'test',
        argv: ['node', 'scripts/seed.ts'],
        reseed: false,
      }),
    ).rejects.toThrow(
      /Refusing to run seed on a non-empty database \(brands=0, materials=1, stats=0, services=0, projects=0, team=0\)/,
    )

      const [
        brandsAfterB,
        materialsAfterB,
        statsAfterB,
        servicesAfterB,
        projectsAfterB,
        teamAfterB,
      ] = await Promise.all([
        payload.count({ collection: 'brands', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'materials', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'stats', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'services', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'projects', overrideAccess: false, user: SEED_ADMIN_USER }),
        payload.count({ collection: 'team', overrideAccess: false, user: SEED_ADMIN_USER }),
      ])
    expect(brandsAfterB.totalDocs).toBe(0)
    expect(materialsAfterB.totalDocs).toBe(1)
    expect(statsAfterB.totalDocs).toBe(0)
    expect(servicesAfterB.totalDocs).toBe(0)
    expect(projectsAfterB.totalDocs).toBe(0)
    expect(teamAfterB.totalDocs).toBe(0)

    await payload.db.deleteOne({
      collection: 'materials',
      where: {
        id: {
          equals: createdMaterial.id,
        },
      },
    })
  }, 60_000)

  it('seeds the full Phase 4 baseline (P4-T1 + P4-T2) via --reseed and verifies all counts, locales, marquee order, and home-page interactiveSystems in both en & ar', async () => {
    const summary = await seedP4T2Content(payload, {
      nodeEnv: 'test',
        argv: ['node', 'scripts/seed.ts', '--reseed', '--i-understand-this-deletes-content'],
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
      draftWithoutPhoto: 70,
      featured: 6,
      total: 91,
    })
    expect(summary.teamPlaceholdersCreatedInactive).toBe(13)
    // Owner decision 2026-11-08: the Figma baseline is published at launch.
    expect(summary.figmaBaseline).toEqual({
      servicesPublished: 10,
      pageGlobalsPublished: [
        'home-page',
        'services-page',
        'about-page',
        'projects-page',
        'contact-page',
      ],
      featuredProjectsPublishedWithFigmaCover: 4,
    })
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
      expect(marqueeEn.docs.map((b) => b.order)).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1),
      )
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
    expect(homeEn._status).toBe('published')
    expect(homeAr._status).toBe('published')
    expect(homeEn.interactiveSystems?.systems?.map((s) => s.title)).toEqual(
      DEFAULT_INTERACTIVE_SYSTEMS_EN.map((s) => s.title),
    )
    expect(homeAr.interactiveSystems?.systems?.map((s) => s.title)).toEqual(
      DEFAULT_INTERACTIVE_SYSTEMS_AR.map((s) => s.title),
    )
    expect(homeEn.interactiveSystems?.relatedProjectsLabel).toBe('Related projects')
    expect(homeAr.interactiveSystems?.relatedProjectsLabel).toBe('مشاريع ذات صلة')
    expect(homeEn.statsSection?.backgroundImage).toBeTruthy()

    // D-10 & R-18: Exactly one Zamil brand exists ("Zamil Air Conditioners" with empty P4-T1 origin filled as "Saudi Arabia"), while Belden preserves its existing P4-T1 client origin ("United States")
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
    expect(zamilBrands.docs[0]?.origin).toBe('Saudi Arabia')

    const beldenBrandEn = marqueeEn.docs.find((b) => b.name === 'Belden')
    expect(beldenBrandEn?.origin).toBe('United States')

    // R-13: Jeddah Palace Hotel (XLSX-22) is seeded with 'Makkah Region, KSA' / 'منطقة مكة المكرمة، المملكة العربية السعودية' (never rewritten as a city)
    const [jeddahPalaceEn, jeddahPalaceAr, pnuAr, statsAr] = await Promise.all([
      payload.find({
        collection: 'projects',
        where: { slug: { equals: 'jeddah-palace-hotel' } },
        limit: 1,
        depth: 0,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'projects',
        where: { slug: { equals: 'jeddah-palace-hotel' } },
        limit: 1,
        depth: 0,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'projects',
        where: { slug: { equals: 'princess-noura-university-pnu' } },
        limit: 1,
        depth: 0,
        draft: true,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'stats',
        sort: 'order',
        limit: 10,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
    ])
    expect(jeddahPalaceEn.docs[0]?.location).toBe('Makkah Region, KSA')
    expect(jeddahPalaceAr.docs[0]?.location).toBe('منطقة مكة المكرمة، المملكة العربية السعودية')
    // R-17: Arabic drafts translate the English source without adding extra facts
    expect(pnuAr.docs[0]?.title).toBe('جامعة الأميرة نورة (PNU)')
    expect(statsAr.docs.find((s) => s.value === '3')?.label).toBe('دول نخدمها')

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

  it('shows the published Figma baseline and hides drafts, [placeholder] items, placeholder-flagged media and admin-only review fields (needsClientReview, reviewNote) from anonymous visitors across Local API and REST endpoints', async () => {
    // 1. Anonymous Local API (`overrideAccess: false`, `user: undefined`, `draft: false`)
    const [anonServices, anonTeam, anonProjects, anonMedia] = await Promise.all([
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
      payload.find({
        collection: 'media',
        limit: 200,
        overrideAccess: false,
      }),
    ])

    // Owner decision 2026-11-08: the 10 services are published; the team placeholders stay inactive.
    expect(anonServices.totalDocs).toBe(10)
    for (const svc of anonServices.docs) {
      expect(svc._status).toBe('published')
      expect(JSON.stringify(svc)).not.toContain('[placeholder]')
    }
    expect(anonTeam.totalDocs).toBe(0)
    // 17 projects with a real photo + 4 featured projects published with their Figma image.
    expect(anonProjects.totalDocs).toBe(21)
    expect(anonProjects.docs.filter((p) => p.featured)).toHaveLength(6)
    // Owner decision 2026-11-08: the 17 real project photos and the 9 Figma images are public.
    expect(anonMedia.totalDocs).toBe(26)

    for (const mediaDoc of anonMedia.docs) {
      expect(JSON.stringify(mediaDoc)).not.toContain('[placeholder]')
      expect((mediaDoc as unknown as Record<string, unknown>).placeholder).toBeUndefined()
      // R-16: Verify og size never enlarges beyond original image dimensions
      if (typeof mediaDoc.width === 'number' && typeof mediaDoc.sizes?.og?.width === 'number') {
        expect(mediaDoc.sizes.og.width).toBeLessThanOrEqual(mediaDoc.width)
      }
      if (typeof mediaDoc.height === 'number' && typeof mediaDoc.sizes?.og?.height === 'number') {
        expect(mediaDoc.sizes.og.height).toBeLessThanOrEqual(mediaDoc.height)
      }
    }

    for (const proj of anonProjects.docs) {
      expect(proj._status).toBe('published')
      expect(proj.coverImage).toBeTruthy()
      expect(JSON.stringify(proj)).not.toContain('[placeholder]')
      expect((proj as unknown as Record<string, unknown>).needsClientReview).toBeUndefined()
      expect((proj as unknown as Record<string, unknown>).reviewNote).toBeUndefined()
    }

    // 2. Anonymous REST API (`GET /api/services`, `/api/team`, `/api/projects`, `/api/media`, `/api/globals/*`)
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

    const callRestRawGet = async (urlPath: string): Promise<Response> => {
      const cleanPath = urlPath.replace(/^\/api\//, '').split('?')[0] ?? ''
      const slug = cleanPath.split('/').filter(Boolean)
      const req = new Request(`http://localhost:3000${urlPath}`, {
        method: 'GET',
      })
      return getHandler(req, {
        params: Promise.resolve({ slug }),
      })
    }

    const restServices = await callRestGet('/api/services?limit=200')
    expect(restServices.status).toBe(200)
    expect((restServices.body as { totalDocs: number }).totalDocs).toBe(10)

    const restTeam = await callRestGet('/api/team?limit=200')
    expect(restTeam.status).toBe(200)
    expect((restTeam.body as { totalDocs: number }).totalDocs).toBe(0)

    const restProjects = await callRestGet('/api/projects?limit=200')
    expect(restProjects.status).toBe(200)
    const restProjectDocs = (
      restProjects.body as { docs: Array<Record<string, unknown>>; totalDocs: number }
    ).docs
    expect((restProjects.body as { totalDocs: number }).totalDocs).toBe(21)
    expect(JSON.stringify(restProjectDocs)).not.toContain('[placeholder]')
    for (const doc of restProjectDocs) {
      expect(doc.needsClientReview).toBeUndefined()
      expect(doc.reviewNote).toBeUndefined()
    }

    // R-12: Anonymous REST list `/api/media`, by ID `/api/media/:id`, and file URL `/api/media/file/:filename`
    const restMedia = await callRestGet('/api/media?limit=200')
    expect(restMedia.status).toBe(200)
    const restMediaDocs = (
      restMedia.body as { docs: Array<Record<string, unknown>>; totalDocs: number }
    ).docs
    expect((restMedia.body as { totalDocs: number }).totalDocs).toBe(26)
    expect(JSON.stringify(restMediaDocs)).not.toContain('[placeholder]')
    for (const doc of restMediaDocs) {
      expect(doc.placeholder).toBeUndefined()
    }

    // The seed flags no media as placeholder any more (owner decision 2026-11-08), but the R-12 rule
    // still holds: media that an editor flags as placeholder is hidden from anonymous visitors.
    const seededPlaceholderMedia = await payload.find({
      collection: 'media',
      where: { placeholder: { equals: true } },
      limit: 50,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    expect(seededPlaceholderMedia.totalDocs).toBe(0)

    const flaggedMediaId = anonMedia.docs[anonMedia.docs.length - 1]?.id
    expect(flaggedMediaId).toBeDefined()
    await payload.update({
      collection: 'media',
      id: flaggedMediaId,
      data: { placeholder: true },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    const adminPlaceholderMedia = await payload.find({
      collection: 'media',
      where: { placeholder: { equals: true } },
      limit: 50,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    expect(adminPlaceholderMedia.totalDocs).toBe(1)
    const anonMediaAfterFlag = await payload.find({
      collection: 'media',
      limit: 200,
      overrideAccess: false,
    })
    expect(anonMediaAfterFlag.totalDocs).toBe(25)
    for (const placeholderDoc of adminPlaceholderMedia.docs) {
      const byIdRes = await callRestGet(`/api/media/${String(placeholderDoc.id)}`)
      expect(byIdRes.status).toBe(404)

      if (placeholderDoc.filename) {
        const fileRes = await callRestRawGet(
          `/api/media/file/${encodeURIComponent(placeholderDoc.filename)}`,
        )
        expect(fileRes.status).toBe(403)
      }
      if (placeholderDoc.sizes?.thumb?.filename) {
        const thumbRes = await callRestRawGet(
          `/api/media/file/${encodeURIComponent(placeholderDoc.sizes.thumb.filename)}`,
        )
        expect(thumbRes.status).toBe(403)
      }
    }
    await payload.update({
      collection: 'media',
      id: flaggedMediaId,
      data: { placeholder: false },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    const firstRealMedia = anonMedia.docs[0]
    expect(firstRealMedia.filename).toBeTruthy()
    if (firstRealMedia.filename) {
      const realByIdRes = await callRestGet(`/api/media/${String(firstRealMedia.id)}`)
      expect(realByIdRes.status).toBe(200)
      const realFileRes = await callRestRawGet(
        `/api/media/file/${encodeURIComponent(firstRealMedia.filename)}`,
      )
      expect(realFileRes.status).toBe(200)
    }

    for (const pageGlobalSlug of [
      'home-page',
      'services-page',
      'about-page',
      'projects-page',
      'contact-page',
      'privacy-page',
    ] as const) {
      // Owner decision 2026-11-08: every page global except the privacy page is published at launch.
      const isPublishedAtLaunch = pageGlobalSlug !== 'privacy-page'
      const headerKey = pageGlobalSlug === 'home-page' ? 'hero' : 'pageHeader'
      const res = await callRestGet(`/api/globals/${pageGlobalSlug}`)
      expect(res.status).toBe(200)
      if (isPublishedAtLaunch) {
        expect(res.body[headerKey]).toBeTruthy()
      } else {
        expect(res.body._status).toBeUndefined()
        expect(res.body.hero).toBeUndefined()
        expect(res.body.pageHeader).toBeUndefined()
      }
      expect(JSON.stringify(res.body)).not.toContain('[placeholder]')

      const draftAttempt = await callRestGet(`/api/globals/${pageGlobalSlug}?draft=true`)
      expect(draftAttempt.status).toBe(200)
      expect(JSON.stringify(draftAttempt.body)).not.toContain('[placeholder]')
      if (!isPublishedAtLaunch) {
        expect(draftAttempt.body._status).toBeUndefined()
        expect(draftAttempt.body.hero).toBeUndefined()
        expect(draftAttempt.body.pageHeader).toBeUndefined()
      }

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

    it('logs all deleted counts on --reseed when rebuilding a populated Phase 4 database and preserves non-seed media (D-14, E-09)', async () => {
      // 1. Verify reseed guard fails before any delete when NODE_ENV is unset, confirmation flag is missing, or DB is aljazira_prod
      await expect(
        seedP4T2Content(payload, {
          nodeEnv: '',
          argv: ['node', 'scripts/seed.ts', '--reseed', '--i-understand-this-deletes-content'],
          reseed: true,
        }),
      ).rejects.toThrow(/NODE_ENV/)

      await expect(
        seedP4T2Content(payload, {
      nodeEnv: 'test',
      argv: ['node', 'scripts/seed.ts', '--reseed'],
      reseed: true,
        }),
      ).rejects.toThrow(/--i-understand-this-deletes-content/)

      await expect(
        seedP4T2Content(payload, {
          nodeEnv: 'test',
          argv: ['node', 'scripts/seed.ts', '--reseed', '--i-understand-this-deletes-content'],
          databaseUrl: 'postgresql://aljazira_app:pass@127.0.0.1:5434/aljazira_prod',
          reseed: true,
        }),
      ).rejects.toThrow(/aljazira_prod/)

      // 2. Upload a non-seed media item as an editor and verify it survives --reseed
      const oneByOnePng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      )
      const editorUser = {
        ...SEED_ADMIN_USER,
        id: 999,
        email: 'editor-test@aljazira.co',
        name: 'Editor Test',
        role: 'editor' as const,
      }
      const nonSeedMedia = await payload.create({
        collection: 'media',
        locale: 'en',
        data: {
          alt: 'Editor custom uploaded photo — must survive reseed',
          placeholder: false,
        },
        file: {
          data: oneByOnePng,
          mimetype: 'image/png',
          name: 'editor-custom-photo.png',
          size: oneByOnePng.byteLength,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: editorUser,
      })

      const reseedSummary = await seedP4T2Content(payload, {
        nodeEnv: 'test',
        argv: ['node', 'scripts/seed.ts', '--reseed', '--i-understand-this-deletes-content'],
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

      const survivingMedia = await payload.findByID({
        collection: 'media',
        id: nonSeedMedia.id,
        locale: 'en',
        overrideAccess: false,
        user: editorUser,
      })
      expect(survivingMedia.id).toBe(nonSeedMedia.id)
      expect(survivingMedia.alt).toBe('Editor custom uploaded photo — must survive reseed')

      await payload.delete({
        collection: 'media',
        id: nonSeedMedia.id,
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })

    const lines = formatP4T2SummaryLines(reseedSummary).join('\n')
    expect(lines).toContain(
      'mode: reseed (--reseed, deleted projects=91, services=10, team=13, stats=5, materials=73, brands=99, media=26)',
    )
  }, 180_000)
  },
)
