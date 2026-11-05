import os from 'os'
import path from 'path'
import { z } from 'zod'

/**
 * Startup environment validation (S1, S2).
 *
 * Note on S4 (`server-only`): `src/env.ts` is imported by `src/payload.config.ts`, which is
 * executed directly under Node/tsx by the Payload CLI (`payload migrate`, `payload generate:types`,
 * `payload generate:importmap`) without `--conditions=react-server`. Therefore `src/env.ts` is the
 * documented exception to `import 'server-only'` and is instead prohibited in `'use client'` modules
 * by the in-repo ESLint rule `local/no-server-in-client` and verified by the CI `.next/static` secret grep (R-3).
 *
 * Build-time vs runtime handling (R-1): During `next build` (`NEXT_PHASE === 'phase-production-build'`),
 * production secrets are not present in the Docker build environment. When `NEXT_PHASE` is
 * `'phase-production-build'`, unset variables fall back to build-only dummy values so `next build`
 * can compile the standalone bundle without secrets. At server boot (`next dev` and
 * `node .next/standalone/server.js`), `src/instrumentation.ts` calls `parseEnv(process.env)` and
 * exits with code 1 if any secret is missing or invalid.
 */

const PLACEHOLDER_PATTERNS = [
  'CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_BASE64_48_PAYLOAD_SECRET',
  'CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_BASE64_48_IP_HASH_SALT',
  'YOUR_SECRET_HERE',
] as const

function isPlaceholderSecret(value: string): boolean {
  const trimmed = value.trim()
  const upper = trimmed.toUpperCase()
  return (
    PLACEHOLDER_PATTERNS.some((p) => upper === p) ||
    upper.startsWith('CHANGE_ME') ||
    upper.startsWith('YOUR_') ||
    upper.includes('PLACEHOLDER')
  )
}

function shannonEntropyBitsPerChar(value: string): number {
  if (value.length === 0) {
    return 0
  }
  const counts = new Map<string, number>()
  for (const ch of value) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1)
  }
  let entropy = 0
  for (const count of counts.values()) {
    const p = count / value.length
    entropy -= p * Math.log2(p)
  }
  return entropy
}

function hasSufficientSecretEntropy(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 48) {
    return false
  }
  const counts = new Map<string, number>()
  for (const ch of trimmed) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1)
  }
  // Require at least 16 distinct characters
  if (counts.size < 16) {
    return false
  }
  // Reject any single character repeated 6+ times consecutively (e.g. 'a'.repeat(64) or 'A'.repeat(48) + ...)
  if (/(.)\1{5,}/.test(trimmed)) {
    return false
  }
  // Reject if a single character accounts for more than 25% of the secret
  const maxCharCount = Math.max(...counts.values())
  if (maxCharCount / trimmed.length > 0.25) {
    return false
  }
  // Reject pure periodic repetitions (e.g. '0123456789abcdef'.repeat(4))
  if ((trimmed + trimmed).slice(1, -1).includes(trimmed)) {
    return false
  }
  // Require Shannon entropy >= 3.5 bits/char
  return shannonEntropyBitsPerChar(trimmed) >= 3.5
}

const FORBIDDEN_SUPERUSER_DB_ROLES = new Set([
  'postgres',
  'postgresql',
  'root',
  'superuser',
  'rdsadmin',
  'avnadmin',
  'aljazira_pg_super',
])

function isSuperuserDbRoleInUri(connectionUri: string): boolean {
  try {
    const parsed = new URL(connectionUri)
    const username = decodeURIComponent(parsed.username).trim().toLowerCase()
    return !username || FORBIDDEN_SUPERUSER_DB_ROLES.has(username)
  } catch {
    return true
  }
}

function secretFieldSchema(varName: 'PAYLOAD_SECRET' | 'IP_HASH_SALT') {
  return z
    .string({
      error: `${varName} is required. Generate one with: openssl rand -base64 48`,
    })
    .min(
      48,
      `${varName} must be at least 48 characters long. Generate a strong secret with: openssl rand -base64 48`,
    )
    .refine(
      (val) => !isPlaceholderSecret(val),
      `${varName} must not use a placeholder value from .env.example. Generate a real secret with: openssl rand -base64 48`,
    )
    .refine(
      (val) => hasSufficientSecretEntropy(val),
      `${varName} has insufficient entropy (repeated characters or low diversity). Generate a high-entropy secret with: openssl rand -base64 48`,
    )
}

function storageDirSchema(varName: 'MEDIA_DIR' | 'VIDEOS_DIR' | 'UPLOAD_TMP_DIR') {
  const exampleSubdir =
    varName === 'MEDIA_DIR' ? 'media' : varName === 'VIDEOS_DIR' ? 'videos' : 'tmp'
  return z
    .string()
    .trim()
    .min(1, `${varName} must not be empty.`)
    .refine(
      (val) => path.isAbsolute(val),
      `${varName} must be an absolute filesystem path (e.g. /var/lib/aljazira/${exampleSubdir} or D:\\jazira\\${exampleSubdir}).`,
    )
    .refine((val) => {
      const resolvedDir = path.resolve(val)
      const publicDir = path.resolve(process.cwd(), 'public')
      const rel = path.relative(publicDir, resolvedDir)
      return rel !== '' && (rel.startsWith('..') || path.isAbsolute(rel))
    }, `${varName} must not be inside public/ (uploads must be served through Payload access control).`)
    .transform((val) => path.resolve(val))
}

