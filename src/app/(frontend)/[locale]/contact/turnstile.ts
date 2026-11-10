import 'server-only'

import { z } from 'zod'

/**
 * P5-T1 §6 — server-side Cloudflare Turnstile verification. Only the switch and this check are
 * built; `TURNSTILE_ENABLED` stays off until the client approves it. The visitor's IP is not sent
 * to Cloudflare (D2). Any network error, timeout or unexpected reply counts as a failed check.
 */
export const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const siteverifyReplySchema = z.object({ success: z.boolean() })

export async function verifyTurnstileToken(
  token: string,
  secretKey: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!secretKey || token.length === 0 || token.length > 2048) return false
  try {
    const response = await fetchImpl(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }).toString(),
      signal: AbortSignal.timeout(5_000),
    })
    if (!response.ok) return false
    const reply = siteverifyReplySchema.safeParse(await response.json())
    return reply.success && reply.data.success
  } catch {
    return false
  }
}
