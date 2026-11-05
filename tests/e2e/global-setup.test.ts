import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import globalSetup, { ensureE2EAdminToken } from './global-setup'

describe('A-03 / B-15 / E-03 — E2E global-setup safety & teardown', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  it('does not hardcode Strong!AdminPassword#2026 or Passw0rd!StrongAdmin2026 in tests/e2e or tests/int', () => {
    const filesToCheck = [
      path.resolve(process.cwd(), 'tests/e2e/global-setup.ts'),
      path.resolve(process.cwd(), 'tests/e2e/admin-smoke.spec.ts'),
      path.resolve(process.cwd(), 'tests/int/p3-t12.int.test.ts'),
    ]
    for (const filePath of filesToCheck) {
      const source = fs.readFileSync(filePath, 'utf8')
      expect(
        source,
        `${path.basename(filePath)} must not hardcode Strong!AdminPassword#2026`,
      ).not.toContain('Strong!AdminPassword#2026')
      expect(
        source,
        `${path.basename(filePath)} must not hardcode Passw0rd!StrongAdmin2026`,
      ).not.toContain('Passw0rd!StrongAdmin2026')
    }
  })

  it('requires process.env.E2E_ADMIN_PASSWORD with no default in code', async () => {
    delete process.env.E2E_ADMIN_PASSWORD
    process.env.TEST_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'

    await expect(ensureE2EAdminToken('http://localhost:3330')).rejects.toThrow(/E2E_ADMIN_PASSWORD/)
  })

  it('refuses to run first-register or global mutations when target host is not loopback or DB name does not end in _test', async () => {
    process.env.E2E_ADMIN_PASSWORD = 'RandomPerRunPassword!2026#Safe99'
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_prod'
    process.env.TEST_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_prod'

    await expect(ensureE2EAdminToken('http://localhost:3330')).rejects.toThrow(/_test/)

    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    process.env.TEST_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    await expect(ensureE2EAdminToken('https://aljazira.co')).rejects.toThrow(/loopback/i)
  })

  it('returns a globalTeardown function that restores snapshotted site-settings (including arabicEnabled: false)', async () => {
    process.env.E2E_ADMIN_PASSWORD = 'RandomPerRunPassword!2026#Safe99'
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    process.env.TEST_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'

    const recordedPostBodies: Array<{ url: string; body: Record<string, unknown> }> = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url.endsWith('/api/users/login') && method === 'POST') {
        return Response.json({ token: 'mock-jwt-token' }, { status: 200 })
      }
      if (url.includes('/api/globals/site-settings') && method === 'GET') {
        const isAr = url.includes('locale=ar')
        return Response.json(
          {
            arabicEnabled: false,
            companyName: isAr ? 'الاسم الأصلي' : 'Original Company Name',
            tagline: isAr ? 'الشعار الأصلي' : 'Original Tagline',
            defaultSeo: {
              title: isAr ? 'عنوان أصلي' : 'Original SEO Title',
              description: isAr ? 'وصف أصلي' : 'Original SEO Desc',
            },
          },
          { status: 200 },
        )
      }
      if (url.includes('/api/globals/site-settings') && method === 'POST') {
        const parsedBody = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
        recordedPostBodies.push({ url, body: parsedBody })
        return Response.json(parsedBody, { status: 200 })
      }
      return Response.json({}, { status: 200 })
    })

    const teardown = await globalSetup({
      projects: [{ use: { baseURL: 'http://localhost:3330' } }],
    } as never)

    expect(typeof teardown).toBe('function')
    expect(recordedPostBodies.some((c) => c.body.arabicEnabled === true)).toBe(true)

    recordedPostBodies.length = 0
    await (teardown as () => Promise<void>)()

    const enRestore = recordedPostBodies.find((c) => c.url.includes('locale=en'))
    const arRestore = recordedPostBodies.find((c) => c.url.includes('locale=ar'))
    expect(enRestore).toBeDefined()
    expect(enRestore?.body.arabicEnabled).toBe(false)
    expect(enRestore?.body.companyName).toBe('Original Company Name')
    expect(arRestore).toBeDefined()
    expect(arRestore?.body.companyName).toBe('الاسم الأصلي')
  })
})
