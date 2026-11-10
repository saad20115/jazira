import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { assertTestDatabaseIsolation } from './testDbIsolation'

describe('E-07 — Integration test DB isolation guard', () => {
  it('refuses when TEST_DATABASE_URL is missing, non-loopback, or does not end in _test, and never falls back to DATABASE_URL', () => {
    expect(() =>
      assertTestDatabaseIsolation({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_dev',
      }),
    ).toThrow(/TEST_DATABASE_URL/)

    expect(() =>
      assertTestDatabaseIsolation({
        NODE_ENV: 'test',
        TEST_DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_dev',
      }),
    ).toThrow(/_test/)

    expect(() =>
      assertTestDatabaseIsolation({
        NODE_ENV: 'test',
        TEST_DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_prod',
      }),
    ).toThrow(/_test/)

    expect(() =>
      assertTestDatabaseIsolation({
        NODE_ENV: 'test',
        TEST_DATABASE_URL: 'postgresql://aljazira_app:pass@db.example.com:5432/aljazira_test',
      }),
    ).toThrow(/non-loopback/i)

    expect(
      assertTestDatabaseIsolation({
        NODE_ENV: 'test',
        TEST_DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test',
        DATABASE_URL: 'postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test',
      }),
    ).toBe('postgresql://aljazira_app:pass@127.0.0.1:5470/aljazira_test')
  })

  it('enforces assertTestDatabaseIsolation in every tests/int/*.int.test.ts file and forbids falling back to DATABASE_URL', () => {
    const intDir = path.resolve(process.cwd(), 'tests/int')
    const intFiles = fs
      .readdirSync(intDir)
      .filter((f) => f.endsWith('.int.test.ts'))
      .sort()

    expect(intFiles.length).toBeGreaterThanOrEqual(13)

    for (const file of intFiles) {
      const source = fs.readFileSync(path.join(intDir, file), 'utf8')
      expect(
        source,
        `${file} must not fall back from TEST_DATABASE_URL to DATABASE_URL`,
      ).not.toContain('process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL')
      expect(source, `${file} must call assertTestDatabaseIsolation`).toContain(
        'assertTestDatabaseIsolation(',
      )
    }
  })
})
