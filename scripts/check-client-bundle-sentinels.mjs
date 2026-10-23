import fs from 'node:fs'
import path from 'node:path'

/**
 * Post-build client bundle sentinel scanner (`P2-T6 R-6`, `P2-T8 R-12`, `docs/03-security.md` S4).
 *
 * Scans `.next/static` (or a specified directory) to ensure server-only modules
 * (`src/env.ts`, `src/lib/ipHash.ts`, and `src/lib/cms/client.ts`) never leak
 * transitively into client chunks.
 */

export const FORBIDDEN_CLIENT_BUNDLE_SENTINELS = [
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_ENV__',
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_IPHASH__',
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_CMS_CLIENT__',
  'build-phase-only-ephemeral-payload-secret-not-used-at-runtime-0001',
  'build-phase-only-ephemeral-ip-hash-salt-not-used-at-runtime-00002',
]

/**
 * @param {string} rootDir
 * @returns {Array<{ file: string; sentinel: string }>}
 */
export function scanDirectoryForSentinels(rootDir) {
  if (!fs.existsSync(rootDir)) {
    throw new Error(`Client bundle directory not found: ${rootDir}`)
  }

  /** @type {Array<{ file: string; sentinel: string }>} */
  const hits = []

  /**
   * @param {string} currentDir
   */
  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8')
        for (const sentinel of FORBIDDEN_CLIENT_BUNDLE_SENTINELS) {
          if (content.includes(sentinel)) {
            hits.push({
              file: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
              sentinel,
            })
          }
        }
      }
    }
  }

  walk(rootDir)
  return hits
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/check-client-bundle-sentinels.mjs')
) {
  const targetDir = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.resolve(process.cwd(), '.next', 'static')

  const hits = scanDirectoryForSentinels(targetDir)
  if (hits.length > 0) {
    for (const hit of hits) {
      process.stderr.write(
        `[check-client-bundle-sentinels] ERROR: Server-only sentinel "${hit.sentinel}" leaked into client bundle file "${hit.file}" (S4, R-6, R-12)!\n`,
      )
    }
    process.exit(1)
  }

  process.stdout.write(
    `[check-client-bundle-sentinels] Verified zero server-only sentinels in ${path.relative(process.cwd(), targetDir).replace(/\\/g, '/') || targetDir}\n`,
  )
}
