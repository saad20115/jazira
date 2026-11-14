import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import type { PublicQuoteRequestData, QuoteAttemptCounts } from '@/lib/cms/client'

import {
  handleQuoteSubmission,
  issueQuoteStartToken,
  QUOTE_MIN_FILL_TIME_MS,
  QUOTE_START_TOKEN_MAX_AGE_MS,
  type QuoteHandlerDeps,
  readQuoteStartToken,
} from './quote-handler'

const KEY = 'unit-test-signing-key-that-is-long-enough-for-hmac-0123456789'
const NOW = 1_800_000_000_000
const IP_HASH = 'a'.repeat(64)

function validInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    projectType: 'hotel-tower',
    projectStage: 'design',
    servicesNeeded: ['hvac', 'fire-fighting'],
    projectLocation: 'makkah',
    attachmentFileName: '',
    name: 'Test Visitor',
    company: 'Test Company',
    phone: '+966 57 353 4185',
    email: 'visitor@example.test',
    preferredContact: 'whatsapp',
    message: 'Please send a proposal.',
    consent: true,
    locale: 'en',
    sourcePage: '/en/contact',
    honeypot: '',
    startedAtMs: NOW - 10_000,
    startToken: issueQuoteStartToken(NOW - 10_000, KEY),
    ...overrides,
  }
}

function makeDeps(overrides: Partial<QuoteHandlerDeps> = {}): QuoteHandlerDeps & {
  saved: PublicQuoteRequestData[]
  attempts: () => number
} {
  const saved: PublicQuoteRequestData[] = []
  const state = { attempts: 0 }
  const deps = {
    saved,
    attempts: () => state.attempts,
    nowMs: NOW,
    ipHash: IP_HASH,
    userAgent: 'unit-test-agent',
    signingKey: KEY,
    turnstileEnabled: false,
    recordAttempt: (_hash: string, _now: number): Promise<QuoteAttemptCounts> => {
      state.attempts += 1
      return Promise.resolve({ lastMinute: 1, lastDay: 1 })
    },
    saveRequest: (data: PublicQuoteRequestData) => {
      saved.push(data)
      return Promise.resolve({ id: saved.length })
    },
    verifyTurnstile: () => Promise.resolve(false),
    ...overrides,
  }
  return deps
}

