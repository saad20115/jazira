'use server'

import { headers } from 'next/headers'

import { env } from '@/env'
import { createPublicQuoteRequest, recordQuoteSubmissionAttempt } from '@/lib/cms/client'
import { hashIp } from '@/lib/ipHash'

import {
  handleQuoteSubmission,
  issueQuoteStartToken,
  type QuoteSubmissionResult,
} from './quote-handler'
import { verifyTurnstileToken } from './turnstile'

/**
 * P5-T1 — the quote form's server actions. A server action (not a route handler) because the
 * form already calls one (P3-T9) and Next checks the request Origin for server actions, so a
 * cross-site page cannot post the form on a visitor's behalf.
 */

/**
 * The client IP as the reverse proxy saw it. In production Nginx sets `X-Real-IP` to
 * `$remote_addr` and overwrites any value a visitor sends (P6-T1 must keep that). Without a
 * proxy (local development) every visitor shares the "unknown" bucket, which only makes the
 * limit stricter. The raw IP is hashed at once and never stored or logged (D2).
 */
function clientIp(requestHeaders: Headers): string {
  const realIp = requestHeaders.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded ?? 'unknown'
}

/** Issues the signed "form opened at" token when the quote form mounts. */
export async function startQuoteFormAction(): Promise<string> {
  await Promise.resolve()
  return issueQuoteStartToken(Date.now(), env.PAYLOAD_SECRET)
}

export async function submitQuoteRequestAction(rawInput: unknown): Promise<QuoteSubmissionResult> {
  const requestHeaders = await headers()
  return handleQuoteSubmission(rawInput, {
    nowMs: Date.now(),
    ipHash: hashIp(clientIp(requestHeaders)),
    userAgent: requestHeaders.get('user-agent') ?? '',
    signingKey: env.PAYLOAD_SECRET,
    turnstileEnabled: env.TURNSTILE_ENABLED,
    recordAttempt: recordQuoteSubmissionAttempt,
    saveRequest: createPublicQuoteRequest,
    verifyTurnstile: (token) => verifyTurnstileToken(token, env.TURNSTILE_SECRET_KEY),
  })
}
