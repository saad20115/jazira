import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  assertSeedEnvironmentAllowed,
  formatSeedSummaryLines,
  seedMaterialsAndBrands,
  type MaterialsSeedRunSummary,
} from '../src/seed/materials'

export { formatSeedSummaryLines }

export async function runSeedCli(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  argv: readonly string[] = process.argv,
): Promise<MaterialsSeedRunSummary> {
  assertSeedEnvironmentAllowed(nodeEnv, argv)

  const payload = await getPayload({ config: configPromise })
  try {
    const summary = await seedMaterialsAndBrands(payload, { nodeEnv, argv })
    for (const line of formatSeedSummaryLines(summary)) {
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
