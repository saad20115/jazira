import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Copies the pinned 3D release from `3d/web/` (CTO-owned, Git LFS) into the git-ignored
 * `public/systems/<release>/`, and the KTX2 transcoder from `three` into `basis/` next to it
 * (`handoff/tasks/P3-T5.md` E3 step 2 and "Pinned assets — v022n"; `docs/01-architecture.md` §7).
 *
 * Every served file is verified before anything is written:
 *   - release files against the pinned table below (bytes + SHA-256);
 *   - every file from `3d/web/` against `3d/SHA256SUMS.txt`;
 *   - stills against `stills/stills_manifest.json` `files[]`, whose `derived_from` must match the pins;
 *   - decoders from `three` against their pins (also the two that are bundled, not served);
 *   - `manifest.json` `runtime` (three version, transcoder and meshopt hashes) against the
 *     installed `three` and those pins.
 * It fails on a Git LFS pointer file, a size or hash mismatch, a missing file, or an unexpected
 * file in `3d/web/stills/`. PNG masters are never served and are listed as skipped.
 *
 * The output is written to a temporary folder and renamed into place, so a killed run never leaves
 * a half-synced release. A complete, verified target is left untouched.
 *
 * Usage: node scripts/sync-3d-assets.mjs [--check]   (`--check` verifies only, writes nothing)
 */

export const RELEASE = 'v022n'

const LFS_POINTER_PREFIX = 'version https://git-lfs.github.com/spec/v1'

/** Release files pinned in `handoff/tasks/P3-T5.md` ("Pinned assets — release v022n"). */
export const PINNED_RELEASE_FILES = Object.freeze({
  'tower.glb': {
    bytes: 7081536,
    sha256: '2fd419908dbe8bacdc97c08ba6ac26b75b61d30c65b6785653ab897f8fcd8af5',
  },
  'tower-lite.glb': {
    bytes: 2109740,
    sha256: '382f8f67f83adfcd9f9f7060401a0cfa49da2dcdb0f677273d39dbcebafbe62e',
  },
  'manifest.json': {
    bytes: 12003,
    sha256: '2a5b055d70e20c7928c67b37675da2f9287cbf9abaf0afd9a09b995591abc749',
  },
  'stills/stills_manifest.json': {
    bytes: 9406,
    sha256: 'abceb7a3a2f25f3b9766eefe9ba4b6b60ff4fe5d35a1e45f15a232c774b0fe88',
  },
})

/**
 * Decoders from `three@0.186.1` (`examples/jsm/libs/`). `serveAs` files are fetched by KTX2Loader at
 * run time and copied; the others are imported by the loaders (bundled), so they are verified in place.
 */
export const PINNED_DECODERS = Object.freeze([
  {
    from: 'basis/basis_transcoder.js',
    serveAs: 'basis/basis_transcoder.js',
    bytes: 57529,
    sha256: '8478b5b6d6b74e7d3082b89f6417321d8d1dc0307f2b30d4484bb11b441696a1',
  },
  {
    from: 'basis/basis_transcoder.wasm',
    serveAs: 'basis/basis_transcoder.wasm',
    bytes: 527333,
    sha256: '6cf17dc889352c42e9acf8897107978d127005fe3386c36a0e3845e27967630a',
  },
  {
    from: 'meshopt_decoder.module.js',
    serveAs: null,
    bytes: 29256,
    sha256: 'd428e73a000057c6c94bfcedc3412d0c2dc14ca8800e88553aab05113ad2bf19',
  },
  {
    from: 'zstddec.module.js',
    serveAs: null,
    bytes: 39754,
    sha256: '5cbf818e842628a4464e748594a6deae18ceddda3c2f541e7b3a0ff5fc7611e2',
  },
])

/** Stills served to the site: webp + jpg at 2048 / 1440 / 828 and the per-system hotspot lists. */
const SERVED_STILL = /^[a-z]+(?:_end)?_(?:2048|1440|828)\.(?:webp|jpg)$|^[a-z]+_hotspots\.json$/
const SKIPPED_STILL = /\.png$/

export class SyncError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SyncError'
  }
}

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export function isLfsPointer(buffer) {
  return buffer.subarray(0, LFS_POINTER_PREFIX.length).toString('latin1') === LFS_POINTER_PREFIX
}

