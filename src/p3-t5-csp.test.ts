import { describe, expect, it } from 'vitest'

import { buildAdminCspHeader, buildPublicCspHeader, isHomePagePath } from '@/security/csp'

const NONCE = 'p3t5TestNonce0123456789=='

function directives(header: string): Map<string, string> {
  return new Map(
    header.split('; ').map((part) => {
      const [name = '', ...values] = part.split(' ')
      return [name, values.join(' ')]
    }),
  )
}

/** The H3 public policy, exactly; `home` adds only the two H3a tokens. */
function expectedPublic(home: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${NONCE}' 'strict-dynamic'${home ? " 'wasm-unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${NONCE}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self' blob:",
    "connect-src 'self'",
    'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
    ...(home ? ["worker-src 'self'"] : []),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ')
}

describe('P3-T5 CSP (H3a/H3b): wasm + same-origin workers on the home routes only', () => {
  it('/en and /ar (with or without a trailing slash) get exactly H3 + the H3a delta', () => {
    for (const pathname of ['/en', '/ar', '/en/', '/ar/']) {
      expect(buildPublicCspHeader({ nonce: NONCE, pathname }), pathname).toBe(expectedPublic(true))
    }
  })

  it('every other public route is unchanged H3 (no wasm, no worker-src)', () => {
    for (const pathname of [
      '/en/projects',
      '/ar/projects',
      '/en/services',
      '/en/about',
      '/en/contact',
      '/',
      '/enx',
      '/en/projects/en',
    ]) {
      const header = buildPublicCspHeader({ nonce: NONCE, pathname })
      expect(header, pathname).toBe(expectedPublic(false))
      expect(isHomePagePath(pathname), pathname).toBe(false)
    }
  })

  it('the home delta is exactly two tokens; nothing unsafe is ever added', () => {
    const home = directives(buildPublicCspHeader({ nonce: NONCE, pathname: '/en' }))
    const projects = directives(buildPublicCspHeader({ nonce: NONCE, pathname: '/en/projects' }))
    const changed = [...home.keys()].filter((name) => home.get(name) !== projects.get(name))
    expect(changed.sort()).toEqual(['script-src', 'worker-src'])
    expect(home.get('script-src')).toBe(`${projects.get('script-src') ?? ''} 'wasm-unsafe-eval'`)
    expect(home.get('worker-src')).toBe("'self'")
    expect(projects.has('worker-src')).toBe(false)
    for (const header of [home, projects]) {
      const all = [...header.values()].join(' ')
      expect(all).not.toContain("'unsafe-eval'")
      expect(all).not.toContain("'unsafe-inline'")
      expect(header.get('connect-src')).toBe("'self'")
      expect(header.get('script-src')).toContain("'strict-dynamic'")
      expect(header.get('script-src')).toContain(`'nonce-${NONCE}'`)
    }
  })

  it('/admin keeps its own documented policy, unchanged by P3-T5', () => {
    expect(buildAdminCspHeader()).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://www.gravatar.com",
        "font-src 'self' data:",
        "media-src 'self' data: blob:",
        "connect-src 'self'",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ].join('; '),
    )
    expect(buildAdminCspHeader()).not.toContain('worker-src')
    expect(buildAdminCspHeader()).not.toContain('wasm-unsafe-eval')
  })
})
