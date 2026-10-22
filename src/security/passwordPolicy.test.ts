import { describe, expect, it } from 'vitest'

import { checkPasswordPolicy, enforcePasswordPolicy } from './passwordPolicy'

describe('passwordPolicy (A4)', () => {
  it('rejects passwords shorter than 12 characters', () => {
    const check = checkPasswordPolicy('short')
    expect(check.valid).toBe(false)
    expect(check.reason).toMatch(/at least 12 characters/i)
    expect(() => {
      enforcePasswordPolicy('short')
    }).toThrow(/password/i)
  })

  it('rejects passwords in the bundled common-password blocklist (including >= 12 chars)', () => {
    const check = checkPasswordPolicy('password1234')
    expect(check.valid).toBe(false)
    expect(check.reason).toMatch(/common-password blocklist/i)
    expect(checkPasswordPolicy('PASSWORD12345').valid).toBe(false)
    expect(checkPasswordPolicy('123456789012').valid).toBe(false)
    expect(() => {
      enforcePasswordPolicy('password1234')
    }).toThrow(/password/i)
  })

  it('accepts a strong password of >= 12 characters not in the blocklist', () => {
    expect(checkPasswordPolicy('Strong!Passw0rd#2026_Jazira').valid).toBe(true)
    expect(() => {
      enforcePasswordPolicy('Strong!Passw0rd#2026_Jazira')
    }).not.toThrow()
  })
})
