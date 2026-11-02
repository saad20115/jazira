/**
 * Device tiers for the live 3D card (`handoff/tasks/P3-T5.md` §8b, §8c and the CTO decision
 * "device tiers" of 2026-10-25). Pure functions; the caller reads the browser capabilities.
 */

import type { ModelTier } from './renderContract'

export interface DeviceCaps {
  /** `navigator.deviceMemory` (GB, Chrome caps it at 8); undefined where unsupported. */
  deviceMemory?: number
  hardwareConcurrency?: number
  /** `navigator.connection.saveData`. */
  saveData?: boolean
  /** `navigator.connection.effectiveType` ('slow-2g' | '2g' | '3g' | '4g'). */
  effectiveType?: string
  reducedMotion: boolean
  /** `(pointer: coarse)` matches (phones, tablets). */
  coarsePointer: boolean
  /** The card is in the phone layout (< 768 px wide). */
  phoneLayout: boolean
}

export type StartDecision = 'stills' | 'live'

const SLOW_CONNECTIONS = new Set(['slow-2g', '2g', '3g'])

/** Before any 3D download: weak or constrained devices keep the stills tier (§8b). */
export function decideStart(caps: DeviceCaps): StartDecision {
  if (caps.reducedMotion || caps.saveData === true) {
    return 'stills'
  }
  if (caps.effectiveType !== undefined && SLOW_CONNECTIONS.has(caps.effectiveType)) {
    return 'stills'
  }
  if (caps.deviceMemory !== undefined && caps.deviceMemory < 4) {
    return 'stills'
  }
  if (caps.hardwareConcurrency !== undefined && caps.hardwareConcurrency <= 4) {
    return 'stills'
  }
  return 'live'
}

const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/

/**
 * Whether WebGL runs on the CPU (SwiftShader, llvmpipe, Microsoft Basic Render Driver). The live
 * view then falls back to stills before any download: it cannot hold the frame rate, and it would
 * burn the visitor's CPU.
 */
export function isSoftwareRenderer(renderer: string | null | undefined): boolean {
  return renderer ? SOFTWARE_RENDERERS.test(renderer.toLowerCase()) : false
}

/**
 * Whether the unmasked WebGL renderer string names a high-performance GPU. Integrated, mobile and
 * software renderers (and an unknown string) are not; the default is the lite model.
 */
export function isHighPerformanceGpu(renderer: string | null | undefined): boolean {
  if (!renderer) {
    return false
  }
  const name = renderer.toLowerCase()
  if (isSoftwareRenderer(name) || /mali|adreno|powervr|apple gpu/.test(name)) {
    return false
  }
  if (/intel/.test(name) && !/\barc\b/.test(name)) {
    return false
  }
  // AMD: only discrete Radeon (RX, Pro, VII). Ryzen APUs report "Radeon(TM) Graphics", "Radeon Vega
  // 8" or "Radeon 780M": integrated, shared memory, so the lite model.
  if (/amd|radeon/.test(name)) {
    return /radeon(\(tm\))? (rx|pro|vii)\b/.test(name)
  }
  return /nvidia|geforce|quadro|rtx|gtx|\barc\b|apple m[1-9]/.test(name)
}

/**
 * Lite with bloom off is the default (mobile, tablets, low end). Full only on a desktop with a fine
 * pointer, more than 4 GB and a high-performance GPU; bloom is allowed only with full.
 */
export function chooseModelTier(caps: DeviceCaps, gpuRenderer: string | null): ModelTier {
  const lowMemory = caps.deviceMemory !== undefined && caps.deviceMemory <= 4
  if (caps.coarsePointer || caps.phoneLayout || lowMemory) {
    return 'lite'
  }
  return isHighPerformanceGpu(gpuRenderer) ? 'full' : 'lite'
}

/**
 * Run-time tier check (§8b): a rolling window of frame intervals measured while the view animates.
 * Below `lowFps` the viewer drops to the low tier (DPR 1, no bloom); below `stillsFps` while already
 * low it falls back to the stills tier. A decision needs a full window, and each interval counts at
 * most `MAX_INTERVAL_MS`, so one stall (shader compile, hidden tab, card scrolled away) never
 * changes the tier. O-9: the viewer applies a drop only while the card is off screen or the tab
 * hidden, never in view; the tier it starts with comes from `probeVerdict`.
 */
export const FPS_WINDOW = 60
export const LOW_TIER_FPS = 45
export const STILLS_TIER_FPS = 24
export const MAX_INTERVAL_MS = 250

export type FpsVerdict = 'ok' | 'low' | 'stills'

export function fpsVerdict(intervalsMs: readonly number[], alreadyLow: boolean): FpsVerdict {
  if (intervalsMs.length < FPS_WINDOW) {
    return 'ok'
  }
  const window = intervalsMs.slice(-FPS_WINDOW)
  const mean = window.reduce((sum, ms) => sum + Math.min(ms, MAX_INTERVAL_MS), 0) / window.length
  const fps = mean > 0 ? 1000 / mean : Infinity
  if (alreadyLow) {
    return fps < STILLS_TIER_FPS ? 'stills' : 'ok'
  }
  return fps < LOW_TIER_FPS ? 'low' : 'ok'
}

/**
 * O-9: the tier is fixed before the first visible frame. The viewer times a few frames of the hero
 * view at the size they will show (each drawn, then waited for on the GPU); the first one pays
 * first-use costs and is left out. The median of the rest is held to the same rates as the run-time
 * check: a frame that takes longer than one frame at `LOW_TIER_FPS` (or `STILLS_TIER_FPS` once low)
 * fails it.
 */
export const PROBE_FRAMES = 4

export function probeVerdict(frameMs: readonly number[], alreadyLow: boolean): FpsVerdict {
  const timed = [...frameMs.slice(1)].sort((a, b) => a - b)
  if (timed.length === 0) {
    return 'ok'
  }
  const middle = Math.floor(timed.length / 2)
  const median = timed.length % 2 === 1 ? timed[middle] : (timed[middle - 1] + timed[middle]) / 2
  if (alreadyLow) {
    return median > 1000 / STILLS_TIER_FPS ? 'stills' : 'ok'
  }
  return median > 1000 / LOW_TIER_FPS ? 'low' : 'ok'
}

/**
 * Shader warm-up tasks lengthen frames on any GPU, so frame intervals during a warm-up are not speed
 * samples. The blind window is capped (CTO 2026-11-01): after `WARMUP_SKIP_CAP_MS` of skipped
 * warm-up time, intervals are sampled again even if the warm-up still runs. The skipped time
 * restarts when a warm-up ends.
 */
export const WARMUP_SKIP_CAP_MS = 3000

export function warmupSample(
  skippedMs: number,
  preparing: boolean,
  intervalMs: number,
): { sample: boolean; skippedMs: number } {
  if (!preparing) {
    return { sample: true, skippedMs: 0 }
  }
  if (skippedMs >= WARMUP_SKIP_CAP_MS) {
    return { sample: true, skippedMs }
  }
  return { sample: false, skippedMs: skippedMs + intervalMs }
}
