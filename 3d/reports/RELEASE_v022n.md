# RELEASE v022n — Al Jazira tower, studio maquette at night

> **RELEASED 2026-10-25.** `web/` now holds v022n; the hashes are below and were re-verified after the copy.
> v020 is backed up in `C:\aljazira-3d-backup\release_v020\`, with its stills and viewer in `release_v020_pre_v022n\` (`SHA256SUMS.txt`).
> The v022n snapshot is in `C:\aljazira-3d-backup\release_v022n\` (`SHA256SUMS.txt`, 180 files).

**Owner decisions (2026-10-25):**
- "نعتمد النسخة الليلية v022n" ("we adopt the night version v022n"), in the هلا session.
- "نعتمده كما هو" ("we accept it as is"), to the site CTO.
- "نكتفي بالوضع الحالي ونضيف التأثيرات من واجهة التطوير" ("we'll settle for the current state and add the effects from the development front-end"), in the QA session. This is the promotion go.
- The live polish items V-1..V-6 (the site CTO's review) are therefore no longer 3D rebuild items. They go to the site front-end as runtime effects; see "Handed to the site".
**Supersedes:** v020 (`reports/RELEASE_v020.md`). v021 was never promoted. Day v022 (`web/build/v022/`) stays as a reference only.
**Candidate:** `web/build/v022n/`. These are the exact bytes previewed and QA-checked. They are copied with no re-export.

## What changed against v020

- **Studio maquette** (owner pivot, 2026-10-25):
  - the tower, podium, plaza and a full roundabout of palms, lamps and gardens on a white turntable plinth (r 92 m) inside a studio room;
  - no sky, no city, no fog.
- **Night look** (owner picks):
  - glossy dark-navy glass #142A54 (coat 0.6, specular 0.8) in light and in shade;
  - a 45° moon that lights the whole model;
  - richer gold office light ("i"), in the PATCHY lit/dim pattern the owner sent ("this is the output I expect");
  - the gold pilaster wash and the lit lobby;
  - cool moonlit paving (#7A7F86).
- **Turntable:** the model turns while idle (0.6 rpm). It eases back to 0 before a system entry and resumes 8 s after.
- **Camera:** the hero is pulled back to 381 m; `max_distance` 420; `hero_shift_y` 0.1475 replaces the hard-coded 0.227.
- **Compression:** `tex_roomlight` is now UASTC. ETC1S blotched the dark room gradient.
- **Schema:** `web/build/v022n/extras-schema.md` (night delta → v022 delta → v021 base).
- **Manifest `render`:** environment = studio PMREM (room + env_only + night_glow), moon DirectionalLight, bloom full only.

## Files (sha256)

| File | Bytes | sha256 |
|---|---:|---|
| `tower.glb` | 7,081,536 | `2fd419908dbe8bacdc97c08ba6ac26b75b61d30c65b6785653ab897f8fcd8af5` |
| `tower-lite.glb` | 2,109,740 | `382f8f67f83adfcd9f9f7060401a0cfa49da2dcdb0f677273d39dbcebafbe62e` |
| `manifest.json` | 12,003 | `2a5b055d70e20c7928c67b37675da2f9287cbf9abaf0afd9a09b995591abc749` |
| `stills/stills_manifest.json` | — | `abceb7a3a2f25f3b9766eefe9ba4b6b60ff4fe5d35a1e45f15a232c774b0fe88` (37 files listed; derived_from = the three rows above) |

Do not re-run guard into `web/build/v022n` or `web/`: it rewrites `generated`, so the manifest hash would no longer match `stills_manifest.json.derived_from`.

## Final numbers

| | full | lite |
|---|---:|---:|
| Size | 7,081,536 B (budget 8 MB) | 2,109,740 B (budget 2.5 MB) |
| Triangles | 61,496 | 52,120 |
| GPU textures | ~12.86 MB, 16 × KTX2 | ~6.61 MB, 16 × KTX2 |
| Draw calls, outside (6 orbit frames) | 62 scene / 76 with bloom | 40 (no bloom) |
| Draw calls, entered hvac / fire / plumbing / power / smart | 92 / 89 / 81 / 66 / 68 (+14 bloom) | 50 / 48 / 46 / 45 / 45 |

Triangles per system (full / lite):
- hvac 9,932 / 7,152
- fire 9,352 / 7,376
- plumbing 6,556 / 4,660
- power 6,328 / 4,804
- smart 5,032 / 3,832

MEP envelope check: 4 failures, the same as v020.

## Eye evidence (`renders/r4-corner/v022n/`)

- `hero_cycles_2048_v022n_b.png` and `day_vs_night_final_v022.png`.
- `live_orbit_sheet_full_v022n.png`, `live_orbit_sheet_lite_v022n.png`: hero, az090, az180, az270, lowest, highest. Nothing floating, cut or hanging.
- `crop_sheet_100pct_v022n.png`, `facade_approved_vs_now_v022n.png`, `paving_shadow_before_after_v022n.png`.
- Turntable (lite fix): `renders/r4/live/v022n_lite_tt000/tt060/tt135.png`, `v022n_lite_enter_hvac_from135.png`.

## Fixed during review

1. **Lite systems not on the turntable.** Owner: "when the tower turns, the systems stay still". `export_glb.py` re-ran `build_mep` for lite, and `lib.root()` unparented the `SYS_` roots. They are now re-parented to `TURNTABLE`, world kept. Full was never affected.
   - **Known:** the day `web/build/v022/tower-lite.glb` has the same bug. It's reference only, so it's not rebuilt.
2. **Room blotches** in live: ETC1S → UASTC for `tex_roomlight*`.
3. **Brown tower shadow** on the plaza at night: the paving is a cool grey at night only.

## Handed to the site (runtime effects, owner 2026-10-25)

From the site CTO's v022n review (handoff/reviews/A-1.md Milestone 5). The live tone is set in code; the GLB bytes stay as released.
- **V-1:** live is about 30% brighter than the Cycles stills (hero luma 92 vs 70; background (60,72,89)/(82,96,115) vs (44,54,66)/(53,65,81)). Match it with `toneMappingExposure` and the env/emissive intensities so the still→live crossfade doesn't jump. Alternatively, match the poster to live.
- **V-2:** façade and crown sharpness at DPR 2: texture anisotropy (8–16) on `tex_cw_emit` and the interior map.
- **V-3:** palm aliasing: `alphaToCoverage` on the alpha-tested frond materials (MSAA is already on).
- **V-4:** a hard pale ellipse at the plinth base. A soft contact shadow and an invisible floor-disc edge would need a re-bake to fix fully; partly possible in code (a fade on the floor-disc alpha).
- **V-5 / V-6:** the dark patch behind the tower (az90/180) and the hvac deck smudge are bake-level items. They're logged for a future 3D round if the owner asks.
- **Known (cosmetic):** `manifest.json` `tools.toktx` holds a captured shell error string, not the version `4.4.2`. Left as is, because changing it would break `stills_manifest.derived_from`.

## Promotion steps (done 2026-10-25)

1. Verify `C:\aljazira-3d-backup\release_v020\` against the v020 hashes above (verified 2026-10-25: identical). That snapshot has no `web/stills/`, so back up `web/stills/` and `web/viewer-test/` to `C:\aljazira-3d-backup\release_v020_pre_v022n\web\` and hash them.
2. Copy `web/build/v022n/{tower.glb, tower-lite.glb, manifest.json}` → `web/`, and `web/build/v022n/stills/*` → `web/stills/` (replacing the v020 set).
   - `web/viewer-test/` already implements the v022 contract (studio env, env_only hidden, moon, night_glow, turntable, bloom rule).
3. Re-run guard as a check, writing its manifest to a scratch folder, so the promoted `manifest.json` keeps the exact bytes `stills_manifest.json.derived_from` refers to. Re-hash `web/` and compare with this table.
4. Snapshot `C:\aljazira-3d-backup\release_v022n\` (web files + stills + `blend/aljazira_tower_r5c_v022n.blend` + `blend/scripts/` + `textures_v022n/` + evidence).
5. Send the final hashes to QA/CTO. Update this file: drop DRAFT, add the date.

## Carried forward

- Corner massing.
- Level crown at 88.75 m.
- Pilasters to 82.0 m with the 1 m return.
- Natural-colour systems.
- Calibrated entered-deck tone.
- HVAC fans spin while entered.
- **Still pending, text only:** the `fan_spin` note says `+=` while the viewer applies `−=`.
- **Site:** P3-T5 (live 3D) is not wired yet; the home page shows a static card. The CTO wires it against the v022n schema.