/** Parses `<sha256> *./<path>` lines (sha256sum binary mode) into a map keyed by the path. */
export function parseSha256Sums(text) {
  const sums = new Map()
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }
    const match = /^([0-9a-f]{64}) [ *](?:\.\/)?(.+)$/.exec(line)
    if (!match) {
      throw new SyncError(`SHA256SUMS: unreadable line "${line.slice(0, 80)}"`)
    }
    sums.set(match[2], match[1])
  }
  return sums
}

function readVerified(absPath, label, expected) {
  if (!fs.existsSync(absPath)) {
    throw new SyncError(`${label}: missing (${absPath})`)
  }
  const buffer = fs.readFileSync(absPath)
  if (isLfsPointer(buffer)) {
    throw new SyncError(
      `${label}: is a Git LFS pointer file, not the asset. Run "git lfs pull" and try again.`,
    )
  }
  if (expected.bytes !== undefined && buffer.length !== expected.bytes) {
    throw new SyncError(
      `${label}: size ${String(buffer.length)} B does not match the pinned ${String(expected.bytes)} B`,
    )
  }
  const actual = sha256(buffer)
  for (const [source, hash] of expected.hashes) {
    if (actual !== hash) {
      throw new SyncError(`${label}: sha256 ${actual} does not match ${source} (${hash})`)
    }
  }
  return buffer
}

/** Version of the installed `three` (its `package.json`), which the release manifest must name. */
function readThreeVersion(packagePath) {
  let version
  try {
    version = JSON.parse(fs.readFileSync(packagePath, 'utf8'))?.version
  } catch {
    throw new SyncError(`three: cannot read ${packagePath}. Run "pnpm install".`)
  }
  if (typeof version !== 'string') {
    throw new SyncError(`three: no version in ${packagePath}`)
  }
  return version
}

/**
 * The release manifest records the runtime it was verified with (`runtime.three`, the basis
 * transcoder and meshopt decoder hashes). They must equal the installed `three` and the decoder pins.
 */
function verifyRuntimeRecord(manifestBuffer, threeVersion, pinnedDecoders) {
  let manifest
  try {
    manifest = JSON.parse(manifestBuffer.toString('utf8'))
  } catch {
    throw new SyncError('manifest.json: not valid JSON')
  }
  const runtime = manifest?.runtime
  if (runtime?.three !== threeVersion) {
    throw new SyncError(
      `manifest.json: runtime.three "${String(runtime?.three)}" is not the installed three ${threeVersion}`,
    )
  }
  const pinFor = (from) => pinnedDecoders.find((decoder) => decoder.from === from)?.sha256
  const records = [
    [
      'runtime.basisTranscoder["basis_transcoder.js"]',
      runtime.basisTranscoder?.['basis_transcoder.js'],
      pinFor('basis/basis_transcoder.js'),
    ],
    [
      'runtime.basisTranscoder["basis_transcoder.wasm"]',
      runtime.basisTranscoder?.['basis_transcoder.wasm'],
      pinFor('basis/basis_transcoder.wasm'),
    ],
    [
      'runtime.meshoptDecoder.sha256',
      runtime.meshoptDecoder?.sha256,
      pinFor('meshopt_decoder.module.js'),
    ],
  ]
  for (const [key, recorded, pinned] of records) {
    if (!pinned || recorded !== pinned) {
      throw new SyncError(
        `manifest.json: ${key} (${String(recorded)}) does not match the decoder pin (${String(pinned)})`,
      )
    }
  }
}

/**
 * @typedef {{ bytes: number, sha256: string }} FilePin
 * @typedef {{ from: string, serveAs: string | null, bytes: number, sha256: string }} DecoderPin
 * @typedef {{
 *   sourceDir: string,
 *   sumsPath: string,
 *   sumsPrefix?: string,
 *   threeLibsDir: string,
 *   threePackagePath?: string,
 *   release?: string,
 *   pinnedFiles?: Readonly<Record<string, FilePin>>,
 *   pinnedDecoders?: ReadonlyArray<DecoderPin>,
 * }} PlanOptions
 * @typedef {{ files: { rel: string, buffer: Buffer }[], skipped: string[] }} SyncPlan
 */

/**
 * Verifies the release and the decoders and returns the plan: `{ files: [{ rel, buffer }], skipped }`.
 * Throws `SyncError` on the first problem. Writes nothing.
 * @param {PlanOptions} options
 * @returns {SyncPlan}
 */
