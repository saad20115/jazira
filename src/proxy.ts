import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const COOKIE_PREFIX = 'payload'
const ADMIN_LANG_COOKIE = `${COOKIE_PREFIX}-lng`
const DEFAULT_ADMIN_LANG = 'ar'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Next.js 16 proxy (`src/proxy.ts`).
 *
 * Ensures the Payload Admin UI defaults to Arabic (`ar`, RTL) on a visitor's first visit
 * even when the browser sends `Accept-Language: en-US`, while preserving the user's explicit
 * language choice (`payload-lng`) once set via Payload's Account language selector (R-4).
 */
export function proxy(request: NextRequest): NextResponse {
  if (request.cookies.has(ADMIN_LANG_COOKIE)) {
    return NextResponse.next()
  }

  request.cookies.set(ADMIN_LANG_COOKIE, DEFAULT_ADMIN_LANG)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('cookie', request.cookies.toString())

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Match the exact cookie attributes set by Payload's switchLanguageServerAction
  // in @payloadcms/next/dist/layouts/Root/index.js (not HttpOnly so user switch overwrites).
  response.cookies.set({
    name: ADMIN_LANG_COOKIE,
    value: DEFAULT_ADMIN_LANG,
    maxAge: ONE_YEAR_SECONDS,
    path: '/',
    httpOnly: false,
  })

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
