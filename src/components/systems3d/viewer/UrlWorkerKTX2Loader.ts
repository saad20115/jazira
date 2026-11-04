/**
 * KTX2Loader whose transcoding workers load from one same-origin URL instead of a blob (security
 * H3b, `docs/03-security.md`). three's `init()` fetches `basis_transcoder.js`, concatenates it with
 * `KTX2Loader.BasisWorker` into a blob and starts blob workers, which inherit the page CSP; the
 * Emscripten/embind transcoder needs `Function` there. Here the same worker body is pre-built and
 * hash-pinned by `scripts/sync-3d-assets.mjs` as `ktx2-worker.js`, served with its own CSP, and
 * only the wasm binary is fetched (and transferred to each worker, exactly as three does).
 *
 * Overrides `init()` and `dispose()` of three 0.186.1; every other method is three's. The policy
 * check and the binary can start before the renderer exists (`fetchTranscoder`), and `init()` starts
 * the pool's workers at once (`WorkerPool._initWorker`, three 0.186.1).
 *
 * Fail closed (C3-3): before any worker starts, a same-origin HEAD request must show exactly the
 * expected CSP on the worker URL. A missing or different policy (which a URL worker would otherwise
 * run under silently) rejects, and the card stays on the stills tier.
 */

import { FileLoader } from 'three'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'

import { ViewerStartError } from './failure'

let warned = false

/** Checks the worker URL's response CSP. Exported for tests. */
export async function verifyWorkerPolicy(workerUrl: string, expectedCsp: string): Promise<void> {
  const response = await fetch(workerUrl, {
    method: 'HEAD',
    cache: 'no-store',
    credentials: 'same-origin',
  })
  const policy = response.headers.get('content-security-policy')
  if (!response.ok || policy !== expectedCsp) {
    if (!warned) {
      warned = true
      console.warn('[systems3d] KTX2 worker policy check failed; staying on the still images')
    }
    throw new ViewerStartError('worker-policy', 'KTX2 worker: unexpected Content-Security-Policy')
  }
}

export class UrlWorkerKTX2Loader extends KTX2Loader {
  private readonly workerUrl: string
  private readonly expectedCsp: string
  private transcoderFetch: Promise<ArrayBuffer> | null = null
  /** Workers started after the policy check, before the worker config exists (`init`). */
  private readonly spareWorkers: Worker[] = []
  private disposed = false

  constructor(workerUrl: string, expectedCsp: string) {
    super()
    this.workerUrl = workerUrl
    this.expectedCsp = expectedCsp
  }

  /**
   * O-9a: the policy check and the transcoder binary, which need neither the renderer nor the
   * worker config, so the viewer starts them first (set the transcoder path before). Once the
   * policy is checked the pool's workers start too (thread and script); `init()` hands them the
   * config and the binary. `init()` waits for the same promise and reports its failure.
   */
  fetchTranscoder(): Promise<ArrayBuffer> {
    if (!this.transcoderFetch) {
      const policyChecked = verifyWorkerPolicy(this.workerUrl, this.expectedCsp).then(() => {
        while (!this.disposed && this.spareWorkers.length < this.workerPool.pool) {
          this.spareWorkers.push(new Worker(this.workerUrl))
        }
      })
      const binaryLoader = new FileLoader(this.manager)
      binaryLoader.setPath(this.transcoderPath)
      binaryLoader.setResponseType('arraybuffer')
      binaryLoader.setWithCredentials(this.withCredentials)
      const fetched = Promise.all([
        policyChecked,
        binaryLoader.loadAsync('basis_transcoder.wasm'),
      ]).then(([, binary]) => {
        if (!(binary instanceof ArrayBuffer)) {
          throw new Error('KTX2: basis_transcoder.wasm did not load as binary')
        }
        return binary
      })
      // Reported by `init()` (the parse); unobserved until then.
      fetched.catch(() => undefined)
      this.transcoderFetch = fetched
    }
    return this.transcoderFetch
  }

  override init(): Promise<void> {
    if (!this.transcoderPending) {
      this.transcoderPending = this.fetchTranscoder().then((binary) => {
        this.transcoderBinary = binary
        this.workerPool.setWorkerCreator(() => {
          const worker = this.spareWorkers.pop() ?? new Worker(this.workerUrl)
          const transcoderBinary = binary.slice(0)
          worker.postMessage({ type: 'init', config: this.workerConfig, transcoderBinary }, [
            transcoderBinary,
          ])
          return worker
        })
        // O-9a: every worker compiles the transcoder now, while the model downloads, not when the
        // parse posts it its first texture (never once disposed: nothing would end it).
        if (!this.disposed) {
          for (let id = 0; id < this.workerPool.pool; id += 1) {
            this.workerPool._initWorker(id)
          }
        }
      })
    }
    return this.transcoderPending
  }

  override dispose(): void {
    this.disposed = true
    for (const worker of this.spareWorkers.splice(0)) {
      worker.terminate()
    }
    this.workerPool.dispose()
  }
}
