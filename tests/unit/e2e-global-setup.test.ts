import { execFile } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it, vi } from 'vitest'

import globalSetup, { ensureE2EAdminToken } from '../e2e/global-setup'

const execFileAsync = promisify(execFile)

describe('A-03 / B-15 / E-03 / R1-1..R1-4 — E2E global-setup & recording script safety', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  it('R1-1: keeps Vitest *.test.ts files out of tests/e2e/ so unfiltered playwright test does not abort', () => {
    const e2eDir = path.resolve(process.cwd(), 'tests/e2e')
    const vitestFilesInE2E = fs.readdirSync(e2eDir).filter((file) => file.endsWith('.test.ts'))
    expect(vitestFilesInE2E).toEqual([])
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
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ token: 'mock-jwt-token' }, { status: 200 }),
    )
    delete process.env.E2E_ADMIN_PASSWORD
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    process.env.E2E_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'

    await expect(ensureE2EAdminToken('http://localhost:3330')).rejects.toThrow(/E2E_ADMIN_PASSWORD/)
  })

  it('R1-2: refuses when E2E_DATABASE_URL is unset (no fallback to TEST_DATABASE_URL), when DATABASE_URL is a non-test DB, or when target host is not loopback', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ token: 'mock-jwt-token' }, { status: 200 }),
    )
    process.env.E2E_ADMIN_PASSWORD = 'RandomPerRunPassword!2026#Safe99'
    // Standard .env scenario: TEST_DATABASE_URL ends in _test, but DATABASE_URL is the dev DB and E2E_DATABASE_URL is unset
    delete process.env.E2E_DATABASE_URL
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_verify'
    process.env.TEST_DATABASE_URL =
      'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_verify_test'

    await expect(ensureE2EAdminToken('http://localhost:3330')).rejects.toThrow(
      /E2E_DATABASE_URL|_test/i,
    )

    // Mismatch scenario: E2E_DATABASE_URL is set to _test, but server DATABASE_URL is non-test
    process.env.E2E_DATABASE_URL =
      'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_verify_test'
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_verify'
    await expect(ensureE2EAdminToken('http://localhost:3330')).rejects.toThrow(
      /DATABASE_URL|_test/i,
    )

    // Non-test DB in both E2E_DATABASE_URL and DATABASE_URL
    process.env.E2E_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_prod'
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_prod'
    await expect(ensureE2EAdminToken('http://localhost:3330')).rejects.toThrow(/_test/)

    // Non-loopback host
    process.env.E2E_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    await expect(ensureE2EAdminToken('https://aljazira.co')).rejects.toThrow(/loopback/i)
  })

  it('R1-2 live must-fail: refuses a running server connected to a non-test database before calling first-register', async () => {
    const testDbUrl =
      originalEnv.TEST_DATABASE_URL || 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    process.env.E2E_ADMIN_PASSWORD = 'RandomPerRunPassword!2026#Safe99'
    process.env.E2E_DATABASE_URL = testDbUrl
    process.env.DATABASE_URL = testDbUrl

    let firstRegisterHits = 0
    const server = http.createServer((req, res) => {
      if (req.url?.startsWith('/api/users/first-register')) {
        firstRegisterHits += 1
      }
      if (req.url?.startsWith('/api/globals/site-settings')) {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(
          JSON.stringify({
            arabicEnabled: false,
            companyName: 'Dev DB Company',
            tagline: 'unmatched-non-test-db-server-tagline',
          }),
        )
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ token: 'should-not-be-reached' }))
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        resolve()
      })
    })
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0
    const localBaseUrl = `http://127.0.0.1:${String(port)}`

    try {
      await expect(ensureE2EAdminToken(localBaseUrl)).rejects.toThrow(
        /not connected|test database|site_settings/i,
      )
      expect(firstRegisterHits).toBe(0)
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve()
        })
      })
    }
  })

  it('R1-3: tries E2E_ADMIN_PASSWORD only against the e2e admin email and never against other accounts', async () => {
    process.env.E2E_ADMIN_PASSWORD = 'RandomPerRunPassword!2026#Safe99'
    process.env.E2E_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    delete process.env.E2E_ADMIN_EMAIL

    const attemptedEmails: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url.endsWith('/api/users/login') && method === 'POST') {
        const rawBody = typeof init?.body === 'string' ? init.body : '{}'
        const parsed = JSON.parse(rawBody) as { email?: string }
        if (parsed.email) {
          attemptedEmails.push(parsed.email)
        }
        return Promise.resolve(Response.json({ errors: [{ message: 'Invalid' }] }, { status: 401 }))
      }
      return Promise.resolve(Response.json({}, { status: 200 }))
    })

    await expect(ensureE2EAdminToken('http://localhost:3330')).rejects.toThrow(
      /could not authenticate/i,
    )
    expect(attemptedEmails).toEqual(['e2e-admin@aljazira.co'])
  })

  it('R1-4: scripts/record/p3-t14-motion-recordings.mjs refuses non-loopback or non-test DB targets before calling first-register', async () => {
    let firstRegisterHits = 0
    const server = http.createServer((req, res) => {
      if (req.url?.startsWith('/api/users/first-register')) {
        firstRegisterHits += 1
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({}))
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        resolve()
      })
    })
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0
    const localBaseUrl = `http://127.0.0.1:${String(port)}`
    const tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r1-4-record-test-'))
    const scriptPath = path.resolve(process.cwd(), 'scripts/record/p3-t14-motion-recordings.mjs')

    try {
      let nonTestDbStderr = ''
      try {
        await execFileAsync(process.execPath, [scriptPath, localBaseUrl, tmpOutDir], {
          timeout: 5000,
          env: {
            ...process.env,
            RECORD_ADMIN_EMAIL: 'e2e-admin@aljazira.co',
            RECORD_ADMIN_PASSWORD: 'RandomPerRunPassword!2026#Safe99',
            DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_verify',
            TEST_DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_verify_test',
            E2E_DATABASE_URL: '',
          },
        })
      } catch (err) {
        const execErr = err as { stderr?: string; stdout?: string; message?: string }
        nonTestDbStderr = `${execErr.stderr ?? ''}\n${execErr.message ?? ''}`
      }

      expect(firstRegisterHits).toBe(0)
      expect(nonTestDbStderr).toMatch(/E2E_DATABASE_URL|_test|safety guard/i)

      let nonLoopbackStderr = ''
      try {
        await execFileAsync(process.execPath, [scriptPath, 'https://aljazira.co', tmpOutDir], {
          timeout: 5000,
          env: {
            ...process.env,
            RECORD_ADMIN_EMAIL: 'e2e-admin@aljazira.co',
            RECORD_ADMIN_PASSWORD: 'RandomPerRunPassword!2026#Safe99',
            DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_verify_test',
            E2E_DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_verify_test',
          },
        })
      } catch (err) {
        const execErr = err as { stderr?: string; stdout?: string; message?: string }
        nonLoopbackStderr = `${execErr.stderr ?? ''}\n${execErr.message ?? ''}`
      }

      expect(firstRegisterHits).toBe(0)
      expect(nonLoopbackStderr).toMatch(/loopback/i)
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve()
        })
      })
      fs.rmSync(tmpOutDir, { recursive: true, force: true })
    }
  })

  it('returns a globalTeardown function that restores snapshotted site-settings (including arabicEnabled: false)', async () => {
    process.env.E2E_ADMIN_PASSWORD = 'RandomPerRunPassword!2026#Safe99'
    process.env.DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    process.env.E2E_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'
    process.env.TEST_DATABASE_URL = 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test'

    const recordedPostBodies: Array<{ url: string; body: Record<string, unknown> }> = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url.endsWith('/api/users/login') && method === 'POST') {
        return Promise.resolve(Response.json({ token: 'mock-jwt-token' }, { status: 200 }))
      }
      if (url.includes('/api/globals/site-settings') && method === 'GET') {
        const isAr = url.includes('locale=ar')
        return Promise.resolve(
          Response.json(
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
          ),
        )
      }
      if (url.includes('/api/globals/site-settings') && method === 'POST') {
        const rawBody = typeof init?.body === 'string' ? init.body : '{}'
        const parsedBody = JSON.parse(rawBody) as Record<string, unknown>
        recordedPostBodies.push({ url, body: parsedBody })
        return Promise.resolve(Response.json(parsedBody, { status: 200 }))
      }
      return Promise.resolve(Response.json({}, { status: 200 }))
    })

    const teardown = await globalSetup({
      projects: [{ use: { baseURL: 'http://localhost:3330' } }],
    } as never)

    expect(typeof teardown).toBe('function')
    expect(recordedPostBodies.some((c) => c.body.arabicEnabled === true)).toBe(true)

    recordedPostBodies.length = 0
    await teardown()

    const enRestore = recordedPostBodies.find((c) => c.url.includes('locale=en'))
    const arRestore = recordedPostBodies.find((c) => c.url.includes('locale=ar'))
    expect(enRestore).toBeDefined()
    expect(enRestore?.body.arabicEnabled).toBe(false)
    expect(enRestore?.body.companyName).toBe('Original Company Name')
    expect(arRestore).toBeDefined()
    expect(arRestore?.body.companyName).toBe('الاسم الأصلي')
  })
})
