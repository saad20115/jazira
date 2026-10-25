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

/** Device-pixel-ratio caps (`handoff/tasks/P3-T5.md` §8). */
export const DPR_CAP = { desktop: 1.5, mobile: 1.25 } as const

/** Camera clip planes used by the reference viewer. */
export const CAMERA_NEAR = 0.5
export const CAMERA_FAR = 6000
export const PMREM = { near: 1, far: 3000 } as const