function isSameOrSubdirectory(parentDir: string, candidateDir: string): boolean {
  const rel = path.relative(parentDir, candidateDir)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

const jobsAutoRunSchema = z
  .string({
    error:
      'PAYLOAD_JOBS_AUTORUN must be explicitly set to "true" or "false" in production so at most one instance runs the Payload jobs queue.',
  })
  .trim()
  .toLowerCase()
  .refine(
    (val) => val === 'true' || val === 'false' || val === '1' || val === '0',
    'PAYLOAD_JOBS_AUTORUN must be "true", "false", "1", or "0".',
  )
  .transform((val) => val === 'true' || val === '1')

const smtpHostSchema = z
  .string({
    error:
      'SMTP_HOST must be explicitly set in production (silent fallback to 127.0.0.1 is forbidden).',
  })
  .trim()
  .min(
    1,
    'SMTP_HOST must be explicitly set in production (silent fallback to 127.0.0.1 is forbidden).',
  )
  .refine(
    (val) => !val.toUpperCase().includes('CHANGE_ME'),
    'SMTP_HOST must not contain placeholder values.',
  )

const smtpPortSchema = z
  .string({
    error: 'SMTP_PORT must be explicitly set in production (silent fallback to 1025 is forbidden).',
  })
  .trim()
  .refine((val) => {
    if (!/^\d+$/.test(val)) {
      return false
    }
    const port = Number.parseInt(val, 10)
    return Number.isInteger(port) && port >= 1 && port <= 65535
  }, 'SMTP_PORT must be a valid TCP port integer between 1 and 65535.')
  .transform((val) => Number.parseInt(val, 10))

const envSchema = z
  .object({
    DATABASE_URL: z
      .string({
        error: 'DATABASE_URL is required (PostgreSQL connection URI).',
      })
      .min(1, 'DATABASE_URL must not be empty.')
      .refine(
        (val) =>
          (val.startsWith('postgresql://') || val.startsWith('postgres://')) &&
          !val.includes('CHANGE_ME'),
        'DATABASE_URL must be a valid PostgreSQL URI (postgresql://...) and must not contain placeholder credentials.',
      )
      .refine(
        (val) => !isSuperuserDbRoleInUri(val),
        'DATABASE_URL must use a least-privilege application role and must not connect as a PostgreSQL superuser role (e.g. postgres or aljazira_pg_super).',
      ),
    SERVER_URL: z
      .string({
        error: 'SERVER_URL is required (e.g. http://localhost:3000).',
      })
      .refine((val) => {
        try {
          const parsed = new URL(val)
          return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        } catch {
          return false
        }
      }, 'SERVER_URL must be an absolute http(s) URL (e.g. http://localhost:3000).'),
    PAYLOAD_SECRET: secretFieldSchema('PAYLOAD_SECRET'),
    IP_HASH_SALT: secretFieldSchema('IP_HASH_SALT'),
    MEDIA_DIR: storageDirSchema('MEDIA_DIR'),
    VIDEOS_DIR: storageDirSchema('VIDEOS_DIR'),
    UPLOAD_TMP_DIR: storageDirSchema('UPLOAD_TMP_DIR'),
    PAYLOAD_JOBS_AUTORUN: jobsAutoRunSchema,
    SMTP_HOST: smtpHostSchema,
    SMTP_PORT: smtpPortSchema,
  })
  .refine((data) => data.PAYLOAD_SECRET !== data.IP_HASH_SALT, {
    path: ['IP_HASH_SALT'],
    message:
      'IP_HASH_SALT and PAYLOAD_SECRET must differ from each other. Generate a separate secret with: openssl rand -base64 48',
  })
  .refine(
    (data) =>
      !isSameOrSubdirectory(data.MEDIA_DIR, data.VIDEOS_DIR) &&
      !isSameOrSubdirectory(data.VIDEOS_DIR, data.MEDIA_DIR),
    {
      path: ['VIDEOS_DIR'],
      message:
        'VIDEOS_DIR and MEDIA_DIR must be separate sibling directories (neither may be equal to or nested inside the other).',
    },
  )
  .refine(
    (data) =>
      !isSameOrSubdirectory(data.MEDIA_DIR, data.UPLOAD_TMP_DIR) &&
      !isSameOrSubdirectory(data.UPLOAD_TMP_DIR, data.MEDIA_DIR) &&
      !isSameOrSubdirectory(data.VIDEOS_DIR, data.UPLOAD_TMP_DIR) &&
      !isSameOrSubdirectory(data.UPLOAD_TMP_DIR, data.VIDEOS_DIR),
    {
      path: ['UPLOAD_TMP_DIR'],
      message:
        'UPLOAD_TMP_DIR must be outside MEDIA_DIR and VIDEOS_DIR (neither equal to nor nested inside either served directory).',
    },
  )

export type Env = z.infer<typeof envSchema>

export const ENV_SERVER_ONLY_SENTINEL = '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_ENV__'

export function parseEnv(rawEnv: Record<string, string | undefined>): Env {
  const rawMediaDir = rawEnv.MEDIA_DIR?.trim()
  const rawVideosDir = rawEnv.VIDEOS_DIR?.trim()
  const rawUploadTmpDir = rawEnv.UPLOAD_TMP_DIR?.trim()
  const rawJobsAutoRun = rawEnv.PAYLOAD_JOBS_AUTORUN?.trim()
  const rawSmtpHost = rawEnv.SMTP_HOST?.trim()
  const rawSmtpPort = rawEnv.SMTP_PORT?.trim()
  const isProductionRuntime =
    rawEnv.NODE_ENV === 'production' &&
    rawEnv.NEXT_PHASE !== 'phase-production-build' &&
    rawEnv.NEXT_PHASE !== 'phase-export' &&
    rawEnv.NEXT_PHASE !== 'phase-production-compile'

  const result = envSchema.safeParse({
    DATABASE_URL: rawEnv.DATABASE_URL,
    SERVER_URL: rawEnv.SERVER_URL,
    PAYLOAD_SECRET: rawEnv.PAYLOAD_SECRET,
    IP_HASH_SALT: rawEnv.IP_HASH_SALT,
    MEDIA_DIR: rawMediaDir ? rawMediaDir : path.resolve(process.cwd(), 'media'),
    VIDEOS_DIR: rawVideosDir ? rawVideosDir : path.resolve(process.cwd(), 'videos'),
    UPLOAD_TMP_DIR: rawUploadTmpDir
      ? rawUploadTmpDir
      : path.resolve(os.tmpdir(), 'aljazira-uploads'),
    PAYLOAD_JOBS_AUTORUN: rawJobsAutoRun
      ? rawJobsAutoRun
      : isProductionRuntime
        ? undefined
        : 'true',
    SMTP_HOST: rawSmtpHost ? rawSmtpHost : isProductionRuntime ? undefined : '127.0.0.1',
    SMTP_PORT: rawSmtpPort ? rawSmtpPort : isProductionRuntime ? undefined : '1025',
  })

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const field = issue.path.join('.') || 'env'
        return `  - ${field}: ${issue.message}`
      })
      .join('\n')

    throw new Error(
      `Invalid environment configuration (src/env.ts, ${ENV_SERVER_ONLY_SENTINEL}):\n${details}\nHint: generate secrets using \`openssl rand -base64 48\`.`,
    )
  }

  return result.data
}

