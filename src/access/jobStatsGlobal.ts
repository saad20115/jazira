import type { SanitizedConfig } from 'payload'

/**
 * P5-T2 §5 — scheduling a job task (the retention job) makes Payload add the system global
 * `payload-jobs-stats` during sanitisation, with Payload's default access (any logged-in user).
 * The scheduler reads and writes it through the database adapter, never through access control,
 * so REST, GraphQL and the Local API with access checks are denied for everyone (Z1).
 */
export const JOB_STATS_GLOBAL_SLUG = 'payload-jobs-stats'

const denyJobStatsAccess = (): boolean => false

export function lockDownJobStatsGlobal(config: SanitizedConfig): SanitizedConfig {
  for (const globalConfig of config.globals) {
    if (globalConfig.slug === JOB_STATS_GLOBAL_SLUG) {
      globalConfig.access = {
        ...globalConfig.access,
        read: denyJobStatsAccess,
        readVersions: denyJobStatsAccess,
        update: denyJobStatsAccess,
      }
    }
  }
  return config
}
