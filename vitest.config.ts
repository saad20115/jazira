import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vitest/config'

function readDotEnvTestDbUrl(): string | undefined {
  try {
    const envPath = path.resolve(import.meta.dirname, '.env')
    if (!fs.existsSync(envPath)) {
      return undefined
    }
    const content = fs.readFileSync(envPath, 'utf8')
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) {
        continue
      }
      const eqIdx = line.indexOf('=')
      if (eqIdx === -1) {
        continue
      }
      const key = line.slice(0, eqIdx).trim()
      const val = line.slice(eqIdx + 1).trim()
      if (key === 'TEST_DATABASE_URL' && val) {
        return val
      }
    }
  } catch {
    return undefined
  }
  return undefined
}

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  readDotEnvTestDbUrl() ??
  'postgresql://test_user:test_pass@127.0.0.1:5434/aljazira_test'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@payload-config': path.resolve(import.meta.dirname, './src/payload.config.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      SERVER_URL: 'http://localhost:3000',
      PAYLOAD_SECRET: 'test_only_payload_secret_at_least_48_characters_long_a1b2c3d4',
      IP_HASH_SALT: 'test_only_ip_hash_salt_at_least_48_characters_long_e5f6g7h8',
    },
  },
})
