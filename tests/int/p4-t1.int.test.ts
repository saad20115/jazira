import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import payloadConfig from '../../src/payload.config'
import { SEED_ADMIN_USER, seedMaterialsAndBrands } from '../../src/seed/materials'

let payload: Payload

describe('P4-T1 Integration — Materials + brands seed (73 rows, first-run baseline, --reseed, Local API)', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: payloadConfig })

    // Ensure a clean starting state before first-run baseline test
    await payload.delete({
      collection: 'materials',
      where: {
        itemNo: {
          greater_than_equal: 1,
        },
      },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'brands',
      where: {
        id: {
          exists: true,
        },
      },
      overrideAccess: true,
    })
  })

  it('refuses to run on a half-empty database when only brands exist or only materials exist, leaving the DB unchanged (R-8)', async () => {
    // 1. Brands-only state (brands=1, materials=0)
    const soloBrand = await payload.create({
      collection: 'brands',
      locale: 'en',
      data: {
        name: 'Solo Guard Brand',
        origin: 'Saudi Arabia',
        showInMarquee: false,
        order: 99,
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    await expect(
      seedMaterialsAndBrands(payload, {
        nodeEnv: 'test',
        argv: ['node', 'scripts/seed.ts'],
      }),
    ).rejects.toThrow(/Refusing to run seed on a non-empty database \(brands=1, materials=0\)/)

    const [brandsAfterCase1, materialsAfterCase1] = await Promise.all([
      payload.find({
        collection: 'brands',
        limit: 10,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'materials',
        limit: 10,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
    ])
    expect(brandsAfterCase1.totalDocs).toBe(1)
    expect(brandsAfterCase1.docs[0]?.name).toBe('Solo Guard Brand')
    expect(materialsAfterCase1.totalDocs).toBe(0)

    // 2. Materials-only state (brands=0, materials=1)
    const soloMaterial = await payload.create({
      collection: 'materials',
      locale: 'en',
      data: {
        itemNo: 999,
        system: 'electrical',
        description: 'Solo Guard Material',
        brands: [soloBrand.id],
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    await payload.db.deleteOne({
      collection: 'brands',
      where: {
        id: {
          equals: soloBrand.id,
        },
      },
    })

    await expect(
      seedMaterialsAndBrands(payload, {
        nodeEnv: 'test',
        argv: ['node', 'scripts/seed.ts'],
      }),
    ).rejects.toThrow(/Refusing to run seed on a non-empty database \(brands=0, materials=1\)/)

    const [brandsAfterCase2, materialsAfterCase2] = await Promise.all([
      payload.find({
        collection: 'brands',
        limit: 10,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'materials',
        limit: 10,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
    ])
    expect(brandsAfterCase2.totalDocs).toBe(0)
    expect(materialsAfterCase2.totalDocs).toBe(1)
    expect(materialsAfterCase2.docs[0]?.itemNo).toBe(999)

    // Clean up the 1 remaining material before the full baseline seed test
    await payload.delete({
      collection: 'materials',
      id: soloMaterial.id,
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
  })

  it('seeds all 73 materials and 83 normalized brands on an empty DB, refuses on a non-empty DB preserving editor changes, refuses --reseed in production, and rebuilds on dev --reseed (R-4, R-11)', async () => {
    const run1 = await seedMaterialsAndBrands(payload, {
      nodeEnv: 'test',
      argv: ['node', 'scripts/seed.ts'],
    })

    expect(run1.reseeded).toBe(false)
    expect(run1.materialsCreated).toBe(73)
    expect(run1.materialsUpdated).toBe(0)
    expect(run1.materialsUnchanged).toBe(0)
    expect(run1.materialsTotal).toBe(73)

    expect(run1.brandsCreated).toBe(83)
    expect(run1.brandsUpdated).toBe(0)
    expect(run1.brandsUnchanged).toBe(0)
    expect(run1.brandsTotal).toBe(83)

    expect(run1.everyMaterialHasAtLeastOneBrand).toBe(true)
    expect(run1.minBrandsPerMaterial).toBeGreaterThanOrEqual(1)
    expect(run1.systemCounts).toEqual({
      electrical: 20,
      mechanical: 37,
      structural: 8,
      architectural: 8,
    })

    // Simulate editor changes in the CMS (`handoff/reviews/P4-T1.md` R-4):
    // 1. Rename "Tyco" -> "Tyco Fire" and toggle showInMarquee -> false
    // 2. Edit material #1 Arabic description and note
    const tycoRes = await payload.find({
      collection: 'brands',
      where: { name: { equals: 'Tyco' } },
      limit: 1,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    const tycoDoc = tycoRes.docs[0]
    expect(tycoDoc).toBeDefined()

    await payload.update({
      collection: 'brands',
      id: tycoDoc.id,
      data: {
        name: 'Tyco Fire',
        showInMarquee: false,
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    const mat1Res = await payload.find({
      collection: 'materials',
      where: { itemNo: { equals: 1 } },
      limit: 1,
      locale: 'ar',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    const mat1Doc = mat1Res.docs[0]
    expect(mat1Doc).toBeDefined()

    await payload.update({
      collection: 'materials',
      id: mat1Doc.id,
      locale: 'ar',
      data: {
        description: 'مواسير EMT معتمدة من المحرر',
        notes: 'ملاحظة خاصة بالمحرر',
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    // Rerun without --reseed on a non-empty DB MUST refuse (exit 1 in CLI) and leave editor edits untouched
    await expect(
      seedMaterialsAndBrands(payload, {
        nodeEnv: 'test',
        argv: ['node', 'scripts/seed.ts'],
      }),
    ).rejects.toThrow(/Refusing to run seed on a non-empty database \(brands=83, materials=73\)/)

    // Verify editor changes were NOT overwritten and no duplicate "Tyco" was created
    const [afterRefusalBrands, afterRefusalMat1Ar] = await Promise.all([
      payload.find({
        collection: 'brands',
        limit: 200,
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.findByID({
        collection: 'materials',
        id: mat1Doc.id,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
    ])
    expect(afterRefusalBrands.totalDocs).toBe(83)
    expect(afterRefusalBrands.docs.find((b) => b.name === 'Tyco')).toBeUndefined()
    const tycoFireAfter = afterRefusalBrands.docs.find((b) => b.name === 'Tyco Fire')
    expect(tycoFireAfter).toBeDefined()
    expect(tycoFireAfter?.showInMarquee).toBe(false)
    expect(afterRefusalBrands.docs.filter((b) => b.showInMarquee)).toHaveLength(19)
    expect(afterRefusalMat1Ar.description).toBe('مواسير EMT معتمدة من المحرر')
    expect(afterRefusalMat1Ar.notes).toBe('ملاحظة خاصة بالمحرر')

    // --reseed MUST be refused when NODE_ENV=production (with or without --force-production)
    await expect(
      seedMaterialsAndBrands(payload, {
        nodeEnv: 'production',
        argv: ['node', 'scripts/seed.ts', '--reseed'],
      }),
    ).rejects.toThrow(/Refusing to run --reseed when NODE_ENV=production/)

    await expect(
      seedMaterialsAndBrands(payload, {
        nodeEnv: 'production',
        argv: ['node', 'scripts/seed.ts', '--force-production', '--reseed'],
      }),
    ).rejects.toThrow(/Refusing to run --reseed when NODE_ENV=production/)

    // --reseed in development/test rebuilds the clean baseline (83 brands, 73 materials, 20 marquee)
    const reseedRun = await seedMaterialsAndBrands(payload, {
      nodeEnv: 'test',
      argv: ['node', 'scripts/seed.ts', '--reseed'],
    })
    expect(reseedRun.reseeded).toBe(true)
    expect(reseedRun.brandsDeleted).toBe(83)
    expect(reseedRun.materialsDeleted).toBe(73)
    expect(reseedRun.brandsCreated).toBe(83)
    expect(reseedRun.brandsTotal).toBe(83)
    expect(reseedRun.materialsCreated).toBe(73)
    expect(reseedRun.materialsTotal).toBe(73)
  }, 120000)

  it('persists localized en/ar descriptions, Hi-Tech origin (R-1), uncertain typo review notes (R-2), literal Arabic drafts (R-3, R-10), and Hempel + Jazeera normalization (R-5, R-9)', async () => {
    const [materialsEn, materialsAr, brandsEn, brandsAr] = await Promise.all([
      payload.find({
        collection: 'materials',
        sort: 'itemNo',
        limit: 100,
        depth: 1,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'materials',
        sort: 'itemNo',
        limit: 100,
        depth: 1,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'brands',
        sort: 'name',
        limit: 100,
        depth: 0,
        locale: 'en',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
      payload.find({
        collection: 'brands',
        sort: 'name',
        limit: 100,
        depth: 0,
        locale: 'ar',
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      }),
    ])

    expect(materialsEn.totalDocs).toBe(73)
    expect(materialsAr.totalDocs).toBe(73)
    expect(brandsEn.totalDocs).toBe(83)
    expect(brandsAr.totalDocs).toBe(83)
    expect(brandsEn.docs.filter((b) => b.showInMarquee)).toHaveLength(20)

    const mat1En = materialsEn.docs.find((m) => m.itemNo === 1)
    const mat1Ar = materialsAr.docs.find((m) => m.itemNo === 1)
    expect(mat1En?.description).toBe('EMT Conduit')
    expect(mat1Ar?.description).toBe('مواسير EMT')

    const mat7En = materialsEn.docs.find((m) => m.itemNo === 7)
    expect(mat7En?.description).toBe('Electric Cables')

    const mat30En = materialsEn.docs.find((m) => m.itemNo === 30)
    expect(mat30En?.description).toBe('Pressure Gauge')

    const mat34En = materialsEn.docs.find((m) => m.itemNo === 34)
    expect(mat34En?.description).toBe('Fire Extinguisher')

    // R-1: Hi-Tech origin is United States / الولايات المتحدة
    const hiTechEn = brandsEn.docs.find((b) => b.name === 'Hi-Tech')
    const hiTechAr = brandsAr.docs.find((b) => b.name === 'Hi-Tech')
    expect(hiTechEn?.origin).toBe('United States')
    expect(hiTechAr?.origin).toBe('الولايات المتحدة')

    // R-2: Uncertain description typos left as-is in English, translated literally in Arabic, with review notes
    const mat13En = materialsEn.docs.find((m) => m.itemNo === 13)
    const mat13Ar = materialsAr.docs.find((m) => m.itemNo === 13)
    expect(mat13En?.description).toBe('Disconnected Switch')
    expect(mat13Ar?.description).toBe('مفتاح مفصول')
    expect(mat13En?.notes).toContain('DISCONNECTED SWITCH')
    expect(mat13Ar?.notes).toContain('DISCONNECTED SWITCH')

    const mat27En = materialsEn.docs.find((m) => m.itemNo === 27)
    const mat27Ar = materialsAr.docs.find((m) => m.itemNo === 27)
    expect(mat27En?.description).toBe('Temper Switch')
    expect(mat27Ar?.description).toBe('مفتاح تقسية')
    expect(mat27En?.notes).toContain('TEMPER SWITCH')

    const mat54En = materialsEn.docs.find((m) => m.itemNo === 54)
    const mat54Ar = materialsAr.docs.find((m) => m.itemNo === 54)
    expect(mat54En?.description).toBe('Out Let Grill')
    expect(mat54Ar?.description).toBe('شبكة مخرج')
    expect(mat54En?.notes).toContain('OUT LET GRILL')

    // R-3 & R-10: Literal Arabic drafts with zero invented specs
    expect(materialsAr.docs.find((m) => m.itemNo === 16)?.description).toBe('إنارة')
    expect(materialsAr.docs.find((m) => m.itemNo === 18)?.description).toBe('إنارة')
    expect(materialsAr.docs.find((m) => m.itemNo === 23)?.description).toBe('قطع اتصال مخددة')
    expect(materialsAr.docs.find((m) => m.itemNo === 24)?.description).toBe('قطع اتصال مسننة')
    expect(materialsAr.docs.find((m) => m.itemNo === 26)?.description).toBe('ZCV للحريق')
    expect(materialsAr.docs.find((m) => m.itemNo === 35)?.description).toBe('نوفيك (NOVEC)')
    expect(materialsAr.docs.find((m) => m.itemNo === 47)?.description).toBe('خزان طرد للمرحاض (WC)')
    expect(materialsAr.docs.find((m) => m.itemNo === 53)?.description).toBe('مواسير DX')
    expect(materialsAr.docs.find((m) => m.itemNo === 68)?.description).toBe('إضافات اللياسة')

    // R-5 & R-9: Hempel (Coating) -> Hempel and JAZEERA (PRIMER) -> Jazeera, with notes preserved on material #31
    const hempelEn = brandsEn.docs.find((b) => b.name === 'Hempel')
    const hempelAr = brandsAr.docs.find((b) => b.name === 'Hempel')
    expect(hempelEn).toBeDefined()
    expect(hempelEn?.origin).toBe('Denmark')
    expect(hempelAr?.origin).toBe('الدنمارك')
    expect(hempelEn?.showInMarquee).toBe(true)
    expect(hempelEn?.order).toBe(14)

    const jazeeraEn = brandsEn.docs.find((b) => b.name === 'Jazeera')
    const jazeeraAr = brandsAr.docs.find((b) => b.name === 'Jazeera')
    expect(jazeeraEn).toBeDefined()
    expect(jazeeraEn?.origin).toBe('Saudi Arabia')
    expect(jazeeraAr?.origin).toBe('المملكة العربية السعودية')
    expect(brandsEn.docs.find((b) => b.name === 'Jazeera (Primer)')).toBeUndefined()

    const mat31En = materialsEn.docs.find((m) => m.itemNo === 31)
    const mat31Ar = materialsAr.docs.find((m) => m.itemNo === 31)
    expect(mat31En?.notes).toContain('Hempel (Coating)')
    expect(mat31En?.notes).toContain('Jazeera (Primer)')
    expect(mat31Ar?.notes).toContain('همبل (طلاء / Coating)')
    expect(mat31Ar?.notes).not.toContain('طلاء نهائي')

    // Structural row 58: Saudi Ready Mix & Nesma Concrete Solutions have empty origins
    const saudiReadyMixEn = brandsEn.docs.find((b) => b.name === 'Saudi Ready Mix')
    const saudiReadyMixAr = brandsAr.docs.find((b) => b.name === 'Saudi Ready Mix')
    expect(saudiReadyMixEn).toBeDefined()
    expect(saudiReadyMixEn?.origin ?? null).toBeNull()
    expect(saudiReadyMixAr?.origin ?? null).toBeNull()

    const nesmaEn = brandsEn.docs.find((b) => b.name === 'Nesma Concrete Solutions')
    expect(nesmaEn).toBeDefined()
    expect(nesmaEn?.origin ?? null).toBeNull()

    // Architectural row 69: Saudi Ceramics (Saudi Arabia from row 49) & Alfanar Cermics (null origin)
    const saudiCeramicsEn = brandsEn.docs.find((b) => b.name === 'Saudi Ceramics')
    const saudiCeramicsAr = brandsAr.docs.find((b) => b.name === 'Saudi Ceramics')
    expect(saudiCeramicsEn?.origin).toBe('Saudi Arabia')
    expect(saudiCeramicsAr?.origin).toBe('المملكة العربية السعودية')

    const alfanarCermicsEn = brandsEn.docs.find((b) => b.name === 'Alfanar Cermics')
    expect(alfanarCermicsEn?.origin ?? null).toBeNull()
  })
})
