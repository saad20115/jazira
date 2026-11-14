/**
 * The live render contract of the pinned release (`3d/web/manifest.json` → `render`, brief A-1 §17,
 * `extras-schema.md` "Live render"). Plain constants, kept equal to the manifest by
 * `src/p3-t5-render-contract.test.ts`. No three.js import.
 */

export const RELEASE = 'v023b'
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

/**
 * The exact CSP the worker URL must carry (`next.config.ts`, H3b). The viewer checks it before it
 * starts a worker and fails closed (stills tier) on anything else, including a missing header (C3-3).
 */
export const KTX2_WORKER_CSP =
  "default-src 'none'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self'"

/** `render.bloom`: UnrealBloomPass on a HalfFloat 4× MSAA composer target, full model only. */
export const BLOOM = { threshold: 8, strength: 0.22, radius: 0.25 } as const
export const COMPOSER_MSAA_SAMPLES = 4

/** Blender's "Medium High Contrast" look in AgX-log space: `(c − pivot) · 1.2 + pivot`. */
export const AGX_LOOK = { pivot: 0.606, contrast: 1.2 } as const

/**
 * The release's clear colour for each studio mode (the room mesh as the backdrop). O-13: the live
 * canvas clears transparent instead, and the card's dusk sky (CSS) is the backdrop.
 */
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

/** A warm key light, placed relative to the hero camera (no shadows: cheap on the lite tier). */
export interface KeyLight {
  color: readonly [number, number, number]
  intensity: number
  /** Turned this far around the vertical axis from the hero camera's direction (degrees). */
  azimuthDeg: number
  /** Height above the horizon (degrees). */
  elevationDeg: number
}

/** A sky/ground fill (`HemisphereLight`), so the plaza and palms read in the dark studio. */
export interface FillLight {
  sky: readonly [number, number, number]
  ground: readonly [number, number, number]
  intensity: number
}

/**
 * The live look on top of the release values (`toneMappingExposure = 2 ** exposure_stops`,
 * environment and emissive at 1). Owner review O-5 (2026-11-02, `docs/05-design.md` §21): the target
 * is the look of the Figma render, judged by the owner; the V-1 match to the Cycles stills no longer
 * limits it.
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
  /**
   * O-13: the room's floor is the ground the plinth stands on. It fades out into the card's dusk sky
   * between these multiples of the plinth radius; the room's walls are not drawn.
   */
  groundFade: readonly [number, number]
  /**
   * O-13: evening tints of the baked studio light (emissive, a cool grey) of the lightmapped room
   * floor (warm, toward the ground under the sky) and plinth (warm).
   */
  floorTint: readonly [number, number, number]
  plinthTint: readonly [number, number, number]
  /**
   * O-13: base colour tint per material, for the few surfaces lit by the lights rather than baked
   * (the roads are white in the model, so the cool moon turns them pale blue).
   */
  materialColor: Readonly<Record<string, readonly [number, number, number]>>
  /**
   * O-13: environment reflection per material, in place of `envIntensity`: the studio's bright
   * panels turn the roads and the plinth rim's clear coat pale, which reads as day, not dusk.
   */
  materialEnv: Readonly<Record<string, number>>
  key: KeyLight
  /**
   * O-15 (owner 2026-11-05, "from the side and above", 45°): the façade's light is baked, so the key
   * light alone cannot tell one face of the tower from the other. These materials get a warm sheen in
   * the key's direction: `color × strength × max(N·L, 0)^sharpness`, so the faces turned toward the
   * key read lit and the others stay in soft shade. It fades out inside a system with the façade.
   * Shader text only: no light, shadow map or texture is added.
   */
  keySheen: {
    materials: readonly string[]
    color: readonly [number, number, number]
    strength: number
    sharpness: number
  }
  fill: FillLight
  /**
   * Emissive (baked light) scale per material, in place of `emissiveScale`: most of the model is lit
   * by its lightmaps, so this is how the glazing, lobby, gold, crown and plaza are lifted while the
   * studio room behind stays dark.
   */
  materialEmissive: Readonly<Record<string, number>>
  /**
   * Inside a system, eased in with the façade fade: the key and fill are scaled by this (the
   * equipment is lit, not baked), so it reads clearly against its room; the environment is not
   * raised, which would grey the faded façade glass.
   */
  systemLightScale: number
  systemExposureScale: number
  /**
   * Inside a system, the façade glass glow and reflection are scaled by this, so the faded layers of
   * glass do not veil the equipment.
   */
  systemGlassScale: number
}

