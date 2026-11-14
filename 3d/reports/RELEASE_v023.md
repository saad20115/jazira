# v023 — OWNER-APPROVED LOOK (2026-11-11) — Figma match + fewer lite feature combinations

> **OWNER SIGN-OFF 2026-11-11: "اعتمد"**, given on `renders/r4-corner/v023/three_panel_hero_v023.jpg`
> (Figma | Cycles | live lite) + the crown / pilaster / lobby crops and the end-stills sheet. This approves the v023
> look in `web/build/v023/` (tower.glb `998e1575…`, tower-lite.glb `a66be4da…`, stills). The site may now unpin
> v022n and take v023 from `web/build/v023/` (site work: see `extras-schema.md` delta). Nothing was pushed or
> deployed here; `web/` release files (v022n) are untouched. Still unmeasured: the 3 s start with lite
> MeshPhysical glass.

> **CURRENT BUILD (2026-11-11, last of the day): "dusk-sky mirror".** After the owner asked
> "ما مشكلتك في مطابقة صورة فيجما؟" the named-colour attempts (navy, steel, royal blue, olive options) were dropped.
> Cause found: the ref's glass takes its look from the dusk sky it reflects; the studio had one glow colour.
> Now: `MAQ_glow_dusk`, an env-only dome (listed in `studio.env_only`, never drawn) with `tex_roomlight_sky`
> (deep blue above, paler horizon band, warm glow 150° round from `CAM_hero`, dark below) on `MAT_sky_env`;
> glass = neutral blue-grey mirror, base (0.16, 0.21, 0.28) + `tex_cw_tilt`; window emission 2.2 on a yellower
> picture; gold base (0.66, 0.50, 0.27); lobby 2.6; `studio.night_glow` back to its v022n values (the dome hides it).
> Then, on the owner's request "اطفئ الاضاءه الداخلية في المبني في الجانبين البعيدين في واجهتي المبني مثل صورة فيجما":
> the west wing (`FAC_cw_wing`) and the east face beyond its pilaster (`FAC_cw_E`, cut at plan y = 1.6 m) show unlit
> rooms only; their window UVs moved into a dark band of `tex_cw_emit_night` (u 0.3125–0.6875). `FAC_cw_E` gained one cut.
> Then three more owner asks, all in this build: "خفف خطوط الفواصل بين الواح الزجاج لاقل درجة وزيد الانعكاس بدون بهتان"
> (mullions / floor lines recoloured close to the glass, roughness 0.15; pane gaps in the window picture 8 → 4 px);
> "زيد شفافية الزجاج ليظهر تأثير اللمعان ويمتص اثر الاتعكاس الزائد" (rooms behind unlit panes brighter, 0.035–0.07;
> clearcoat 0.6 kept in lite too, so lite glass is `MeshPhysicalMaterial` again); "الزجاج مفترض زجاج مرايا عاكس ايضا"
> (glass base 0.18 / 0.24 / 0.32). Brighter-sky variants were tried live and dropped: they read pale.
> Latest ask, built: "زيد اثر الانعكاس وقلل الشفافية للزجاج والمجسم بعيد لانه بيظهر باهت وخفف فواصل الزجاج" →
> glass base 0.25 / 0.32 / 0.43; rooms behind unlit panes back down to 0.012–0.026; mullion colour 0.22 / 0.28 / 0.38,
> roughness 0.08; pane gaps 2 px. Read as: it looked pale from far away (checked at 225 m and at max distance 420 m).
> Latest ask, built: "المشكله الان في درجات الزجاج والفواصل كأنه قطع زجاج من الوان مختلفه وغير متطابقة التركيب وليس تغيير
> بنعومه" → the per-pane tilt map `tex_cw_tilt` is REMOVED (the glass has no normal map at all) and `tex_cw_mr` is
> one uniform value (roughness 0.05, metal 0.6): one smooth sheet, the dusk reflection runs as a continuous gradient.
> So ignore every mention of `tex_cw_tilt` below. 16 textures per file again.
> Latest ask, built: "زيد شفافيته اكثر" → rooms behind unlit panes 0.03–0.055, glass base 0.20 / 0.26 / 0.35.
> The glass is still opaque in the file; real see-through at rest is the site's façade opacity (it draws the façade
> opaque at rest and fades it only on entry). Not tried: a rest opacity below 1 on the site side.
> **Owner on this build (2026-11-11): "لا، يكفي هكذا"** — said when offered real see-through glass; the glass work
> stops here. This is the lite look he steered on the live preview; it is not a release sign-off.
> Then one more ask, built (this is the current build): "ضيف شفافية للزجاج في الغرف المعتمه الغير مضاءه بنسبه
> مناسبه" → rooms behind unlit panes 0.05–0.085 (was 0.03–0.055). Evidence: `near_zoom_far_lite_v023.png`
> (hero | zoom on the unlit panes | 420 m), 40 draw calls near and far. Re-checked on the final build: hero / az 90 / 180 / 270 / 420 m = 40 draw calls;
> entered hvac 53, fire 51, plumbing 49, power 48, smart 48; exit lands on `CAM_hero` (0 m off); full hero 62 / 76 with bloom.
> Owner on the unlit-room transparency: **"مناسبة"**. Glass look settled on lite (not a release sign-off).
> **FINAL BUILD OF THE DAY** (after that): the dark band widened to u 0.281–0.719 and the far sides centred in it.
> **FULL TIER:** the lit rooms that leaked onto the far sides are gone. What remains is the viewer's interior
> mapping: its parallax smears lit / unlit panes into each other, so the windows read dimmer and less distinct than
> lite (`ref_lite_full_hero_v023.png`). With `?interior=0` the full model matches lite (checked, one frame).
> **For the CTO: turn interior mapping OFF for v023** (it was designed for v022n's continuous bands), or clamp its
> parallax to the pane. `manifest.json` still says `interior_mapping.tiers: ['full']` (written by guard.mjs, frozen).
> Numbers of this build: full 7,089,064 B / 63,800 tris / 16 KTX2 (~13.02 MB GPU); lite 2,116,712 B / 54,424 tris /
> 16 KTX2 (~6.78 MB GPU), 40 draw calls at the hero and at az 90 / 180 / 270, 39 materials in 17 feature combinations (v022n 38 in 19; the
> new one is the env-only `MAT_sky_env`, never drawn). Entered (lite, this build): hvac 53, fire 51, plumbing 49, power 48, smart 48 draw calls; each lands back on `CAM_hero`.
> Evidence of this build: `renders/r4-corner/v023/ref_vs_lite_v023.png`, `live_lite_hero_2048_v023.png`, `live_lite_far_420m_v023.png` (the three-panel = ref | 225 m | 420 m),
> `orbit_sheet_lite_v023.png`, `entered_sheet_lite_v023.png`, `lite_vs_full_hero_v023.png`. Full hero: 62 scene / 76 with bloom.
> **Site note:** the site must hide every `studio.env_only` node in the main view (contract since v022); if it
> hard-codes the three softbox names instead, the dome would be drawn as a 700 m sphere round the scene.
> **Where the sections below disagree with this box (glass row, combination count, sizes, evidence list), this box wins.**
>
> **Status 2026-11-11: look approved by the owner ("اعتمد"); build in `web/build/v023/`. `web/` stays v022n** until
> the owner says to promote it (hashes re-checked after every build). Nothing pushed, nothing deployed, `3d/` in the
> site repository not edited. Waiting for: the site CTO's import and speed gates (3 s start not measured).

**Briefs:** `A-1-v023-figma-match.md` (2026-11-11) and `A-1-v023-request.md` (2026-11-05), read from
`S:\aljazira-3d_handover\` (`D:\jazira\handoff\briefs\` is not reachable from this machine; same file names).
**Owner, in this session (2026-11-11):** "انا عندي مشكله في الاضاءه والواجهه الخرجيه والمظهر العام" and
"انعكاسات ولمعان الزجاج"; on the first preview: "درجة اللون مختلفه جذريا و الزجاج مطفي"; then
"زيد شفافية الزجاج وخليه مايل للاخضر قليلا" and "الازرق الزجاجي الملكي اللامع". System entry is not a complaint and was not changed.
**QA was told on 2026-11-11** (owner sign-off note sent to the QA session; QA verified hashes, stills and web/).

## Model or site? (the brief's first question)

Both. The v022n **lite** GLB in the reference viewer (`web/viewer-test`, no site code) already shows the pale
look: continuous cream window bands over most of the façade, pale pilasters, flat glass. The site adds its own
brightening on top (its evening-sky background and `LiveLook` values); that part was not measured here.

## What changed (all in memory on top of `blend/aljazira_tower_r5c_v022n.blend`; the master is not modified)

| # | Brief item | v022n | v023 |
|---|---|---|---|
| 1 | Glass | flat navy (0.007, 0.023, 0.089); dim sheen | **glossy royal blue leaning slightly green**, base (0.03, 0.10, 0.26); new `tex_cw_tilt` normal map (one randomly tilted flat normal per 2.4 m pane) replaces `tex_cw_normal` on the glass: panes mirror different heights = shimmer; `studio.night_glow` regraded (color 0.36/0.52/1.0 → 0.55/0.76/1.0, gain 2.2 → 3.4, min 0.25 → 0.05, height −20..700 → −70..170): a reflection gradient up the wall. A steel blue-grey measured on the ref was tried first; the owner asked for royal blue. "More transparent": the file stays opaque (the site fades glass only on entry); every unlit pane now shows its dim room. |
| 2 | Lit windows | continuous bands (`tex_cw_emit_night`) | each 2.4 m pane lit or dark on its own, in office-sized runs, dark gap at each mullion; unlit panes show a dim green-grey room; emission 2.6→1.5 |
| 3 | Gold pilasters | roughness exported as 1.0 (a noise node the exporter cannot write), cream wash | gold metal: roughness 0.30, base (0.70, 0.46, 0.20), a faint gold wash (0.24) |
| 4 | Lobby | strength 4.3, washed out | amber picture, strength 2.2 |
| 5 | Crown | L22 dark, LED line 0.25 m | a few lit panes on L22, LED line 0.60 m, strength 6 (full) / 5 on the amber swatch (lite) |
| 6 | Framing | `CAM_hero` 381.2 m, `hero_shift_y` 0.1475 | **225.0 m**, `hero_shift_y` **0.2135** (same axis and fov). The plinth is cut at the frame sides, like the roundabout in the ref. `max_distance` stays 420. |

Same names, UV layouts, window band (12–74 %), extras keys, hotspots, variants and entered looks.
New extras **values** only: `camera_limits.hero_distance / hero_shift_y`, `studio.night_glow.{color,gain,min,height_from,height_to}`.
New texture name in the GLBs: `tex_cw_tilt` (`tex_cw_normal` is gone); the glass normal map no longer uses `KHR_texture_transform`.

## Lite feature combinations (2026-11-05 request)

Counted with `web/feature_combos.mjs` (same method as the CTO's estimate; lists in `web/build/v023/feature_combos_lite_*.txt`).

| | v022n lite | v023 lite |
|---|---:|---:|
| Materials | 38 | 38 (names are contract) |
| Distinct feature combinations | **19** | **16** |

- Glass (4 materials): clearcoat and specular extension dropped → plain `MeshStandardMaterial`; normal map without texture transform.
- `MAT_plinth_side`: clearcoat dropped → same set as `MAT_plinth_top` / `MAT_room`.
- `MAT_crown_light`: emission from the amber swatch of `tex_glow_palette`, no vertex colours → same set as `MAT_podium_glass`.
- `MAT_gold_fin`: double-sided → same set as `MAT_podium_glass`.
- **Tried and dropped (eye check):** merging the lightmapped site set with the room / plinth set changed the plaza or the room tone.
- Full: 19 → 19 (look only; clearcoat / specular / normal / interior mapping kept).
- **Not measured:** compile time. Nobody has timed the 3 s start with v023.
- **For the CTO:** the five systems' materials (3 of the 16 sets) are inside the tower in the hero view but still drawn, so they compile at start. Hiding the `SYS_*` roots until entry is a site-side lever.

## Files (`web/build/v023/`)

| File | Bytes | sha256 |
|---|---:|---|
| `tower.glb` | 7,089,064 | `998e15755cf07613b2c93842a9106f58fc73fc8244b4e607f9d19a61eb10a9d0` |
| `tower-lite.glb` | 2,116,712 | `a66be4dab740110347a065a82f6d99141e39ac5e5b9b290f8ead2ffe687e875f` |
| `manifest.json` | 11,783 | `25709051ef5b5869251338f73539c5d39220dd4655532378f787a443139d6829` |

Do not re-run guard into `web/build/v023`: it rewrites `generated` and the manifest hash changes.

| | full | lite |
|---|---:|---:|
| Size | 7,089,064 B (≤ 8 MB) | 2,116,712 B (≤ 2.5 MB) |
| Triangles | 63,800 | 54,424 |
| GPU textures | ~13.02 MB, 16 × KTX2 | ~6.78 MB, 16 × KTX2 |
| Draw calls, hero | 62 / 76 with bloom | 40 |
| Draw calls, hero orbit az 90 / 180 / 270 | not captured | 40 / 40 / 40 |
| Draw calls, entered hvac / fire / plumbing / power / smart | not captured | final build: hvac 53, smart 48 (fire / plumbing / power 51 / 49 / 48 on the build before the glass change; v022n 50 / 48 / 46 / 45 / 45; ≤ 60) |

The +3 entered calls in lite: the double-sided gold and crown-light meshes draw in two passes while the façade is faded.

## Changed materials and textures

- Materials: `MAT_glass_cw`, `MAT_glass_wing`, `MAT_glass_side`, `MAT_glass_terrace`, `MAT_gold_fin`, `MAT_crown_light`, `MAT_podium_glass`; lite also `MAT_plinth_side`.
- Textures (`textures_v023/`, regenerated by `v023_textures.py`): `tex_cw_emit_night`, `tex_pilaster_wash`, `tex_podium_emit`, new `tex_cw_tilt`. All others are byte copies of `textures_v022n/` (lite re-bakes `LM_systems_lite`, `tex_sys_shade_lite` as before).
- Geometry: `FAC_crown_light` crown line 0.25 → 0.60 m; lite: its UV layers (`UVMap` + `LM`), no `Col`.
- Scripts: new `blend/scripts/v023_textures.py`, `v023_look.py`, `v023_render_hero.py`, `web/feature_combos.mjs`; `export_glb.py` gained one guarded hook (`AJ_V023=1`; unset = v022n behaviour).

## Rebuild

```
set AJ_TEX=C:\aljazira-3d\textures_v023 & set AJ_V023=1
blender -b --factory-startup -P blend\scripts\v023_textures.py
blender -b --factory-startup blend\aljazira_tower_r5c_v022n.blend -P blend\scripts\export_glb.py -- web\build\v023\src\tower_src.glb AUTO full
blender -b --factory-startup blend\aljazira_tower_r5c_v022n.blend -P blend\scripts\export_glb.py -- web\build\v023\src\tower-lite_src.glb AUTO lite
powershell -File web\compress.ps1 -OutDir build\v023
```

## Evidence (`renders/r4-corner/v023/`, final build)

- `ref_before_after_lite_v023.png`: Figma ref | v022n lite | v023 lite (reference viewer, each at its own `CAM_hero`).
- `live_lite_hero_2048_v023.png`, `orbit_sheet_lite_v023.png` (az 90 / 180 / 270).
- `hero_cycles_2048_v023_STALE_before_royal_glass.png`: Cycles, rendered **before** the royal-glass change. Not valid evidence.
- **Missing against the brief:** the three-panel with a current Cycles frame, and the crown / pilaster / lobby crops.
- Live frames: reference viewer on this machine (Intel UHD, the lite tier's GPU class), not the site.

## Open — not done

1. **Done (2026-11-11): Cycles matched to live** by eye with `blend/scripts/v023_cycles_match.py` (Cycles-only:
   glass roughness 0.30, coat roughness 0.35, dusk dome 2.8, lobby ×1.6, windows ×1.2; never exported).
   Evidence: `renders/r4-corner/v023/three_panel_hero_v023.jpg` (Figma | Cycles | live lite) and
   `crop_crown_v023.jpg`, `crop_pilasters_v023.jpg`, `crop_lobby_v023.jpg`. Cycles windows read a touch warmer
   than live; the crossfade does not jump in framing (same `CAM_hero`, 1:1 master).
2. **Done (2026-11-11): v023 stills** in `web/build/v023/stills/` (hero 2048 / 1440 / 828, five ends 2048 / 1440,
   webp + jpg q85, `<s>_hotspots.json`, `stills_manifest.json` 9,4xx B with every file's SHA-256; release GLB hashes
   are the v023 build ones). Rendered with `v023_render_hero.py` / `v023_render_ends.py` (Cycles 256 spp, OptiX);
   logs in `reports/v023_logs/`. Contact sheet of the ends: `renders/r4-corner/v023/ends_sheet_cycles_v023.jpg`.
   `master_blend` in the manifest names the v022n master + v023 scripts (no v023 .blend is saved).
3. **Still short of the ref (eye):** the glass is royal blue by owner choice (the ref is a steel blue); lit panes in
   the bright upper reflection read lilac rather than amber; the night glow has one colour, so no warm horizon; the ref's fine vertical mullion rhythm is weaker here; lobby and plaza have no warm light spill
   (`tex_sitelight` was not re-baked for the new lobby colour); no city (owner decision 2026-10-22).
4. **Site side, for the CTO:** `LiveLook` was tuned against v022n; with v023's lower emission its emissive scales
   and exposure need a fresh look, and the site's hero camera follows `camera_limits` (225 m / 0.2135).
5. Done: `web/build/v023/extras-schema.md` (v023 delta on top of the v022n schema).
6. Entered views were only checked to still work in lite; full entered draw calls not captured.
