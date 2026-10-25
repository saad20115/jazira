import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { assertSeedEnvironmentAllowed, formatSeedSummaryLines } from '../src/seed/materials'
import { formatP4T2SummaryLines, type P4T2SeedRunSummary, seedP4T2Content } from '../src/seed/p4-t2'

export { formatP4T2SummaryLines, formatSeedSummaryLines }

export async function runSeedCli(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  argv: readonly string[] = process.argv,
): Promise<P4T2SeedRunSummary> {
  assertSeedEnvironmentAllowed(nodeEnv, argv)

  const payload = await getPayload({ config: configPromise })
  try {
    const summary = await seedP4T2Content(payload, { nodeEnv, argv })
    for (const line of formatP4T2SummaryLines(summary)) {
      process.stdout.write(`${line}\n`)
    }
    return summary
  } finally {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  }
}

if (typeof process !== 'undefined' && !process.env.VITEST && process.env.NODE_ENV !== 'test') {
  try {
    await runSeedCli()
    process.exit(0)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`${message}\n`)
    process.exit(1)
  }
}