export function buildSyncPlan({
  sourceDir,
  sumsPath,
  sumsPrefix = 'web/',
  threeLibsDir,
  threePackagePath,
  release = RELEASE,
  pinnedFiles = PINNED_RELEASE_FILES,
  pinnedDecoders = PINNED_DECODERS,
}) {
  if (!fs.existsSync(sumsPath)) {
    throw new SyncError(`SHA256SUMS: missing (${sumsPath}). Is the 3d/ project imported?`)
  }
  const sums = parseSha256Sums(fs.readFileSync(sumsPath, 'utf8'))
  const sumFor = (rel) => {
    const hash = sums.get(`${sumsPrefix}${rel}`)
    if (!hash) {
      throw new SyncError(`${rel}: no entry "${sumsPrefix}${rel}" in SHA256SUMS`)
    }
    return hash
  }

  const files = []
  for (const [rel, pin] of Object.entries(pinnedFiles)) {
    const buffer = readVerified(path.join(sourceDir, rel), rel, {
      bytes: pin.bytes,
      hashes: [
        ['the pinned table', pin.sha256],
        ['SHA256SUMS', sumFor(rel)],
      ],
    })
    files.push({ rel, buffer })
  }

  const stillsManifestEntry = files.find((file) => file.rel === 'stills/stills_manifest.json')
  if (!stillsManifestEntry) {
    throw new SyncError('stills/stills_manifest.json: not in the pinned table')
  }
  let stillsManifest
  try {
    stillsManifest = JSON.parse(stillsManifestEntry.buffer.toString('utf8'))
  } catch {
    throw new SyncError('stills/stills_manifest.json: not valid JSON')
  }
  if (stillsManifest?.release !== release) {
    throw new SyncError(
      `stills/stills_manifest.json: release "${String(stillsManifest?.release)}" is not "${release}"`,
    )
  }
  for (const rel of ['tower.glb', 'tower-lite.glb', 'manifest.json']) {
    const derived = stillsManifest.derived_from?.[rel]
    const pin = pinnedFiles[rel]
    if (!pin || derived?.sha256 !== pin.sha256 || derived?.bytes !== pin.bytes) {
      throw new SyncError(
        `stills/stills_manifest.json: derived_from["${rel}"] does not match the pin`,
      )
    }
  }
  if (!Array.isArray(stillsManifest.files)) {
    throw new SyncError('stills/stills_manifest.json: "files" is not a list')
  }

  const listed = new Map()
  for (const entry of stillsManifest.files) {
    const name = entry?.name
    if (typeof name !== 'string' || !/^[a-z0-9_]+\.[a-z0-9]+$/.test(name)) {
      throw new SyncError(`stills/stills_manifest.json: invalid file name ${JSON.stringify(name)}`)
    }
    if (!Number.isInteger(entry.bytes) || !/^[0-9a-f]{64}$/.test(String(entry.sha256))) {
      throw new SyncError(`stills/stills_manifest.json: ${name} has no valid bytes/sha256`)
    }
    listed.set(name, entry)
  }

  const stillsDir = path.join(sourceDir, 'stills')
  const present = fs.existsSync(stillsDir) ? fs.readdirSync(stillsDir) : []
  for (const name of present) {
    if (name !== 'stills_manifest.json' && !listed.has(name)) {
      throw new SyncError(`stills/${name}: not listed in stills_manifest.json`)
    }
  }

  const skipped = []
  for (const [name, entry] of listed) {
    const rel = `stills/${name}`
    if (SKIPPED_STILL.test(name)) {
      skipped.push(rel)
      continue
    }
    if (!SERVED_STILL.test(name)) {
      throw new SyncError(`${rel}: listed in stills_manifest.json but not a known still type`)
    }
    const buffer = readVerified(path.join(sourceDir, rel), rel, {
      bytes: entry.bytes,
      hashes: [
        ['stills_manifest.json', entry.sha256],
        ['SHA256SUMS', sumFor(rel)],
      ],
    })
    files.push({ rel, buffer })
  }

  for (const decoder of pinnedDecoders) {
    const label = `three/examples/jsm/libs/${decoder.from}`
    const buffer = readVerified(path.join(threeLibsDir, decoder.from), label, {
      bytes: decoder.bytes,
      hashes: [['the decoder pin', decoder.sha256]],
    })
    if (decoder.serveAs) {
      files.push({ rel: decoder.serveAs, buffer })
    }
  }

  const manifestEntry = files.find((file) => file.rel === 'manifest.json')
  if (!manifestEntry) {
    throw new SyncError('manifest.json: not in the pinned table')
  }
  verifyRuntimeRecord(
    manifestEntry.buffer,
    readThreeVersion(threePackagePath ?? path.join(threeLibsDir, '..', '..', '..', 'package.json')),
    pinnedDecoders,
  )

  files.sort((a, b) => a.rel.localeCompare(b.rel))
  return { files, skipped: skipped.sort() }
}

