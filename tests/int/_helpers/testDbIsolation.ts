import crypto from 'node:crypto'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

/**
 * Verifies that integration tests are running against a loopback PostgreSQL database
 * whose name ends in `_test`, using `TEST_DATABASE_URL` explicitly (never falling back
 * to `DATABASE_URL`) (`E-07`).
 */
export function assertTestDatabaseIsolation(rawEnv: NodeJS.ProcessEnv = process.env): string {
  const testDbUrl = rawEnv.TEST_DATABASE_URL?.trim()
  if (!testDbUrl) {
    throw new Error(
      'Integration test isolation guard (E-07): TEST_DATABASE_URL must be explicitly set (falling back to DATABASE_URL is forbidden).',
    )
  }

  let parsed: URL
  try {
    parsed = new URL(testDbUrl)
  } catch {
    throw new Error(
      'Integration test isolation guard (E-07): TEST_DATABASE_URL is not a valid PostgreSQL URI.',
    )
  }

  const hostname = parsed.hostname.trim().toLowerCase()
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')).trim()

  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new Error(
      `Integration test isolation guard (E-07): refusing to run integration tests against non-loopback host "${hostname}".`,
    )
  }

  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Integration test isolation guard (E-07): refusing to run integration tests against database "${dbName}". Database name must end in "_test".`,
    )
  }

  if (rawEnv.DATABASE_URL && rawEnv.DATABASE_URL.trim() !== testDbUrl) {
    let parsedActive: URL
    try {
      parsedActive = new URL(rawEnv.DATABASE_URL.trim())
    } catch {
      throw new Error(
        'Integration test isolation guard (E-07): DATABASE_URL is not a valid PostgreSQL URI.',
      )
    }
    const activeHost = parsedActive.hostname.trim().toLowerCase()
    const activeDbName = decodeURIComponent(parsedActive.pathname.replace(/^\/+/, '')).trim()
    if (!LOOPBACK_HOSTS.has(activeHost) || !activeDbName.endsWith('_test')) {
      throw new Error(
        `Integration test isolation guard (E-07): active DATABASE_URL targets "${activeDbName}" on "${activeHost}" instead of a loopback "_test" database.`,
      )
    }
  }

  return testDbUrl
}

/**
 * Generates a strong per-run ephemeral password for integration test users so no password
 * literal is hardcoded in test files (`A-03 / B-15 / E-03`).
 */
export function generateEphemeralTestPassword(label = 'int'): string {
  return `Ephem_${label}_${crypto.randomBytes(16).toString('hex')}!9A#`
}
