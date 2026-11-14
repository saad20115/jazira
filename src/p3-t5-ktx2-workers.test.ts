import { FileLoader } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { KTX2_WORKER_CSP, KTX2_WORKER_URL } from '@/components/systems3d/renderContract'
import { UrlWorkerKTX2Loader } from '@/components/systems3d/viewer/UrlWorkerKTX2Loader'

/** A Worker that records what the loader does with it (no thread). */
class FakeWorker {
  static created: FakeWorker[] = []
  readonly url: string
  readonly messages: { type: string }[] = []
  terminated = false

  constructor(url: string) {
    this.url = url
    FakeWorker.created.push(this)
  }

  postMessage(message: { type: string }): void {
    this.messages.push(message)
  }

  addEventListener(): void {
    // The pool listens for transcoded textures; none come here.
  }

  terminate(): void {
    this.terminated = true
  }
}

function serveWorkerPolicy(csp: string | null): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(null, {
          status: 200,
          headers: csp === null ? {} : { 'content-security-policy': csp },
        }),
      ),
    ),
  )
}

function loader(): UrlWorkerKTX2Loader {
  const ktx2 = new UrlWorkerKTX2Loader(KTX2_WORKER_URL, KTX2_WORKER_CSP)
  ktx2.setTranscoderPath('/systems/v023b/basis/')
  return ktx2
}

beforeEach(() => {
  FakeWorker.created = []
  vi.stubGlobal('Worker', FakeWorker)
  vi.spyOn(FileLoader.prototype, 'loadAsync').mockResolvedValue(new ArrayBuffer(8))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('P3-T5 O-9a: the KTX2 workers start before the parse, never before the policy check', () => {
  it('starts no worker until the policy is checked, then one per pool slot; init gives each the transcoder', async () => {
    serveWorkerPolicy(KTX2_WORKER_CSP)
    const ktx2 = loader()
    const fetched = ktx2.fetchTranscoder()
    expect(FakeWorker.created).toEqual([])
    await fetched
    expect(FakeWorker.created).toHaveLength(ktx2.workerPool.pool)
    expect(FakeWorker.created.every((worker) => worker.url === KTX2_WORKER_URL)).toBe(true)
    expect(FakeWorker.created.flatMap((worker) => worker.messages)).toEqual([])

    await ktx2.init()
    // The same workers, each with one init message; no new ones.
    expect(FakeWorker.created).toHaveLength(ktx2.workerPool.pool)
    for (const worker of FakeWorker.created) {
      expect(worker.messages.map((message) => message.type)).toEqual(['init'])
    }
  })

  it('a failed policy check starts no worker, and init reports it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    serveWorkerPolicy(null)
    const ktx2 = loader()
    await expect(ktx2.fetchTranscoder()).rejects.toThrow(/unexpected Content-Security-Policy/)
    await expect(ktx2.init()).rejects.toThrow(/unexpected Content-Security-Policy/)
    expect(FakeWorker.created).toEqual([])
  })

  it('dispose ends the started workers, and none start or get the transcoder after it', async () => {
    serveWorkerPolicy(KTX2_WORKER_CSP)
    const ktx2 = loader()
    await ktx2.fetchTranscoder()
    const started = [...FakeWorker.created]
    expect(started).toHaveLength(ktx2.workerPool.pool)
    ktx2.dispose()
    expect(started.every((worker) => worker.terminated)).toBe(true)
    await ktx2.init()
    expect(FakeWorker.created).toHaveLength(started.length)
    expect(started.flatMap((worker) => worker.messages)).toEqual([])
  })

  it('a dispose during the policy check starts no worker at all', async () => {
    serveWorkerPolicy(KTX2_WORKER_CSP)
    const ktx2 = loader()
    const fetched = ktx2.fetchTranscoder()
    ktx2.dispose()
    await fetched
    expect(FakeWorker.created).toEqual([])
  })
})