/**
 * C3-2: lite tier only, a tint of the paving (its baked light and its base colour) and of the
 * vegetation base colour, so the ground at the swap reads like the Cycles still (gate: ground band ±8 per channel).
 */
export interface LiteGroundTint {
  paving: readonly [number, number, number]
  vegetation: readonly [number, number, number]
}
/**
 * O-5 (round 3): the plaza warm and light, as in the Figma render, and the palms a readable green
 * (the 2026-10-25 tint matched the cool grey-blue Cycles still). The rest is the plinth-top glow and
 * palm geometry/LOD (3D-lead list in the report), not a colour.
 */
export const LITE_GROUND_TINT: LiteGroundTint = {
  paving: [2.6, 2.3, 1.9],
  vegetation: [0.85, 0.95, 0.65],
}
/**
 * O-5 (round 3): brighter and warmer than the V-1 calibration of 2026-10-25 (exposure 0.84, emissive
 * 0.78): lit glazing and lobby, gold pilasters and crown caught by a warm key, the plaza and palms
 * lifted by the fill, and more light inside the systems. Judged by eye against the Figma render
 * (`docs/reports/evidence/P3-T5/r3/lighting/`).
 */
export const LIVE_LOOK: LiveLook = {
  exposureScale: 1,
  envIntensity: 1,
  emissiveScale: 0.66,
  roomEnvIntensity: 0.4,
  floorEdgeLevel: 0.5,
  groundFade: [1.02, 1.6],
  floorTint: [1, 0.7, 0.36],
  plinthTint: [0.7, 0.6, 0.48],
  materialColor: { MAT_asphalt: [0.3, 0.29, 0.28] },
  materialEnv: { MAT_asphalt: 0.3, MAT_plinth_side: 0.35 },
  materialEmissive: {
    MAT_glass_cw: 1.5,
    MAT_glass_side: 1.5,
    MAT_glass_wing: 1.5,
    MAT_glass_terrace: 1.5,
    MAT_podium_glass: 1.8,
    MAT_gold_fin: 2,
    MAT_crown_light: 1.8,
    MAT_paving: 1,
    MAT_planting: 1,
    MAT_stone: 1,
    MAT_bronze: 1,
  },
  // O-15: 45° to the right of the hero camera's view (the poster's warm side), 45° above the horizon.
  key: { color: [1, 0.74, 0.48], intensity: 1.6, azimuthDeg: 45, elevationDeg: 45 },
  keySheen: {
    materials: [...INTERIOR_MATERIALS, 'MAT_gold_fin'],
    color: [1, 0.62, 0.3],
    strength: 0.22,
    sharpness: 2,
  },
  fill: { sky: [0.45, 0.52, 0.78], ground: [0.45, 0.33, 0.22], intensity: 0.5 },
  systemLightScale: 1.5,
  systemExposureScale: 1,
  systemGlassScale: 0.3,
}

/** V-2: anisotropic filtering of the façade emissive (window) textures, capped by the GPU. */
export const FACADE_ANISOTROPY = 16

/** Device-pixel-ratio caps (`handoff/tasks/P3-T5.md` §8). */
export const DPR_CAP = { desktop: 1.5, mobile: 1.25 } as const

/** Camera clip planes used by the reference viewer. */
export const CAMERA_NEAR = 0.5
export const CAMERA_FAR = 6000
export const PMREM = { near: 1, far: 3000, size: 256 } as const
