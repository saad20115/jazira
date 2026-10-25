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
export type GfxOverride = 'stills' | 'low' | 'high'

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

/**
 * Whether the unmasked WebGL renderer string names a high-performance GPU. Integrated, mobile and
 * software renderers (and an unknown string) are not; the default is the lite model.
 */
export function isHighPerformanceGpu(renderer: string | null | undefined): boolean {
  if (!renderer) {
    return false
  }
  const name = renderer.toLowerCase()
  if (/swiftshader|llvmpipe|software|microsoft basic|mali|adreno|powervr|apple gpu/.test(name)) {
    return false
  }
  if (/intel/.test(name) && !/arc/.test(name)) {
    return false
  }
  return /nvidia|geforce|quadro|rtx|gtx|radeon|amd|\barc\b|apple m[1-9]/.test(name)
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

/** Parses the dev-only `?gfx=` override (ignored in production builds by the caller). */
export function parseGfxOverride(search: string): GfxOverride | null {
  const value = new URLSearchParams(search).get('gfx')
  return value === 'stills' || value === 'low' || value === 'high' ? value : null
}
