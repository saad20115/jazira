/**
 * KTX2Loader whose transcoding workers load from one same-origin URL instead of a blob (security
 * H3b, `docs/03-security.md`). three's `init()` fetches `basis_transcoder.js`, concatenates it with
 * `KTX2Loader.BasisWorker` into a blob and starts blob workers, which inherit the page CSP; the
 * Emscripten/embind transcoder needs `Function` there. Here the same worker body is pre-built and
 * hash-pinned by `scripts/sync-3d-assets.mjs` as `ktx2-worker.js`, served with its own CSP, and
 * only the wasm binary is fetched (and transferred to each worker, exactly as three does).
 *
 * Overrides `init()` and `dispose()` of three 0.186.1; every other method is three's.
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

  constructor(workerUrl: string, expectedCsp: string) {
    super()
    this.workerUrl = workerUrl
    this.expectedCsp = expectedCsp
  }

  override init(): Promise<void> {
    if (!this.transcoderPending) {
      const policyChecked = verifyWorkerPolicy(this.workerUrl, this.expectedCsp)
      const binaryLoader = new FileLoader(this.manager)
      binaryLoader.setPath(this.transcoderPath)
      binaryLoader.setResponseType('arraybuffer')
      binaryLoader.setWithCredentials(this.withCredentials)
      this.transcoderPending = Promise.all([
        policyChecked,
        binaryLoader.loadAsync('basis_transcoder.wasm'),
      ]).then(([, binary]) => {
        if (!(binary instanceof ArrayBuffer)) {
          throw new Error('KTX2: basis_transcoder.wasm did not load as binary')
        }
        this.transcoderBinary = binary
        this.workerPool.setWorkerCreator(() => {
          const worker = new Worker(this.workerUrl)
          const transcoderBinary = binary.slice(0)
          worker.postMessage({ type: 'init', config: this.workerConfig, transcoderBinary }, [
            transcoderBinary,
          ])
          return worker
        })
      })
    }
    return this.transcoderPending
  }

  override dispose(): void {
    this.workerPool.dispose()
  }
}
