import { afterEach, describe, expect, it } from 'vitest'

import { buildNonBlockingEmailAdapter, resolveSmtpTransportConfig } from './emailAdapter'

describe('buildNonBlockingEmailAdapter (A-09)', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalNextPhase = process.env.NEXT_PHASE
  const originalSmtpHost = process.env.SMTP_HOST
  const originalSmtpPort = process.env.SMTP_PORT

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    if (originalNextPhase === undefined) {
      delete process.env.NEXT_PHASE
    } else {
      process.env.NEXT_PHASE = originalNextPhase
    }
    if (originalSmtpHost === undefined) {
      delete process.env.SMTP_HOST
    } else {
      process.env.SMTP_HOST = originalSmtpHost
    }
    if (originalSmtpPort === undefined) {
      delete process.env.SMTP_PORT
    } else {
      process.env.SMTP_PORT = originalSmtpPort
    }
  })

  it('requires SMTP_HOST and SMTP_PORT in production instead of silently falling back to 127.0.0.1:1025', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PHASE
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT

    expect(() => resolveSmtpTransportConfig()).toThrow(/SMTP_HOST.*production/i)
    await expect(buildNonBlockingEmailAdapter()).rejects.toThrow(/SMTP_HOST.*production/i)

    process.env.SMTP_HOST = 'smtp.aljazira.co'
    expect(() => resolveSmtpTransportConfig()).toThrow(/SMTP_PORT.*production/i)
    await expect(buildNonBlockingEmailAdapter()).rejects.toThrow(/SMTP_PORT.*production/i)

    process.env.SMTP_PORT = '587'
    expect(resolveSmtpTransportConfig()).toEqual({ host: 'smtp.aljazira.co', port: 587 })
    await expect(buildNonBlockingEmailAdapter()).resolves.toBeTypeOf('function')
  })
})
