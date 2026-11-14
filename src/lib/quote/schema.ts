import { z } from 'zod'

/**
 * Pure phone & quote validation schema module (`R-6`, `R-12`).
 *
 * IMPORTANT: This module must ONLY import `zod` (never `payload`, `src/env.ts`,
 * or `src/lib/ipHash.ts`) so it can be safely imported by both `'use client'`
 * frontend form components (`P3-T9`) and server-side handlers/collections (`P2-T6`, `P5-T1`).
 */

export const INTERNATIONAL_PHONE_CHARS_REGEX = /^(?:\+|00)\s*[1-9][0-9\s()-]{6,28}$/
export const KSA_LOCAL_PHONE_CHARS_REGEX = /^0[15][0-9\s()-]{7,14}$/
export const E164_KSA_PHONE_REGEX = /^\+966[15]\d{8}$/
export const E164_GENERAL_PHONE_REGEX = /^\+[1-9]\d{7,14}$/
const REPEATED_DIGIT_RUN_REGEX = /(\d)\1{6,}/

export const QUOTE_PHONE_ERROR_MESSAGE =
  'يرجى إدخال رقم هاتف سعودي أو دولي صالح (مثال: +966 57 353 4185 أو 05XXXXXXXX). / Please provide a valid KSA or international phone number.'

/**
 * Normalizes a KSA local (`05XXXXXXXX` / `01XXXXXXXX`) or international (`+...` / `00...`)
 * phone string to canonical E.164 format (`+9665XXXXXXXX`, `+971501234567`) by stripping
 * whitespace, parentheses, and hyphens, converting leading `00` to `+`, converting
 * 10-digit KSA local `05`/`01` numbers to `+9665`/`+9661`, and stripping an optional
 * trunk `0` after `+966` (`+966 0573534185` -> `+966573534185`) (`R-3`, `R-12`, `R-16`).
 */
