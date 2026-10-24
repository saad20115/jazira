import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'

import type { Brand, Material, User } from '@/payload-types'

/**
 * Note on S4 (`server-only`): `src/seed/materials.ts` is executed directly under Node/tsx by the
 * Payload CLI (`pnpm seed` -> `payload run scripts/seed.ts`), where Next's compiled `server-only`
 * virtual package is not in top-level `node_modules`. Server-only isolation is enforced by:
 * 1. `SEED_SERVER_ONLY_SENTINEL` checked against `.next/static` by `scripts/check-client-bundle-sentinels.mjs`
 * 2. `local/no-server-in-client` and `FRONTEND_FORBIDDEN_SERVER_DIR_PATTERNS` in `eslint.config.mjs`
 * 3. Runtime `typeof window !== 'undefined'` check in `assertSeedEnvironmentAllowed`.
 */
export const SEED_SERVER_ONLY_SENTINEL = '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_SEED__'

export type MaterialSystemSlug = 'electrical' | 'mechanical' | 'structural' | 'architectural'

export interface RawMaterialSeedRow {
  alternativeRaw?: string
  brandRaw: string
  description: string
  needsClientReview?: string
  no: number
  originRaw?: string
  system: MaterialSystemSlug
}

export interface NormalizationRecord {
  category: 'brand-typo' | 'brand-case-whitespace' | 'description-typo' | 'description-case' | 'country'
  field: 'brandRaw' | 'description' | 'originRaw'
  normalizedValue: string
  rawValue: string
  reason: string
  rowNumbers: number[]
}

export interface ClientReviewItem {
  category:
    | 'structural-architectural-second-supplier'
    | 'uncertain-brand-spelling-or-split'
    | 'missing-brand-origin'
    | 'arabic-material-draft'
  details: string
  normalizedBrands: string[]
  rawBrandOrOrigin: string
  rowNo: number
  system: MaterialSystemSlug
}

export interface PlannedBrandSeed {
  firstSeenRow: number
  name: string
  needsClientReviewReason: string | null
  order: number
  originAr: string | null
  originEn: string | null
  rawVariants: string[]
  referencedByRows: number[]
  showInMarquee: boolean
}

export interface PlannedMaterialSeed {
  brandNames: string[]
  descriptionAr: string
  descriptionEn: string
  itemNo: number
  needsClientReview: boolean
  notesAr: string | null
  notesEn: string | null
  rawBrand: string
  rawDescription: string
  rawOriginOrAlternative: string
  system: MaterialSystemSlug
}

export interface MaterialsSeedPlan {
  arabicDrafts: Array<{
    descriptionAr: string
    descriptionEn: string
    itemNo: number
    rawDescription: string
    system: MaterialSystemSlug
  }>
  brands: PlannedBrandSeed[]
  materials: PlannedMaterialSeed[]
  needsClientReview: ClientReviewItem[]
  normalizationsApplied: NormalizationRecord[]
  systemCounts: Record<MaterialSystemSlug, number>
}

export interface MaterialsSeedRunSummary {
  brandsCreated: number
  brandsTotal: number
  brandsUnchanged: number
  brandsUpdated: number
  everyMaterialHasAtLeastOneBrand: boolean
  materialsCreated: number
  materialsTotal: number
  materialsUnchanged: number
  materialsUpdated: number
  minBrandsPerMaterial: number
  plan: MaterialsSeedPlan
  systemCounts: Record<MaterialSystemSlug, number>
  updatedAtDigest: string
}

/**
 * Synthetic admin user passed to Local API calls with `overrideAccess: false` so every
 * `payload.find`, `payload.create`, and `payload.update` executes through the collection's
 * configured `isAdminOrEditor` access-control function (`M-134`).
 */
export const SEED_ADMIN_USER: User = {
  id: 0,
  collection: 'users',
  email: 'seed-runner@aljazira.co',
  name: 'Seed Runner (Admin)',
  role: 'admin',
  createdAt: '2026-10-21T00:00:00.000Z',
  updatedAt: '2026-10-21T00:00:00.000Z',
}

/**
 * Refuses to run when `NODE_ENV === 'production'` unless `--force-production` is passed explicitly
 * (`handoff/tasks/P4-T1.md` §Scope 1, `docs/02-content-model.md` §"Seed data rules").
 */
export function assertSeedEnvironmentAllowed(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  argv: readonly string[] = process.argv,
): void {
  if (typeof window !== 'undefined') {
    throw new Error(SEED_SERVER_ONLY_SENTINEL)
  }
  if (nodeEnv === 'production' && !argv.includes('--force-production')) {
    throw new Error(
      '[seed] Refusing to run seed when NODE_ENV=production unless --force-production is passed explicitly.',
    )
  }
}

/**
 * Exact description typo mapping table from `docs/02-content-model.md` lines 148–150:
 * `CABELS→Cables`, `EXTENGUISHER→Extinguisher`, `Gauage→Gauge`.
 */
export const SPEC_DESCRIPTION_TYPO_MAP: Readonly<Record<string, string>> = {
  CABELS: 'Cables',
  EXTENGUISHER: 'Extinguisher',
  GAUAGE: 'Gauge',
}

/**
 * Exact brand typo mapping table from `docs/02-content-model.md` lines 148–150:
 * `GEBRIT→Geberit`, `Peddrolla→Pedrollo`, `SAUDI CERMICS→Saudi Ceramics`,
 * `SEFECO/SEFEECO→SEFECO`, `AL ROUF/ALROUF→Al Rouf`, `arma flex→Armaflex`, `zamil→Zamil`.
 * Anything else uncertain is left as-is (case/whitespace normalized only) and reported.
 */
