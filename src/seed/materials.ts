import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'

import type { Material, User } from '@/payload-types'

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
  category:
    | 'brand-typo'
    | 'brand-product-note'
    | 'brand-case-whitespace'
    | 'description-typo'
    | 'description-case'
    | 'country'
    | 'figma-partner-display-mapping'
  field: 'brandRaw' | 'description' | 'originRaw'
  normalizedValue: string
  rawValue: string
  reason: string
  rowNumbers: number[]
}

export interface ClientReviewItem {
  category:
    | 'structural-architectural-second-supplier'
    | 'uncertain-description-typo'
    | 'uncertain-brand-spelling-or-split'
    | 'missing-brand-origin'
    | 'figma-partner-display-mapping'
    | 'arabic-material-draft'
  details: string
  normalizedBrands: string[]
  rawBrandOrOrigin: string
  rowNo: number
  system: MaterialSystemSlug
}

export interface FigmaPartnerDisplayMapping {
  confirmationNeeded: string
  figmaDisplayName: string
  marqueeOrder: number
  rawBrandValue: string
  rowNumbers: number[]
  seededBrandName: string
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
    reviewNote: string | null
    system: MaterialSystemSlug
  }>
  brands: PlannedBrandSeed[]
  figmaPartnerMappings: FigmaPartnerDisplayMapping[]
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
  reseeded: boolean
  systemCounts: Record<MaterialSystemSlug, number>
  updatedAtDigest: string
}

/**
 * In-memory synthetic admin `User` context (`id: 0, role: 'admin'`) passed to Payload Local API
 * calls (`payload.count`, `payload.find`, `payload.create`, `payload.delete`, `payload.update`)
 * with `overrideAccess: false`.
 *
 * Architectural note (`R-7`): `SEED_ADMIN_USER` is NOT a persisted row in the PostgreSQL `users`
 * table (`brands` and `materials` have no foreign-key reference to `users`). Passing this
 * in-memory `User` object with `overrideAccess: false` ensures every Local API operation in the
 * server-only seed script is evaluated through the collection's configured `isAdminOrEditor`
 * access-control function without inserting a dummy admin account into the database.
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
 * Validates that the seed script is running in an allowed server environment (`handoff/tasks/P4-T1.md` §Scope 1,
 * `docs/02-content-model.md` §"Seed data rules", `handoff/reviews/P4-T1.md` `R-4`):
 * 1. Never runs in a browser context (`SEED_SERVER_ONLY_SENTINEL`).
 * 2. `--reseed` is strictly development-only and is ALWAYS refused when `NODE_ENV === 'production'`
 *    (even if `--force-production` is also passed).
 * 3. First-run baseline seed is refused when `NODE_ENV === 'production'` unless `--force-production`
 *    is passed explicitly.
 */