export function normalizeQuotePhone(value: string): string {
  const trimmed = value.trim()
  const compact = trimmed.replace(/[\s()-]+/g, '')
  let normalized = compact
  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`
  } else if (/^0[15]\d{8}$/.test(normalized)) {
    normalized = `+966${normalized.slice(1)}`
  }
  if (/^\+9660[15]\d{8}$/.test(normalized)) {
    normalized = `+966${normalized.slice(5)}`
  }
  return normalized
}

/**
 * Formats a stored E.164 phone number (`+966573534185`) for human-readable UI display
 * (`+966 57 353 4185`) (`R-12`).
 */
export function formatPhoneForDisplay(value: string): string {
  const normalized = normalizeQuotePhone(value)
  const ksaMobileMatch = /^\+966(5\d)(\d{3})(\d{4})$/.exec(normalized)
  if (ksaMobileMatch) {
    return `+966 ${ksaMobileMatch[1]} ${ksaMobileMatch[2]} ${ksaMobileMatch[3]}`
  }
  const ksaLandlineMatch = /^\+966(1\d)(\d{3})(\d{4})$/.exec(normalized)
  if (ksaLandlineMatch) {
    return `+966 ${ksaLandlineMatch[1]} ${ksaLandlineMatch[2]} ${ksaLandlineMatch[3]}`
  }
  return normalized
}

/**
 * Validates KSA (`+966 5X XXX XXXX`, `00966 5X XXX XXXX`, `05XXXXXXXX`, `011XXXXXXX`)
 * and international E.164 phone numbers (`R-3`, `R-12`).
 *
 * Rules:
 * - International numbers must start with `+` or `00` (bare `966573534185` without `+` is rejected).
 * - KSA local numbers must start with `05` or `01` and have 10 digits (`05XXXXXXXX` -> `+9665XXXXXXXX`).
 * - Repeated-digit runs of 7+ identical digits (`+111111111111111`) are rejected.
 * - After normalizing to E.164 via `normalizeQuotePhone`, KSA numbers (`+966...`) must match
 *   `^\+966[15]\d{8}$` (country code `966` + 9 national digits), and other international numbers
 *   must match `^\+[1-9]\d{6,14}$`.
 */
export function isValidKsaOrInternationalPhone(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 30) {
    return false
  }

  const isInternationalInput = INTERNATIONAL_PHONE_CHARS_REGEX.test(trimmed)
  const isKsaLocalInput = KSA_LOCAL_PHONE_CHARS_REGEX.test(trimmed)
  if (!isInternationalInput && !isKsaLocalInput) {
    return false
  }

  const normalized = normalizeQuotePhone(trimmed)
  if (!E164_GENERAL_PHONE_REGEX.test(normalized)) {
    return false
  }

  const digitsOnly = normalized.slice(1)
  if (REPEATED_DIGIT_RUN_REGEX.test(digitsOnly)) {
    return false
  }

  if (normalized.startsWith('+966')) {
    return E164_KSA_PHONE_REGEX.test(normalized)
  }

  return true
}

/**
 * Shared Zod phone schema for reuse in `QuoteRequests` (`P2-T6`), the client Quote Form UI
 * (`P3-T9`), and the server quote submission handler (`P5-T1`) (`R-3`, `R-6`, `R-12`).
 * Validates the input and transforms it to canonical E.164 format (`+9665XXXXXXXX`).
 */
export const quotePhoneSchema = z
  .string()
  .trim()
  .min(1, 'رقم الجوال مطلوب. / Phone number is required.')
  .max(30, 'رقم الجوال طويل جداً. / Phone number is too long.')
  .refine((val) => isValidKsaOrInternationalPhone(val), {
    message: QUOTE_PHONE_ERROR_MESSAGE,
  })
  .transform((val) => normalizeQuotePhone(val))

// ============================================================================
// 3-Step Quote Form Schema (`103:422` & `P3-T9` / `P5-T1`)
// ============================================================================

export const QUOTE_PROJECT_TYPE_VALUES = [
  'hotel-tower',
  'commercial-office',
  'hospital-healthcare',
  'industrial-warehouse',
  'residential-compound',
  'infrastructure-data-center',
  'other',
] as const
export type QuoteProjectType = (typeof QUOTE_PROJECT_TYPE_VALUES)[number]

export const QUOTE_PROJECT_STAGE_VALUES = [
  'design',
  'tender',
  'construction',
  'retrofit',
  'maintenance',
] as const
export type QuoteProjectStage = (typeof QUOTE_PROJECT_STAGE_VALUES)[number]

export const QUOTE_SERVICE_NEEDED_VALUES = [
  'hvac',
  'fire-fighting',
  'plumbing',
  'electrical',
  'low-current',
  'smart-systems',
  'supply-only',
] as const
export type QuoteServiceNeeded = (typeof QUOTE_SERVICE_NEEDED_VALUES)[number]

export const QUOTE_PROJECT_LOCATION_VALUES = [
  'makkah',
  'riyadh',
  'jeddah',
  'madinah',
  'eastern-province',
  'neom-red-sea',
  'other',
] as const
export type QuoteProjectLocation = (typeof QUOTE_PROJECT_LOCATION_VALUES)[number]

export const QUOTE_PREFERRED_CONTACT_VALUES = ['whatsapp', 'phone', 'email'] as const
export type QuotePreferredContact = (typeof QUOTE_PREFERRED_CONTACT_VALUES)[number]

export const QUOTE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const quoteStep1Schema = z.object({
  projectType: z.enum(QUOTE_PROJECT_TYPE_VALUES),
  projectStage: z.enum(QUOTE_PROJECT_STAGE_VALUES),
  servicesNeeded: z
    .array(z.enum(QUOTE_SERVICE_NEEDED_VALUES))
    .min(1, 'يرجى اختيار خدمة واحدة على الأقل. / Please select at least one service.')
    .max(7),
  projectLocation: z.enum(QUOTE_PROJECT_LOCATION_VALUES),
  attachmentFileName: z.string().trim().max(240).optional().default(''),
})
export type QuoteStep1Input = z.infer<typeof quoteStep1Schema>

export const quoteStep2Schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'الاسم الكامل مطلوب. / Full name is required.')
    .max(120, 'الاسم الكامل طويل جداً. / Full name must be at most 120 characters.'),
  company: z
    .string()
    .trim()
    .max(160, 'اسم الشركة طويل جداً. / Company name must be at most 160 characters.')
    .optional()
    .default(''),
  phone: quotePhoneSchema,
  email: z
    .string()
    .trim()
    .min(1, 'البريد الإلكتروني مطلوب. / Email is required.')
    .max(254, 'البريد الإلكتروني طويل جداً. / Email is too long.')
    .refine((val) => QUOTE_EMAIL_REGEX.test(val), {
      message: 'يرجى إدخال بريد إلكتروني صالح. / Please provide a valid email address.',
    }),
  preferredContact: z.enum(QUOTE_PREFERRED_CONTACT_VALUES),
})
export type QuoteStep2Input = z.infer<typeof quoteStep2Schema>

export const quoteStep3Schema = z.object({
  message: z
    .string()
    .trim()
    .max(3000, 'الرسالة يجب ألا تتجاوز 3000 حرف. / Message must not exceed 3000 characters.')
    .optional()
    .default(''),
  consent: z.boolean().refine((val) => val, {
    message:
      'يجب الموافقة على سياسة الخصوصية ومعالجة البيانات. / Consent to the privacy policy is required.',
  }),
})
export type QuoteStep3Input = z.infer<typeof quoteStep3Schema>

export const quoteSubmissionSchema = quoteStep1Schema
  .extend(quoteStep2Schema.shape)
  .extend(quoteStep3Schema.shape)
  .extend({
    locale: z.enum(['en', 'ar']).default('en'),
    sourcePage: z.string().trim().max(240).default('/en/contact'),
    honeypot: z.string().max(240).optional().default(''),
    startedAtMs: z.number().int().nonnegative(),
    // P5-T1: the server-signed "form opened at" token; the server never trusts `startedAtMs`.
    startToken: z.string().trim().max(200).optional().default(''),
    // P5-T1 §6: Cloudflare Turnstile response, checked only when TURNSTILE_ENABLED is on.
    turnstileToken: z.string().trim().max(2048).optional().default(''),
  })
export type QuoteSubmissionPayload = z.infer<typeof quoteSubmissionSchema>

export type QuoteFieldErrorKey =
  | 'projectType'
  | 'projectStage'
  | 'servicesNeeded'
  | 'projectLocation'
  | 'name'
  | 'company'
  | 'phone'
  | 'email'
  | 'preferredContact'
  | 'message'
  | 'consent'
