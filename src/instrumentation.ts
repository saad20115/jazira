export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return
    }

    try {
      const { parseEnv } = await import('./env')
      parseEnv(process.env)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      process.stderr.write(`${message}\n`)
      process.exit(1)
    }

    const { shouldAutoRunJobs } = await import('./jobs/shouldAutoRun')
    if (shouldAutoRunJobs()) {
      const [{ getPayload }, { default: config }] = await Promise.all([
        import('payload'),
        import('@payload-config'),
      ])
      await getPayload({ config, cron: true })
    }
  }
}
