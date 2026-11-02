/**
 * Why the live card ended on the stills tier. The card shows the reason as `data-viewer-fallback`,
 * so tests and support can tell a designed fallback from a broken one. No three.js import here:
 * the card loads this module eagerly, the viewer lazily.
 */

/** Failures of a running viewer (reported through `onFailure`). */
export type ViewerFailure = 'context-lost' | 'render-error' | 'too-slow'

/**
 * Failures before the first frame that have a known cause (`too-slow`: the GPU probe before the
 * first frame, O-9).
 */
export type StartFailure = 'no-webgl' | 'software' | 'worker-policy' | 'too-slow'

/**
 * Every stills-tier reason: `device` (the device rules or reduced motion chose stills before any
 * download), `timeout` (no first frame in time), `load-error` (anything else while starting).
 */
export type FallbackReason = ViewerFailure | StartFailure | 'device' | 'timeout' | 'load-error'

export class ViewerStartError extends Error {
  readonly reason: StartFailure

  constructor(reason: StartFailure, message: string) {
    super(message)
    this.name = 'ViewerStartError'
    this.reason = reason
  }
}
