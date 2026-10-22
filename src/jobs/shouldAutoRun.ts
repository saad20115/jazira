/**
 * Determines whether the current Node.js process should automatically run
 * the Payload Jobs queue (`jobs.autoRun`, e.g. `schedulePublish`) on a cron tick (`R-1`).
 *
 * Returns `false` during:
 * - Next.js production builds / static export (`NEXT_PHASE=phase-production-build` or `next build`)
 * - Payload CLI runs (`payload migrate`, `payload migrate:*`, `payload generate:*`)
 * - Automated test suites (`NODE_ENV=test`, `VITEST=true`, `PLAYWRIGHT_TEST=true`)
 * - Secondary workers / replicas when `PAYLOAD_JOBS_AUTORUN=false` or a non-zero worker instance ID
 *   (`NODE_APP_INSTANCE`, `PM2_INSTANCE_ID`, `WORKER_ID`) is set, ensuring that in Phase 6 (`P6-T1`)
 *   at most a single application instance runs the jobs queue.
 */
export function shouldAutoRunJobs(
  env: NodeJS.ProcessEnv = process.env,
  argv: readonly string[] = process.argv,
): boolean {
  const explicitFlag = env.PAYLOAD_JOBS_AUTORUN?.trim().toLowerCase()
  if (explicitFlag === 'false' || explicitFlag === '0') {
    return false
  }
  if (env.NODE_ENV === 'production' && explicitFlag !== 'true' && explicitFlag !== '1') {
    return false
  }

  if (
    env.NEXT_PHASE === 'phase-production-build' ||
    env.NEXT_PHASE === 'phase-export' ||
    env.NEXT_PHASE === 'phase-production-compile'
  ) {
    return false
  }

  if (
    env.NODE_ENV === 'test' ||
    env.VITEST === 'true' ||
    env.VITEST_WORKER_ID !== undefined ||
    env.PLAYWRIGHT_TEST === 'true'
  ) {
    return false
  }

  // Secondary worker / cluster replica guards (only instance 0 / primary runs jobs)
  if (
    env.NODE_APP_INSTANCE !== undefined &&
    env.NODE_APP_INSTANCE !== '' &&
    env.NODE_APP_INSTANCE !== '0'
  ) {
    return false
  }
  if (
    env.PM2_INSTANCE_ID !== undefined &&
    env.PM2_INSTANCE_ID !== '' &&
    env.PM2_INSTANCE_ID !== '0'
  ) {
    return false
  }
  if (
    env.WORKER_ID !== undefined &&
    env.WORKER_ID !== '' &&
    env.WORKER_ID !== '0' &&
    env.WORKER_ID !== 'primary'
  ) {
    return false
  }

  for (const rawArg of argv) {
    const arg = rawArg.replace(/\\/g, '/').toLowerCase()
    if (
      arg === 'build' ||
      arg === 'migrate' ||
      arg.startsWith('migrate:') ||
      arg.startsWith('generate:') ||
      arg.endsWith('/payload/bin.js') ||
      arg.includes('/vitest')
    ) {
      return false
    }
  }

  return true
}
