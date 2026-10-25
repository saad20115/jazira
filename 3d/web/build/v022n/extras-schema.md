# Al Jazira tower GLB: extras and live-render schema (v022n, studio maquette, night)

## v022n delta (night, on top of v022)

v022n is the night version of the v022 studio maquette. The owner asked for it on 2026-10-25 to choose between day and night. It uses the same model, plinth, roundabout, turntable and camera. The studio is dimmed to a cool night tone, and a 45° moonlight lights the whole model. The glass is a glossy dark navy (#142A54) in light and in shade, the office floors glow warm gold (owner pick "i"), and bloom is on in the full model. Everything in the v022 delta and the v021 sections below still applies, except where this delta says otherwise.

### Scene extras: `studio` (night values)

| Key | v022 day | v022n night | Meaning |
|---|---|---|---|
| `studio.mode` | `'day'` | **`'night'`** | Selects the night clear colour and the defaults below. |
| `studio.env_only` | softboxes | softboxes (unchanged) | Reflection-only nodes. They go in the PMREM scene and are **never** drawn in the main view. |
| `studio.exposure_stops` | 0 | 0 | `renderer.toneMappingExposure = 2 ** exposure_stops`. |
| `studio.bloom` | false | **true** | Bloom on for `tower.glb`, off for `tower-lite.glb` (recommended low-end fallback, as in v021). |
| `studio.moon` | (absent) | **new** | `{direction_to_light [-0.336, 0.707, 0.622], color [0.74, 0.84, 1.0], intensity 2.6, lights, note}` |
| `studio.night_glow` | (absent) | **new** | `{color [0.36, 0.52, 1.0], gain 2.2, min 0.25, height_from -20, height_to 700, radius 776, centre [-1.2, 0, 3.9], note}` |

**Moon.** Add `THREE.DirectionalLight(color, intensity)` placed at `target + direction_to_light * R` (any large R), aimed at the target. In Cycles it is light-linked to the model only. three.js has no light linking, but the room, plinth and site-light set are lightmapped with a black base colour, so the moon does not light them twice. It lights the PBR surfaces: the glass sheen, the gold, the palms and the systems.

**Night glow (env only).** Build an inward-facing sphere (`radius`, `centre`). Give it an unlit vertex colour `color × gain × mix(min, 1, smoothstep(height_from, height_to, y))`, with y the world height (glTF Y). Add it **only** to the PMREM scene, next to the room and the `env_only` nodes. It is the dark-navy sheen the glass reflects; Cycles uses a reflection-only glow shell (`MAQ_glowshell`, not exported).

**Clear colour.** Use `#1b2130` at night and keep `#d8d8d6` for day. `scene.background` stays null, and the room mesh is the visible background.

### Materials (night)

- `MAT_glass*` uses a base of #142A54 (dark navy), clearcoat 0.6 and specular 0.8. It reads as glossy navy both in the moon and in shade.
- `tex_cw_emit` is the night window light (patchy lit floors, warm gold, saturation ×1.6 linear). The gold wash factor is 1.0.
- `tex_roomlight` and `tex_plinthlight` hold the night studio bake (studio lights ×0.06, cool).
- `MAT_paving` (lightmapped, `tex_sitelight`) is a cool moonlit grey #7A7F86 at night, not the warm day #847D72. QA: the tower shadow read brown.

### Compression change

- `tex_roomlight*` emissive is now **UASTC** + Zstd, as are the lamp pools and the pilaster wash (`compress.ps1` pattern).
- Reason: ETC1S broke the dark, smooth room gradient into purple 4×4-block blotches in live.
- Cost: +137 KB per file.

### Budgets and measurements (v022n, live)

| | tower.glb | tower-lite.glb |
|---|---|---|
| Size | 7,081,536 B (≤ 8 MB) | 2,109,784 B (≤ 2.5 MB) |
| GPU textures | ~12.86 MB (cap 24) | ~6.61 MB (cap 12) |
| Textures | 16, all KTX2 | 16, all KTX2 |
| Triangles | 61,496 | 52,120 |
| Draw calls (6 orbit frames) | 62 scene / 76 with bloom | 40 (no bloom) |

---

# Al Jazira tower GLB: extras and live-render schema (v022, studio maquette)

## v022 delta

v022 is the owner's studio maquette (2026-10-25): the tower, podium, plaza and a full roundabout with its gardens and palms stand on a white turntable plinth inside a lit studio, in white daylight. There is no sky, city, fog or bloom. Everything in the v021 sections below still applies, except where this delta says otherwise.

### Scene extras: new and changed

| Key | Change | Meaning |
|---|---|---|
| `sky` | **removed** | There is no sky. The background is the studio room mesh. |
| `studio` | **new** | `{mode: 'day', room: 'MAQ_room', env_only: ['MAQ_softbox_fill', 'MAQ_softbox_key', 'MAQ_softbox_sky'], env_position: [x, y, z], exposure_stops: 0, bloom: false, note}` |
| `turntable` | **new** | `{root: 'TURNTABLE', axis, rpm 0.6, ease_back_s 0.7, resume_after_s 8, play: 'idle', note}` |
| `camera_limits.max_distance` | 283.6 → **420** | Measured from the target. The whole plinth stays in frame at the hero distance (381 m). |
| `camera_limits.hero_shift_y` | **new**, 0.148 | Lens shift of the hero frame: `camera.setViewOffset(w, h, 0, hero_shift_y * h, w, h)`. This replaces the hard-coded 0.227. |
| `camera_limits.hero_distance` | 254 → about 381 | CAM_hero has moved back along its own axis; its direction is unchanged. |
| `SYS_<s>.enter_motion.shift_y_from` | 0.227 → **hero_shift_y** | The camera moves from the hero lens shift down to 0. |

**Environment.** Build `scene.environment` with `PMREMGenerator.fromScene(envScene, 0, 1, 3000, { position: env_position })`. `envScene` holds copies of `studio.room` and the `studio.env_only` nodes, each placed with its world matrix.
- The glass and the gold reflect the bright room and the three softbox panels. Cycles does the same: the room and the panels are the only objects visible to glossy rays.
- Set `scene.background = null` and clear to `#d8d8d6`. The room mesh is the visible background.
- Bloom and fog are off.

**Turntable.**
- While idle, rotate the `turntable.root` node about +Y at `rpm`. Idle means no user input for `resume_after_s`, no system entered, and motion allowed (not reduced-motion, tab visible, canvas on screen).
- Before a system entry, ease the rotation back to 0 by the shortest direction over `ease_back_s`, using the enter_motion cubic-bezier. Then play `enter_motion` as before.
- Hold the rotation at 0 while a system is entered. Resume `resume_after_s` after the exit.
- The camera's own idle auto-rotate is off while there is a turntable.
- The root carries ARCH_*, SYS_*, SITE, MAQ_plinth and MAQ_rim. HOT_ / PIVOT_ / CAM_ / PATH_ are world-space and valid at rotation 0.

**Materials (live).**
- `MAT_plinth_top`, `MAT_plinth_side` and `MAT_room` are lightmapped. The baked Cycles studio light is the emissive (`tex_plinthlight`, `tex_roomlight`) and the base colour is black, so the environment does not light them twice.
- The site-light set (stone, bronze, paving, planting, slab) is unchanged, but its bake is now studio daylight.
- Window, lobby and crown emission are a daytime glimmer (×0.04-0.15 of v021).
- There are no lamp pools and no light trails.

**Render contract.**
- Unchanged: AgX + the calibrated look, exposure 1, MSAA.
- Bloom: off.
- Interior mapping: still available on the full model, as in v021, but at daytime emission it barely shows.

---

# Al Jazira tower GLB: extras and live-render schema (v021)

For the site CTO. It covers every `extras` key in `tower.glb` and `tower-lite.glb`, which carry the same keys.
`web/viewer-test/index.html` is the reference implementation of all of it.
Coordinates are glTF (Y up, metres) and angles are radians unless a key says `_deg`.
"Optional" means the site may skip that step: the model still loads and works, and the line says what changes visually.

## Scene extras (`gltf.scene.userData` in three.js)

### `enter`: what changes while a system is entered

The state `k` runs from 0 (rest) to 1 (entered). It ramps over `[fade_start, fade_end]` of the eased move (see `SYS_<s>.enter_motion`). Each value below is the target at `k = 1`; the viewer lerps from 1 at rest.

| Key | Type | Range | v021 | Meaning |
|---|---|---|---|---|
| `facade_opacity` | number | 0–1 | 0.08 | Opacity of the façade materials (see FACADE below). At rest they are drawn opaque. |
| `interior_opacity` | number | 0–1 | 0.08 | Opacity of `MAT_concrete` and `MAT_concrete_floor` (core and slabs). |
| `glass_emissive_scale` | number | 0–1 | 0.15 | Multiplies `emissiveIntensity` of the GLASS materials. |
| `transparent_depth_write` | bool | | false | `depthWrite` for materials while they are faded. |
| `floor_slab_opacity` | number | 0–1 | 1 | Opacity of the entered system's own slabs (`SYS_<s>.floor_slabs`). They stay opaque and unclipped. |
| `other_systems_opacity` | number | 0–1 | 0.12 | Opacity of the other four systems' `MAT_<o>_metal` / `MAT_<o>_fans`. |
| `site_emissive_scale` | number | 0–1 | 0.08 | Multiplies `emissiveIntensity` of the SITE_LIT materials. Their baked lobby light fades with the lobby. |
| `site_occlusion_scale` | number | 0–1 | 0.7 | Target `aoMapIntensity` of the SITE_LIT materials. |

Material lists used by `enter`:
- FACADE: `MAT_glass_cw`, `MAT_glass_wing`, `MAT_glass_side`, `MAT_glass_terrace`, `MAT_mullion`, `MAT_gold_fin`, `MAT_crown_light`, `MAT_podium_glass`.
- GLASS: `MAT_glass_cw`, `MAT_glass_wing`, `MAT_glass_side`, `MAT_glass_terrace`, `MAT_podium_glass`.
- SITE_LIT: `MAT_stone`, `MAT_bronze`, `MAT_paving`, `MAT_planting`. Their emissive map is the baked Cycles site light, and their occlusion is black so the sky does not light them twice.

FACADE materials and `MAT_concrete*` ship as BLEND with alpha 0.999 only so that they can fade. Draw them opaque with `depthWrite` true at rest (`k = 0`), otherwise the glass paints over the mullions.

### `sky`: background and environment

| Key | Type | v021 | Meaning |
|---|---|---|---|
| `model` | string | | `colour(dir) = ramp(elevation_deg) + glow_color · max(0, dir·glow_dir)^glow_exponent · exp(−(elevation_deg / glow_height_deg)²)` |
| `color_space` | string | | Linear-sRGB radiance. `environmentIntensity` is 1 and the background uses the same function. |
| `stops[]` | `{elevation_deg, color[3]}` | −10, −3, 0, 4, 10, 60 | Linear ramp on elevation, clamped at both ends. The two below-horizon stops (v021) give the blue-grey ground fade. |
| `glow_dir` | vec3 (unit) | (−0.087, 0, −0.996) | Sunset direction. |
| `glow_color` | vec3 | (1.4, 0.55, 0.14) | Warm horizon glow, linear. |
| `glow_exponent` | number | 60 | Width of the glow lobe. |
| `glow_height_deg` | number | 2.5 | Gaussian height of the glow band. |

Use: evaluate the function into a small float equirect (512 × 256, RGBA Float), set it as `scene.background`, and set `PMREMGenerator.fromEquirectangular(tex).texture` as `scene.environment`. This is required: the glass reflections come only from this. Never use a flat colour.

### `camera_limits`: OrbitControls outside a system

| Key | Type | v021 | Meaning |
|---|---|---|---|
| `target`, `pan_center` | vec3 | (−4.592, 65.5, 9.075) | Orbit target, which is PIVOT_hero. |
| `pan_radius` | m | 20 | Clamp `controls.target` to within this distance of `pan_center`. |
| `min_distance` / `max_distance` | m | 56.24 / 283.64 | `controls.minDistance` / `maxDistance`. |
| `min_polar` / `max_polar` | rad | 0.2618 / 1.693 | `controls.minPolarAngle` / `maxPolarAngle`. |
| `min_camera_height` | m | 3 | Keep `camera.y` ≥ this value. |
| `fov_y` | rad | 0.55426 | CAM_hero vertical FOV. |
| `tower_height`, `tower_fill_at_max`, `hero_distance` | m, ratio, m | 88.75, 0.55, 254.1 | Information only: how `max_distance` was derived. |

The hero frame also uses CAM_hero's lens shift: `camera.setViewOffset(w, h, 0, 0.227·h, w, h)`.

### `idle`

| Key | Type | v021 | Meaning |
|---|---|---|---|
| `auto_rotate_speed` | number | 0.4 | `controls.autoRotateSpeed`. A value of 2.0 is one orbit per 30 s. |
| `resume_after_s` | s | 8 | Auto-rotate resumes after this many seconds without input, outside a system. Any input stops it. |

Reference viewer behaviour since v021: no auto-rotate when the viewer asks for `prefers-reduced-motion: reduce`.

## Node extras

| Node | Key | Type | Meaning |
|---|---|---|---|
| `ARCH_facade` | `facade_opacity` | number | Rest opacity marker. It is 1, and there is nothing to do with it. |
| `ARCH_core` | `interior_opacity` | number | Same as above, for the core. |
| `HOT_<s>_<n>` (5 per system) | `label` | string | Hotspot id for the site's own labels, for example `chillers`. The node position is the anchor. |
| `SYS_<s>` | `floor_slabs` | csv string | `CORE_slab_*` meshes that stay opaque and unclipped while `<s>` is entered. |
| `SYS_<s>` | `enter_motion` | object | See below. |
| `SYS_<s>` | `section` | object | Clipping plane `{normal[3], constant}`. Points are clipped where `normal·p + constant < 0`. Applies to the ARCH_facade and ARCH_core materials only, with `renderer.localClippingEnabled = true`. The constant slides in from +150 at `k = 0` to `constant` at `k = 1`. |
| `SYS_<s>` | `orbit_limits` | object | `{target, min_distance, max_distance, min_polar, max_polar, pan_radius}`, used while entered. |
| `SYS_hvac` | `fan_spin` | object | See below. |

### `enter_motion`

| Key | Type | v021 |
|---|---|---|
| `duration_s` | s | 2.8 |
| `easing_cubic_bezier` | [x1, y1, x2, y2] | [0.65, 0, 0.35, 1] (CSS cubic-bezier) |
| `path` | node names | `CAM_hero`, then `PATH_<s>_*`, then `CAM_<s>`. The curve is a centripetal Catmull-Rom through the node positions. |
| `target_from` / `target_to` | node names | `PIVOT_hero` → `PIVOT_<s>`, lerped with the eased time. |
| `fov_from` / `fov_to` | rad | 0.55426 → 1.025 (hvac, power, smart) or 1.287 (fire, plumbing) |
| `shift_y_from` / `shift_y_to` | ratio | 0.227 → 0 (view-offset lens shift) |
| `fade_start` / `fade_end` | 0–1 of eased time | 0.1 / 0.55, the window in which `k` ramps |

Exit plays the same path reversed with the same easing, and ends exactly on CAM_hero's pose.

### `fan_spin` (`SYS_hvac`, v020)

| Key | Type | v021 | Meaning |
|---|---|---|---|
| `material` | string | `MAT_hvac_fans` | Its `map` (the rotor texture) is rotated. Set `map.center = (0.5, 0.5)` once. |
| `rpm` | number | 45 | Turns per minute at full level. |
| `play` | `entered` / `always` | entered | With `entered`, `level` ramps 0 → 1 while hvac is entered and back to 0 on exit. |
| `ramp_s` | s | 1 | Ramp time for `level`. |
| `note` | string | | It says `+=`. The reference viewer applies `−=`, which is clockwise seen from above. This is a known text-only item that is fixed only in an owner-approved re-export. |

Each frame: `map.rotation −= rpm / 60 · 2π · dt · level`.

Reference viewer behaviour since v021: the rotors hold still under `prefers-reduced-motion: reduce`, while the tab is hidden, and while the canvas is off-screen (IntersectionObserver). There is no catch-up jump afterwards.

## Material variants

`KHR_materials_variants` has one variant per system, `highlight_<s>`. It switches that system's meshes to `MAT_<s>_highlight`, except the `_glow` and `_fans` meshes. `MAT_<s>_glow` is shown only for the entered system.

## Live render (`manifest.json` → `render`)

The stills were matched to the live model under these settings. Each step is listed with what happens if the site skips it.

| Step | Setting | Required? | If skipped |
|---|---|---|---|
| Tone mapping | `THREE.AgXToneMapping`, `toneMappingExposure` 1, `outputColorSpace` SRGB, applied once (in OutputPass when a composer is used) | **Required** | With ACES or none, the colours and luma no longer match the stills, and the crossfade jumps. |
| AgX look | Blender's "Medium High Contrast": in three's AgX shader, before `agxDefaultContrastApprox`, apply `color = (color − 0.606) · 1.2 + 0.606`. The pivot **0.606 is a calibrated value** (AgX-log mid-grey), not OCIO's 0.4. With 0.4, live came out about 18 luma brighter than the stills. The reference viewer has a `?piv=` override for testing. | Optional | Live is slightly flatter and greyer than the stills, with thirds within about 3 luma. |
| Environment | `sky` extras → PMREM `scene.environment` + background (see above) | **Required** | The glass loses its sky reflections and reads as a flat colour. |
| Render target | EffectComposer on a `HalfFloatType` target with `samples: 4` (MSAA) | Optional (needed only for bloom) | Without the composer, render straight to the canvas with `antialias: true`. Without MSAA in a composer, the mullions alias. |
| Bloom | `UnrealBloomPass`, threshold 8.0 (linear HDR), strength 0.22, radius 0.25, before OutputPass | Optional | Lamps and the crown line lose their soft halo, and the trails are unchanged. Lite without bloom was checked: thirds 97/116/104/70 against 99/117/106/74 with bloom, and draw calls fall from 60 to 46 at most. **Without bloom is the recommended low-end fallback.** |
| Interior mapping | Full model only: `onBeforeCompile` replaces `emissivemap_fragment` on `MAT_glass_cw`, `MAT_glass_wing`, `MAT_glass_side` and `MAT_glass_terrace`. Window band 0.12–0.74 of each module cell, on a 64 × 24 grid over the emissive UV (1.2 × 3.6 m modules, v runs down the façade). The room is 7 m deep, the head is 2.23 m above the sill and the floor is 0.75 m below it. The ray hit is mapped back onto the band of `tex_cw_emit`. See `viewer-test/index.html`, `INTERIOR_GLSL`. | Optional | The baked room picture is shown flat. That is the lite look: still rooms with ceiling panels, without the parallax shift as you orbit. Brightness is the same, with the façade mean 62 vs 62. |

Draw calls in v021 count scene draws only; the bloom chain adds 14 passes on top.
- Full: hero 58; systems 63–88.
- Lite: hero 36–42; systems 42–46.
