import 'server-only'

import crypto from 'node:crypto'

import { getDictionary, isSupportedLocale, type SupportedLocale } from '@/i18n'
import type { PublicQuoteRequestData, QuoteAttemptCounts } from '@/lib/cms/client'
import {
  type QuoteFieldErrorKey,
  type QuoteSubmissionPayload,
  quoteSubmissionSchema,
} from '@/lib/quote/schema'

/**
 * P5-T1 — the quote form's server-side decision logic (I1, I6, Z4, D2).
 *
 * It is written against injected dependencies so the unit tests can drive every branch without a
 * database; `actions.ts` wires the real ones (Postgres rate limit, Local API save, Turnstile).
 */

/** Limits from the P5-T1 card §1. */
export const QUOTE_RATE_LIMIT_PER_MINUTE = 3
export const QUOTE_RATE_LIMIT_PER_DAY = 20
export const QUOTE_MIN_FILL_TIME_MS = 3_000
/** A start token older than this is treated as stale (the visitor reloads the page). */
export const QUOTE_START_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000

export type QuoteFormErrorCode = 'invalid' | 'rateLimited' | 'unavailable'

export type QuoteSubmissionResult =
  | { ok: true }
  | { ok: false; fieldErrors: Partial<Record<QuoteFieldErrorKey, string>> }
  | { ok: false; formError: QuoteFormErrorCode }

export interface QuoteHandlerDeps {
  nowMs: number
  ipHash: string
  userAgent: string
  signingKey: string
  turnstileEnabled: boolean
  recordAttempt: (ipHash: string, nowMs: number) => Promise<QuoteAttemptCounts>
  saveRequest: (data: PublicQuoteRequestData) => Promise<{ id: number }>
  verifyTurnstile: (token: string) => Promise<boolean>
}

const FIELD_ERROR_KEYS = new Set<string>([
  'projectType',
  'projectStage',
  'servicesNeeded',
  'projectLocation',
  'name',
  'company',
  'phone',
  'email',
  'preferredContact',
  'message',
  'consent',
])

function startTokenSignature(issuedAtMs: number, signingKey: string): string {
  return crypto
    .createHmac('sha256', signingKey)
    .update(`aljazira-quote-start:${String(issuedAtMs)}`, 'utf8')
    .digest('hex')
}

/** A server-signed "form opened at" token, so the minimum fill time never trusts the browser clock. */
export function issueQuoteStartToken(nowMs: number, signingKey: string): string {
  return `${String(nowMs)}.${startTokenSignature(nowMs, signingKey)}`
}

/** Returns the signed issue time, or null when the token is missing, forged or malformed. */
export function readQuoteStartToken(token: string, signingKey: string): number | null {
  const match = /^(\d{10,16})\.([a-f0-9]{64})$/.exec(token)
  if (!match?.[1] || !match[2]) return null
  const issuedAtMs = Number(match[1])
  if (!Number.isSafeInteger(issuedAtMs)) return null
  const expected = Buffer.from(startTokenSignature(issuedAtMs, signingKey), 'hex')
  const given = Buffer.from(match[2], 'hex')
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null
  return issuedAtMs
}

function localeOf(rawInput: unknown): SupportedLocale {
  if (typeof rawInput === 'object' && rawInput !== null && 'locale' in rawInput) {
    const { locale } = rawInput
    if (isSupportedLocale(locale)) return locale
  }
  return 'en'
}

function serviceTitleFor(data: QuoteSubmissionPayload): string {
  const labels = getDictionary(data.locale).quoteForm.services
  return data.servicesNeeded
    .map((value) => labels[value])
    .join(', ')
    .slice(0, 200)
}

/**
 * Order matters:
 * 1. every attempt is counted first, valid or not, so invalid floods are limited too;
 * 2. the payload is parsed with the shared schema (unknown keys stripped, every string bounded);
 * 3. a filled honeypot gets a generic success and nothing is saved;
 * 4. the signed start token enforces the minimum fill time;
 * 5. Turnstile is checked only when switched on;
 * 6. the request is saved, and the visitor sees success as soon as the save succeeds.
 */
export async function handleQuoteSubmission(
  rawInput: unknown,
  deps: QuoteHandlerDeps,
): Promise<QuoteSubmissionResult> {
  const counts = await deps.recordAttempt(deps.ipHash, deps.nowMs)
  if (
    counts.lastMinute > QUOTE_RATE_LIMIT_PER_MINUTE ||
    counts.lastDay > QUOTE_RATE_LIMIT_PER_DAY
  ) {
    return { ok: false, formError: 'rateLimited' }
  }

  const parsed = quoteSubmissionSchema.safeParse(rawInput)
  if (!parsed.success) {
    const dict = getDictionary(localeOf(rawInput))
    const fieldErrors: Partial<Record<QuoteFieldErrorKey, string>> = {}
    let hasNonFieldIssue = false
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && FIELD_ERROR_KEYS.has(key)) {
        const fieldKey = key as QuoteFieldErrorKey
        fieldErrors[fieldKey] ??= dict.quoteForm.errors[fieldKey]
      } else {
        hasNonFieldIssue = true
      }
    }
    if (hasNonFieldIssue || Object.keys(fieldErrors).length === 0) {
      return { ok: false, formError: 'invalid' }
    }
    return { ok: false, fieldErrors }
  }
  const data = parsed.data

  if (data.honeypot.trim().length > 0) {
    return { ok: true }
  }

  const issuedAtMs = readQuoteStartToken(data.startToken, deps.signingKey)
  if (
    issuedAtMs === null ||
    issuedAtMs > deps.nowMs ||
    deps.nowMs - issuedAtMs < QUOTE_MIN_FILL_TIME_MS ||
    deps.nowMs - issuedAtMs > QUOTE_START_TOKEN_MAX_AGE_MS
  ) {
    return { ok: false, formError: 'invalid' }
  }

  if (deps.turnstileEnabled && !(await deps.verifyTurnstile(data.turnstileToken))) {
    return { ok: false, formError: 'invalid' }
  }

  try {
    await deps.saveRequest({
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      serviceTitle: serviceTitleFor(data),
      projectType: data.projectType,
      projectStage: data.projectStage,
      servicesNeeded: data.servicesNeeded,
      projectLocation: data.projectLocation,
      preferredContact: data.preferredContact,
      message: data.message,
      locale: data.locale,
      sourcePage: data.sourcePage,
      consent: data.consent,
      ipHash: deps.ipHash,
      userAgent: deps.userAgent.slice(0, 300),
    })
  } catch {
    return { ok: false, formError: 'unavailable' }
  }
  return { ok: true }
}