export const SPEC_BRAND_TYPO_MAP: Readonly<Record<string, string>> = {
  GEBRIT: 'Geberit',
  PEDDROLLA: 'Pedrollo',
  'SAUDI CERMICS': 'Saudi Ceramics',
  SEFECO: 'SEFECO',
  SEFEECO: 'SEFECO',
  'AL ROUF': 'Al Rouf',
  ALROUF: 'Al Rouf',
  'ARMA FLEX': 'Armaflex',
  ZAMIL: 'Zamil',
}

/**
 * Uppercase acronyms/initialisms preserved verbatim during Title Case normalization of
 * English material descriptions and brand names.
 */
const UPPERCASE_ACRONYMS = new Set([
  'EMT',
  'PVC',
  'ZCV',
  'PPR',
  'AC',
  'WC',
  'DX',
  'GRC',
  'EGA',
  'MESC',
  'JMC',
  'SRI',
  'LEO',
  'AFICO',
  'SKM',
  'ALUPCO',
  'JTPR',
  'UL-FM',
  'UL/FM',
  'ASSTTE',
  'ASTTE',
  'XPS',
])

/**
 * Special mixed-case brand tokens preserved during case normalization.
 */
const SPECIAL_BRAND_TOKENS: Readonly<Record<string, string>> = {
  COMMSCOPE: 'CommScope',
  'HI-TECH': 'Hi-Tech',
}

const LOWERCASE_TITLE_WORDS = new Set(['for', 'and', 'of', 'in', 'to'])

/**
 * Fixed country normalization and Arabic translation table (`handoff/tasks/P4-T1.md` §Scope 3).
 */
export const COUNTRY_TRANSLATION_TABLE: Readonly<
  Record<string, { ar: string; en: string } | undefined>
> = {
  'saudi arabia': {
    en: 'Saudi Arabia',
    ar: 'المملكة العربية السعودية',
  },
  'saudi arbia': {
    en: 'Saudi Arabia',
    ar: 'المملكة العربية السعودية',
  },
  'saudi arabia / oman': {
    en: 'Saudi Arabia / Oman',
    ar: 'المملكة العربية السعودية / عُمان',
  },
  'united states': {
    en: 'United States',
    ar: 'الولايات المتحدة',
  },
  'united states (brand; now eaton)': {
    en: 'United States',
    ar: 'الولايات المتحدة',
  },
  france: {
    en: 'France',
    ar: 'فرنسا',
  },
  austria: {
    en: 'Austria',
    ar: 'النمسا',
  },
  'united kingdom': {
    en: 'United Kingdom',
    ar: 'المملكة المتحدة',
  },
  china: {
    en: 'China',
    ar: 'الصين',
  },
  india: {
    en: 'India',
    ar: 'الهند',
  },
  italy: {
    en: 'Italy',
    ar: 'إيطاليا',
  },
  denmark: {
    en: 'Denmark',
    ar: 'الدنمارك',
  },
  uae: {
    en: 'UAE',
    ar: 'الإمارات العربية المتحدة',
  },
  malaysia: {
    en: 'Malaysia',
    ar: 'ماليزيا',
  },
  cyprus: {
    en: 'Cyprus',
    ar: 'قبرص',
  },
  germany: {
    en: 'Germany',
    ar: 'ألمانيا',
  },
  sweden: {
    en: 'Sweden',
    ar: 'السويد',
  },
}

/**
 * Partner brands featured in the Home page Trusted Partners marquee (`design/copy/01-home.md` `18:579`).
 */
export const MARQUEE_PARTNER_BRAND_ORDER: Readonly<Record<string, number>> = {
  Alfanar: 1,
  Legrand: 2,
  Belden: 3,
  CommScope: 4,
  Tridonic: 5,
  Cooper: 6,
  Tyco: 7,
  Grohe: 8,
  Ariston: 9,
  Watts: 10,
  Zamil: 11,
  SKM: 12,
  'System Air': 13,
  'Hempel (Coating)': 14,
  'Jazeera Paints': 15,
  'Saudi Ceramics': 16,
  Tahweel: 17,
  'Bahra Cables': 18,
  'Al-Rajhi Steel': 19,
  'Obeikan Glass': 20,
}

/**
 * Arabic drafted material descriptions for all 73 rows (`handoff/tasks/P4-T1.md` §Scope 5).
 * Every Arabic draft string is listed in the P4-T1 report for client confirmation (`needsClientReview`).
 */
