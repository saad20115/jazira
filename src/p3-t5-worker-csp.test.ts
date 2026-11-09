import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import nextConfig from '../next.config'
import { config as proxyConfig } from './proxy'

const WORKER_CSP =
  "default-src 'none'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self'"

interface HeaderRule {
  source: string
  headers: { key: string; value: string }[]
}

async function headerRules(): Promise<HeaderRule[]> {
  const headers = nextConfig.headers
  if (!headers) {
    throw new Error('next.config.ts has no headers()')
  }
  return await headers()
}

describe('P3-T5 security H3b: the KTX2 worker URL alone has its own CSP', () => {
  it('sends exactly the H3b policy and CORP same-origin on /systems/<release>/basis/ktx2-worker.js', async () => {
    const rules = await headerRules()
    const worker = rules.filter((rule) =>
      rule.headers.some((h) => h.key === 'Content-Security-Policy'),
    )
    expect(worker).toHaveLength(1)
    expect(worker[0]?.source).toBe('/systems/:release/basis/ktx2-worker.js')
    expect(worker[0]?.headers).toEqual([
      { key: 'Content-Security-Policy', value: WORKER_CSP },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    ])
    const base = rules.find((rule) => rule.source === '/:path*')
    expect(base?.headers).toContainEqual({ key: 'X-Content-Type-Options', value: 'nosniff' })
  })

  it('the page proxy (page CSP) does not run on /systems/, so the two policies never stack', () => {
    const matcher = proxyConfig.matcher[0]
    const source = typeof matcher === 'string' ? matcher : matcher.source
    const pattern = new RegExp(`^${source}$`)
    expect(pattern.test('/systems/v022n/basis/ktx2-worker.js')).toBe(false)
    expect(pattern.test('/systems/v022n/tower-lite.glb')).toBe(false)
    expect(pattern.test('/en')).toBe(true)
    expect(pattern.test('/en/projects')).toBe(true)
  })
})