describe('P5-T1 — quote handler (I1, I6, Z4, D2)', () => {
  it('saves a valid request with server-side values and reports success', async () => {
    const deps = makeDeps()
    const result = await handleQuoteSubmission(validInput(), deps)
    expect(result).toEqual({ ok: true })
    expect(deps.saved).toHaveLength(1)
    expect(deps.saved[0]).toMatchObject({
      name: 'Test Visitor',
      phone: '+966573534185',
      serviceTitle: 'HVAC, Fire Fighting',
      projectType: 'hotel-tower',
      servicesNeeded: ['hvac', 'fire-fighting'],
      locale: 'en',
      consent: true,
      ipHash: IP_HASH,
      userAgent: 'unit-test-agent',
    })
  })

  it('computes serviceTitle in the request locale', async () => {
    const deps = makeDeps()
    await handleQuoteSubmission(validInput({ locale: 'ar', sourcePage: '/ar/contact' }), deps)
    expect(deps.saved[0]?.serviceTitle).not.toContain('HVAC, Fire Fighting')
    expect(deps.saved[0]?.locale).toBe('ar')
  })

  it('strips unknown keys: a client cannot set status, email state, ipHash or serviceTitle', async () => {
    const deps = makeDeps()
    await handleQuoteSubmission(
      validInput({
        status: 'closed',
        emailStatus: 'sent',
        ipHash: 'f'.repeat(64),
        serviceTitle: 'forged',
        assignedTo: 1,
      }),
      deps,
    )
    const saved = deps.saved[0] as unknown as Record<string, unknown>
    expect(saved).not.toHaveProperty('status')
    expect(saved).not.toHaveProperty('emailStatus')
    expect(saved).not.toHaveProperty('assignedTo')
    expect(saved.ipHash).toBe(IP_HASH)
    expect(saved.serviceTitle).toBe('HVAC, Fire Fighting')
  })

  it('a filled honeypot gets a generic success and nothing is saved', async () => {
    const deps = makeDeps()
    const result = await handleQuoteSubmission(
      validInput({ honeypot: 'http://spam.example' }),
      deps,
    )
    expect(result).toEqual({ ok: true })
    expect(deps.saved).toHaveLength(0)
  })

  it('rejects a form submitted in under 3 seconds', async () => {
    const deps = makeDeps()
    const issued = NOW - (QUOTE_MIN_FILL_TIME_MS - 1)
    const result = await handleQuoteSubmission(
      validInput({ startToken: issueQuoteStartToken(issued, KEY), startedAtMs: NOW - 60_000 }),
      deps,
    )
    expect(result).toEqual({ ok: false, formError: 'invalid' })
    expect(deps.saved).toHaveLength(0)
  })

  it('never trusts the browser clock: a missing, forged, future or stale start token is rejected', async () => {
    const forged = `${String(NOW - 10_000)}.${'0'.repeat(64)}`
    const otherKey = issueQuoteStartToken(NOW - 10_000, `${KEY}-other`)
    const future = issueQuoteStartToken(NOW + 60_000, KEY)
    const stale = issueQuoteStartToken(NOW - QUOTE_START_TOKEN_MAX_AGE_MS - 1, KEY)
    for (const startToken of ['', forged, otherKey, future, stale]) {
      const deps = makeDeps()
      const result = await handleQuoteSubmission(validInput({ startToken }), deps)
      expect(result, startToken).toEqual({ ok: false, formError: 'invalid' })
      expect(deps.saved).toHaveLength(0)
    }
  })

  it('reads back only tokens it signed', () => {
    const token = issueQuoteStartToken(NOW, KEY)
    expect(readQuoteStartToken(token, KEY)).toBe(NOW)
    expect(readQuoteStartToken(token, `${KEY}x`)).toBeNull()
    expect(readQuoteStartToken(`${token}0`, KEY)).toBeNull()
    expect(readQuoteStartToken('not-a-token', KEY)).toBeNull()
  })

  it('rate-limits the 4th attempt within a minute and the 21st within a day, before saving', async () => {
    for (const counts of [
      { lastMinute: 4, lastDay: 4 },
      { lastMinute: 1, lastDay: 21 },
    ]) {
      const deps = makeDeps({ recordAttempt: () => Promise.resolve(counts) })
      const result = await handleQuoteSubmission(validInput(), deps)
      expect(result).toEqual({ ok: false, formError: 'rateLimited' })
      expect(deps.saved).toHaveLength(0)
    }
    const atLimit = makeDeps({
      recordAttempt: () => Promise.resolve({ lastMinute: 3, lastDay: 20 }),
    })
    expect(await handleQuoteSubmission(validInput(), atLimit)).toEqual({ ok: true })
  })

  it('counts every attempt, including invalid ones', async () => {
    const deps = makeDeps()
    await handleQuoteSubmission({ nonsense: true }, deps)
    await handleQuoteSubmission(validInput({ honeypot: 'bot' }), deps)
    expect(deps.attempts()).toBe(2)
  })

  it('rejects over-long fields with localized field errors and saves nothing', async () => {
    const deps = makeDeps()
    const result = await handleQuoteSubmission(
      validInput({ name: 'x'.repeat(121), message: 'y'.repeat(3001) }),
      deps,
    )
    expect(result.ok).toBe(false)
    expect('fieldErrors' in result ? Object.keys(result.fieldErrors).sort() : []).toEqual([
      'message',
      'name',
    ])
    expect(deps.saved).toHaveLength(0)
  })

  it('rejects consent false and an empty service list, localized in en and ar (moved from the P3-T9 stub test)', async () => {
    const invalid = {
      servicesNeeded: [],
      name: '',
      phone: 'bad',
      email: 'bad',
      consent: false,
    }
    const en = await handleQuoteSubmission(validInput({ ...invalid, locale: 'en' }), makeDeps())
    expect(en.ok).toBe(false)
    const enErrors = 'fieldErrors' in en ? en.fieldErrors : {}
    expect(enErrors.servicesNeeded).toContain('service')
    expect(enErrors.name).toContain('full name')
    expect(enErrors.consent).toContain('privacy policy')

    const ar = await handleQuoteSubmission(validInput({ ...invalid, locale: 'ar' }), makeDeps())
    const arErrors = 'fieldErrors' in ar ? ar.fieldErrors : {}
    expect(arErrors.name).toContain('الاسم')
    expect(arErrors.consent).toContain('سياسة الخصوصية')
  })

  it('answers "check the form" for a payload that is not a form at all', async () => {
    const deps = makeDeps()
    expect(await handleQuoteSubmission('garbage', deps)).toEqual({
      ok: false,
      formError: 'invalid',
    })
    expect(await handleQuoteSubmission(validInput({ locale: 'fr' }), deps)).toEqual({
      ok: false,
      formError: 'invalid',
    })
    expect(deps.saved).toHaveLength(0)
  })

  it('checks Turnstile only when it is switched on', async () => {
    const verify = vi.fn(() => Promise.resolve(false))
    const off = makeDeps({ verifyTurnstile: verify })
    expect(await handleQuoteSubmission(validInput(), off)).toEqual({ ok: true })
    expect(verify).not.toHaveBeenCalled()

    const onFail = makeDeps({ turnstileEnabled: true, verifyTurnstile: verify })
    expect(await handleQuoteSubmission(validInput({ turnstileToken: 't' }), onFail)).toEqual({
      ok: false,
      formError: 'invalid',
    })
    expect(onFail.saved).toHaveLength(0)

    const onPass = makeDeps({
      turnstileEnabled: true,
      verifyTurnstile: () => Promise.resolve(true),
    })
    expect(await handleQuoteSubmission(validInput({ turnstileToken: 't' }), onPass)).toEqual({
      ok: true,
    })
  })

  it('a failed save shows a generic error with no internal details', async () => {
    const deps = makeDeps({
      saveRequest: () => Promise.reject(new Error('relation "quote_requests" does not exist')),
    })
    const result = await handleQuoteSubmission(validInput(), deps)
    expect(result).toEqual({ ok: false, formError: 'unavailable' })
    expect(JSON.stringify(result)).not.toContain('relation')
  })
})
