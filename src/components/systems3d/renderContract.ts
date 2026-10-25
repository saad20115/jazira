/**
 * The live render contract of the pinned release (`3d/web/manifest.json` → `render`, brief A-1 §17,
 * `extras-schema.md` "Live render"). Plain constants, kept equal to the manifest by
 * `src/p3-t5-render-contract.test.ts`. No three.js import.
 */

export const RELEASE = 'v022n'
export const RELEASE_BASE_PATH = `/systems/${RELEASE}`

export const MODEL_FILES = {
  full: `${RELEASE_BASE_PATH}/tower.glb`,
  lite: `${RELEASE_BASE_PATH}/tower-lite.glb`,
} as const
export type ModelTier = keyof typeof MODEL_FILES

/** Self-hosted KTX2 transcoder (same three version, hash-pinned by `scripts/sync-3d-assets.mjs`). */
export const BASIS_TRANSCODER_PATH = `${RELEASE_BASE_PATH}/basis/`

/** The KTX2 transcoding worker (security H3b): generated and pinned by the sync, own CSP. */
export const KTX2_WORKER_URL = `${RELEASE_BASE_PATH}/basis/ktx2-worker.js`

/** `render.bloom`: UnrealBloomPass on a HalfFloat 4× MSAA composer target, full model only. */
export const BLOOM = { threshold: 8, strength: 0.22, radius: 0.25 } as const
export const COMPOSER_MSAA_SAMPLES = 4

/** Blender's "Medium High Contrast" look in AgX-log space: `(c − pivot) · 1.2 + pivot`. */
export const AGX_LOOK = { pivot: 0.606, contrast: 1.2 } as const

/** Clear colour for each studio mode (`scene.background` stays null; the room mesh is the backdrop). */
export const CLEAR_COLOR = { night: 0x1b2130, day: 0xd8d8d6 } as const

/** Materials the `enter` state fades and the interior mapping applies to (`extras-schema.md` v021). */
export const FACADE_MATERIALS = [
  'MAT_glass_cw',
  'MAT_glass_wing',
  'MAT_glass_side',
  'MAT_glass_terrace',
  'MAT_mullion',
  'MAT_gold_fin',
  'MAT_crown_light',
  'MAT_podium_glass',
] as const
export const INTERIOR_MATERIALS = [
  'MAT_glass_cw',
  'MAT_glass_wing',
  'MAT_glass_side',
  'MAT_glass_terrace',
] as const
export const CORE_MATERIALS = ['MAT_concrete', 'MAT_concrete_floor'] as const

/** Interior mapping (`render.interior_mapping`): 64 × 24 modules, window band 0.12–0.74, 7 m room. */
export const INTERIOR = { depthM: 7, grid: [64, 24], windowBand: [0.12, 0.74] } as const

/**
 * V-1 (live ~30 % brighter than the Cycles stills): live look calibration on top of the release
 * values (`toneMappingExposure = 2 ** exposure_stops`, environment and emissive at 1). Tuned against
 * the hero still, gate: mean luma ±5, background ±6 per channel (`handoff/tasks/P3-T5.md`).
 */
export interface LiveLook {
  exposureScale: number
  envIntensity: number
  emissiveScale: number
  /** Environment reflection on the lightmapped room only (`MAT_room.envMapIntensity`). */
  roomEnvIntensity: number
  /**
   * V-4: emissive level the room floor reaches at the edge of its inner disc (1 = no fade). The
   * baked disc around the plinth is flat in live, so it ends in a hard pale ellipse.
   */
  floorEdgeLevel: number
}
/**
 * Calibrated 2026-10-25 on this machine (Intel HD 530, Chrome/ANGLE D3D11), hero still vs the live
 * first frame at 1440 × DPR 1 (card 600 × 580), lite and full: mean luma −1.6 / −2.0, background top
 * ≤ 2.5 and floor ≤ 3.7 per channel (gate ±5 / ±6). Evidence: docs/reports/evidence/P3-T5/m3/.
 */
export const LIVE_LOOK: LiveLook = {
  exposureScale: 0.84,
  envIntensity: 1,
  emissiveScale: 0.78,
  roomEnvIntensity: 0.4,
  floorEdgeLevel: 0.5,
}

/** V-2: anisotropic filtering of the façade emissive (window) textures, capped by the GPU. */
export const FACADE_ANISOTROPY = 16

/** Device-pixel-ratio caps (`handoff/tasks/P3-T5.md` §8). */
export const DPR_CAP = { desktop: 1.5, mobile: 1.25 } as const

/** Camera clip planes used by the reference viewer. */
export const CAMERA_NEAR = 0.5
export const CAMERA_FAR = 6000
export const PMREM = { near: 1, far: 3000 } as const
