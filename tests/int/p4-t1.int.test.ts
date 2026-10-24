import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import payloadConfig from '../../src/payload.config'
import { SEED_ADMIN_USER, seedMaterialsAndBrands } from '../../src/seed/materials'

let payload: Payload

describe('P4-T1 Integration — Materials + brands seed (73 rows, idempotency, Local API)', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: payloadConfig })

    // Ensure a clean starting state before Run 1
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

  it('seeds all 73 materials and 83 normalized brands on Run 1, and changes 0 rows / 0 updatedAt timestamps on Run 2', async () => {
    const run1 = await seedMaterialsAndBrands(payload, {
      nodeEnv: 'test',
      argv: ['node', 'scripts/seed.ts'],
    })

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

    // Consecutive Run 2: must create 0, update 0, and leave every updatedAt timestamp identical
    const run2 = await seedMaterialsAndBrands(payload, {
      nodeEnv: 'test',
      argv: ['node', 'scripts/seed.ts'],
    })

    expect(run2.materialsCreated).toBe(0)
    expect(run2.materialsUpdated).toBe(0)
    expect(run2.materialsUnchanged).toBe(73)
    expect(run2.materialsTotal).toBe(73)

    expect(run2.brandsCreated).toBe(0)
    expect(run2.brandsUpdated).toBe(0)
    expect(run2.brandsUnchanged).toBe(83)
    expect(run2.brandsTotal).toBe(83)

    expect(run2.updatedAtDigest).toBe(run1.updatedAtDigest)
  }, 120000)

  it('persists localized en/ar descriptions, normalized brand names, and localized country origins accurately', async () => {
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

    const mat1En = materialsEn.docs.find((m) => m.itemNo === 1)
    const mat1Ar = materialsAr.docs.find((m) => m.itemNo === 1)
    expect(mat1En?.description).toBe('EMT Conduit')
    expect(mat1Ar?.description).toBe('مواسير كهربائية معدنية (EMT)')

    const mat7En = materialsEn.docs.find((m) => m.itemNo === 7)
    expect(mat7En?.description).toBe('Electric Cables')

    const mat30En = materialsEn.docs.find((m) => m.itemNo === 30)
    expect(mat30En?.description).toBe('Pressure Gauge')

    const mat34En = materialsEn.docs.find((m) => m.itemNo === 34)
    expect(mat34En?.description).toBe('Fire Extinguisher')

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
