import { afterEach, describe, expect, it } from 'vitest'

import { buildNonBlockingEmailAdapter, resolveSmtpTransportConfig } from './emailAdapter'

describe('buildNonBlockingEmailAdapter (A-09)', () => {
  const mutableEnv = process.env as Record<string, string | undefined>
  const originalNodeEnv = mutableEnv.NODE_ENV
  const originalNextPhase = mutableEnv.NEXT_PHASE
  const originalSmtpHost = mutableEnv.SMTP_HOST
  const originalSmtpPort = mutableEnv.SMTP_PORT

  afterEach(() => {
    mutableEnv.NODE_ENV = originalNodeEnv
    if (originalNextPhase === undefined) {
      delete mutableEnv.NEXT_PHASE
    } else {
      mutableEnv.NEXT_PHASE = originalNextPhase
    }
    if (originalSmtpHost === undefined) {
      delete mutableEnv.SMTP_HOST
    } else {
      mutableEnv.SMTP_HOST = originalSmtpHost
    }
    if (originalSmtpPort === undefined) {
      delete mutableEnv.SMTP_PORT
    } else {
      mutableEnv.SMTP_PORT = originalSmtpPort
    }
  })

  it('requires SMTP_HOST and SMTP_PORT in production instead of silently falling back to 127.0.0.1:1025', async () => {
    mutableEnv.NODE_ENV = 'production'
    delete mutableEnv.NEXT_PHASE
    delete mutableEnv.SMTP_HOST
    delete mutableEnv.SMTP_PORT

    expect(() => resolveSmtpTransportConfig()).toThrow(/SMTP_HOST.*production/i)
    await expect(buildNonBlockingEmailAdapter()).rejects.toThrow(/SMTP_HOST.*production/i)

    mutableEnv.SMTP_HOST = 'smtp.aljazira.co'
    expect(() => resolveSmtpTransportConfig()).toThrow(/SMTP_PORT.*production/i)
    await expect(buildNonBlockingEmailAdapter()).rejects.toThrow(/SMTP_PORT.*production/i)

    mutableEnv.SMTP_PORT = '587'
    expect(resolveSmtpTransportConfig()).toEqual({ host: 'smtp.aljazira.co', port: 587 })
    await expect(buildNonBlockingEmailAdapter()).resolves.toBeTypeOf('function')
  })
})