export function assertSeedEnvironmentAllowed(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  argv: readonly string[] = process.argv,
  reseedOption?: boolean,
): void {
  if (typeof window !== 'undefined') {
    throw new Error(SEED_SERVER_ONLY_SENTINEL)
  }
  const hasReseedFlag = reseedOption === true || argv.includes('--reseed')
  if (nodeEnv === 'production' && hasReseedFlag) {
    throw new Error(
      '[seed] Refusing to run --reseed when NODE_ENV=production. --reseed is a development-only flag and is never allowed in production.',
    )
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
 * Partner brands featured in the Home page Trusted Partners marquee (`design/copy/01-home.md` `18:579`,
 * `docs/02-content-model.md` §"Seed data rules" CTO additions 2026-10-24).
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
  Hempel: 14,
  'Jazeera Paints': 15,
  'Saudi Ceramics': 16,
  Tahweel: 17,
  'Bahra Cables': 18,
  'Al-Rajhi Steel': 19,
  'Obeikan Glass': 20,
}

/**
 * Figma Trusted Partners display-name mappings (`design/copy/01-home.md` `18:579` ↔ `seed/materials.raw.json`,
 * `docs/02-content-model.md` lines 152–156, `handoff/reviews/P4-T1.md` `R-5`).
 * Per `docs/02-content-model.md`:
 * - `Hempel (Coating)` -> brand `Hempel` (parenthetical product note stripped from brand name and kept on material #31).
 * - `Eaton Cooper`↔`Cooper`, `Systemair`↔`System Air`, `Al Rajhi Steel`↔`Al-Rajhi Steel`: the seeded brand name
 *   stays the raw/normalized one (`Cooper`, `System Air`, `Al-Rajhi Steel`), and the mapping is reported for client
 *   confirmation of display names.
 */
export const FIGMA_PARTNER_DISPLAY_NAME_MAPPINGS: readonly FigmaPartnerDisplayMapping[] = [
  {
    marqueeOrder: 6,
    figmaDisplayName: 'Eaton Cooper',
    rawBrandValue: 'COOPER',
    seededBrandName: 'Cooper',
    rowNumbers: [19],
    confirmationNeeded:
      'Figma Trusted Partners (18:579) displays "Eaton Cooper"; raw row 19 has brandRaw="COOPER" and originRaw="COOPER: United States (brand; now Eaton)". Seeded brand name stays raw/normalized "Cooper" — confirm display name with client.',
  },
  {
    marqueeOrder: 13,
    figmaDisplayName: 'Systemair',
    rawBrandValue: 'SYSTEM AIR',
    seededBrandName: 'System Air',
    rowNumbers: [56],
    confirmationNeeded:
      'Figma Trusted Partners (18:579) displays single-word "Systemair"; raw row 56 has two-word "SYSTEM AIR". Seeded brand name stays raw/normalized "System Air" — confirm display name with client.',
  },
  {
    marqueeOrder: 14,
    figmaDisplayName: 'Hempel',
    rawBrandValue: 'HEMPEL (COATING)',
    seededBrandName: 'Hempel',
    rowNumbers: [31],
    confirmationNeeded:
      'Raw row 31 has parenthetical product note "HEMPEL (COATING)"; normalized to brand "Hempel" (matching Figma 18:579) and product note kept on material #31 notes — confirm with client.',
  },
  {
    marqueeOrder: 19,
    figmaDisplayName: 'Al Rajhi Steel',
    rawBrandValue: 'Al-rajhi Steel',
    seededBrandName: 'Al-Rajhi Steel',
    rowNumbers: [60],
    confirmationNeeded:
      'Figma Trusted Partners (18:579) displays unhyphenated "Al Rajhi Steel"; raw row 60 has hyphenated "Al-rajhi Steel". Seeded brand name stays raw/normalized "Al-Rajhi Steel" — confirm display name with client.',
  },
]

/**
 * Uncertain English description typos in `seed/materials.raw.json` (`handoff/reviews/P4-T1.md` `R-2`,
 * `docs/02-content-model.md` line 150). Left as-is in English (Title Case only), translated literally
 * in Arabic, and flagged with a review note on the material and in the report for client confirmation.
 */
export const UNCERTAIN_DESCRIPTION_TYPO_NOTES: Readonly<
  Record<
    number,
    | {
        arReviewNote: string
        enReviewNote: string
        literalArabicExplanation: string
        rawDescription: string
        suspectedIntendedEnglish: string
      }
    | undefined
  >
> = {
  13: {
    rawDescription: 'DISCONNECTED SWITCH',
    suspectedIntendedEnglish: 'Disconnect Switch',
    literalArabicExplanation:
      'Raw English "DISCONNECTED SWITCH" is left as "Disconnected Switch" and translated literally as "مفتاح مفصول"; confirm with client whether "Disconnect Switch" ("مفتاح فصل") was intended.',
    enReviewNote:
      'Client review needed: raw description is "DISCONNECTED SWITCH" (translated literally to Arabic "مفتاح مفصول") — confirm whether "Disconnect Switch" was intended.',
    arReviewNote:
      'يرجى مراجعة العميل: الوصف الإنجليزي الأصلي "DISCONNECTED SWITCH" تُرجم حرفياً إلى "مفتاح مفصول" — يرجى تأكيد ما إذا كان المقصود "مفتاح فصل" (Disconnect Switch).',
  },
  21: {
    rawDescription: 'FIREPIPES',
    suspectedIntendedEnglish: 'Fire Pipes',
    literalArabicExplanation:
      'Raw English single-word "FIREPIPES" is left as "Firepipes" and translated literally as "مواسير حريق"; confirm with client whether two-word "Fire Pipes" was intended.',
    enReviewNote:
      'Client review needed: raw description is single-word "FIREPIPES" (translated literally to Arabic "مواسير حريق") — confirm whether "Fire Pipes" was intended.',
    arReviewNote:
      'يرجى مراجعة العميل: الوصف الإنجليزي الأصلي "FIREPIPES" ورد ككلمة واحدة وتُرجم حرفياً إلى "مواسير حريق" — يرجى تأكيد ما إذا كان المقصود "Fire Pipes".',
  },
  27: {
    rawDescription: 'TEMPER SWITCH',
    suspectedIntendedEnglish: 'Tamper Switch',
    literalArabicExplanation:
      'Raw English "TEMPER SWITCH" is left as "Temper Switch" and translated literally as "مفتاح تقسية"; confirm with client whether "Tamper Switch" ("مفتاح مراقبة العبث") was intended.',
    enReviewNote:
      'Client review needed: raw description is "TEMPER SWITCH" (translated literally to Arabic "مفتاح تقسية") — confirm whether "Tamper Switch" was intended.',
    arReviewNote:
      'يرجى مراجعة العميل: الوصف الإنجليزي الأصلي "TEMPER SWITCH" تُرجم حرفياً إلى "مفتاح تقسية" — يرجى تأكيد ما إذا كان المقصود "مفتاح مراقبة العبث" (Tamper Switch).',
  },
  54: {
    rawDescription: 'OUT LET GRILL',
    suspectedIntendedEnglish: 'Outlet Grill / Outlet Grille',
    literalArabicExplanation:
      'Raw English "OUT LET GRILL" is left as "Out Let Grill" and translated literally as "شبكة مخرج"; confirm with client whether "Outlet Grill" / "Outlet Grille" was intended.',
    enReviewNote:
      'Client review needed: raw description is "OUT LET GRILL" (translated literally to Arabic "شبكة مخرج") — confirm whether "Outlet Grill" / "Outlet Grille" was intended.',
    arReviewNote:
      'يرجى مراجعة العميل: الوصف الإنجليزي الأصلي "OUT LET GRILL" تُرجم حرفياً إلى "شبكة مخرج" — يرجى تأكيد ما إذا كان المقصود "Outlet Grill".',
  },
}

/**
 * Arabic drafted material descriptions for all 73 rows (`handoff/tasks/P4-T1.md` §Scope 5,
 * `docs/02-content-model.md` line 161, `handoff/reviews/P4-T1.md` `R-2` & `R-3`).
 * Every Arabic draft translates strictly what the English description says with zero added specs,
 * and is listed in the P4-T1 report for client confirmation (`needsClientReview`).
 */
export const MATERIAL_ARABIC_DRAFT_MAP: Readonly<Record<number, string | undefined>> = {
  1: 'مواسير EMT',
  2: 'علبة كهربائية',
  3: 'علبة كهربائية فولاذية',
  4: 'مواسير كهربائية PVC',
  5: 'حامل كابلات',
  6: 'مجرى كابلات',
  7: 'كابلات كهربائية',
  8: 'أسلاك',
  9: 'كابلات إنذار الحريق',
  10: 'كابل بيانات لعلبة الأرضية',
  11: 'التأريض والاتصال الأرضي',
  12: 'أدوات التوصيل الكهربائي',
  13: 'مفتاح مفصول',
  14: 'علبة أرضية',
  15: 'بطارية إنارة الطوارئ',
  16: 'إنارة',
  17: 'إنارة خارجية',
  18: 'إنارة',
  19: 'نظام إنذار الحريق',
  20: 'لوحة توزيع',
  21: 'مواسير حريق',
  22: 'مواسير مجلفنة',
  23: 'قطع اتصال مخددة',
  24: 'قطع اتصال مسننة',
  25: 'مربط مشطور مبطن وعلاقة كليفس',
  26: 'صمام ZCV للحريق',
  27: 'مفتاح تقسية',
  28: 'صمام اختبار وتصريف',
  29: 'مفتاح تدفق',
  30: 'مقياس ضغط',
  31: 'دهانات مواسير الحريق',
  32: 'مضخة حريق',
  33: 'صندوق خرطوم حريق فولاذي',
  34: 'طفاية حريق',
  35: 'نوفيك (NOVEC)',
  36: 'أيروسول (Aerosol)',
  37: 'مواسير PPR',
  38: 'قطع اتصال (وصلات)',
  39: 'صمامات سباكة',
  40: 'مانع المطرقة المائية',
  41: 'حنفيات خراطيم',
  42: 'عزل السباكة',
  43: 'ماسورة صرف',
  44: 'مواسير صرف التكييف',
  45: 'ماسورة تصريف وصرف',
  46: 'مواسير صرف',
  47: 'خزان طرد للمرحاض (WC)',
  48: 'خزان مياه',
  49: 'سخان مياه',
  50: 'مضخة تقوية',
  51: 'صاج مجاري الهواء',
  52: 'عزل مجاري الهواء',
  53: 'مواسير DX',
  54: 'شبكة مخرج',
  55: 'وحدات تكييف',
  56: 'مروحة',
  57: 'مصاعد',
  58: 'خرسانة جاهزة',
  59: 'أسمنت',
  60: 'قضبان حديد التسليح',
  61: 'أغشية العزل المائي',
  62: 'العزل الحراري للأسطح',
  63: 'وحدات البناء الخرسانية',
  64: 'أبواب وإطارات خشبية',
  65: 'أنظمة الألمنيوم',
  66: 'زجاج',
  67: 'ألواح جبس',
  68: 'إضافات اللياسة',
  69: 'بورسلين',
  70: 'رخام',
  71: 'دهانات',
  72: 'تكسية GRC',
  73: 'درابزين حديد مشغول',
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

  // Uncertain typos ("DISCONNECTED SWITCH", "FIREPIPES", "TEMPER SWITCH", "OUT LET GRILL")
  // are left as-is (Title Case only) and flagged for client review (`R-2`).
  const normalized = words.join(' ')
  return {
    normalized,
    typosReplaced,
    caseNormalized: normalized !== rawDescription,
  }
}

/**
 * Normalizes a single brand token using `SPEC_BRAND_TYPO_MAP`, parenthetical product-note
 * stripping for `HEMPEL (COATING)` -> `Hempel` (`docs/02-content-model.md` line 152, `R-5`),
 * plus case/whitespace normalization.
 */
export function normalizeBrandName(rawBrandToken: string): {
  caseOrWhitespaceNormalized: boolean
  normalized: string
  productNoteStripped?: boolean
  specTypoApplied: boolean
} {
  const collapsed = rawBrandToken
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, (match) => (match.includes(' ') ? ' - ' : '-'))

  const upperKey = collapsed.toUpperCase()
  if (upperKey === 'HEMPEL (COATING)') {
    return {
      normalized: 'Hempel',
      specTypoApplied: false,
      productNoteStripped: true,
      caseOrWhitespaceNormalized: true,
    }
  }

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
 * Resolves per-brand `{ en, ar }` country of origin from `originRaw` (`handoff/tasks/P4-T1.md` §Scope 3,
 * `handoff/reviews/P4-T1.md` `R-1`).
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

  // Case 3: One or more `Brand: Country` pairs (separated by `|`, `,`, `/`, or `-` after a `: Country` value
  // before the next `Brand:` key — never splitting on a hyphen inside a brand key like `HI-TECH: United States`, `R-1`).
  const normalizedPairsText = trimmedOrigin
    .replace(/\)\s*:\s*([A-Za-z ]+?)\s+(?=[A-Z]+\s*\()/g, '): $1 | ')
    .replace(/:\s*([A-Za-z][A-Za-z ]*?)\s*-\s*(?=[A-Za-z][A-Za-z ]*\s*:)/g, ': $1 | ')

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
    19: 'originRaw notes "COOPER: United States (brand; now Eaton) | AVANGER: United Kingdom"; left as "Cooper" (Figma 18:579 displays "Eaton Cooper") and "Avanger" pending client confirmation on display name and "Avenger" spelling.',
    20: 'brandRaw has "EFFECTIVE POWER - ASSTTE" while originRaw has "(EFFECTIVE POWER-ASTTE): Saudi Arabia"; left as "Effective Power - ASSTTE" pending client confirmation on spelling.',
    21: 'brandRaw is "ALJAZIRAH (OMAN-SAUDI)" and originRaw is "ALJAZIRAH (OMAN-SAUDI):" (empty country after colon); left as-is with empty origin pending client confirmation (compare row 22 "ALJAZERA").',
    22: 'brandRaw is "ALJAZERA" with originRaw "ALJAZERA: Saudi Arabia / Oman"; left as "Aljazera" pending client confirmation whether rows 21 and 22 are the same manufacturer (Al Jazeera Steel Products Co.).',
    23: 'brandRaw is "Junt / JTPR UL-FM" (includes UL-FM certification suffix on JTPR); left as "Junt" and "JTPR UL-FM" pending client confirmation.',
    24: 'brandRaw is "JIHANZI -UL/FM" (UL/FM certification suffix with slash); kept as single brand "Jihanzi -UL/FM" (China) pending client confirmation.',
    31: 'brandRaw is "JAZEERA (PRIMER) HEMPEL (COATING)" and originRaw has two Brand: Country pairs ("JAZEERA (PRIMER):Saudi arbia HEMPEL (COATING): Denmark"); "HEMPEL (COATING)" normalized to brand "Hempel" with product note kept on material #31, and "Jazeera (Primer)" kept pending client confirmation whether to merge with "Jazeera Paints" (row 71).',
    42: 'originRaw is "AEROFOAM: UAE" without a country for second brand "arma flex" ("Armaflex"); seeded "Armaflex" with empty origin pending client confirmation.',
    47: 'originRaw is "GROHE: Germany" without a country for second brand "GEBRIT" ("Geberit"); seeded "Geberit" with empty origin pending client confirmation.',
    53: 'brandRaw is "LUVATA-CAMLEE" joined by hyphen while originRaw has two Brand: Country pairs ("LUVATA :ITALY /CAMLEE: CHINA"); split into "Luvata" (Italy) and "Camlee" (China) pending client confirmation.',
    56: 'brandRaw is "SYSTEM AIR/BLACK HORSE"; left as "System Air" (two words) pending client confirmation on display name vs single-word "Systemair" in Figma (18:579).',
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

    const uncertainDescTypo = UNCERTAIN_DESCRIPTION_TYPO_NOTES[row.no]
    const descriptionAr =
      MATERIAL_ARABIC_DRAFT_MAP[row.no] ?? `${descResult.normalized} (مسودة)`
    arabicDrafts.push({
      itemNo: row.no,
      system: row.system,
      rawDescription: row.description,
      descriptionEn: descResult.normalized,
      descriptionAr,
      reviewNote: uncertainDescTypo ? uncertainDescTypo.literalArabicExplanation : null,
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
      if (brandNorm.productNoteStripped) {
        addNormalization(
          'brand-product-note',
          'brandRaw',
          rawToken,
          brandNorm.normalized,
          'Parenthetical product note "(COATING)" stripped from brand name and kept on material #31 notes (docs/02-content-model.md)',
          row.no,
        )
      } else if (brandNorm.specTypoApplied) {
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

    if (uncertainDescTypo) {
      needsClientReview.push({
        rowNo: row.no,
        system: row.system,
        category: 'uncertain-description-typo',
        rawBrandOrOrigin: `description="${row.description}"`,
        normalizedBrands: rowBrandNames,
        details: uncertainDescTypo.literalArabicExplanation,
      })
    }

    if (isStructuralOrArch) {
      const altText = row.alternativeRaw?.trim() || '(empty)'
      const extraNote =
        row.no === 60
          ? ' (both brandRaw and alternativeRaw are "Al-rajhi Steel" — deduplicated to 1 brand link; Figma 18:579 displays "Al Rajhi Steel")'
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

    const row31NotesEn =
      row.no === 31
        ? 'Product notes from brand cell: Hempel (Coating); Jazeera (Primer).'
        : null
    const row31NotesAr =
      row.no === 31
        ? 'ملاحظات المنتج من حقل العلامة التجارية: همبل (طلاء نهائي / Coating)؛ الجزيرة (أساس / Primer).'
        : null

    const notesEn = uncertainDescTypo ? uncertainDescTypo.enReviewNote : row31NotesEn
    const notesAr = uncertainDescTypo ? uncertainDescTypo.arReviewNote : row31NotesAr

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
      notesEn,
      notesAr,
      needsClientReview: Boolean(
        isStructuralOrArch || UNCERTAIN_MEP_BRAND_NOTES[row.no] || uncertainDescTypo,
      ),
    })
  }

  // Record Figma Trusted Partners (18:579) ↔ raw brand display-name mappings (`R-5`, `docs/02-content-model.md:154-156`)
  for (const mapping of FIGMA_PARTNER_DISPLAY_NAME_MAPPINGS) {
    for (const rowNo of mapping.rowNumbers) {
      addNormalization(
        'figma-partner-display-mapping',
        'brandRaw',
        `Figma "${mapping.figmaDisplayName}" ↔ raw "${mapping.rawBrandValue}"`,
        mapping.seededBrandName,
        mapping.confirmationNeeded,
        rowNo,
      )
    }
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
    figmaPartnerMappings: [...FIGMA_PARTNER_DISPLAY_NAME_MAPPINGS],
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
 * Executes the first-run baseline `P4-T1` Materials + Brands seed via the Payload Local API
 * with `overrideAccess: false` and `SEED_ADMIN_USER` (`handoff/tasks/P4-T1.md`, `M-134`,
 * `docs/02-content-model.md` lines 157–160, `handoff/reviews/P4-T1.md` `R-4`).
 *
 * Behavior (`R-4`):
 * - Runs on an empty `brands` and `materials` database (`brands === 0 && materials === 0`).
 * - Refuses to run (throws Error -> CLI exits 1) on a non-empty database unless `--reseed`
 *   (`options?.reseed` or `argv.includes('--reseed')`) is passed explicitly.
 * - Always refuses `--reseed` when `NODE_ENV === 'production'`.
 * - Never overwrites editor changes or creates duplicate brands after a rename unless `--reseed`
 *   is explicitly invoked in development.
 */
export async function seedMaterialsAndBrands(
  payload: Payload,
  options?: {
    argv?: readonly string[]
    nodeEnv?: string
    rawRows?: readonly RawMaterialSeedRow[]
    reseed?: boolean
  },
): Promise<MaterialsSeedRunSummary> {
  const effectiveNodeEnv = options?.nodeEnv ?? process.env.NODE_ENV
  const effectiveArgv = options?.argv ?? process.argv
  const reseed = options?.reseed === true || effectiveArgv.includes('--reseed')

  assertSeedEnvironmentAllowed(effectiveNodeEnv, effectiveArgv, reseed)

  const [existingBrandsCountRes, existingMaterialsCountRes] = await Promise.all([
    payload.count({
      collection: 'brands',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
    payload.count({
      collection: 'materials',
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    }),
  ])

  const existingBrandsCount = existingBrandsCountRes.totalDocs
  const existingMaterialsCount = existingMaterialsCountRes.totalDocs

  if ((existingBrandsCount > 0 || existingMaterialsCount > 0) && !reseed) {
    throw new Error(
      `[seed] Refusing to run seed on a non-empty database (brands=${String(existingBrandsCount)}, materials=${String(existingMaterialsCount)}). The seed is a first-run baseline and never overwrites existing data. Pass --reseed in development to clear and rebuild brands and materials.`,
    )
  }

  let reseeded = false
  if ((existingBrandsCount > 0 || existingMaterialsCount > 0) && reseed) {
    // Delete materials first (since materials.brands references brands), then brands
    await payload.delete({
      collection: 'materials',
      where: {
        id: {
          exists: true,
        },
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    await payload.delete({
      collection: 'brands',
      where: {
        id: {
          exists: true,
        },
      },
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: SEED_ADMIN_USER,
    })
    reseeded = true
  }

  const plan = buildMaterialsSeedPlan(options?.rawRows)
  const brandIdByName = new Map<string, number>()

  let brandsCreated = 0
  const brandsUpdated = 0
  const brandsUnchanged = 0

  for (const plannedBrand of plan.brands) {
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
  }

  let materialsCreated = 0
  const materialsUpdated = 0
  const materialsUnchanged = 0

  for (const plannedMat of plan.materials) {
    const brandIds = plannedMat.brandNames.map((name) => {
      const id = brandIdByName.get(name)
      if (typeof id !== 'number') {
        throw new Error(`[seed] Missing brand ID for "${name}" on material #${String(plannedMat.itemNo)}`)
      }
      return id
    })

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
    reseeded,
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
    `mode: ${summary.reseeded ? 'reseed (--reseed)' : 'first-run baseline'}`,
    `brands: created=${String(summary.brandsCreated)}, updated=${String(summary.brandsUpdated)}, unchanged=${String(summary.brandsUnchanged)}, total=${String(summary.brandsTotal)}`,
    `materials: created=${String(summary.materialsCreated)}, updated=${String(summary.materialsUpdated)}, unchanged=${String(summary.materialsUnchanged)}, total=${String(summary.materialsTotal)}`,
    `systemCounts: electrical=${String(summary.systemCounts.electrical)}, mechanical=${String(summary.systemCounts.mechanical)}, structural=${String(summary.systemCounts.structural)}, architectural=${String(summary.systemCounts.architectural)}`,
    `everyMaterialHasAtLeastOneBrand: ${String(summary.everyMaterialHasAtLeastOneBrand)} (minBrandsPerMaterial=${String(summary.minBrandsPerMaterial)})`,
    `normalizationsApplied: ${String(summary.plan.normalizationsApplied.length)} distinct rule applications`,
    `figmaPartnerMappings: ${String(summary.plan.figmaPartnerMappings.length)} Figma↔raw partner display mappings`,
    `needsClientReview: ${String(summary.plan.needsClientReview.length)} items flagged`,
    `arabicDrafts: ${String(summary.plan.arabicDrafts.length)} rows drafted`,
    `updatedAtDigestSha256: ${digestSha256}`,
  ]
}
