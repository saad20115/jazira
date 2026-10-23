import { z } from 'zod'

/**
 * Pure phone & quote validation schema module (`R-6`, `R-12`).
 *
 * IMPORTANT: This module must ONLY import `zod` (never `payload`, `src/env.ts`,
 * or `src/lib/ipHash.ts`) so it can be safely imported by both `'use client'`
 * frontend form components (`P3-T9`) and server-side handlers/collections (`P2-T6`, `P5-T1`).
 */

export const INTERNATIONAL_PHONE_CHARS_REGEX = /^(?:\+|00)[1-9][0-9\s()-]{6,28}$/
export const KSA_LOCAL_PHONE_CHARS_REGEX = /^0[15][0-9\s()-]{7,14}$/
export const E164_KSA_PHONE_REGEX = /^\+966[15]\d{8}$/
export const E164_GENERAL_PHONE_REGEX = /^\+[1-9]\d{7,14}$/
const REPEATED_DIGIT_RUN_REGEX = /(\d)\1{6,}/

export const QUOTE_PHONE_ERROR_MESSAGE =
  'يرجى إدخال رقم هاتف سعودي أو دولي صالح (مثال: +966 57 353 4185 أو 05XXXXXXXX). / Please provide a valid KSA or international phone number.'

/**
 * Normalizes a KSA local (`05XXXXXXXX` / `01XXXXXXXX`) or international (`+...` / `00...`)
 * phone string to canonical E.164 format (`+9665XXXXXXXX`, `+971501234567`) by stripping
 * whitespace, parentheses, and hyphens, converting leading `00` to `+`, and converting
 * 10-digit KSA local `05`/`01` numbers to `+9665`/`+9661` (`R-3`, `R-12`).
 */
export function normalizeQuotePhone(value: string): string {
  const trimmed = value.trim()
  const compact = trimmed.replace(/[\s()-]+/g, '')
  if (compact.startsWith('00')) {
    return `+${compact.slice(2)}`
  }
  if (/^0[15]\d{8}$/.test(compact)) {
    return `+966${compact.slice(1)}`
  }
  return compact
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