export const MATERIAL_ARABIC_DRAFT_MAP: Readonly<Record<number, string>> = {
  1: 'مواسير كهربائية معدنية (EMT)',
  2: 'علب كهربائية',
  3: 'علب كهربائية فولاذية',
  4: 'مواسير كهربائية بلاستيكية (PVC)',
  5: 'حوامل كابلات (Cable Tray)',
  6: 'مجاري كابلات (Cable Trunk)',
  7: 'كابلات كهربائية',
  8: 'أسلاك كهربائية',
  9: 'كابلات إنذار الحريق',
  10: 'كابلات بيانات لعلب الأرضيات',
  11: 'أنظمة التأريض والحماية الأرضية',
  12: 'مفاتيح وأفياش كهربائية (Wiring Devices)',
  13: 'مفاتيح فصل وتشغيل (Disconnect Switch)',
  14: 'علب أرضيات كهربائية (Floor Box)',
  15: 'بطاريات إنارة الطوارئ',
  16: 'وحدات إنارة داخلية',
  17: 'وحدات إنارة خارجية',
  18: 'وحدات إنارة',
  19: 'نظام إنذار الحريق',
  20: 'لوحات توزيع كهربائية (Panel Board)',
  21: 'مواسير شبكة إطفاء الحريق',
  22: 'مواسير فولاذية مجلفنة',
  23: 'قطع اتصال مخددة لمكافحة الحريق (Grooved Fittings)',
  24: 'قطع اتصال مسننة لمكافحة الحريق (Threaded Fittings)',
  25: 'مرابط وعلاقات مواسير مبطنة (Split Clamp & Clevis Hanger)',
  26: 'صمامات تحكم المناطق لمكافحة الحريق (ZCV)',
  27: 'مفاتيح مراقبة الصمامات (Tamper Switch)',
  28: 'صمامات اختبار وتصريف (Test & Drain Valve)',
  29: 'مفاتيح تدفق المياه (Flow Switch)',
  30: 'مقاييس ضغط (Pressure Gauge)',
  31: 'دهانات وطلاءات مواسير الحريق (أساس وطلاء نهائي)',
  32: 'مضخات إطفاء الحريق',
  33: 'صناديق خراطيم الحريق الفولاذية',
  34: 'طفايات الحريق',
  35: 'نظام الإطفاء بالغاز النظيف (NOVEC)',
  36: 'نظام الإطفاء بالأيروسول (Aerosol)',
  37: 'مواسير تغذية المياه البلاستيكية (PPR)',
  38: 'قطع ووصلات مواسير التغذية (Fittings)',
  39: 'محابس وصمامات السباكة',
  40: 'مانعات المطرقة المائية (Water Hammer Arrestor)',
  41: 'حنفيات الخدمة الخارجية (Hose Bibs)',
  42: 'عزل مواسير السباكة',
  43: 'مواسير الصرف الصحي',
  44: 'مواسير تصريف تكثيف التكييف',
  45: 'مواسير التصريف والصرف',
  46: 'شبكات مواسير الصرف',
  47: 'خزانات طرد مخفية للمراحيض',
  48: 'خزانات المياه',
  49: 'سخانات المياه',
  50: 'مضخات تقوية ضغط المياه (Booster Pump)',
  51: 'صاج مجاري الهواء (Duct Sheet)',
  52: 'عزل مجاري الهواء (Duct Insulation)',
  53: 'مواسير النحاس للتبريد المباشر (DX Pipe)',
  54: 'مخارج وناشرات الهواء (Outlet Grill)',
  55: 'وحدات التكييف (AC Units)',
  56: 'مراوح التهوية',
  57: 'المصاعد الكهربائية',
  58: 'خرسانة جاهزة',
  59: 'أسمنت',
  60: 'حديد التسليح',
  61: 'أغشية العزل المائي',
  62: 'العزل الحراري للأسطح',
  63: 'بلوك خرساني',
  64: 'أبواب وإطارات خشبية',
  65: 'أنظمة الألمنيوم',
  66: 'الزجاج المعماري',
  67: 'ألواح الجبس (Gypsum Board)',
  68: 'إضافات اللياسة والمونة',
  69: 'بلاط البورسلين',
  70: 'الرخام',
  71: 'الدهانات المعمارية',
  72: 'تكسية واجهات خرسانية مسلحة بالألياف (GRC)',
  73: 'درابزين حديد مشغول (Wrought Iron)',
}

function capitalizeWordToken(token: string, index: number): string {
  if (!token) {
    return ''
  }
  const upper = token.toUpperCase()
  if (SPECIAL_BRAND_TOKENS[upper]) {
    return SPECIAL_BRAND_TOKENS[upper]
  }
  if (UPPERCASE_ACRONYMS.has(upper)) {
    return upper
  }
  if (token.startsWith('(') && token.endsWith(')') && token.length > 2) {
    const inner = token.slice(1, -1)
    return `(${inner
      .split('-')
      .map((part, idx) => capitalizeWordToken(part, idx))
      .join('-')})`
  }
  if (token.includes('-') && !UPPERCASE_ACRONYMS.has(upper)) {
    return token
      .split('-')
      .map((part, idx) => capitalizeWordToken(part, idx))
      .join('-')
  }
  const lower = token.toLowerCase()
  if (index > 0 && LOWERCASE_TITLE_WORDS.has(lower)) {
    return lower
  }
  // Handle plural acronym like "BIBs" -> "Bibs"
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/**
 * Normalizes an English material description using `SPEC_DESCRIPTION_TYPO_MAP` plus Title Case
 * matching `design/copy/02-services.md` (`157:3293`).
 */
export function normalizeMaterialDescriptionEn(rawDescription: string): {
  caseNormalized: boolean
  normalized: string
  typosReplaced: Array<{ from: string; to: string }>
} {
  const collapsed = rawDescription
    .trim()
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')

  const typosReplaced: Array<{ from: string; to: string }> = []
  const words = collapsed.split(' ').map((word, idx) => {
    const cleanAlpha = word.replace(/[^a-zA-Z]/g, '').toUpperCase()
    const typoTarget = SPEC_DESCRIPTION_TYPO_MAP[cleanAlpha]
    if (typoTarget) {
      typosReplaced.push({ from: word, to: typoTarget })
      return word.replace(/[a-zA-Z]+/, typoTarget)
    }
    return capitalizeWordToken(word, idx)
  })

  // Join "OUT LET GRILL" -> "Outlet Grill" only? No: spec says only known typos + case/whitespace normalization!
  // So "OUT LET GRILL" becomes "Out Let Grill".
  const normalized = words.join(' ')
  return {
    normalized,
    typosReplaced,
    caseNormalized: normalized !== rawDescription,
  }
}

/**
 * Normalizes a single brand token using `SPEC_BRAND_TYPO_MAP` plus case/whitespace normalization.
 */
export function normalizeBrandName(rawBrandToken: string): {
  caseOrWhitespaceNormalized: boolean
  normalized: string
  specTypoApplied: boolean
} {
  const collapsed = rawBrandToken
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, (match) => (match.includes(' ') ? ' - ' : '-'))

  const upperKey = collapsed.toUpperCase()
  const specMapped = SPEC_BRAND_TYPO_MAP[upperKey]
  if (specMapped) {
    return {
      normalized: specMapped,
      specTypoApplied: true,
      caseOrWhitespaceNormalized: specMapped !== rawBrandToken,
    }
  }

  const tokens = collapsed.split(' ').map((token, idx) => {
    if (token === '-') {
      return '-'
    }
    return capitalizeWordToken(token, idx)
  })

  const normalized = tokens.join(' ')
  return {
    normalized,
    specTypoApplied: false,
    caseOrWhitespaceNormalized: normalized !== rawBrandToken,
  }
}

