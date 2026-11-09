import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  buildKtx2WorkerSource,
  buildSyncPlan,
  isLfsPointer,
  KTX2_WORKER_PATH,
  parseSha256Sums,
  PINNED_DECODERS,
  PINNED_KTX2_WORKER,
  PINNED_RELEASE_FILES,
  readBasisWorkerFromThree,
  RELEASE,
  sha256,
  syncThreeDAssets,
  writePlan,
} from '../../scripts/sync-3d-assets.mjs'

const LFS_POINTER =
  'version https://git-lfs.github.com/spec/v1\noid sha256:2fd419908dbe8bacdc97c08ba6ac26b75b61d30c65b6785653ab897f8fcd8af5\nsize 7081536\n'

interface Fixture {
  root: string
  sourceDir: string
  sumsPath: string
  threeLibsDir: string
  targetDir: string
  pinnedFiles: Record<string, { bytes: number; sha256: string }>
  pinnedDecoders: { from: string; serveAs: string | null; bytes: number; sha256: string }[]
  basisWorker: typeof FAKE_BASIS_WORKER
  pinnedWorker: { bytes: number; sha256: string }
}

/** A stand-in for three's KTX2Loader.BasisWorker (the real one is checked in the last test). */
const FAKE_BASIS_WORKER = {
  fnSource: 'function () {\n\tself.onmessage = () => {}\n}',
  engineFormat: { RGBAFormat: 1023 },
  engineType: { UnsignedByteType: 1009 },
  transcoderFormat: { ETC1: 0 },
  basisFormat: { ETC1S: 0 },
}

let fixture: Fixture

function pinOf(content: string | Buffer): { bytes: number; sha256: string } {
  const buffer = Buffer.from(content)
  return { bytes: buffer.length, sha256: sha256(buffer) }
}

function writeFile(abs: string, content: string | Buffer): void {
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content)
}

/** The fixture `manifest.json`: its `runtime` record names the fixture three and decoders. */
function fixtureManifest(runtimeOverrides: Record<string, unknown> = {}): object {
  return {
    release: 'v022n',
    runtime: {
      three: '0.186.1',
      basisTranscoder: {
        'basis_transcoder.js': pinOf('transcoder-js').sha256,
        'basis_transcoder.wasm': pinOf('transcoder-wasm').sha256,
      },
      meshoptDecoder: { sha256: pinOf('meshopt').sha256 },
      ...runtimeOverrides,
    },
  }
}

