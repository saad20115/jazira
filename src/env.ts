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
}

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
    MEDIA_DIR: z
      .string()
      .trim()
      .min(1, 'MEDIA_DIR must not be empty.')
      .refine(
        (val) => path.isAbsolute(val),
        'MEDIA_DIR must be an absolute filesystem path (e.g. /var/lib/aljazira/media or D:\\jazira\\media).',
      )
      .refine((val) => {
        const resolvedMedia = path.resolve(val)
        const publicDir = path.resolve(process.cwd(), 'public')
        const rel = path.relative(publicDir, resolvedMedia)
        return rel !== '' && (rel.startsWith('..') || path.isAbsolute(rel))
      }, 'MEDIA_DIR must not be inside public/ (uploads must be served through Payload access control).')
      .transform((val) => path.resolve(val)),
  })
  .refine((data) => data.PAYLOAD_SECRET !== data.IP_HASH_SALT, {
    path: ['IP_HASH_SALT'],
    message:
      'IP_HASH_SALT and PAYLOAD_SECRET must differ from each other. Generate a separate secret with: openssl rand -base64 48',
  })

export type Env = z.infer<typeof envSchema>

export function parseEnv(rawEnv: Record<string, string | undefined>): Env {
  const rawMediaDir = rawEnv.MEDIA_DIR?.trim()
  const result = envSchema.safeParse({
    DATABASE_URL: rawEnv.DATABASE_URL,
    SERVER_URL: rawEnv.SERVER_URL,
    PAYLOAD_SECRET: rawEnv.PAYLOAD_SECRET,
    IP_HASH_SALT: rawEnv.IP_HASH_SALT,
    MEDIA_DIR: rawMediaDir ? rawMediaDir : path.resolve(process.cwd(), 'media'),
  })

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const field = issue.path.join('.') || 'env'
        return `  - ${field}: ${issue.message}`
      })
      .join('\n')

    throw new Error(
      `Invalid environment configuration (src/env.ts):\n${details}\nHint: generate secrets using \`openssl rand -base64 48\`.`,
    )
  }

  return result.data
}

const BUILD_PHASE_FALLBACK_ENV: Record<string, string> = {
  DATABASE_URL: 'postgresql://build_only:build_only@127.0.0.1:5432/build_only',
  SERVER_URL: 'http://localhost:3000',
  PAYLOAD_SECRET: 'build-phase-only-ephemeral-payload-secret-not-used-at-runtime-0001',
  IP_HASH_SALT: 'build-phase-only-ephemeral-ip-hash-salt-not-used-at-runtime-00002',
}

function loadEnv(): Env {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return parseEnv({
      DATABASE_URL: process.env.DATABASE_URL || BUILD_PHASE_FALLBACK_ENV.DATABASE_URL,
      SERVER_URL: process.env.SERVER_URL || BUILD_PHASE_FALLBACK_ENV.SERVER_URL,
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || BUILD_PHASE_FALLBACK_ENV.PAYLOAD_SECRET,
      IP_HASH_SALT: process.env.IP_HASH_SALT || BUILD_PHASE_FALLBACK_ENV.IP_HASH_SALT,
      MEDIA_DIR: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'media'),
    })
  }

  return parseEnv(process.env)
}

export const env: Env = loadEnv()
