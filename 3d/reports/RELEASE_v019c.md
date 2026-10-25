# RELEASE v019c — Al Jazira tower, final web model

Owner sign-off: v019c approved as the final version for the website (relayed by CTO/QA, 2026-10-23).
Snapshot: `C:\aljazira-3d-backup\release_v019c\` (taken 2026-10-23 20:05:59 +0300; hashes of the copies verified identical).

## Frozen files (sha256)

| File | Bytes | sha256 |
|---|---:|---|
| `web/tower.glb` | 7,166,540 | `4d581efaf77d28ef2ea13d5c9aef49dbcfb3519b87e2e150e2089751c8cadf4d` |
| `web/tower-lite.glb` | 2,187,356 | `7af5fa75b4247bd6fd8f18ad7f0935cf2e1871c3611ffc73d900eacb7173543e` |
| `web/manifest.json` | 6,764 | `3176e2eeea218e18495f34432fad82f3b9a7f44ea178174641a7f821d865473e` |

These three are not overwritten from here on. Any further experiment goes to `web/build/` or a new version number, and only with the owner's go-ahead.

Snapshot contents: the three files above + `web/viewer-test/index.html`; `blend/aljazira_tower_r5c_v019c.blend` (master copy) + `blend/scripts/`; `textures/`; evidence `renders/r4-corner/v019b/` and `v019c/`.

## Final numbers

| | full (`tower.glb`) | lite (`tower-lite.glb`) |
|---|---:|---:|
| Size | 7,166,540 B (budget 7.5 MB) | 2,187,356 B (budget 2.4 MB) |
| Triangles | 53,788 | 43,740 (budget 45k) |
| GPU textures | ~12.16 MB, 13 × KTX2 | ~6.05 MB, 13 × KTX2 |
| Draw calls — hero | 57 | 35 |
| Draw calls — hvac / fire / plumbing / power / smart (entered) | 87 / 85 / 77 / 63 / 65 | 45 / 44 / 42 / 42 / 42 |

Triangles per system (full / lite): hvac 10,408 / 6,956 · fire 9,352 / 7,376 · plumbing 6,556 / 4,660 · power 6,328 / 4,804 · smart 5,032 / 3,832.
Guard: `GUARD OK` (`renders/r4-corner/v019c/guard_output_v019c.txt`).

## glTF scene extras

- `enter`:
  - `facade_opacity` 0.08
  - `interior_opacity` 0.08
  - `glass_emissive_scale` 0.15
  - `transparent_depth_write` false
  - `floor_slab_opacity` 1.0
  - `other_systems_opacity` 0.12
  - `site_emissive_scale` 0.08 *(new in v019c)*
  - `site_occlusion_scale` 0.7 *(new in v019c)*: while a system is entered, MAT_stone / bronze / paving / planting `emissiveIntensity` and `aoMapIntensity` ramp to these values; both are restored on exit.
- `sky`: background + PMREM environment stops (= Cycles world).
- `camera_limits`: orbit / pan limits, mirrored into `manifest.json` by `guard.mjs`.
- `idle`: idle-motion settings.
- Per system (`SYS_<s>` node extras): entry motion, section plane, `floor_slabs`.
- Material variants: `highlight_<s>` (KHR_materials_variants) for each of the 5 systems.

## Owner decisions in this release

- **Corner massing**, with CAM_hero fixed.
- **Level crown** at 88.75 m with a continuous gold line; the crown storey is set back 2.5 m from the S face.
- **Pilasters / gold side frames stop at 82.0 m** (L22 floor + 1 m). The front ones return 90° into a 1 m gold band over the L22 terrace up to the crown wall. Every inner junction is a clean 90° stop, with nothing passing through.
- **Natural-colour MEP systems** (hvac, fire, plumbing, power, smart) with real equipment detail. Gold is an accent only. Glow is hidden at rest and shows only for the entered system.
- **No city** in the scene.

## v019c changes from v019b (slab-tone fix, QA-approved)

- `build_arch.py`: POD_plinth top 0.0 → −0.02 m. The same change was patched into the master; this removes the GF-slab z-fight.
- `bake_site_light.py`: the `tex_slablight` bake render-hides CORE_* / FAC_* / POD_* (the systems are kept), so the entered decks read navy as in Cycles.
- `export_glb.py`: `LM_STRENGTH` for MAT_concrete_floor = 1.0.
- `entry_views.py` + `viewer-test/index.html`: the two new `enter` keys above.
- Hero regression vs v019b: Cycles PSNR 63.6 dB (noise only). Crown and pilaster measurements are identical.
