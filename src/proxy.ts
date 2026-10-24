import fs from 'node:fs'
import path from 'node:path'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from './i18n'
import { buildAdminCspHeader, buildPublicCspHeader, isAdminRoutePath } from './security/csp'

const COOKIE_PREFIX = 'payload'
const ADMIN_LANG_COOKIE = `${COOKIE_PREFIX}-lng`
export const DEFAULT_ADMIN_LANG = 'en'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

const PASSTHROUGH_EXACT_ROOT_PATHS = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
  '/icon.svg',
  '/icon.png',
  '/apple-icon.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/manifest.json',
  '/site.webmanifest',
  '/opengraph-image',
  '/twitter-image',
  '/basis_transcoder.js',
  '/basis_transcoder.wasm',
  '/draco_decoder.js',
  '/draco_decoder.wasm',
  '/draco_wasm_wrapper.js',
  '/meshopt_decoder.js',
  '/meshopt_decoder.wasm',
])

const PASSTHROUGH_ROOT_PREFIXES = [
  '/.well-known/',
  '/api/',
  '/_next/',
  '/brand/',
  '/media/',
  '/systems/',
  '/3d/',
  '/models/',
  '/draco/',
  '/basis/',
  '/ktx2/',
  '/meshopt/',
  '/transcoders/',
  '/decoders/',
  '/textures/',
  '/hdr/',
  '/fonts/',
  '/images/',
  '/videos/',
  '/assets/',
]

function hasMatchingPublicFile(pathname: string): boolean {
  if (!pathname.startsWith('/') || pathname === '/' || pathname.includes('\0')) {
    return false
  }
  try {
    const publicRoot = path.resolve(process.cwd(), 'public')
    const decodedRel = decodeURIComponent(pathname).replace(/^\/+/, '')
    if (!decodedRel || decodedRel.includes('..') || decodedRel.includes('\\')) {
      return false
    }
    const candidate = path.resolve(publicRoot, decodedRel)
    if (!candidate.startsWith(`${publicRoot}${path.sep}`)) {
      return false
    }
    return fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  } catch {
    return false
  }
}

/**
 * Returns `true` when `pathname` matches a non-localized metadata route, `.well-known/**`,
 * API / Next internal route, root-level 3D transcoder/decoder (`H3a`, `P3-T5`), or a public
 * asset folder / file (`R-12`).
 */
export function isPassthroughRootOrPublicPath(pathname: string): boolean {
  if (PASSTHROUGH_EXACT_ROOT_PATHS.has(pathname)) {
    return true
  }
  if (pathname === '/.well-known' || pathname === '/api' || pathname === '/_next') {
    return true
  }
  if (/^\/sitemap[^/]*\.xml$/i.test(pathname)) {
    return true
  }
  if (/^\/(?:basis|draco|ktx2|meshopt)[^/]*\.(?:js|mjs|wasm)$/i.test(pathname)) {
    return true
  }
  for (const prefix of PASSTHROUGH_ROOT_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }
  return hasMatchingPublicFile(pathname)
}

/**
 * Extracts the locale segment from a public pathname (`/en/...` -> `'en'`, `/ar/...` -> `'ar'`).
 * Defaults to `'en'` (`DEFAULT_LOCALE`) when no valid locale prefix is present.
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
 * `handoff/tasks/P3-T1.md` §4 & §5, `handoff/tasks/P3-T12.md` §1, `R-12`):
 *
 * 1. Redirects `/` -> `308 Permanent Redirect` to `/en` (preserving query parameters if any).
 * 2. Generates a fresh cryptographic nonce per request (`x-nonce`) and attaches the strict
 *    public Content-Security-Policy (`H3`, plus `H3a` on `/ar` and `/en` home only).
 * 3. Scopes the documented relaxed admin Content-Security-Policy strictly to `/admin` and
 *    `/admin/:path*`, while setting the default English (`payload-lng=en`) admin UI cookie
 *    when no user preference cookie is present (`P3-T12` §1).
 * 4. Propagates `x-aljazira-locale`, `x-aljazira-pathname`, and `x-aljazira-search` on request
 *    headers so the `(frontend)` root layout renders `<html lang dir>` matching the active locale
 *    and redirects `/ar/*` -> `307 /en/*` when `site-settings.arabicEnabled` is `false`.
 * 5. Rewrites non-locale paths to `/${resolvedLocale}/__not_found__` ONLY when no route and
 *    no public file matches (`!isPassthroughRootOrPublicPath(pathname)`, `R-12`).
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

  // 2. Redirect `/` -> `308 Permanent Redirect` to `/en` (`DEFAULT_LOCALE`)
  if (pathname === '/') {
    const redirectUrl = new URL(`/${DEFAULT_LOCALE}${search}`, request.url)
    const redirectCsp = buildPublicCspHeader({
      nonce,
      pathname: `/${DEFAULT_LOCALE}`,
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
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const hasSupportedLocalePrefix = isSupportedLocale(firstSegment)
  const resolvedLocale = hasSupportedLocalePrefix ? firstSegment : DEFAULT_LOCALE

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('x-aljazira-locale', resolvedLocale)
  requestHeaders.set('x-aljazira-pathname', pathname)
  requestHeaders.set('x-aljazira-search', search)
  requestHeaders.set('Content-Security-Policy', publicCsp)

  const isBlockedProdDevRoute =
    process.env.NODE_ENV === 'production' &&
    (pathname.endsWith('/_specimen') ||
      pathname.endsWith('/%5Fspecimen') ||
      pathname.endsWith('/%5fspecimen') ||
      pathname.endsWith('/styleguide'))

  if (
    (!hasSupportedLocalePrefix && !isPassthroughRootOrPublicPath(pathname)) ||
    isBlockedProdDevRoute
  ) {
    const notFoundRewriteUrl = new URL(`/${resolvedLocale}/__not_found__`, request.url)
    const rewriteResponse = NextResponse.rewrite(notFoundRewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    })
    rewriteResponse.headers.set('Content-Security-Policy', publicCsp)
    return rewriteResponse
  }

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
     * - robots.txt, sitemap*.xml, favicon.ico, icon.svg, .well-known/, and public asset folders (R-12)
     */
    {
      source:
        '/((?!api|_next/static|_next/image|robots\\.txt|sitemap[^/]*\\.xml|favicon\\.ico|icon\\.svg|apple-icon\\.png|manifest\\.webmanifest|\\.well-known/|brand/|media/|systems/|3d/|models/|draco/|basis/|ktx2/|meshopt/|transcoders/|decoders/|textures/|hdr/|fonts/|images/|videos/|assets/|(?:basis|draco|ktx2|meshopt)[^/]*\\.(?:js|mjs|wasm)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
