import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { TURNSTILE_SITEVERIFY_URL, verifyTurnstileToken } from './turnstile'

function reply(body: unknown, ok = true): Response {
  return { ok, json: () => Promise.resolve(body) } as unknown as Response
}

describe('P5-T1 §6 — Turnstile server verification', () => {
  it('accepts only a siteverify reply with success: true', async () => {
    const fetchOk = vi.fn(() => Promise.resolve(reply({ success: true })))
    expect(await verifyTurnstileToken('token', 'secret', fetchOk as unknown as typeof fetch)).toBe(
      true,
    )
    const call = fetchOk.mock.calls[0] as unknown as [string, RequestInit]
    expect(call[0]).toBe(TURNSTILE_SITEVERIFY_URL)
    expect(typeof call[1].body).toBe('string')
    expect(call[1].body as string).not.toContain('remoteip')

    const fetchNo = vi.fn(() => Promise.resolve(reply({ success: false })))
    expect(await verifyTurnstileToken('token', 'secret', fetchNo as unknown as typeof fetch)).toBe(
      false,
    )
  })

  it('fails closed on HTTP errors, odd replies and network errors', async () => {
    const cases = [
      () => Promise.resolve(reply({ success: true }, false)),
      () => Promise.resolve(reply({ unexpected: 1 })),
      () => Promise.reject(new Error('network down')),
    ]
    for (const impl of cases) {
      expect(
        await verifyTurnstileToken('token', 'secret', vi.fn(impl) as unknown as typeof fetch),
      ).toBe(false)
    }
  })

  it('never calls Cloudflare without a secret or a token', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(reply({ success: true })))
    expect(
      await verifyTurnstileToken('token', undefined, fetchSpy as unknown as typeof fetch),
    ).toBe(false)
    expect(await verifyTurnstileToken('', 'secret', fetchSpy as unknown as typeof fetch)).toBe(
      false,
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
