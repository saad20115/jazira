import { ValidationError } from 'payload'

export const MIN_PASSWORD_LENGTH = 12

/**
 * Bundled common-password blocklist (A4 — no network call).
 * Includes both top common passwords and ≥12-character weak/common patterns.
 */
export const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  'password',
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  '123456789012',
  '1234567890123',
  'qwerty',
  'qwerty123456',
  'qwertyuiop12',
  'qwertyuiopas',
  'password123',
  'password1234',
  'password12345',
  'password123456',
  'password!234',
  'passw0rd1234',
  'admin1234567',
  'admin12345678',
  'administrator',
  'welcome12345',
  'welcome123456',
  'letmein12345',
  'letmein123456',
  'iloveyou1234',
  'monkey123456',
  'dragon123456',
  'baseball1234',
  'football1234',
  'superman1234',
  'trustno12345',
  'changeme1234',
  'changeme12345',
  'aljazira1234',
  'aljazira2025',
  'aljazira2026',
  'aaaaaaaaaaaa',
  '111111111111',
  '000000000000',
  'abc123456789',
])

export function checkPasswordPolicy(password: unknown): {
  valid: boolean
  reason?: string
} {
  if (typeof password !== 'string') {
    return {
      valid: false,
      reason: 'Password is required and must be at least 12 characters long.',
    }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      reason: `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters long.`,
    }
  }

  const normalized = password.trim().toLowerCase()
  if (COMMON_PASSWORDS.has(password.toLowerCase()) || COMMON_PASSWORDS.has(normalized)) {
    return {
      valid: false,
      reason:
        'This password is in the common-password blocklist. Please choose a stronger password.',
    }
  }

  return { valid: true }
}

export function enforcePasswordPolicy(password: unknown): void {
  const result = checkPasswordPolicy(password)
  if (!result.valid) {
    throw new ValidationError({
      errors: [
        {
          path: 'password',
          message: result.reason ?? 'Invalid password.',
        },
      ],
    })
  }
}
