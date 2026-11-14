# v023b — PROMOTED to `web/` 2026-11-12 — window lighting read from the Figma picture

> **PROMOTED 2026-11-12: owner "انقلها للموقع"** (answer to "أنقل v023b للموقع الحين؟", in the device-spec session).
> `web/` now holds v023b: tower.glb `d7e975d9…`, tower-lite.glb `01736727…`, manifest.json `39945794…`,
> stills/ (38, stills_manifest `d1cadfad…`); verified here. v022n backed up first to
> `web/build/v022n_live_backup_2026-11-12/` (43 files). `web/src`, viewer-test, compress/guard untouched. Not pushed,
> not deployed. Lite draw calls re-counted after the promote: **40**. `web/build/v023b/` is now the source of the live
> bytes: do not rebuild into it; further changes go to a new folder (e.g. `web/build/v023c`).

> **OWNER SIGN-OFF 2026-11-12: "أعتمد الشكل"** (his answer to "هل تعتمد شكل الجولة السابعة؟"), given on the live lite
> preview and `renders/r4-corner/v023b/figma_vs_v023b_r7_hero.jpg`. This approves the LOOK of v023b round 7 in
> `web/build/v023b/`. It is **not** a promote word: `web/` still holds v022n (`2fd41990…`, `382f8f67…`,
> `2a5b055d…`), `web/build/v023/` (approved 2026-11-11) is untouched, nothing was pushed or deployed.

v023b is v023 (`reports/RELEASE_v023.md`) plus seven rounds on the window lighting, asked for by the owner after
he approved v023: "شكل وعدد وتوزيع المضاء والمعتم غير منطقي وغير مطابق. ممكن نحاكي اللي موجود في الصوره", then
"طابق مع فيجما". Full round-by-round spec: `web/build/v023b/extras-v023b-delta.md`.

## What changed against v023
- **Window map read from Figma.** `tex_cw_emit_night` is sampled from `ref/tower-render.png` (`figma_plan()` in
  `blend/scripts/v023_textures.py`): the two front faces are rectified, each Figma floor × each 2.4 m pane is read
  for warm light. A lit Figma floor is lit right across the face, Figma's dark floors stay dark, each office (1–3
  panes) has its own brightness. Top floors unlit but for a few rooms; the front stepped corner is lit (owner).
- **Near / far dimming follows the view angle**, not a baked dark side: new scene extra `window_view_falloff`.
- **Lit glass is clearer than dark glass** (owner: lobby +90 %, lit rooms 85 %): new scene extra `lit_glass_clarity`.
- **Lobby** seen through clear glass (golden double-height hall), gold 1.0 / 0.73 / 0.20.
- **Lobby light spill** on the plaza, plinth and canopies, added to `tex_sitelight` by `blend/scripts/v023b_spill.py`.
- No mesh, node-name, material-name, hotspot or variant change. Pane gaps stay hairlines (owner, 2026-11-11).

## Files (`web/build/v023b/`)
| file | bytes | sha256 |
|---|---|---|
| tower.glb | 7,124,096 | `d7e975d913a5a018ce670761a4654c8da07950b95645221c439a379f76d763a9` |
| tower-lite.glb | 2,151,664 | `017367270f596dda41c485bb4892fa16384d6a297fa22a7d92dc95a5aa95a732` |
| manifest.json | 11,783 | `3994579499fc5b32581134cb456078789659bfc23502a13dd8324289791b5b49` |
| stills/stills_manifest.json | 9,177 | `d1cadfad527b73ce85478a9e50541d64f24a38b0e5f60522c89261defe92de5c` |

Guard OK: lite 2.15 MB (budget 2.5), GPU textures lite ~6.78 MB, all KTX2. Lite draw calls were 40 at az 0 / 45 /
90 / 180 / 270 in round 5; **not re-counted** in rounds 6–7 (pictures only changed).

## Stills (`web/build/v023b/stills/`, 2026-11-12)
Hero 2048 / 1440 / 828 and five ends 2048 / 1440, png master + webp + jpg q85, `<s>_hotspots.json`,
`stills_manifest.json` (every file's SHA-256; derived from the v023b GLBs). Cycles 256 spp, OptiX, same scripts as
v023 with `AJ_TEX=textures_v023b AJ_WIN=figma`. The view-angle falloff is built in Cycles nodes
(`v023_cycles_match.py`). The lobby spill is in Cycles too (QA 2026-11-12: it was missing from the first stills, so
the plaza would have warmed up on the photo → live crossfade): `v023b_spill.py` also writes the spill alone as
`textures_v023b/tex_spill_add.png`, and `v023_cycles_match.py` adds it as emission on the site materials' LM UV
(Cycles only, never exported). All six stills re-rendered with it on 2026-11-12 (hero 08:27, ends 08:32–16:42).
By eye the hero now matches the live window pattern, tone and plaza pool. Logs: `reports/v023_logs/v023b_*`.

## Rebuild
```
AJ_TEX=C:\aljazira-3d\textures_v023b  AJ_V023=1  AJ_LIGHT=night  AJ_WIN=figma
blender -b --factory-startup -P blend/scripts/v023_textures.py
blender -b blend/aljazira_tower_r5c_v022n.blend --factory-startup -P blend/scripts/v023b_spill.py
blender -b --factory-startup blend/aljazira_tower_r5c_v022n.blend -P blend/scripts/export_glb.py -- C:/aljazira-3d/web/build/v023b/src/tower-lite_src.glb AUTO lite   (and tower_src.glb AUTO full)
web\compress.ps1 -OutDir build\v023b
```
The master `.blend` is never saved (in-memory patch).

## Site side, for the CTO (must be done before v023b goes live)
1. Implement `window_view_falloff` (or the far sides read fully lit) and `lit_glass_clarity`. Reference shader:
   `addGlassFx` in `web/viewer-test/index.html`; formulas in `extras-v023b-delta.md`.
2. Everything already listed for v023 (`RELEASE_v023.md`, "Site side"): `LiveLook` emissive scales and exposure,
   interior mapping off for the full tier.

## Open — not done
- `lit_glass_clarity` is **not mirrored in Cycles** (stills keep the full glass reflection over lit rooms).
- The 3 s start with lite MeshPhysical glass is still **not measured**.
- ~~Lite draw calls not re-counted after round 5.~~ Closed 2026-11-12: 40 (viewer-test from `web/`, after promote).
- Site-side, cosmetic (QA 2026-11-12, not a v023b regression: the approved live v023 hero has it too): the live
  renderer's hard tower shadow reads as a dark wedge on the plaza right of the tower, plus a thin black line along
  the right plinth edge; Cycles' soft shadow does not show it, so it changes on the photo → live crossfade.
- Still short of the ref by eye (owner approved as is): lobby paler than the ref's deep gold; windows a little
  lighter from afar; fins between bays thinner (owner's hairline decision); back faces repeat the front pattern
  (the ref shows only two faces); ref picture is 1024 px.
