import { draftMode } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { resolveAuthenticatedStaffUser } from '@/lib/cms/client'
import {
  previewQuerySchema,
  resolvePreviewTargetPath,
  verifyPreviewSecret,
} from '@/lib/preview'

/**
 * `GET /api/preview` (`handoff/tasks/P3-T1.md` §7, `docs/03-security.md` Z2, I1):
 *
 * 1. Parses and validates query params with `zod` (`previewQuerySchema`, `I1`).
 * 2. Verifies the preview secret via constant-time `crypto.timingSafeEqual`.
 * 3. Verifies the caller has an active authenticated Payload session with role `admin` or `editor`.
 * 4. Enables Next.js `draftMode()` and redirects (`307`) to the validated internal document URL.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = previewQuerySchema.safeParse(rawParams)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid preview parameters.' },
      { status: 400 },
    )
  }

  const { secret, locale, path, collection, global, slug } = parsed.data
  if (!verifyPreviewSecret(secret)) {
    return NextResponse.json(
      { error: 'Invalid preview secret.' },
      { status: 401 },
    )
  }

  const targetPath = resolvePreviewTargetPath({
    locale,
    path,
    collection,
    global,
    slug,
  })
  if (!targetPath) {
    return NextResponse.json(
      { error: 'Unsafe or invalid preview path.' },
      { status: 400 },
    )
  }

  const staffUser = await resolveAuthenticatedStaffUser(request.headers)

  if (!staffUser) {
    return NextResponse.json(
      { error: 'Forbidden: authenticated staff session required for preview.' },
      { status: 403 },
    )
  }

  const dm = await draftMode()
  dm.enable()

  return NextResponse.redirect(new URL(targetPath, request.url), 307)
}
