import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  assertSeedEnvironmentAllowed,
  buildMaterialsSeedPlan,
  FIGMA_PARTNER_DISPLAY_NAME_MAPPINGS,
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
  UNCERTAIN_DESCRIPTION_TYPO_NOTES,
} from './materials'

describe('P4-T1 materials + brands seed plan (unit)', () => {
  it('refuses to run when NODE_ENV=production unless --force-production is passed explicitly, and always refuses --reseed in production (R-4)', () => {
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

    // --reseed is always refused in production, even with --force-production
    expect(() => {
      assertSeedEnvironmentAllowed('production', ['node', 'scripts/seed.ts', '--reseed'])
    }).toThrow(/Refusing to run --reseed when NODE_ENV=production/)

    expect(() => {
      assertSeedEnvironmentAllowed('production', [
        'node',
        'scripts/seed.ts',
        '--force-production',
        '--reseed',
      ])
    }).toThrow(/Refusing to run --reseed when NODE_ENV=production/)

    expect(() => {
      assertSeedEnvironmentAllowed('production', ['node', 'scripts/seed.ts'], true)
    }).toThrow(/Refusing to run --reseed when NODE_ENV=production/)

    expect(() => {
      assertSeedEnvironmentAllowed('development', ['node', 'scripts/seed.ts'])
    }).not.toThrow()

    expect(() => {
      assertSeedEnvironmentAllowed('test', ['node', 'scripts/seed.ts'])
    }).not.toThrow()

    // D-14 / E-09: Fail closed when NODE_ENV is unset, empty, or not development/test
    expect(() => {
      assertSeedEnvironmentAllowed(undefined, ['node', 'scripts/seed.ts'])
    }).toThrow(/NODE_ENV/)

    expect(() => {
      assertSeedEnvironmentAllowed('', ['node', 'scripts/seed.ts'])
    }).toThrow(/NODE_ENV/)

    expect(() => {
      assertSeedEnvironmentAllowed('staging', ['node', 'scripts/seed.ts'])
    }).toThrow(/NODE_ENV/)

    // D-14 / E-09: Require --i-understand-this-deletes-content in addition to --reseed
    expect(() => {
      assertSeedEnvironmentAllowed('development', ['node', 'scripts/seed.ts', '--reseed'])
    }).toThrow(/--i-understand-this-deletes-content/)

    // D-14 / E-09: Verify DB host is loopback and DB name matches _(dev|test|e2e)$ before any reseed
    expect(() => {
      assertSeedEnvironmentAllowed(
        'development',
        ['node', 'scripts/seed.ts', '--reseed', '--i-understand-this-deletes-content'],
        true,
        'postgresql://aljazira_app:pass@127.0.0.1:5434/aljazira_prod',
      )
    }).toThrow(/aljazira_prod/)

    expect(() => {
      assertSeedEnvironmentAllowed(
        'development',
        ['node', 'scripts/seed.ts', '--reseed', '--i-understand-this-deletes-content'],
        true,
        'postgresql://aljazira_app:pass@db.example.com:5432/aljazira_dev',
      )
    }).toThrow(/loopback/i)

    expect(() => {
      assertSeedEnvironmentAllowed(
        'development',
        ['node', 'scripts/seed.ts', '--reseed', '--i-understand-this-deletes-content'],
        true,
        'postgresql://aljazira_app:pass@127.0.0.1:5434/aljazira_dev',
      )
    }).not.toThrow()

    expect(() => {
      assertSeedEnvironmentAllowed(
        'test',
        ['node', 'scripts/seed.ts', '--reseed', '--i-understand-this-deletes-content'],
        true,
        'postgresql://aljazira_app:pass@localhost:5434/aljazira_test',
      )
    }).not.toThrow()
  })

  it('normalizes the exact 3 description typos, 7 brand typo groups, and parenthetical product note Hempel (Coating) -> Hempel (R-5)', () => {
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

    // Uncertain description typos left as-is in English (Title Case only, R-2)
    expect(normalizeMaterialDescriptionEn('DISCONNECTED SWITCH').normalized).toBe(
      'Disconnected Switch',
    )
    expect(normalizeMaterialDescriptionEn('FIREPIPES').normalized).toBe('Firepipes')
    expect(normalizeMaterialDescriptionEn('TEMPER SWITCH').normalized).toBe('Temper Switch')
    expect(normalizeMaterialDescriptionEn('OUT LET GRILL').normalized).toBe('Out Let Grill')

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
    expect(normalizeBrandName('HEMPEL (COATING)')).toEqual({
      normalized: 'Hempel',
      specTypoApplied: false,
      productNoteStripped: true,
      caseOrWhitespaceNormalized: true,
    })
    expect(normalizeBrandName('JAZEERA (PRIMER)')).toEqual({
      normalized: 'Jazeera',
      specTypoApplied: false,
      productNoteStripped: true,
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

  it('resolves per-brand origins and Arabic country names from originRaw without breaking hyphenated brand keys like HI-TECH (R-1)', () => {
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

    const row28 = resolveBrandOriginsFromCell(
      ['Giacomini', 'SEFEECO'],
      'Giacomini: Italy -SEFEECO:Saudi arabia',
    )
    expect(row28.get('Giacomini')).toEqual({
      en: 'Italy',
      ar: 'إيطاليا',
      rawCountry: 'Italy',
    })
    expect(row28.get('SEFEECO')).toEqual({
      en: 'Saudi Arabia',
      ar: 'المملكة العربية السعودية',
      rawCountry: 'Saudi arabia',
    })

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

    // R-1: Row 35 "HI-TECH: United States | look :united kingdom | SRI: Malaysia"
    const row35 = resolveBrandOriginsFromCell(
      ['HI-TECH', 'look', 'SRI'],
      'HI-TECH: United States | look :united kingdom | SRI: Malaysia',
    )
    expect(row35.get('HI-TECH')).toEqual({
      en: 'United States',
      ar: 'الولايات المتحدة',
      rawCountry: 'United States',
    })
    expect(row35.get('look')).toEqual({
      en: 'United Kingdom',
      ar: 'المملكة المتحدة',
      rawCountry: 'united kingdom',
    })
    expect(row35.get('SRI')).toEqual({
      en: 'Malaysia',
      ar: 'ماليزيا',
      rawCountry: 'Malaysia',
    })

    // Row 50 hyphen-separated pairs: "Pedrollo :Italy -LEO:China-Water Horse :China"
    const row50 = resolveBrandOriginsFromCell(
      ['Peddrolla', 'LEO', 'WATER horse'],
      'Pedrollo :Italy -LEO:China-Water Horse :China',
    )
    expect(row50.get('Peddrolla')?.en).toBe('Italy')
    expect(row50.get('LEO')?.en).toBe('China')
    expect(row50.get('WATER horse')?.en).toBe('China')
  })

  it('builds the complete 73-row seed plan with Hi-Tech origin United States (R-1), uncertain description typos flagged (R-2), literal Arabic drafts (R-3), and Hempel + Figma mappings (R-5)', () => {
    const rawRows = loadRawMaterialsJson()
    expect(rawRows).toHaveLength(73)

    const plan = buildMaterialsSeedPlan(rawRows)
    expect(plan.materials).toHaveLength(73)
    expect(plan.brands).toHaveLength(83)
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

    // R-1: Hi-Tech has origin United States / الولايات المتحدة
    const hiTech = plan.brands.find((b) => b.name === 'Hi-Tech')
    expect(hiTech).toBeDefined()
    expect(hiTech?.originEn).toBe('United States')
    expect(hiTech?.originAr).toBe('الولايات المتحدة')
    expect(hiTech?.referencedByRows).toEqual([35])

    // R-2: Uncertain description typos (rows 13, 21, 27, 54) left as-is in English, translated literally in Arabic, and flagged for client review
    expect(Object.keys(UNCERTAIN_DESCRIPTION_TYPO_NOTES).map(Number).sort((a, b) => a - b)).toEqual([
      13, 21, 27, 54,
    ])
    const mat13 = plan.materials.find((m) => m.itemNo === 13)
    expect(mat13?.descriptionEn).toBe('Disconnected Switch')
    expect(mat13?.descriptionAr).toBe('مفتاح مفصول')
    expect(mat13?.needsClientReview).toBe(true)
    expect(mat13?.notesEn).toContain('DISCONNECTED SWITCH')

    const mat21 = plan.materials.find((m) => m.itemNo === 21)
    expect(mat21?.descriptionEn).toBe('Firepipes')
    expect(mat21?.descriptionAr).toBe('مواسير حريق')
    expect(mat21?.needsClientReview).toBe(true)
    expect(mat21?.notesEn).toContain('FIREPIPES')

    const mat27 = plan.materials.find((m) => m.itemNo === 27)
    expect(mat27?.descriptionEn).toBe('Temper Switch')
    expect(mat27?.descriptionAr).toBe('مفتاح تقسية')
    expect(mat27?.needsClientReview).toBe(true)
    expect(mat27?.notesEn).toContain('TEMPER SWITCH')

    const mat54 = plan.materials.find((m) => m.itemNo === 54)
    expect(mat54?.descriptionEn).toBe('Out Let Grill')
    expect(mat54?.descriptionAr).toBe('شبكة مخرج')
    expect(mat54?.needsClientReview).toBe(true)
    expect(mat54?.notesEn).toContain('OUT LET GRILL')

    const descTypoReviewRows = plan.needsClientReview
      .filter((r) => r.category === 'uncertain-description-typo')
      .map((r) => r.rowNo)
    expect(descTypoReviewRows).toEqual([13, 21, 27, 54])

    // R-3 & R-10: Arabic drafts translate only what the English says with zero added specs
    expect(MATERIAL_ARABIC_DRAFT_MAP[16]).toBe('إنارة')
    expect(MATERIAL_ARABIC_DRAFT_MAP[18]).toBe('إنارة')
    expect(MATERIAL_ARABIC_DRAFT_MAP[23]).toBe('قطع اتصال مخددة')
    expect(MATERIAL_ARABIC_DRAFT_MAP[24]).toBe('قطع اتصال مسننة')
    expect(MATERIAL_ARABIC_DRAFT_MAP[26]).toBe('ZCV للحريق')
    expect(MATERIAL_ARABIC_DRAFT_MAP[35]).toBe('نوفيك (NOVEC)')
    expect(MATERIAL_ARABIC_DRAFT_MAP[47]).toBe('خزان طرد للمرحاض (WC)')
    expect(MATERIAL_ARABIC_DRAFT_MAP[53]).toBe('مواسير DX')
    expect(MATERIAL_ARABIC_DRAFT_MAP[68]).toBe('إضافات اللياسة')

    // R-5 & R-9: Hempel (Coating) -> Hempel and JAZEERA (PRIMER) -> Jazeera, with notes kept on material #31, plus Figma partner mappings
    const brandNames = new Set(plan.brands.map((b) => b.name))
    expect(brandNames.has('Hempel')).toBe(true)
    expect(brandNames.has('Hempel (Coating)')).toBe(false)
    expect(brandNames.has('Jazeera')).toBe(true)
    expect(brandNames.has('Jazeera (Primer)')).toBe(false)
    const hempel = plan.brands.find((b) => b.name === 'Hempel')
    expect(hempel?.originEn).toBe('Denmark')
    expect(hempel?.originAr).toBe('الدنمارك')
    expect(hempel?.showInMarquee).toBe(true)
    expect(hempel?.order).toBe(14)

    const jazeera = plan.brands.find((b) => b.name === 'Jazeera')
    expect(jazeera?.originEn).toBe('Saudi Arabia')
    expect(jazeera?.originAr).toBe('المملكة العربية السعودية')

    const productNoteNormalizations = plan.normalizationsApplied.filter(
      (n) => n.category === 'brand-product-note',
    )
    expect(productNoteNormalizations.map((n) => `${n.rawValue}->${n.normalizedValue}`)).toEqual([
      'JAZEERA (PRIMER)->Jazeera',
      'HEMPEL (COATING)->Hempel',
    ])

    const mat31 = plan.materials.find((m) => m.itemNo === 31)
    expect(mat31?.brandNames).toEqual(['Jazeera', 'Hempel'])
    expect(mat31?.notesEn).toContain('Hempel (Coating)')
    expect(mat31?.notesEn).toContain('Jazeera (Primer)')
    expect(mat31?.notesAr).toContain('همبل (طلاء / Coating)')
    expect(mat31?.notesAr).not.toContain('طلاء نهائي')
    expect(mat31?.notesAr).toContain('الجزيرة (أساس / Primer)')

    // R-11: Row 24 review note uses normalized "Jihanzi - UL/FM"
    const row24Review = plan.needsClientReview.find((r) => r.rowNo === 24)
    expect(row24Review?.details).toContain('kept as single brand "Jihanzi - UL/FM"')

    expect(FIGMA_PARTNER_DISPLAY_NAME_MAPPINGS).toHaveLength(4)
    expect(plan.figmaPartnerMappings.map((m) => m.seededBrandName)).toEqual([
      'Cooper',
      'System Air',
      'Hempel',
      'Al-Rajhi Steel',
    ])

    // Uncertain brand names are left as-is (case/whitespace normalized only)
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
      brandsDeleted: 0,
      brandsUpdated: 0,
      brandsUnchanged: 0,
      brandsTotal: plan.brands.length,
      materialsCreated: 73,
      materialsDeleted: 0,
      materialsUpdated: 0,
      materialsUnchanged: 0,
      materialsTotal: 73,
      everyMaterialHasAtLeastOneBrand: true,
      minBrandsPerMaterial: 1,
      reseeded: false,
      systemCounts: plan.systemCounts,
      updatedAtDigest: 'brand:Alfanar:2026-10-24T00:00:00.000Z',
      plan,
    })
    expect(summaryLines[0]).toContain('P4-T1: MATERIALS + BRANDS')
    expect(summaryLines.join('\n')).toContain('mode: first-run baseline')
    expect(summaryLines.join('\n')).toContain(
      'systemCounts: electrical=20, mechanical=37, structural=8, architectural=8',
    )

    const reseedSummaryLines = formatSeedSummaryLines({
      brandsCreated: plan.brands.length,
      brandsDeleted: 83,
      brandsUpdated: 0,
      brandsUnchanged: 0,
      brandsTotal: plan.brands.length,
      materialsCreated: 73,
      materialsDeleted: 73,
      materialsUpdated: 0,
      materialsUnchanged: 0,
      materialsTotal: 73,
      everyMaterialHasAtLeastOneBrand: true,
      minBrandsPerMaterial: 1,
      reseeded: true,
      systemCounts: plan.systemCounts,
      updatedAtDigest: 'brand:Alfanar:2026-10-24T00:00:00.000Z',
      plan,
    })
    expect(reseedSummaryLines.join('\n')).toContain(
      'mode: reseed (--reseed, deleted brands=83, materials=73)',
    )
    expect(reseedSummaryLines.join('\n')).toContain('deleted=83')
    expect(reseedSummaryLines.join('\n')).toContain('deleted=73')
  })
})