const BUILD_PHASE_FALLBACK_ENV: Record<string, string> = {
  DATABASE_URL: 'postgresql://build_only:build_only@127.0.0.1:5432/build_only',
  SERVER_URL: 'http://localhost:3000',
  PAYLOAD_SECRET: 'build-phase-only-ephemeral-payload-secret-not-used-at-runtime-x7K9mP2qR4wZ8',
  IP_HASH_SALT: 'build-phase-only-ephemeral-ip-hash-salt-not-used-at-runtime-v3N8bH5kW6pL9',
  PAYLOAD_JOBS_AUTORUN: 'false',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '1025',
}

function loadEnv(): Env {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return parseEnv({
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PHASE: process.env.NEXT_PHASE,
      DATABASE_URL: process.env.DATABASE_URL || BUILD_PHASE_FALLBACK_ENV.DATABASE_URL,
      SERVER_URL: process.env.SERVER_URL || BUILD_PHASE_FALLBACK_ENV.SERVER_URL,
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || BUILD_PHASE_FALLBACK_ENV.PAYLOAD_SECRET,
      IP_HASH_SALT: process.env.IP_HASH_SALT || BUILD_PHASE_FALLBACK_ENV.IP_HASH_SALT,
      MEDIA_DIR: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'media'),
      VIDEOS_DIR: process.env.VIDEOS_DIR || path.resolve(process.cwd(), 'videos'),
      UPLOAD_TMP_DIR: process.env.UPLOAD_TMP_DIR || path.resolve(os.tmpdir(), 'aljazira-uploads'),
      PAYLOAD_JOBS_AUTORUN:
        process.env.PAYLOAD_JOBS_AUTORUN || BUILD_PHASE_FALLBACK_ENV.PAYLOAD_JOBS_AUTORUN,
      SMTP_HOST: process.env.SMTP_HOST || BUILD_PHASE_FALLBACK_ENV.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT || BUILD_PHASE_FALLBACK_ENV.SMTP_PORT,
    })
  }

  return parseEnv(process.env)
}

export const env: Env = loadEnv()
