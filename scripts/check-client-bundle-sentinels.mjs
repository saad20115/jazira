import fs from 'node:fs'
import path from 'node:path'

/**
 * Post-build client bundle sentinel & server-library scanner (`P2-T6 R-6`, `P2-T8 R-12`,
 * `P3-T1 §9`, `docs/03-security.md` S4).
 *
 * Scans `.next/static` (or a specified directory) to ensure:
 * 1. Server-only application modules (`src/env.ts`, `src/lib/ipHash.ts`, `src/lib/cms/client.ts`,
 *    and `src/security/apiError.ts`) never leak transitively into client chunks.
 * 2. Server-only runtime libraries (`payload` server error/database modules, `@payloadcms/db-postgres`,
 *    `@payloadcms/email-nodemailer`, `drizzle-orm/node-postgres`, `pg-protocol`, `nodemailer`, `sharp`)
 *    never reach `.next/static`.
 */

export const FORBIDDEN_CLIENT_BUNDLE_SENTINELS = [
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_ENV__',
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_IPHASH__',
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_CMS_CLIENT__',
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_API_ERROR__',
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_SEED__',
  'build-phase-only-ephemeral-payload-secret-not-used-at-runtime-0001',
  'build-phase-only-ephemeral-ip-hash-salt-not-used-at-runtime-00002',
]

export const FORBIDDEN_SERVER_LIBRARY_MARKERS = [
  '@payloadcms/db-postgres',
  '@payloadcms/email-nodemailer',
  'drizzle-orm/node-postgres',
  'drizzle-orm/pg-core',
  'pg-protocol',
  'SASL: SCRAM-SERVER-FIRST-MESSAGE',
  'nodemailer/lib/mailer',
  'sharp/lib/sharp',
  'the payload config is required for getPayload to work',
  'missing secret key. A secret key is needed to secure Payload',
  'createPublicAPIError',
  'ensurePublicErrorMessageAfterError',
]

/**
 * Runtime markers from `payload` (`APIError`, `ValidationError`, `getPayload`) that survive
 * Turbopack minification and must never appear in any public `(frontend)` client chunk (`R-4`).
 * Note: Payload's `/admin` client bundle (`(payload)`) legitimately uses `payload/shared` & client UI,
 * so these markers are checked against the `(frontend)` route client chunks resolved from
 * `.next/server/app/(frontend)` `build-manifest.json` files (or all files when scanning a standalone test dir).
 */
export const FORBIDDEN_FRONTEND_PAYLOAD_RUNTIME_MARKERS = [
  'this.isOperational',
  'UNAVAILABLE_FOR_LEGAL_REASONS',
  'followingFieldsInvalid',
  'the payload config is required for getPayload to work',
]

export const ALL_FORBIDDEN_CLIENT_BUNDLE_MARKERS = [
  ...FORBIDDEN_CLIENT_BUNDLE_SENTINELS,
  ...FORBIDDEN_SERVER_LIBRARY_MARKERS,
]

/**
 * Collects the relative paths (inside `.next/static`) of all JS chunks loaded by `(frontend)` routes
 * by reading `.next/server/app/(frontend)` `build-manifest.json` files.
 *
 * @param {string} staticRootDir
 * @returns {Set<string> | null} Set of relative paths inside `staticRootDir`, or `null` if no `.next/server` exists.
 */
export function resolveFrontendClientChunkFiles(staticRootDir) {
  const dotNextDir = path.dirname(staticRootDir)
  const frontendServerAppDir = path.join(dotNextDir, 'server', 'app', '(frontend)')
  const payloadServerAppDir = path.join(dotNextDir, 'server', 'app', '(payload)')
  if (!fs.existsSync(frontendServerAppDir) && !fs.existsSync(payloadServerAppDir)) {
    return null
  }

  /** @type {Set<string>} */
  const frontendRelativeFiles = new Set()
  if (!fs.existsSync(frontendServerAppDir)) {
    return frontendRelativeFiles
  }

  /**
   * @param {string} dir
   */
  function walkServerFrontend(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walkServerFrontend(full)
      } else if (entry.isFile() && entry.name === 'build-manifest.json') {
        try {
          const manifest = JSON.parse(fs.readFileSync(full, 'utf8'))
          const fileLists = [
            ...(Array.isArray(manifest.rootMainFiles) ? manifest.rootMainFiles : []),
            ...(Array.isArray(manifest.polyfillFiles) ? manifest.polyfillFiles : []),
            ...Object.values(manifest.pages ?? {}).flat(),
          ]
          for (const item of fileLists) {
            if (typeof item === 'string') {
              const normalized = item
                .replace(/\\/g, '/')
                .replace(/^\/+/, '')
                .replace(/^_next\//, '')
                .replace(/^static\//, '')
              frontendRelativeFiles.add(normalized)
            }
          }
        } catch {
          // Ignore malformed JSON
        }
      } else if (entry.isFile() && entry.name.endsWith('_client-reference-manifest.js')) {
        try {
          const content = fs.readFileSync(full, 'utf8')
          const matches = content.matchAll(/(?:\/_next\/)?static\/chunks\/[^"'\s\\]+\.js/g)
          for (const match of matches) {
            const normalized = match[0]
              .replace(/\\/g, '/')
              .replace(/^\/+/, '')
              .replace(/^_next\//, '')
              .replace(/^static\//, '')
            frontendRelativeFiles.add(normalized)
          }
        } catch {
          // Ignore unreadable manifest
        }
      }
    }
  }

  walkServerFrontend(frontendServerAppDir)
  return frontendRelativeFiles
}

/**
 * @param {string} rootDir
 * @returns {Array<{ file: string; sentinel: string }>}
 */
export function scanDirectoryForSentinels(rootDir) {
  if (!fs.existsSync(rootDir)) {
    throw new Error(`Client bundle directory not found: ${rootDir}`)
  }

  const frontendChunks = resolveFrontendClientChunkFiles(rootDir)

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
        const relFile = path.relative(rootDir, fullPath).replace(/\\/g, '/')
        const content = fs.readFileSync(fullPath, 'utf8')
        for (const marker of ALL_FORBIDDEN_CLIENT_BUNDLE_MARKERS) {
          if (content.includes(marker)) {
            hits.push({
              file: relFile,
              sentinel: marker,
            })
          }
        }
        const isFrontendChunk = frontendChunks === null || frontendChunks.has(relFile)
        if (isFrontendChunk) {
          for (const runtimeMarker of FORBIDDEN_FRONTEND_PAYLOAD_RUNTIME_MARKERS) {
            if (
              !ALL_FORBIDDEN_CLIENT_BUNDLE_MARKERS.includes(runtimeMarker) &&
              content.includes(runtimeMarker)
            ) {
              hits.push({
                file: relFile,
                sentinel: runtimeMarker,
              })
            }
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
        `[check-client-bundle-sentinels] ERROR: Server-only sentinel/library marker "${hit.sentinel}" leaked into client bundle file "${hit.file}" (S4, R-6, R-12, P3-T1 §9)!\n`,
      )
    }
    process.exit(1)
  }

  process.stdout.write(
    `[check-client-bundle-sentinels] Verified zero server-only sentinels or server library markers in ${path.relative(process.cwd(), targetDir).replace(/\\/g, '/') || targetDir}\n`,
  )
}
