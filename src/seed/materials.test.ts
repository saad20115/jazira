import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  assertSeedEnvironmentAllowed,
  buildMaterialsSeedPlan,
  formatSeedSummaryLines,
  loadRawMaterialsJson,
  MATERIAL_ARABIC_DRAFT_MAP,
  normalizeBrandName,
  normalizeMaterialDescriptionEn,
  resolveBrandOriginsFromCell,
  SEED_SERVER_ONLY_SENTINEL,
  SPEC_BRAND_TYPO_MAP,
  SPEC_DESCRIPTION_TYPO_MAP,
  splitBrandCell,
} from './materials'

describe('P4-T1 materials + brands seed plan (unit)', () => {
  it('refuses to run when NODE_ENV=production unless --force-production is passed explicitly', () => {
    expect(SEED_SERVER_ONLY_SENTINEL).toBe('__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_SEED__')

    expect(() => {
      assertSeedEnvironmentAllowed('production', ['node', 'scripts/seed.ts'])
    }).toThrow(/Refusing to run seed when NODE_ENV=production/)

    expect(() => {
      assertSeedEnvironmentAllowed('production', [
        'node',
        'scripts/seed.ts',
        '--force-production',
      ])
    }).not.toThrow()

    expect(() => {
      assertSeedEnvironmentAllowed('development', ['node', 'scripts/seed.ts'])
    }).not.toThrow()

    expect(() => {
      assertSeedEnvironmentAllowed('test', ['node', 'scripts/seed.ts'])
    }).not.toThrow()
  })

  it('normalizes the exact 3 description typos and 7 brand typo groups from docs/02-content-model.md', () => {
    expect(Object.keys(SPEC_DESCRIPTION_TYPO_MAP).sort()).toEqual([
      'CABELS',
      'EXTENGUISHER',
      'GAUAGE',
    ])
    expect(Object.keys(SPEC_BRAND_TYPO_MAP).sort()).toEqual([
      'AL ROUF',
      'ALROUF',
      'ARMA FLEX',
      'GEBRIT',
      'PEDDROLLA',
      'SAUDI CERMICS',
      'SEFECO',
      'SEFEECO',
      'ZAMIL',
    ])

    expect(normalizeMaterialDescriptionEn('ELECTRIC CABELS').normalized).toBe('Electric Cables')
    expect(normalizeMaterialDescriptionEn('FIRE ALARM CABELS').normalized).toBe('Fire Alarm Cables')
    expect(normalizeMaterialDescriptionEn('Pressure Gauage').normalized).toBe('Pressure Gauge')
    expect(normalizeMaterialDescriptionEn('FIRE EXTENGUISHER').normalized).toBe('Fire Extinguisher')
    expect(normalizeMaterialDescriptionEn('EMT CONDUIT').normalized).toBe('EMT Conduit')
    expect(normalizeMaterialDescriptionEn('DATA CABLE FOR FLOOR BOX').normalized).toBe(
      'Data Cable for Floor Box',
    )

    expect(normalizeBrandName('GEBRIT')).toEqual({
      normalized: 'Geberit',
      specTypoApplied: true,
      caseOrWhitespaceNormalized: true,
    })
    expect(normalizeBrandName('Peddrolla')).toEqual({
      normalized: 'Pedrollo',
      specTypoApplied: true,
      caseOrWhitespaceNormalized: true,
    })
    expect(normalizeBrandName('SAUDI CERMICS')).toEqual({
      normalized: 'Saudi Ceramics',
      specTypoApplied: true,
      caseOrWhitespaceNormalized: true,
    })
    expect(normalizeBrandName('SEFEECO')).toEqual({
      normalized: 'SEFECO',
      specTypoApplied: true,
      caseOrWhitespaceNormalized: true,
    })
    expect(normalizeBrandName('AL ROUF')).toEqual({
      normalized: 'Al Rouf',
      specTypoApplied: true,
      caseOrWhitespaceNormalized: true,
    })
    expect(normalizeBrandName('ALROUF')).toEqual({
      normalized: 'Al Rouf',
      specTypoApplied: true,
      caseOrWhitespaceNormalized: true,
    })
    expect(normalizeBrandName('arma flex')).toEqual({
      normalized: 'Armaflex',
      specTypoApplied: true,
      caseOrWhitespaceNormalized: true,
    })
    expect(normalizeBrandName('zamil')).toEqual({
      normalized: 'Zamil',
      specTypoApplied: true,
      caseOrWhitespaceNormalized: true,
    })
  })

  it('splits multi-brand cells on /, |, , while protecting UL/FM and handling rows 31 and 53', () => {
    expect(splitBrandCell('BELDEN / COMMSCOPE / MESC')).toEqual(['BELDEN', 'COMMSCOPE', 'MESC'])
    expect(splitBrandCell('ALFANAR / LEGRAND | TRIDONIC')).toEqual([
      'ALFANAR',
      'LEGRAND',
      'TRIDONIC',
    ])
    expect(splitBrandCell('NIBCO , WATTS')).toEqual(['NIBCO', 'WATTS'])
    expect(splitBrandCell('JIHANZI -UL/FM')).toEqual(['JIHANZI -UL/FM'])
    expect(
      splitBrandCell(
        'JAZEERA (PRIMER) HEMPEL (COATING)',
        'JAZEERA (PRIMER):Saudi arbia HEMPEL (COATING): Denmark',
      ),
    ).toEqual(['JAZEERA (PRIMER)', 'HEMPEL (COATING)'])
    expect(splitBrandCell('LUVATA-CAMLEE', 'LUVATA :ITALY /CAMLEE: CHINA')).toEqual([
      'LUVATA',
      'CAMLEE',
    ])
  })

  it('resolves per-brand origins and Arabic country names from originRaw', () => {
    const row10 = resolveBrandOriginsFromCell(
      ['BELDEN', 'COMMSCOPE', 'MESC'],
      'BELDEN: United States | COMMSCOPE: United States | MESC: Saudi Arabia',
    )
    expect(row10.get('BELDEN')).toEqual({
      en: 'United States',
      ar: 'الولايات المتحدة',
      rawCountry: 'United States',
    })
    expect(row10.get('MESC')).toEqual({
      en: 'Saudi Arabia',
      ar: 'المملكة العربية السعودية',
      rawCountry: 'Saudi Arabia',
    })

    const row26 = resolveBrandOriginsFromCell(['Tyco', 'Ashcroft'], '(Tyco-Ashcroft): United States')
    expect(row26.get('Tyco')?.en).toBe('United States')
    expect(row26.get('Ashcroft')?.en).toBe('United States')

    const row31 = resolveBrandOriginsFromCell(
      ['JAZEERA (PRIMER)', 'HEMPEL (COATING)'],
      'JAZEERA (PRIMER):Saudi arbia HEMPEL (COATING): Denmark',
    )
    expect(row31.get('JAZEERA (PRIMER)')).toEqual({
      en: 'Saudi Arabia',
      ar: 'المملكة العربية السعودية',
      rawCountry: 'Saudi arbia',
    })
    expect(row31.get('HEMPEL (COATING)')).toEqual({
      en: 'Denmark',
      ar: 'الدنمارك',
      rawCountry: 'Denmark',
    })
  })

  it('builds the complete 73-row seed plan from seed/materials.raw.json with 20/37/8/8 system counts', () => {
    const rawRows = loadRawMaterialsJson()
    expect(rawRows).toHaveLength(73)

    const plan = buildMaterialsSeedPlan(rawRows)
    expect(plan.materials).toHaveLength(73)
    expect(plan.arabicDrafts).toHaveLength(73)
    expect(Object.keys(MATERIAL_ARABIC_DRAFT_MAP)).toHaveLength(73)
    expect(plan.systemCounts).toEqual({
      electrical: 20,
      mechanical: 37,
      structural: 8,
      architectural: 8,
    })

    // Every material has >= 1 brand
    for (const mat of plan.materials) {
      expect(mat.brandNames.length).toBeGreaterThanOrEqual(1)
      expect(mat.descriptionEn.length).toBeGreaterThan(0)
      expect(mat.descriptionAr.length).toBeGreaterThan(0)
    }

    // Uncertain brand names are left as-is (case/whitespace normalized only)
    const brandNames = new Set(plan.brands.map((b) => b.name))
    expect(brandNames.has('Alfanar Cermics')).toBe(true)
    expect(brandNames.has('Avanger')).toBe(true)
    expect(brandNames.has('Bahra')).toBe(true)
    expect(brandNames.has('Bahra Cables')).toBe(true)
    expect(brandNames.has('Aljazirah (Oman-Saudi)')).toBe(true)
    expect(brandNames.has('Aljazera')).toBe(true)

    // Rows 58–73 have both suppliers seeded and marked for client review; structural/arch-only brands have empty origin
    const reviewRowNumbers = plan.needsClientReview.map((r) => r.rowNo)
    for (let rowNo = 58; rowNo <= 73; rowNo += 1) {
      expect(reviewRowNumbers).toContain(rowNo)
    }

    const saudiReadyMix = plan.brands.find((b) => b.name === 'Saudi Ready Mix')
    expect(saudiReadyMix).toBeDefined()
    expect(saudiReadyMix?.originEn).toBeNull()
    expect(saudiReadyMix?.originAr).toBeNull()

    const nesmaConcrete = plan.brands.find((b) => b.name === 'Nesma Concrete Solutions')
    expect(nesmaConcrete).toBeDefined()
    expect(nesmaConcrete?.originEn).toBeNull()
    expect(nesmaConcrete?.originAr).toBeNull()

    const yanbuCement = plan.brands.find((b) => b.name === 'Yanbu Cement')
    expect(yanbuCement).toBeDefined()
    expect(yanbuCement?.originEn).toBeNull()
    expect(yanbuCement?.originAr).toBeNull()

    // Saudi Ceramics appears in row 49 (Saudi Arabia) and row 69 (architectural); keeps row 49 origin
    const saudiCeramics = plan.brands.find((b) => b.name === 'Saudi Ceramics')
    expect(saudiCeramics?.originEn).toBe('Saudi Arabia')
    expect(saudiCeramics?.originAr).toBe('المملكة العربية السعودية')
    expect(saudiCeramics?.referencedByRows).toEqual([49, 69])

    const summaryLines = formatSeedSummaryLines({
      brandsCreated: plan.brands.length,
      brandsUpdated: 0,
      brandsUnchanged: 0,
      brandsTotal: plan.brands.length,
      materialsCreated: 73,
      materialsUpdated: 0,
      materialsUnchanged: 0,
      materialsTotal: 73,
      everyMaterialHasAtLeastOneBrand: true,
      minBrandsPerMaterial: 1,
      systemCounts: plan.systemCounts,
      updatedAtDigest: 'brand:Alfanar:2026-10-24T00:00:00.000Z',
      plan,
    })
    expect(summaryLines[0]).toContain('P4-T1: MATERIALS + BRANDS')
    expect(summaryLines.join('\n')).toContain(
      'systemCounts: electrical=20, mechanical=37, structural=8, architectural=8',
    )
  })
})