/**
 * Splits a multi-brand `brandRaw` cell on `/`, `|`, `,` (protecting `UL/FM` in row 24,
 * and splitting row 31 `JAZEERA (PRIMER) HEMPEL (COATING)` and row 53 `LUVATA-CAMLEE`
 * where `originRaw` has separate `Brand: Country` entries).
 */
export function splitBrandCell(brandRaw: string, originRaw?: string): string[] {
  const trimmed = brandRaw.trim()
  if (!trimmed) {
    return []
  }

  // Row 31: "JAZEERA (PRIMER) HEMPEL (COATING)" where originRaw has "JAZEERA (PRIMER):Saudi arbia HEMPEL (COATING): Denmark"
  if (/^JAZEERA\s*\(PRIMER\)\s+HEMPEL\s*\(COATING\)$/i.test(trimmed)) {
    return ['JAZEERA (PRIMER)', 'HEMPEL (COATING)']
  }

  // Row 53: "LUVATA-CAMLEE" where originRaw has "LUVATA :ITALY /CAMLEE: CHINA"
  if (/^LUVATA-CAMLEE$/i.test(trimmed) && originRaw && /LUVATA.*CAMLEE/i.test(originRaw)) {
    return ['LUVATA', 'CAMLEE']
  }

  // Protect "UL/FM" certification suffix in Row 24 ("JIHANZI -UL/FM") before splitting on `/`, `|`, `,`
  const placeholderProtected = trimmed.replace(/UL\/FM/gi, 'UL__SLASH__FM')
  return placeholderProtected
    .split(/[\/|,]/)
    .map((part) => part.replace(/UL__SLASH__FM/g, 'UL/FM').trim())
    .filter(Boolean)
}

/**
 * Resolves per-brand `{ en, ar }` country of origin from `originRaw` (`handoff/tasks/P4-T1.md` §Scope 3).
 */
export function resolveBrandOriginsFromCell(
  rawBrands: readonly string[],
  originRaw: string | undefined,
): Map<string, { ar: string; en: string; rawCountry: string } | null> {
  const result = new Map<string, { ar: string; en: string; rawCountry: string } | null>()
  if (!originRaw || !originRaw.trim()) {
    for (const rawBrand of rawBrands) {
      result.set(rawBrand, null)
    }
    return result
  }

  const trimmedOrigin = originRaw.trim()

  // Case 1: Single country without colon (e.g. Row 1 "Saudi arabia", Row 51 "Saudi Arabia")
  if (!trimmedOrigin.includes(':')) {
    const lookup = COUNTRY_TRANSLATION_TABLE[trimmedOrigin.toLowerCase()]
    const resolved = lookup ? { ...lookup, rawCountry: trimmedOrigin } : null
    for (const rawBrand of rawBrands) {
      result.set(rawBrand, resolved)
    }
    return result
  }

  // Case 2: Shared parenthesized pair `(Tyco-Ashcroft): United States` or `(EFFECTIVE POWER-ASTTE): Saudi Arabia`
  const sharedMatch = /^\([^)]+\)\s*:\s*(.+)$/.exec(trimmedOrigin)
  if (sharedMatch && sharedMatch[1]) {
    const rawCountry = sharedMatch[1].trim()
    const lookup = COUNTRY_TRANSLATION_TABLE[rawCountry.toLowerCase()]
    const resolved = lookup ? { ...lookup, rawCountry } : null
    for (const rawBrand of rawBrands) {
      result.set(rawBrand, resolved)
    }
    return result
  }

  // Case 3: One or more `Brand: Country` pairs (separated by `|`, `,`, `/`, `-`, or space before next uppercase key)
  const normalizedPairsText = trimmedOrigin
    .replace(/\)\s*:\s*([A-Za-z ]+?)\s+(?=[A-Z]+\s*\()/g, '): $1 | ')
    .replace(/([A-Za-z])\s*-\s*(?=[A-Za-z ]+\s*:)/g, '$1 | ')

  const pairChunks = normalizedPairsText
    .split(/\s*(?:\||,)\s*|\s+\/(?=[A-Za-z]+\s*:)/)
    .map((c) => c.trim())
    .filter(Boolean)

  const parsedPairs: Array<{ brandKey: string; country: { ar: string; en: string; rawCountry: string } | null }> = []
  for (const chunk of pairChunks) {
    const colonIdx = chunk.indexOf(':')
    if (colonIdx === -1) {
      continue
    }
    const keyPart = chunk.slice(0, colonIdx).trim()
    const countryPart = chunk.slice(colonIdx + 1).trim()
    if (!countryPart) {
      parsedPairs.push({ brandKey: keyPart, country: null })
      continue
    }
    const lookup = COUNTRY_TRANSLATION_TABLE[countryPart.toLowerCase()]
    parsedPairs.push({
      brandKey: keyPart,
      country: lookup ? { ...lookup, rawCountry: countryPart } : null,
    })
  }

  for (let i = 0; i < rawBrands.length; i += 1) {
    const rawBrand = rawBrands[i] ?? ''
    const normBrand = normalizeBrandName(rawBrand).normalized.toLowerCase()
    const cleanBrandPrefix = rawBrand
      .replace(/[- ]*UL[/-]FM/i, '')
      .replace(/\bSteel\b/i, '')
      .trim()
      .toLowerCase()

    const matchedPair =
      parsedPairs.find((p) => {
        const pNorm = normalizeBrandName(p.brandKey).normalized.toLowerCase()
        const pRaw = p.brandKey.toLowerCase()
        return (
          pNorm === normBrand ||
          pRaw === rawBrand.toLowerCase() ||
          pRaw === cleanBrandPrefix ||
          cleanBrandPrefix.startsWith(pRaw)
        )
      }) ?? (rawBrands.length === 1 && parsedPairs.length === 1 ? parsedPairs[0] : undefined)

    result.set(rawBrand, matchedPair?.country ?? null)
  }

  return result
}

