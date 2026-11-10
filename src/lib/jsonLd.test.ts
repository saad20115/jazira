import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/styles/globals.css', () => ({}))
vi.mock('@/styles/grid.module.css', () => ({ default: {} }))
vi.mock('@/styles/fonts', () => ({
  fontVariablesClassName: 'fonts-vars',
  getLocaleFontClassName: () => 'font-locale',
}))
vi.mock('@/styles/font-preload', () => ({
  preloadLocaleFonts: () => [],
}))
vi.mock('next/headers', () => ({
  draftMode: () => Promise.resolve({ isEnabled: false }),
  headers: () => Promise.resolve(new Headers()),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { buildOrganizationJsonLd } from '@/app/(frontend)/[locale]/layout'
import type { SiteSetting } from '@/payload-types'

describe('A-01 / C-03 — JSON-LD escaping (I2)', () => {
  it('escapes <, >, &, U+2028, and U+2029 in buildOrganizationJsonLd so </script><meta http-equiv=refresh …> renders inert while remaining valid JSON', () => {
    const maliciousCompanyName =
      'Al Jazira </script><meta http-equiv=refresh content="0;url=https://evil.example"> & Smart Co.\u2028LineSep\u2029ParaSep'
    const fakeSiteSettings = {
      id: 1,
      companyName: maliciousCompanyName,
      arabicEnabled: false,
      updatedAt: '2026-11-05T00:00:00.000Z',
      createdAt: '2026-11-05T00:00:00.000Z',
    } as SiteSetting

    const serialized = buildOrganizationJsonLd(fakeSiteSettings, 'en', false)

    // Raw HTML-breaking or JS line-terminator characters must never appear in the script body
    expect(serialized).not.toContain('</script>')
    expect(serialized).not.toContain('<meta')
    expect(serialized).not.toContain('<')
    expect(serialized).not.toContain('>')
    expect(serialized).not.toContain('&')
    expect(serialized).not.toContain('\u2028')
    expect(serialized).not.toContain('\u2029')

    // Escaped unicode sequences must be present
    expect(serialized).toContain('\\u003c/script\\u003e')
    expect(serialized).toContain('\\u003cmeta http-equiv=refresh')
    expect(serialized).toContain('\\u0026')
    expect(serialized).toContain('\\u2028')
    expect(serialized).toContain('\\u2029')

    // And JSON.parse must still round-trip back to the exact original string
    const parsed = JSON.parse(serialized) as {
      '@context': string
      '@type': string
      inLanguage: string
      name: string
      url: string
    }
    expect(parsed).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: maliciousCompanyName,
      url: 'http://localhost:3000/en',
      inLanguage: 'en',
    })
  })
})
