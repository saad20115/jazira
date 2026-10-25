import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { KTX2_WORKER_CSP, KTX2_WORKER_URL } from '@/components/systems3d/renderContract'
import { verifyWorkerPolicy } from '@/components/systems3d/viewer/UrlWorkerKTX2Loader'

import nextConfig from '../next.config'

function mockFetch(status: number, csp: string | null): ReturnType<typeof vi.fn> {
  const fn = vi.fn(() =>
    Promise.resolve(
      new Response(null, {
        status,
        headers: csp === null ? {} : { 'content-security-policy': csp },
      }),
    ),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('P3-T5 C3-3: the KTX2 worker fails closed unless its own CSP is exactly H3b', () => {
  it('the expected policy equals the one next.config.ts sends', async () => {
    const rules = (await nextConfig.headers?.()) ?? []
    const rule = rules.find((r) => r.source === '/systems/:release/basis/ktx2-worker.js')
    expect(rule?.headers.find((h) => h.key === 'Content-Security-Policy')?.value).toBe(
      KTX2_WORKER_CSP,
    )
    expect(KTX2_WORKER_URL).toBe('/systems/v022n/basis/ktx2-worker.js')
  })

  it('accepts exactly the H3b policy with a same-origin HEAD request', async () => {
    const fetchMock = mockFetch(200, KTX2_WORKER_CSP)
    await expect(verifyWorkerPolicy(KTX2_WORKER_URL, KTX2_WORKER_CSP)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(KTX2_WORKER_URL, {
      method: 'HEAD',
      cache: 'no-store',
      credentials: 'same-origin',
    })
  })

  it('rejects a missing, different or extended policy and a failed response, warning once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    for (const [status, csp] of [
      [200, null],
      [200, "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'"],
      [200, `${KTX2_WORKER_CSP}; worker-src *`],
      [404, KTX2_WORKER_CSP],
    ] as const) {
      mockFetch(status, csp)
      await expect(verifyWorkerPolicy(KTX2_WORKER_URL, KTX2_WORKER_CSP)).rejects.toThrow(
        /unexpected Content-Security-Policy/,
      )
    }
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
