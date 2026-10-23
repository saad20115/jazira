/**
 * Content Security Policy builder (`docs/03-security.md` §5 H2, H3, H3a, I4; `handoff/tasks/P3-T1.md` §5).
 */

export const I4_VIDEO_FRAME_SOURCES = [
  'https://www.youtube-nocookie.com',
  'https://www.youtube.com',
  'https://player.vimeo.com',
] as const

export interface PublicCspOptions {
  nonce: string
  pathname: string
  nodeEnv?: string | undefined
}

/**
 * Checks whether a pathname is the localized Home page (`/ar` or `/en`), which is the only
 * route allowed to receive the `H3a` 3D viewer WebAssembly & blob worker directives.
 */
export function isHomePagePath(pathname: string): boolean {
  const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  return normalized === '/ar' || normalized === '/en'
}

/**
 * Checks whether a pathname belongs to the Payload Admin UI (`/admin` or `/admin/...`).
 */
export function isAdminRoutePath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

/**
 * Builds the strict per-request CSP header for public site routes (`H3` + `H3a`).
 *
 * - `default-src 'self'`
 * - `script-src 'self' 'nonce-<nonce>' 'strict-dynamic'` (+ `'wasm-unsafe-eval'` ONLY on `/ar` & `/en` home per `H3a`;
 *   in `NODE_ENV === 'development'` only, Next.js dev server requires `'unsafe-eval'` for server stack reconstruction;
 *   in production, never `'unsafe-eval'` and never `'unsafe-inline'`)
 * - `style-src 'self' 'nonce-<nonce>'` (in `NODE_ENV === 'development'`, `'unsafe-inline'` for Next dev style injection)
 * - `img-src 'self' data: blob:`
 * - `font-src 'self'` (all fonts self-hosted via `next/font/google`, zero Google runtime requests)
 * - `media-src 'self' blob:`
 * - `connect-src 'self'`
 * - `frame-src` restricted strictly to the `I4` video embed hosts (`youtube-nocookie.com`, `youtube.com`, `player.vimeo.com`)
 * - `worker-src 'self' blob:` ONLY on `/ar` & `/en` home (`H3a`)
 * - `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'self'`
 */
export function buildPublicCspHeader({
  nonce,
  pathname,
  nodeEnv = process.env.NODE_ENV,
}: PublicCspOptions): string {
  const isDev = nodeEnv === 'development'
  const isHome = isHomePagePath(pathname)

  const scriptTokens = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isHome ? ["'wasm-unsafe-eval'"] : []),
    ...(isDev ? ["'unsafe-eval'"] : []),
  ]

  const styleTokens = ["'self'", isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`]

  const directives = [
    "default-src 'self'",
    `script-src ${scriptTokens.join(' ')}`,
    `style-src ${styleTokens.join(' ')}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self' blob:",
    "connect-src 'self'",
    `frame-src ${I4_VIDEO_FRAME_SOURCES.join(' ')}`,
    ...(isHome ? ["worker-src 'self' blob:"] : []),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ]

  return directives.join('; ')
}

/**
 * Documented relaxations scoped strictly to `/admin` (`docs/03-security.md` H3, `handoff/tasks/P3-T1.md` §5).
 */
export const ADMIN_CSP_RELAXATIONS = [
  {
    directive: 'script-src',
    value: "'self' 'unsafe-inline' 'unsafe-eval'",
    reason:
      'Payload 3.91 Admin UI (@payloadcms/next, @payloadcms/ui, @payloadcms/richtext-lexical) emits inline hydration scripts without x-nonce propagation and uses dynamic evaluation in admin bundle chunks.',
  },
  {
    directive: 'style-src',
    value: "'self' 'unsafe-inline'",
    reason:
      'Payload 3.91 Admin UI components (react-select, Lexical editor toolbar, collapsible sections, modal drawers, and react-image-crop) apply runtime inline style attributes on DOM elements.',
  },
  {
    directive: 'img-src',
    value: "'self' data: blob: https://www.gravatar.com",
    reason:
      'Payload Admin user account header renders default Gravatar avatars from https://www.gravatar.com and uses data:/blob: URLs for local image upload/crop previews.',
  },
  {
    directive: 'font-src',
    value: "'self' data:",
    reason: 'Payload Admin UI stylesheets include inline data: font URIs for UI glyphs.',
  },
  {
    directive: 'media-src',
    value: "'self' data: blob:",
    reason: 'Payload Admin video/media upload fields preview local files via blob: and data: URLs before save.',
  },
  {
    directive: 'frame-src',
    value: "'self'",
    reason: 'Payload Live Preview embeds the same-origin frontend preview route inside an iframe in /admin.',
  },
] as const

/**
 * Builds the relaxed CSP header scoped strictly to `/admin` and `/admin/*` (`H3`).
 */
export function buildAdminCspHeader(): string {
  const directives = [
    "default-src 'self'",
    // Relaxation 1: Payload 3.91 Admin UI & Lexical rich-text editor scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Relaxation 2: Payload 3.91 Admin UI (react-select, Lexical, drawers, image cropper) inline style attributes
    "style-src 'self' 'unsafe-inline'",
    // Relaxation 3: Payload Admin default Gravatar avatar + data:/blob: upload previews
    "img-src 'self' data: blob: https://www.gravatar.com",
    // Relaxation 4: Embedded data: font URIs in admin stylesheets
    "font-src 'self' data:",
    // Relaxation 5: Admin video/media upload blob:/data: previews
    "media-src 'self' data: blob:",
    "connect-src 'self'",
    // Relaxation 6: Same-origin iframe for Payload Live Preview inside /admin
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ]

  return directives.join('; ')
}