/** A miniature, self-consistent release: 2 GLBs, manifest, stills (+ a PNG master), 3 decoders. */
function createFixture(): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p3t5-sync-'))
  const sourceDir = path.join(root, '3d', 'web')
  const threeLibsDir = path.join(root, 'three', 'examples', 'jsm', 'libs')
  writeFile(path.join(root, 'three', 'package.json'), '{"name":"three","version":"0.186.1"}\n')
  const releaseFiles: Record<string, string> = {
    'tower.glb': 'glTF-full-model',
    'tower-lite.glb': 'glTF-lite-model',
    'manifest.json': `${JSON.stringify(fixtureManifest())}\n`,
  }
  const stills: Record<string, string> = {
    'hero_1440.webp': 'hero-webp',
    'hero_828.jpg': 'hero-jpg',
    'hvac_end_2048.webp': 'hvac-webp',
    'hvac_hotspots.json': '{"hotspots":[]}\n',
    'hvac_end_2048.png': 'png-master',
  }
  for (const [rel, content] of Object.entries(releaseFiles)) {
    writeFile(path.join(sourceDir, rel), content)
  }
  for (const [name, content] of Object.entries(stills)) {
    writeFile(path.join(sourceDir, 'stills', name), content)
  }
  const stillsManifest = `${JSON.stringify({
    release: RELEASE,
    derived_from: Object.fromEntries(
      ['tower.glb', 'tower-lite.glb', 'manifest.json'].map((rel) => [
        rel,
        pinOf(releaseFiles[rel] ?? ''),
      ]),
    ),
    files: Object.entries(stills).map(([name, content]) => ({ name, ...pinOf(content) })),
  })}\n`
  writeFile(path.join(sourceDir, 'stills', 'stills_manifest.json'), stillsManifest)

  const decoders = {
    'basis/basis_transcoder.js': 'transcoder-js',
    'basis/basis_transcoder.wasm': 'transcoder-wasm',
    'meshopt_decoder.module.js': 'meshopt',
  }
  for (const [rel, content] of Object.entries(decoders)) {
    writeFile(path.join(threeLibsDir, rel), content)
  }

  const allWeb: Record<string, string> = {
    ...releaseFiles,
    'stills/stills_manifest.json': stillsManifest,
  }
  for (const [name, content] of Object.entries(stills)) {
    allWeb[`stills/${name}`] = content
  }
  const sumsPath = path.join(root, '3d', 'SHA256SUMS.txt')
  writeFile(
    sumsPath,
    `${Object.entries(allWeb)
      .map(([rel, content]) => `${pinOf(content).sha256} *./web/${rel}`)
      .join('\r\n')}\r\n`,
  )

  return {
    root,
    sourceDir,
    sumsPath,
    threeLibsDir,
    targetDir: path.join(root, 'public', 'systems', RELEASE),
    pinnedFiles: {
      'tower.glb': pinOf(releaseFiles['tower.glb'] ?? ''),
      'tower-lite.glb': pinOf(releaseFiles['tower-lite.glb'] ?? ''),
      'manifest.json': pinOf(releaseFiles['manifest.json'] ?? ''),
      'stills/stills_manifest.json': pinOf(stillsManifest),
    },
    pinnedDecoders: [
      { from: 'basis/basis_transcoder.js', serveAs: null, ...pinOf('transcoder-js') },
      {
        from: 'basis/basis_transcoder.wasm',
        serveAs: 'basis/basis_transcoder.wasm',
        ...pinOf('transcoder-wasm'),
      },
      { from: 'meshopt_decoder.module.js', serveAs: null, ...pinOf('meshopt') },
    ],
    basisWorker: FAKE_BASIS_WORKER,
    pinnedWorker: pinOf(buildKtx2WorkerSource('transcoder-js', FAKE_BASIS_WORKER)),
  }
}

function run(checkOnly = false): ReturnType<typeof syncThreeDAssets> {
  return syncThreeDAssets({ ...fixture, checkOnly })
}

function listTarget(): string[] {
  if (!fs.existsSync(fixture.targetDir)) {
    return []
  }
  return (fs.readdirSync(fixture.targetDir, { recursive: true }) as string[])
    .map((rel) => rel.split(path.sep).join('/'))
    .filter((rel) => fs.statSync(path.join(fixture.targetDir, rel)).isFile())
    .sort()
}

const EXPECTED_TARGET = [
  'basis/basis_transcoder.wasm',
  'basis/ktx2-worker.js',
  'manifest.json',
  'stills/hero_1440.webp',
  'stills/hero_828.jpg',
  'stills/hvac_end_2048.webp',
  'stills/hvac_hotspots.json',
  'stills/stills_manifest.json',
  'tower-lite.glb',
  'tower.glb',
]

beforeEach(() => {
  fixture = createFixture()
})

afterEach(() => {
  fs.rmSync(fixture.root, { recursive: true, force: true })
})

