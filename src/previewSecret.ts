import crypto from 'node:crypto'

import { env } from './env'

/**
 * Derives the HMAC-SHA256 preview secret from `PAYLOAD_SECRET` (`handoff/tasks/P3-T1.md` §7, `S1`).
 *
 * It lives here, with relative imports and without `import 'server-only'`, for the same reason as
 * `src/env.ts`: `src/payload.config.ts` needs it for the Live Preview URL (P2-T7 §3), and the
 * Payload CLI runs the config under plain Node. It must never be imported into a client component
 * (`local/no-server-in-client`, and the CI client-bundle grep).
 */
export function getPreviewSecret(): string {
  return crypto
    .createHmac('sha256', env.PAYLOAD_SECRET)
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}
