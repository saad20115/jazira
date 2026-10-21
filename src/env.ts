import { z } from 'zod'

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
  })
  .refine((data) => data.PAYLOAD_SECRET !== data.IP_HASH_SALT, {
    path: ['IP_HASH_SALT'],
    message:
      'IP_HASH_SALT and PAYLOAD_SECRET must differ from each other. Generate a separate secret with: openssl rand -base64 48',
  })

export type Env = z.infer<typeof envSchema>

export function parseEnv(rawEnv: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse({
    DATABASE_URL: rawEnv.DATABASE_URL,
    SERVER_URL: rawEnv.SERVER_URL,
    PAYLOAD_SECRET: rawEnv.PAYLOAD_SECRET,
    IP_HASH_SALT: rawEnv.IP_HASH_SALT,
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

export const env: Env = parseEnv(process.env)
