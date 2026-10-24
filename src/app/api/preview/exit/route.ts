import { draftMode } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { isValidInternalCmsPath } from '@/lib/link-safety'
import { previewExitQuerySchema } from '@/lib/preview'

/**
 * `GET /api/preview/exit` (`handoff/tasks/P3-T1.md` §7, `handoff/tasks/P3-T12.md` §1):
 *
 * Disables Next.js `draftMode()` and redirects (`307`) back to the validated internal `returnTo` path
 * (defaulting to `/en`).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = previewExitQuerySchema.safeParse(rawParams)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid exit-preview parameters.' }, { status: 400 })
  }

  const candidate = parsed.data.returnTo ?? '/en'
  if (!isValidInternalCmsPath(candidate)) {
    return NextResponse.json({ error: 'Unsafe returnTo path.' }, { status: 400 })
  }

  const dm = await draftMode()
  dm.disable()

  return NextResponse.redirect(new URL(candidate, request.url), 307)
}