describe('scripts/sync-3d-assets.mjs (P3-T5 E3 step 2)', () => {
  it('copies exactly the served files byte for byte, skips PNG masters and is idempotent', () => {
    const first = run()
    expect(first.action).toBe('written')
    expect(first.skipped).toEqual(['stills/hvac_end_2048.png'])
    expect(listTarget()).toEqual(EXPECTED_TARGET)
    expect(fs.readFileSync(path.join(fixture.targetDir, 'tower.glb'), 'utf8')).toBe(
      'glTF-full-model',
    )
    expect(
      fs.readFileSync(path.join(fixture.targetDir, 'basis', 'basis_transcoder.wasm'), 'utf8'),
    ).toBe('transcoder-wasm')
    expect(fs.existsSync(path.join(fixture.targetDir, 'meshopt_decoder.module.js'))).toBe(false)

    expect(run().action).toBe('already up to date')

    fs.writeFileSync(path.join(fixture.targetDir, 'stills', 'stale.webp'), 'stale')
    expect(run().action).toBe('written')
    expect(listTarget()).toEqual(EXPECTED_TARGET)
    expect(fs.readdirSync(path.dirname(fixture.targetDir))).toEqual([RELEASE])
  })

  it('--check verifies without writing anything', () => {
    expect(run(true).action).toBe('verified (check only)')
    expect(fs.existsSync(fixture.targetDir)).toBe(false)
  })

  it('fails on a Git LFS pointer file and writes nothing', () => {
    fs.writeFileSync(path.join(fixture.sourceDir, 'tower.glb'), LFS_POINTER)
    expect(() => run()).toThrow(/tower\.glb: is a Git LFS pointer file.*git lfs pull/)
    expect(fs.existsSync(fixture.targetDir)).toBe(false)
  })

  it('fails on a pinned-file mismatch (same size, different bytes) and keeps the old target', () => {
    run()
    fs.writeFileSync(path.join(fixture.sourceDir, 'tower.glb'), 'glTF-full-modeX')
    expect(() => run()).toThrow(/tower\.glb: sha256 [0-9a-f]{64} does not match the pinned table/)
    expect(fs.readFileSync(path.join(fixture.targetDir, 'tower.glb'), 'utf8')).toBe(
      'glTF-full-model',
    )
  })

  it('fails on a size mismatch', () => {
    fs.writeFileSync(path.join(fixture.sourceDir, 'tower-lite.glb'), 'glTF-lite-model+')
    expect(() => run()).toThrow(/tower-lite\.glb: size 16 B does not match the pinned 15 B/)
  })

  it('fails on a still that does not match stills_manifest.json', () => {
    fs.writeFileSync(path.join(fixture.sourceDir, 'stills', 'hero_828.jpg'), 'hero-jpX')
    expect(() => run()).toThrow(
      /stills\/hero_828\.jpg: sha256 .* does not match stills_manifest\.json/,
    )
  })

  it('fails when SHA256SUMS disagrees with an otherwise pinned file', () => {
    const sums = fs.readFileSync(fixture.sumsPath, 'utf8')
    const wrong = sums.replace(
      `${fixture.pinnedFiles['manifest.json'].sha256} *./web/manifest.json`,
      `${'0'.repeat(64)} *./web/manifest.json`,
    )
    expect(wrong).not.toBe(sums)
    fs.writeFileSync(fixture.sumsPath, wrong)
    expect(() => run()).toThrow(/manifest\.json: sha256 .* does not match SHA256SUMS/)
  })

  it('fails on a missing file, a missing SHA256SUMS entry and a missing SHA256SUMS file', () => {
    fs.rmSync(path.join(fixture.sourceDir, 'stills', 'hvac_hotspots.json'))
    expect(() => run()).toThrow(/stills\/hvac_hotspots\.json: missing/)

    fs.rmSync(fixture.root, { recursive: true, force: true })
    fixture = createFixture()
    const sums = fs.readFileSync(fixture.sumsPath, 'utf8')
    fs.writeFileSync(
      fixture.sumsPath,
      sums
        .split('\r\n')
        .filter((line) => !line.endsWith('web/stills/hero_1440.webp'))
        .join('\r\n'),
    )
    expect(() => run()).toThrow(/stills\/hero_1440\.webp: no entry "web\/stills\/hero_1440\.webp"/)

    fs.rmSync(fixture.sumsPath)
    expect(() => run()).toThrow(/SHA256SUMS: missing/)
  })

  it('fails on an unlisted still, a wrong release, or derived_from not matching the pins', () => {
    fs.writeFileSync(path.join(fixture.sourceDir, 'stills', 'extra_1440.webp'), 'extra')
    expect(() => run()).toThrow(/stills\/extra_1440\.webp: not listed in stills_manifest\.json/)
    fs.rmSync(path.join(fixture.sourceDir, 'stills', 'extra_1440.webp'))

    const manifestPath = path.join(fixture.sourceDir, 'stills', 'stills_manifest.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      release: string
      derived_from: Record<string, { bytes: number; sha256: string }>
    }
    const rewrite = (next: object): void => {
      const text = `${JSON.stringify(next)}\n`
      fs.writeFileSync(manifestPath, text)
      fixture.pinnedFiles['stills/stills_manifest.json'] = pinOf(text)
      const sums = fs
        .readFileSync(fixture.sumsPath, 'utf8')
        .replace(/^[0-9a-f]{64}(?= \*\.\/web\/stills\/stills_manifest\.json)/m, pinOf(text).sha256)
      fs.writeFileSync(fixture.sumsPath, sums)
    }

    rewrite({ ...manifest, release: 'v021' })
    expect(() => run()).toThrow(/release "v021" is not "v022n"/)

    rewrite({
      ...manifest,
      derived_from: {
        ...manifest.derived_from,
        'tower.glb': { bytes: 15, sha256: '1'.repeat(64) },
      },
    })
    expect(() => run()).toThrow(/derived_from\["tower\.glb"\] does not match the pin/)
  })

  it('fails when a decoder from three does not match its pin', () => {
    fs.writeFileSync(path.join(fixture.threeLibsDir, 'meshopt_decoder.module.js'), 'meshopX')
    expect(() => run()).toThrow(
      /meshopt_decoder\.module\.js: sha256 .* does not match the decoder pin/,
    )
  })

  it('fails when the installed three is not the version manifest.json was verified with', () => {
    writeFile(path.join(fixture.root, 'three', 'package.json'), '{"version":"0.186.2"}\n')
    expect(() => run()).toThrow(/runtime\.three "0\.186\.1" is not the installed three 0\.186\.2/)
    fs.rmSync(path.join(fixture.root, 'three', 'package.json'))
    expect(() => run()).toThrow(/three: cannot read .*package\.json/)
  })

  it('fails when a decoder matches its pin but not the hash recorded in manifest.json', () => {
    writeFile(path.join(fixture.threeLibsDir, 'basis', 'basis_transcoder.js'), 'transcoder-jsX')
    fixture.pinnedDecoders[0] = {
      from: 'basis/basis_transcoder.js',
      serveAs: null,
      ...pinOf('transcoder-jsX'),
    }
    fixture.pinnedWorker = pinOf(buildKtx2WorkerSource('transcoder-jsX', FAKE_BASIS_WORKER))
    expect(() => run()).toThrow(
      /runtime\.basisTranscoder\["basis_transcoder\.js"\] \([0-9a-f]{64}\) does not match the decoder pin/,
    )
    expect(fs.existsSync(fixture.targetDir)).toBe(false)
  })

  it('generates the KTX2 worker like three does and refuses a worker that differs from its pin', () => {
    const source = buildKtx2WorkerSource('TRANSCODER();', FAKE_BASIS_WORKER)
    expect(source.split('\n').slice(1, 9)).toEqual([
      '/* constants */',
      'let _EngineFormat = {"RGBAFormat":1023}',
      'let _EngineType = {"UnsignedByteType":1009}',
      'let _TranscoderFormat = {"ETC1":0}',
      'let _BasisFormat = {"ETC1S":0}',
      '/* basis_transcoder.js */',
      'TRANSCODER();',
      '/* worker */',
    ])
    expect(source).toContain('\tself.onmessage = () => {}')
    expect(source).not.toContain('function () {')

    run()
    expect(fs.readFileSync(path.join(fixture.targetDir, 'basis', 'ktx2-worker.js'), 'utf8')).toBe(
      buildKtx2WorkerSource('transcoder-js', FAKE_BASIS_WORKER),
    )
    fixture.basisWorker = { ...FAKE_BASIS_WORKER, fnSource: 'function () { evil() }' }
    expect(() => run()).toThrow(
      /basis\/ktx2-worker\.js: generated \d+ B, sha256 [0-9a-f]{64}; the pin is/,
    )
    expect(fs.readFileSync(path.join(fixture.targetDir, 'basis', 'ktx2-worker.js'), 'utf8')).toBe(
      buildKtx2WorkerSource('transcoder-js', FAKE_BASIS_WORKER),
    )
  })

  it('removes its temporary folder and keeps the old target when a write fails midway', () => {
    run()
    const plan = buildSyncPlan(fixture)
    const broken = {
      ...plan,
      files: [
        { rel: 'tower.glb', buffer: Buffer.from('new') },
        { rel: 'tower.glb/inside', buffer: Buffer.from('collides with the file above') },
      ],
    }
    expect(() => {
      writePlan(fixture.targetDir, broken)
    }).toThrow()
    expect(fs.readdirSync(path.dirname(fixture.targetDir))).toEqual([RELEASE])
    expect(fs.readFileSync(path.join(fixture.targetDir, 'tower.glb'), 'utf8')).toBe(
      'glTF-full-model',
    )
  })

  it('detects LFS pointers and parses SHA256SUMS lines (CRLF, "*./" prefix)', () => {
    expect(isLfsPointer(Buffer.from(LFS_POINTER))).toBe(true)
    expect(isLfsPointer(Buffer.from('glTF\u0002\u0000\u0000\u0000'))).toBe(false)
    const sums = parseSha256Sums(
      `${'a'.repeat(64)} *./web/tower.glb\r\n${'b'.repeat(64)}  x.txt\r\n`,
    )
    expect(sums.get('web/tower.glb')).toBe('a'.repeat(64))
    expect(sums.get('x.txt')).toBe('b'.repeat(64))
    expect(() => parseSha256Sums('not a checksum line')).toThrow(/unreadable line/)
  })

  it('pins exactly the v022n table from the task card and the three@0.186.1 decoders', () => {
    expect(RELEASE).toBe('v022n')
    expect(PINNED_RELEASE_FILES).toEqual({
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
    expect(PINNED_DECODERS.map((decoder) => [decoder.from, decoder.serveAs])).toEqual([
      ['basis/basis_transcoder.js', null],
      ['basis/basis_transcoder.wasm', 'basis/basis_transcoder.wasm'],
      ['meshopt_decoder.module.js', null],
      ['zstddec.module.js', null],
    ])
  })

  it('verifies the real 3d/ release and three@0.186.1 in this checkout (needs git lfs pull)', async () => {
    const repoRoot = process.cwd()
    const plan = buildSyncPlan({
      sourceDir: path.join(repoRoot, '3d', 'web'),
      sumsPath: path.join(repoRoot, '3d', 'SHA256SUMS.txt'),
      threeLibsDir: path.join(repoRoot, 'node_modules', 'three', 'examples', 'jsm', 'libs'),
      basisWorker: await readBasisWorkerFromThree(repoRoot),
    })
    expect(plan.files).toHaveLength(37)
    const worker = plan.files.find((file) => file.rel === KTX2_WORKER_PATH)
    expect(worker && sha256(worker.buffer)).toBe(PINNED_KTX2_WORKER.sha256)
    expect(plan.files.some((file) => file.rel === 'basis/basis_transcoder.js')).toBe(false)
    expect(plan.skipped).toHaveLength(6)
    expect(plan.skipped.every((rel) => rel.endsWith('.png'))).toBe(true)
    expect(plan.files.some((file) => file.rel.endsWith('.png'))).toBe(false)
  })
})
