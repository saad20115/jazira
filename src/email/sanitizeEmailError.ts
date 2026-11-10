/**
 * P5-T2 §1 (Q2) — turns an SMTP / nodemailer failure into the text stored in
 * `quote-requests.emailLastError` and thrown back to the job runner (which logs it).
 *
 * The stored text keeps what staff and operators need (the error code, the SMTP response code,
 * a short reason) and drops everything that could be a credential or an address:
 * - the configured SMTP user, password, host and the sales inbox (exact values);
 * - any e-mail address, URL, IPv4/IPv6 address or host name;
 * - SMTP AUTH payloads (long base64 runs).
 * The result is one line of at most 500 characters.
 */
export const EMAIL_LAST_ERROR_MAX_LENGTH = 500

const EMAIL_REGEX = /[^\s@<>"'(),;:]+@[^\s@<>"'(),;:]+/g
const URL_REGEX = /\b[a-z][a-z0-9+.-]*:\/\/[^\s]+/gi
const IPV4_REGEX = /\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g
// Over-redacts on purpose (a clock time like 12:30:45 also matches); a lost time is harmless.
const IPV6_REGEX = /\[?(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{0,4}\]?|\[?::(?:[0-9a-f]{1,4}:?)*\]?/gi
const HOSTNAME_REGEX = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b(?::\d+)?/gi
const BASE64_RUN_REGEX = /\b[A-Za-z0-9+/]{16,}={0,2}/g

function readString(source: unknown, key: string): string | undefined {
  if (source && typeof source === 'object' && key in source) {
    const value = (source as Record<string, unknown>)[key]
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
  }
  return undefined
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function sanitizeEmailError(
  error: unknown,
  secrets: readonly (string | undefined)[],
): string {
  const code = readString(error, 'code') ?? 'UNKNOWN'
  const responseCode = readString(error, 'responseCode')
  let reason =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : (readString(error, 'message') ?? '')

  // Exact configured values first (longest first so a password containing the user is covered).
  const exactValues = secrets
    .map((value) => value?.trim())
    .filter((value): value is string => typeof value === 'string' && value.length >= 3)
    .sort((a, b) => b.length - a.length)
  for (const value of exactValues) {
    reason = reason.replace(new RegExp(escapeRegExp(value), 'gi'), '[redacted]')
  }

  reason = reason
    .replace(URL_REGEX, '[url]')
    .replace(EMAIL_REGEX, '[address]')
    .replace(IPV4_REGEX, '[ip]')
    .replace(IPV6_REGEX, '[ip]')
    .replace(HOSTNAME_REGEX, '[host]')
    .replace(BASE64_RUN_REGEX, '[data]')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const head = responseCode ? `${code} (SMTP ${responseCode})` : code
  const text = reason ? `${head}: ${reason}` : head
  return text.slice(0, EMAIL_LAST_ERROR_MAX_LENGTH)
}
