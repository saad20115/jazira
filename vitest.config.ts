import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://test_user:test_pass@127.0.0.1:5434/aljazira_test',
      SERVER_URL: 'http://localhost:3000',
      PAYLOAD_SECRET: 'test_only_payload_secret_at_least_48_characters_long_a1b2c3d4',
      IP_HASH_SALT: 'test_only_ip_hash_salt_at_least_48_characters_long_e5f6g7h8',
    },
  },
})
