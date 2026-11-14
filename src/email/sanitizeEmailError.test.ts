import { describe, expect, it } from 'vitest'

import { EMAIL_LAST_ERROR_MAX_LENGTH, sanitizeEmailError } from './sanitizeEmailError'

describe('P5-T2 §1 (Q2) — sanitizeEmailError', () => {
  it('keeps the error code and SMTP response code, drops credentials, hosts and addresses', () => {
    const error = Object.assign(
      new Error(
        'Invalid login: 535-5.7.8 Username and Password not accepted for mailer@corp.example.test at smtp.corp.example.test:587 (203.0.113.9) AUTH PLAIN AG1haWxlcgBTM2NyM3RQYXNzIQ==',
      ),
      { code: 'EAUTH', responseCode: 535 },
    )
    const text = sanitizeEmailError(error, ['mailer', 'S3cr3tPass!', 'smtp.corp.example.test'])
    expect(text.startsWith('EAUTH (SMTP 535): Invalid login')).toBe(true)
    for (const leaked of [
      'mailer',
      'corp.example.test',
      '203.0.113.9',
      'AG1haWxlcgBTM2NyM3RQYXNzIQ',
      '@',
    ]) {
      expect(text).not.toContain(leaked)
    }
  })

  it('removes an exact configured secret even when it does not look like one', () => {
    const text = sanitizeEmailError(new Error('rejected secret value hunter2-xyz'), ['hunter2-xyz'])
    expect(text).not.toContain('hunter2-xyz')
    expect(text).toContain('[redacted]')
  })

  it('removes URLs and IPv6 addresses', () => {
    const text = sanitizeEmailError(
      new Error('see https://user:pw@relay.example.test/path and [2001:db8::1]:25'),
      [],
    )
    expect(text).not.toMatch(/relay|user:pw|2001:db8/)
  })

  it('is one line of at most 500 characters', () => {
    const text = sanitizeEmailError(new Error(`line one\r\nline two ${'x '.repeat(600)}`), [])
    expect(text).not.toMatch(/[\r\n]/)
    expect(text.length).toBeLessThanOrEqual(EMAIL_LAST_ERROR_MAX_LENGTH)
  })

  it('handles values that are not Error objects', () => {
    expect(sanitizeEmailError('timeout talking to smtp.example.test', [])).toBe(
      'UNKNOWN: timeout talking to [host]',
    )
    expect(sanitizeEmailError({ code: 'ETIMEDOUT' }, [])).toBe('ETIMEDOUT')
    expect(sanitizeEmailError(null, [])).toBe('UNKNOWN')
  })
})