/**
 * Loads `seed/materials.raw.json` from the repository root.
 */
export function loadRawMaterialsJson(
  repoRoot: string = process.cwd(),
): RawMaterialSeedRow[] {
  const filePath = path.resolve(repoRoot, 'seed', 'materials.raw.json')
  const rawText = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(rawText) as RawMaterialSeedRow[]
}

/**
 * Deterministically parses `seed/materials.raw.json` into the normalized brand and material seed plan
 * along with complete normalization, client-review, and Arabic draft tables (`handoff/tasks/P4-T1.md`).
 */
export function buildMaterialsSeedPlan(
  rawRows: readonly RawMaterialSeedRow[] = loadRawMaterialsJson(),
): MaterialsSeedPlan {
  const normalizationsMap = new Map<string, NormalizationRecord>()
  const addNormalization = (
    category: NormalizationRecord['category'],
    field: NormalizationRecord['field'],
    rawValue: string,
    normalizedValue: string,
    reason: string,
    rowNo: number,
  ): void => {
    if (rawValue === normalizedValue) {
      return
    }
    const key = `${category}|${field}|${rawValue}|${normalizedValue}`
    const existing = normalizationsMap.get(key)
    if (existing) {
      if (!existing.rowNumbers.includes(rowNo)) {
        existing.rowNumbers.push(rowNo)
      }
      return
    }
    normalizationsMap.set(key, {
      category,
      field,
      rawValue,
      normalizedValue,
      reason,
      rowNumbers: [rowNo],
    })
  }

  const brandsMap = new Map<string, PlannedBrandSeed>()
  const materials: PlannedMaterialSeed[] = []
  const needsClientReview: ClientReviewItem[] = []
  const arabicDrafts: MaterialsSeedPlan['arabicDrafts'] = []
  const systemCounts: Record<MaterialSystemSlug, number> = {
    electrical: 0,
    mechanical: 0,
    structural: 0,
    architectural: 0,
  }

  const UNCERTAIN_MEP_BRAND_NOTES: Readonly<Record<number, string>> = {
    11: 'Raw brand is "Bahra" (without "Cables"); left as-is and separate from "Bahra Cables" (rows 7, 8) pending client confirmation.',
    19: 'originRaw notes "COOPER: United States (brand; now Eaton) | AVANGER: United Kingdom"; left as "Cooper" and "Avanger" pending client confirmation on "Eaton Cooper" / "Avenger" spelling.',
    20: 'brandRaw has "EFFECTIVE POWER - ASSTTE" while originRaw has "(EFFECTIVE POWER-ASTTE): Saudi Arabia"; left as "Effective Power - ASSTTE" pending client confirmation on spelling.',
    21: 'brandRaw is "ALJAZIRAH (OMAN-SAUDI)" and originRaw is "ALJAZIRAH (OMAN-SAUDI):" (empty country after colon); left as-is with empty origin pending client confirmation (compare row 22 "ALJAZERA").',
    22: 'brandRaw is "ALJAZERA" with originRaw "ALJAZERA: Saudi Arabia / Oman"; left as "Aljazera" pending client confirmation whether rows 21 and 22 are the same manufacturer (Al Jazeera Steel Products Co.).',
    23: 'brandRaw is "Junt / JTPR UL-FM" (includes UL-FM certification suffix on JTPR); left as "Junt" and "JTPR UL-FM" pending client confirmation.',
    24: 'brandRaw is "JIHANZI -UL/FM" (UL/FM certification suffix with slash); kept as single brand "Jihanzi -UL/FM" (China) pending client confirmation.',
    31: 'brandRaw is "JAZEERA (PRIMER) HEMPEL (COATING)" and originRaw has two Brand: Country pairs ("JAZEERA (PRIMER):Saudi arbia HEMPEL (COATING): Denmark"); split into "Jazeera (Primer)" and "Hempel (Coating)" pending client confirmation.',
    42: 'originRaw is "AEROFOAM: UAE" without a country for second brand "arma flex" ("Armaflex"); seeded "Armaflex" with empty origin pending client confirmation.',
    47: 'originRaw is "GROHE: Germany" without a country for second brand "GEBRIT" ("Geberit"); seeded "Geberit" with empty origin pending client confirmation.',
    53: 'brandRaw is "LUVATA-CAMLEE" joined by hyphen while originRaw has two Brand: Country pairs ("LUVATA :ITALY /CAMLEE: CHINA"); split into "Luvata" (Italy) and "Camlee" (China) pending client confirmation.',
    56: 'brandRaw is "SYSTEM AIR/BLACK HORSE"; left as "System Air" (two words) pending client confirmation whether to merge with single-word "Systemair" in Figma.',
    57: 'brandRaw is "ALDURRAH-fuji" with originRaw "ALDURRAH: Saudi Arabia"; kept as "Aldurrah-Fuji" (Saudi Arabia) pending client confirmation whether Fuji is a separate partner brand.',
  }

  for (const row of rawRows) {
    systemCounts[row.system] += 1

    const descResult = normalizeMaterialDescriptionEn(row.description)
    for (const typo of descResult.typosReplaced) {
      addNormalization(
        'description-typo',
        'description',
        row.description,
        descResult.normalized,
        `Spec typo map (${typo.from.toUpperCase()}→${typo.to}) + Title Case`,
        row.no,
      )
    }
    if (descResult.typosReplaced.length === 0 && descResult.caseNormalized) {
      addNormalization(
        'description-case',
        'description',
        row.description,
        descResult.normalized,
        'Title Case normalization per Services table (157:3293)',
        row.no,
      )
    }

    const descriptionAr =
      MATERIAL_ARABIC_DRAFT_MAP[row.no] ?? `${descResult.normalized} (مسودة)`
    arabicDrafts.push({
      itemNo: row.no,
      system: row.system,
      rawDescription: row.description,
      descriptionEn: descResult.normalized,
      descriptionAr,
    })

    const isStructuralOrArch = row.no >= 58 && row.no <= 73
    const rawBrandTokens = isStructuralOrArch
      ? [row.brandRaw, ...(row.alternativeRaw?.trim() ? [row.alternativeRaw.trim()] : [])]
      : splitBrandCell(row.brandRaw, row.originRaw)

    const originsByRawToken = isStructuralOrArch
      ? new Map<string, { ar: string; en: string; rawCountry: string } | null>()
      : resolveBrandOriginsFromCell(rawBrandTokens, row.originRaw)

    const rowBrandNames: string[] = []
    for (const rawToken of rawBrandTokens) {
      const brandNorm = normalizeBrandName(rawToken)
      if (brandNorm.specTypoApplied) {
        addNormalization(
          'brand-typo',
          'brandRaw',
          rawToken,
          brandNorm.normalized,
          `Spec typo map (${rawToken.trim().toUpperCase()}→${brandNorm.normalized})`,
          row.no,
        )
      } else if (brandNorm.caseOrWhitespaceNormalized) {
        addNormalization(
          'brand-case-whitespace',
          'brandRaw',
          rawToken,
          brandNorm.normalized,
          'Case & whitespace normalization',
          row.no,
        )
      }

      const originInfo = originsByRawToken.get(rawToken) ?? null
      if (originInfo && originInfo.rawCountry !== originInfo.en) {
        addNormalization(
          'country',
          'originRaw',
          originInfo.rawCountry,
          `${originInfo.en} / ${originInfo.ar}`,
          'Country name normalization & Arabic translation',
          row.no,
        )
      }

      if (!rowBrandNames.includes(brandNorm.normalized)) {
        rowBrandNames.push(brandNorm.normalized)
      }

      const existingBrand = brandsMap.get(brandNorm.normalized)
      if (existingBrand) {
        if (!existingBrand.rawVariants.includes(rawToken)) {
          existingBrand.rawVariants.push(rawToken)
        }
        if (!existingBrand.referencedByRows.includes(row.no)) {
          existingBrand.referencedByRows.push(row.no)
        }
        if (!existingBrand.originEn && originInfo) {
          existingBrand.originEn = originInfo.en
          existingBrand.originAr = originInfo.ar
        }
      } else {
        brandsMap.set(brandNorm.normalized, {
          name: brandNorm.normalized,
          originEn: originInfo?.en ?? null,
          originAr: originInfo?.ar ?? null,
          showInMarquee: Object.prototype.hasOwnProperty.call(
            MARQUEE_PARTNER_BRAND_ORDER,
            brandNorm.normalized,
          ),
          order: 0,
          firstSeenRow: row.no,
          rawVariants: [rawToken],
          referencedByRows: [row.no],
          needsClientReviewReason: null,
        })
      }
    }

    if (isStructuralOrArch) {
      const altText = row.alternativeRaw?.trim() || '(empty)'
      const extraNote =
        row.no === 60
          ? ' (both brandRaw and alternativeRaw are "Al-rajhi Steel" — deduplicated to 1 brand link)'
          : row.no === 69
            ? ' ("Saudi cermics" normalized via spec map to "Saudi Ceramics"; "Alfanar Cermics" left as-is pending client confirmation)'
            : ''
      const reason = `Row ${String(row.no)} (${row.system}): origin column holds second supplier "${altText}" instead of a country — seeded [${rowBrandNames.join(', ')}] with empty origin (unless set in rows 1–57)${extraNote}.`
      needsClientReview.push({
        rowNo: row.no,
        system: row.system,
        category: 'structural-architectural-second-supplier',
        rawBrandOrOrigin: `brandRaw="${row.brandRaw}" | alternativeRaw="${row.alternativeRaw ?? ''}"`,
        normalizedBrands: rowBrandNames,
        details: reason,
      })
      for (const bName of rowBrandNames) {
        const b = brandsMap.get(bName)
        if (b && !b.needsClientReviewReason) {
          b.needsClientReviewReason = reason
        }
      }
    } else if (UNCERTAIN_MEP_BRAND_NOTES[row.no]) {
      const note = UNCERTAIN_MEP_BRAND_NOTES[row.no] ?? ''
      needsClientReview.push({
        rowNo: row.no,
        system: row.system,
        category:
          row.no === 21 || row.no === 42 || row.no === 47
            ? 'missing-brand-origin'
            : 'uncertain-brand-spelling-or-split',
        rawBrandOrOrigin: `brandRaw="${row.brandRaw}" | originRaw="${row.originRaw ?? ''}"`,
        normalizedBrands: rowBrandNames,
        details: note,
      })
      for (const bName of rowBrandNames) {
        const b = brandsMap.get(bName)
        if (b && !b.needsClientReviewReason) {
          b.needsClientReviewReason = note
        }
      }
    }

    materials.push({
      itemNo: row.no,
      system: row.system,
      rawDescription: row.description,
      descriptionEn: descResult.normalized,
      descriptionAr,
      brandNames: rowBrandNames,
      rawBrand: row.brandRaw,
      rawOriginOrAlternative: isStructuralOrArch
        ? (row.alternativeRaw ?? '')
        : (row.originRaw ?? ''),
      notesEn: null,
      notesAr: null,
      needsClientReview: Boolean(isStructuralOrArch || UNCERTAIN_MEP_BRAND_NOTES[row.no]),
    })
  }

  // Assign deterministic order values: marquee brands get 1..20 in Figma order, remaining get 21..N in first-seen order
  const allBrands = Array.from(brandsMap.values())
  let nextNonMarqueeOrder = 21
  for (const brand of allBrands) {
    const marqueeOrder = MARQUEE_PARTNER_BRAND_ORDER[brand.name]
    if (typeof marqueeOrder === 'number') {
      brand.order = marqueeOrder
    } else {
      brand.order = nextNonMarqueeOrder
      nextNonMarqueeOrder += 1
    }
  }
  allBrands.sort((a, b) => a.order - b.order)

  return {
    brands: allBrands,
    materials,
    normalizationsApplied: Array.from(normalizationsMap.values()),
    needsClientReview,
    arabicDrafts,
    systemCounts,
  }
}

