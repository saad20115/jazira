import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from './i18n'
import { buildAdminCspHeader, buildPublicCspHeader, isAdminRoutePath } from './security/csp'

const COOKIE_PREFIX = 'payload'
const ADMIN_LANG_COOKIE = `${COOKIE_PREFIX}-lng`
const DEFAULT_ADMIN_LANG = 'ar'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Extracts the locale segment from a public pathname (`/ar/...` -> `'ar'`, `/en/...` -> `'en'`).
 * Defaults to `'ar'` (`DEFAULT_LOCALE`) when no valid locale prefix is present.
 */
export function resolveLocaleFromPathname(pathname: string): SupportedLocale {
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  return isSupportedLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE
}

/**
 * Generates a cryptographic per-request CSP nonce (`H3`).
 */
export function generateCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

/**
 * Next.js 16 proxy (`src/proxy.ts`, `docs/01-architecture.md` §3, `docs/03-security.md` H3 & H3a,
 * `handoff/tasks/P3-T1.md` §4 & §5):
 *
 * 1. Redirects `/` -> `308 Permanent Redirect` to `/ar` (preserving query parameters if any).
 * 2. Generates a fresh cryptographic nonce per request (`x-nonce`) and attaches the strict
 *    public Content-Security-Policy (`H3`, plus `H3a` on `/ar` and `/en` home only).
 * 3. Scopes the documented relaxed admin Content-Security-Policy strictly to `/admin` and
 *    `/admin/:path*`, while preserving the default Arabic (`payload-lng=ar`) admin UI cookie
 *    initialization from Phase 1 (`R-4`).
 * 4. Propagates `x-aljazira-locale` and `x-aljazira-pathname` on request headers so the
 *    `(frontend)` root layout renders `<html lang dir>` matching the active locale.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl
  const nonce = generateCspNonce()

  // 1. Handle `/admin` and `/admin/:path*` routes
  if (isAdminRoutePath(pathname)) {
    const adminCsp = buildAdminCspHeader()
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', adminCsp)

    const hasAdminLangCookie = request.cookies.has(ADMIN_LANG_COOKIE)
    if (!hasAdminLangCookie) {
      request.cookies.set(ADMIN_LANG_COOKIE, DEFAULT_ADMIN_LANG)
      requestHeaders.set('cookie', request.cookies.toString())
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    response.headers.set('Content-Security-Policy', adminCsp)

    if (!hasAdminLangCookie) {
      // Match the exact cookie attributes set by Payload's switchLanguageServerAction
      // in @payloadcms/next/dist/layouts/Root/index.js (not HttpOnly so user switch overwrites).
      response.cookies.set({
        name: ADMIN_LANG_COOKIE,
        value: DEFAULT_ADMIN_LANG,
        maxAge: ONE_YEAR_SECONDS,
        path: '/',
        httpOnly: false,
      })
    }

    return response
  }

  // 2. Redirect `/` -> `308 Permanent Redirect` to `/ar`
  if (pathname === '/') {
    const redirectUrl = new URL(`/ar${search}`, request.url)
    const redirectCsp = buildPublicCspHeader({
      nonce,
      pathname: '/ar',
    })
    const redirectResponse = NextResponse.redirect(redirectUrl, 308)
    redirectResponse.headers.set('Content-Security-Policy', redirectCsp)
    return redirectResponse
  }

  // 3. Public `(frontend)` routes: attach per-request nonce, public CSP (H3/H3a), and locale headers
  const publicCsp = buildPublicCspHeader({
    nonce,
    pathname,
  })
  const resolvedLocale = resolveLocaleFromPathname(pathname)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-aljazira-locale', resolvedLocale)
  requestHeaders.set('x-aljazira-pathname', pathname)
  requestHeaders.set('Content-Security-Policy', publicCsp)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set('Content-Security-Policy', publicCsp)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (Payload & Next API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, brand/, media/ (static assets)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon\\.ico|brand/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