function listFilesRecursive(dir, base = dir) {
  if (!fs.existsSync(dir)) {
    return []
  }
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(abs, base))
    } else {
      out.push(path.relative(base, abs).split(path.sep).join('/'))
    }
  }
  return out.sort()
}

/** True when `targetDir` holds exactly the planned files with the planned bytes. */
/**
 * @param {string} targetDir
 * @param {SyncPlan} plan
 * @returns {boolean}
 */
export function isTargetCurrent(targetDir, plan) {
  const existing = listFilesRecursive(targetDir)
  if (existing.length !== plan.files.length) {
    return false
  }
  return plan.files.every((file, idx) => {
    if (existing[idx] !== file.rel) {
      return false
    }
    const current = fs.readFileSync(path.join(targetDir, file.rel))
    return current.length === file.buffer.length && sha256(current) === sha256(file.buffer)
  })
}

/** Writes the plan to `targetDir` through a temporary sibling folder and an atomic rename. */
/**
 * @param {string} targetDir
 * @param {SyncPlan} plan
 */
export function writePlan(targetDir, plan) {
  const parent = path.dirname(targetDir)
  const stamp = `${String(process.pid)}-${String(Date.now())}`
  const tmpDir = path.join(parent, `.${path.basename(targetDir)}.tmp-${stamp}`)
  const oldDir = path.join(parent, `.${path.basename(targetDir)}.old-${stamp}`)
  fs.mkdirSync(tmpDir, { recursive: true })
  try {
    for (const file of plan.files) {
      const dest = path.join(tmpDir, file.rel)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, file.buffer)
    }
    if (fs.existsSync(targetDir)) {
      fs.renameSync(targetDir, oldDir)
    }
    fs.renameSync(tmpDir, targetDir)
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    throw err
  }
  fs.rmSync(oldDir, { recursive: true, force: true })
}

/** Runs the sync. Returns a summary; throws `SyncError` when verification fails. */
/**
 * @param {PlanOptions & { targetDir: string, checkOnly?: boolean }} options
 * @returns {{ action: string, files: string[], skipped: string[], totalBytes: number }}
 */
export function syncThreeDAssets(options) {
  const plan = buildSyncPlan(options)
  const totalBytes = plan.files.reduce((sum, file) => sum + file.buffer.length, 0)
  let action = 'verified (check only)'
  if (!options.checkOnly) {
    if (isTargetCurrent(options.targetDir, plan)) {
      action = 'already up to date'
    } else {
      writePlan(options.targetDir, plan)
      action = 'written'
    }
  }
  return { action, files: plan.files.map((file) => file.rel), skipped: plan.skipped, totalBytes }
}

function defaultOptions(repoRoot) {
  return {
    sourceDir: path.join(repoRoot, '3d', 'web'),
    sumsPath: path.join(repoRoot, '3d', 'SHA256SUMS.txt'),
    threeLibsDir: path.join(repoRoot, 'node_modules', 'three', 'examples', 'jsm', 'libs'),
    targetDir: path.join(repoRoot, 'public', 'systems', RELEASE),
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const checkOnly = process.argv.includes('--check')
  try {
    const summary = syncThreeDAssets({ ...defaultOptions(repoRoot), checkOnly })
    process.stdout.write(
      `[sync-3d-assets] ${RELEASE}: ${String(summary.files.length)} files, ${String(summary.totalBytes)} B, ${summary.action} -> public/systems/${RELEASE}/\n` +
        `[sync-3d-assets] skipped (not served): ${summary.skipped.join(', ') || 'none'}\n`,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`[sync-3d-assets] FAILED: ${message}\n`)
    process.exit(1)
  }
}
