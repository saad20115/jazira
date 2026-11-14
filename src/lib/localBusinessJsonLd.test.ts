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

import { buildLocalBusinessJsonLd } from '@/app/(frontend)/[locale]/layout'
import type { SiteSetting } from '@/payload-types'

function settings(overrides: Partial<SiteSetting>): SiteSetting {
  return {
    id: 1,
    companyName: 'Test Company',
    email: 'sales@example.test',
    phone: '+966 00 000 0000',
    whatsapp: '966000000000',
    arabicEnabled: false,
    ...overrides,
  }
}

describe('P3-T10 §2 — LocalBusiness JSON-LD from site-settings', () => {
  it('builds LocalBusiness only from site-settings fields and leaves empty ones out', () => {
    const serialized = buildLocalBusinessJsonLd(
      settings({
        tagline: 'Tagline from CMS',
        office: { address: 'Office address from CMS', mapUrl: 'https://maps.example.test/x' },
        socials: [
          { platform: 'linkedin', url: 'https://linkedin.example.test/c' },
          { platform: 'x', url: 'javascript:alert(1)' },
        ],
      }),
      'en',
      false,
    )
    expect(serialized).not.toBeNull()
    expect(JSON.parse(serialized ?? 'null')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Test Company',
      url: 'http://localhost:3000/en',
      description: 'Tagline from CMS',
      telephone: '+966 00 000 0000',
      email: 'sales@example.test',
      address: 'Office address from CMS',
      hasMap: 'https://maps.example.test/x',
      sameAs: ['https://linkedin.example.test/c'],
    })
  })

  it('uses the Arabic URL only while Arabic is switched on', () => {
    const off = JSON.parse(buildLocalBusinessJsonLd(settings({}), 'ar', false) ?? 'null') as {
      url: string
    }
    const on = JSON.parse(buildLocalBusinessJsonLd(settings({}), 'ar', true) ?? 'null') as {
      url: string
    }
    expect(off.url).toBe('http://localhost:3000/en')
    expect(on.url).toBe('http://localhost:3000/ar')
  })

  it('escapes HTML-breaking characters from CMS values (I2)', () => {
    const serialized =
      buildLocalBusinessJsonLd(
        settings({ address: '</script><script>alert(1)</script> & co' }),
        'en',
        false,
      ) ?? ''
    expect(serialized).not.toContain('<')
    expect(serialized).not.toContain('>')
    expect(serialized).not.toContain('&')
    expect((JSON.parse(serialized) as { address: string }).address).toBe(
      '</script><script>alert(1)</script> & co',
    )
  })

  it('emits nothing without a site-settings document', () => {
    expect(buildLocalBusinessJsonLd(null, 'en', false)).toBeNull()
  })
})
