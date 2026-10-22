import { describe, expect, it } from 'vitest'

import { shouldAutoRunJobs } from './shouldAutoRun'

describe('shouldAutoRunJobs (P2-T4 R-1)', () => {
  it('returns true for a primary running server process (next start / next dev)', () => {
    expect(
      shouldAutoRunJobs(
        {
          NODE_ENV: 'production',
        },
        ['node', '/app/node_modules/next/dist/bin/next', 'start'],
      ),
    ).toBe(true)

    expect(
      shouldAutoRunJobs(
        {
          NODE_ENV: 'production',
          NODE_APP_INSTANCE: '0',
          WORKER_ID: 'primary',
        },
        ['node', '/app/node_modules/next/dist/bin/next', 'start'],
      ),
    ).toBe(true)
  })

  it('returns false during Next.js build phases or CLI build argv', () => {
    expect(
      shouldAutoRunJobs(
        {
          NODE_ENV: 'production',
          NEXT_PHASE: 'phase-production-build',
        },
        ['node', 'next'],
      ),
    ).toBe(false)

    expect(
      shouldAutoRunJobs(
        {
          NODE_ENV: 'production',
        },
        ['node', '/app/node_modules/next/dist/bin/next', 'build'],
      ),
    ).toBe(false)
  })

  it('returns false during Payload migrate and generate CLI invocations', () => {
    expect(
      shouldAutoRunJobs({ NODE_ENV: 'production' }, [
        'node',
        '/app/node_modules/payload/bin.js',
        'migrate',
      ]),
    ).toBe(false)

    expect(shouldAutoRunJobs({ NODE_ENV: 'production' }, ['node', 'payload', 'migrate:down'])).toBe(
      false,
    )

    expect(
      shouldAutoRunJobs({ NODE_ENV: 'production' }, ['node', 'payload', 'generate:types']),
    ).toBe(false)
  })

  it('returns false during test runs (NODE_ENV=test, VITEST, PLAYWRIGHT_TEST)', () => {
    expect(shouldAutoRunJobs({ NODE_ENV: 'test' }, ['node'])).toBe(false)
    expect(shouldAutoRunJobs({ NODE_ENV: 'development', VITEST: 'true' }, ['node'])).toBe(false)
    expect(shouldAutoRunJobs({ NODE_ENV: 'development', PLAYWRIGHT_TEST: 'true' }, ['node'])).toBe(
      false,
    )
  })

  it('returns false when disabled via PAYLOAD_JOBS_AUTORUN or on non-primary workers', () => {
    expect(
      shouldAutoRunJobs({ NODE_ENV: 'production', PAYLOAD_JOBS_AUTORUN: 'false' }, [
        'node',
        'next',
        'start',
      ]),
    ).toBe(false)

    expect(
      shouldAutoRunJobs({ NODE_ENV: 'production', NODE_APP_INSTANCE: '1' }, [
        'node',
        'next',
        'start',
      ]),
    ).toBe(false)

    expect(
      shouldAutoRunJobs({ NODE_ENV: 'production', PM2_INSTANCE_ID: '2' }, [
        'node',
        'next',
        'start',
      ]),
    ).toBe(false)

    expect(
      shouldAutoRunJobs({ NODE_ENV: 'production', WORKER_ID: 'worker-2' }, [
        'node',
        'next',
        'start',
      ]),
    ).toBe(false)
  })
})
