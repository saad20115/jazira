/**
 * KTX2Loader whose transcoding workers load from one same-origin URL instead of a blob (security
 * H3b, `docs/03-security.md`). three's `init()` fetches `basis_transcoder.js`, concatenates it with
 * `KTX2Loader.BasisWorker` into a blob and starts blob workers, which inherit the page CSP; the
 * Emscripten/embind transcoder needs `Function` there. Here the same worker body is pre-built and
 * hash-pinned by `scripts/sync-3d-assets.mjs` as `ktx2-worker.js`, served with its own CSP, and
 * only the wasm binary is fetched (and transferred to each worker, exactly as three does).
 *
 * Overrides `init()` and `dispose()` of three 0.186.1; every other method is three's.
 */

import { FileLoader } from 'three'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'

export class UrlWorkerKTX2Loader extends KTX2Loader {
  private readonly workerUrl: string

  constructor(workerUrl: string) {
    super()
    this.workerUrl = workerUrl
  }

  override init(): Promise<void> {
    if (!this.transcoderPending) {
      const binaryLoader = new FileLoader(this.manager)
      binaryLoader.setPath(this.transcoderPath)
      binaryLoader.setResponseType('arraybuffer')
      binaryLoader.setWithCredentials(this.withCredentials)
      this.transcoderPending = binaryLoader.loadAsync('basis_transcoder.wasm').then((binary) => {
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