function extractNumericBrandIdsFromDoc(rawBrands: Material['brands']): number[] {
  if (!Array.isArray(rawBrands)) {
    return []
  }
  return rawBrands
    .map((entry) => (typeof entry === 'number' ? entry : entry.id))
    .filter((id): id is number => typeof id === 'number' && Number.isInteger(id))
}

/**
 * Executes the idempotent `P4-T1` Materials + Brands seed via the Payload Local API
 * with `overrideAccess: false` and `SEED_ADMIN_USER` (`handoff/tasks/P4-T1.md`, `M-134`).
 */
export async function seedMaterialsAndBrands(
  payload: Payload,
  options?: {
    argv?: readonly string[]
    nodeEnv?: string
    rawRows?: readonly RawMaterialSeedRow[]
  },
): Promise<MaterialsSeedRunSummary> {
  assertSeedEnvironmentAllowed(options?.nodeEnv, options?.argv)

  const plan = buildMaterialsSeedPlan(options?.rawRows)
  const brandIdByName = new Map<string, number>()

  let brandsCreated = 0
  let brandsUpdated = 0
  let brandsUnchanged = 0

  for (const plannedBrand of plan.brands) {
    const existingEnRes = await payload.find({
      collection: 'brands',
      where: {
        name: {
          equals: plannedBrand.name,
        },
      },
      locale: 'en',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    const existingEn = existingEnRes.docs[0] as Brand | undefined

    if (!existingEn) {
      const createdAr = await payload.create({
        collection: 'brands',
        locale: 'ar',
        data: {
          name: plannedBrand.name,
          origin: plannedBrand.originAr,
          showInMarquee: plannedBrand.showInMarquee,
          order: plannedBrand.order,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })

      if (plannedBrand.originEn !== plannedBrand.originAr) {
        await payload.update({
          collection: 'brands',
          id: createdAr.id,
          locale: 'en',
          data: {
            origin: plannedBrand.originEn,
          },
          context: { disableRevalidate: true },
          overrideAccess: false,
          user: SEED_ADMIN_USER,
        })
      }

      brandIdByName.set(plannedBrand.name, createdAr.id)
      brandsCreated += 1
      continue
    }

    const existingAr = await payload.findByID({
      collection: 'brands',
      id: existingEn.id,
      locale: 'ar',
      depth: 0,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    const enMatches =
      (existingEn.origin ?? null) === (plannedBrand.originEn ?? null) &&
      Boolean(existingEn.showInMarquee) === plannedBrand.showInMarquee &&
      existingEn.order === plannedBrand.order
    const arMatches = (existingAr.origin ?? null) === (plannedBrand.originAr ?? null)

    if (enMatches && arMatches) {
      brandIdByName.set(plannedBrand.name, existingEn.id)
      brandsUnchanged += 1
      continue
    }

    if (!arMatches) {
      await payload.update({
        collection: 'brands',
        id: existingEn.id,
        locale: 'ar',
        data: {
          origin: plannedBrand.originAr,
          showInMarquee: plannedBrand.showInMarquee,
          order: plannedBrand.order,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    if (!enMatches) {
      await payload.update({
        collection: 'brands',
        id: existingEn.id,
        locale: 'en',
        data: {
          origin: plannedBrand.originEn,
          showInMarquee: plannedBrand.showInMarquee,
          order: plannedBrand.order,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    brandIdByName.set(plannedBrand.name, existingEn.id)
    brandsUpdated += 1
  }

  let materialsCreated = 0
  let materialsUpdated = 0
  let materialsUnchanged = 0

  for (const plannedMat of plan.materials) {
    const brandIds = plannedMat.brandNames.map((name) => {
      const id = brandIdByName.get(name)
      if (typeof id !== 'number') {
        throw new Error(`[seed] Missing brand ID for "${name}" on material #${String(plannedMat.itemNo)}`)
      }
      return id
    })

    const existingEnRes = await payload.find({
      collection: 'materials',
      where: {
        itemNo: {
          equals: plannedMat.itemNo,
        },
      },
      locale: 'en',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    const existingEn = existingEnRes.docs[0] as Material | undefined

    if (!existingEn) {
      const createdAr = await payload.create({
        collection: 'materials',
        locale: 'ar',
        data: {
          itemNo: plannedMat.itemNo,
          system: plannedMat.system,
          description: plannedMat.descriptionAr,
          brands: brandIds,
          notes: plannedMat.notesAr,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })

      await payload.update({
        collection: 'materials',
        id: createdAr.id,
        locale: 'en',
        data: {
          description: plannedMat.descriptionEn,
          notes: plannedMat.notesEn,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })

      materialsCreated += 1
      continue
    }

    const existingAr = await payload.findByID({
      collection: 'materials',
      id: existingEn.id,
      locale: 'ar',
      depth: 0,
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })

    const existingBrandIds = extractNumericBrandIdsFromDoc(existingEn.brands)
    const brandsMatch =
      existingBrandIds.length === brandIds.length &&
      existingBrandIds.every((id, idx) => id === brandIds[idx])

    const enMatches =
      existingEn.system === plannedMat.system &&
      existingEn.description === plannedMat.descriptionEn &&
      (existingEn.notes ?? null) === (plannedMat.notesEn ?? null) &&
      brandsMatch
    const arMatches =
      existingAr.description === plannedMat.descriptionAr &&
      (existingAr.notes ?? null) === (plannedMat.notesAr ?? null)

    if (enMatches && arMatches) {
      materialsUnchanged += 1
      continue
    }

    if (!arMatches || !brandsMatch || existingEn.system !== plannedMat.system) {
      await payload.update({
        collection: 'materials',
        id: existingEn.id,
        locale: 'ar',
        data: {
          system: plannedMat.system,
          description: plannedMat.descriptionAr,
          brands: brandIds,
          notes: plannedMat.notesAr,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    if (!enMatches) {
      await payload.update({
        collection: 'materials',
        id: existingEn.id,
        locale: 'en',
        data: {
          system: plannedMat.system,
          description: plannedMat.descriptionEn,
          brands: brandIds,
          notes: plannedMat.notesEn,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: SEED_ADMIN_USER,
      })
    }

    materialsUpdated += 1
  }

  // Query all seeded materials & brands to verify counts, >= 1 brand per material, and updatedAt digest
  const [allMaterialsRes, allBrandsRes] = await Promise.all([
    payload.find({
      collection: 'materials',
      sort: 'itemNo',
      limit: 200,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
    payload.find({
      collection: 'brands',
      sort: 'name',
      limit: 200,
      depth: 0,
      locale: 'en',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
  ])

  const minBrandsPerMaterial = allMaterialsRes.docs.reduce((min, doc) => {
    const count = extractNumericBrandIdsFromDoc(doc.brands).length
    return Math.min(min, count)
  }, Number.POSITIVE_INFINITY)

  const updatedAtDigest = [
    ...allBrandsRes.docs.map((b) => `brand:${b.name}:${b.updatedAt}`),
    ...allMaterialsRes.docs.map((m) => `material:${String(m.itemNo)}:${m.updatedAt}`),
  ].join('\n')

  return {
    brandsCreated,
    brandsUpdated,
    brandsUnchanged,
    brandsTotal: allBrandsRes.totalDocs,
    materialsCreated,
    materialsUpdated,
    materialsUnchanged,
    materialsTotal: allMaterialsRes.totalDocs,
    everyMaterialHasAtLeastOneBrand:
      allMaterialsRes.totalDocs === 73 && minBrandsPerMaterial >= 1,
    minBrandsPerMaterial: Number.isFinite(minBrandsPerMaterial) ? minBrandsPerMaterial : 0,
    systemCounts: plan.systemCounts,
    updatedAtDigest,
    plan,
  }
}

export function formatSeedSummaryLines(summary: MaterialsSeedRunSummary): string[] {
  const digestSha256 = crypto
    .createHash('sha256')
    .update(summary.updatedAtDigest, 'utf8')
    .digest('hex')

  return [
    '=== AL JAZIRA SEED SUMMARY (P4-T1: MATERIALS + BRANDS) ===',
    `brands: created=${String(summary.brandsCreated)}, updated=${String(summary.brandsUpdated)}, unchanged=${String(summary.brandsUnchanged)}, total=${String(summary.brandsTotal)}`,
    `materials: created=${String(summary.materialsCreated)}, updated=${String(summary.materialsUpdated)}, unchanged=${String(summary.materialsUnchanged)}, total=${String(summary.materialsTotal)}`,
    `systemCounts: electrical=${String(summary.systemCounts.electrical)}, mechanical=${String(summary.systemCounts.mechanical)}, structural=${String(summary.systemCounts.structural)}, architectural=${String(summary.systemCounts.architectural)}`,
    `everyMaterialHasAtLeastOneBrand: ${String(summary.everyMaterialHasAtLeastOneBrand)} (minBrandsPerMaterial=${String(summary.minBrandsPerMaterial)})`,
    `normalizationsApplied: ${String(summary.plan.normalizationsApplied.length)} distinct rule applications`,
    `needsClientReview: ${String(summary.plan.needsClientReview.length)} rows flagged`,
    `arabicDrafts: ${String(summary.plan.arabicDrafts.length)} rows drafted`,
    `updatedAtDigestSha256: ${digestSha256}`,
  ]
}
