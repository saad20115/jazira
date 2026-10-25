# RELEASE v021 (DRAFT, not applied): Al Jazira tower, owner notes N-1 to N-6

> **DRAFT.** Not promoted. `web/` still holds v020, and its hashes are unchanged.
> QA passed v021 as a candidate on 2026-10-24. It is promoted only after the owner approves in chat.
> On approval:
> 1. Snapshot v020 is already in `C:\aljazira-3d-backup\release_v020\`.
> 2. Copy `web/build/v021/{tower.glb, tower-lite.glb, manifest.json}` to `web/` byte for byte, with no re-export.
> 3. Copy `web/build/v021/stills/` to `web/stills/`.
> 4. Snapshot to `C:\aljazira-3d-backup\release_v021\` and re-hash.
> 5. Fill in the approval line below.

**Supersedes v020** (`reports/RELEASE_v020.md`).
Owner approval: _pending_.
The release will be exactly the bytes in `web/build/v021/`.

## Files (sha256)

| File | Bytes | sha256 |
|---|---:|---|
| `tower.glb` | 7,097,856 | `341f1e3b494bd9572d85cf62ce0107723348cc44537cdb600c90c6eaefb56b51` |
| `tower-lite.glb` | 2,099,116 | `54fd2c1fae54d738facc9634bf8bc0411359999f0c95d0f64804feec2220893c` |
| `manifest.json` | | `6013a7b1ec11ac1eca8c0cc7822282059d42aabd6b4dd44bb365504b46032508` |
| `stills/stills_manifest.json` | | `9ea52865f5b2d758a96902cf6507d9162ba665d794d361d0c05a3e4e2fd3ec56` |

`manifest.json` and `stills_manifest.json` were regenerated after the QA pass so that the `render` block labels the AgX pivot as a calibrated value. The GLB bytes did not change. The earlier hashes were 4decb478… and 795741bd….

## Final numbers

| | full | lite |
|---|---:|---:|
| Size | 7,097,856 B (budget 8 MB) | 2,099,116 B (budget 2.5 MB) |
| Triangles | 53,312 | 43,936 |
| GPU textures | ~12.34 MB, 14 × KTX2 | ~6.09 MB, 14 × KTX2 |
| Draw calls, hero (scene) | 58 | 36–42 |
| Draw calls, hvac / fire / plumbing / power / smart | 88 / 85 / 77 / 63 / 65 | 46 / 44 / 42 / 42 / 42 |
| Bloom post passes | +14 | +14 (lite max 60) |

Geometry is unchanged from v020:
- pilasters at (377–379) and (674–676) at 1024;
- the crown is the same as v020;
- the level crown sits at 88.75 m with the 2.5 m set-back;
- mesh names and all extras are unchanged.

## What changed (owner notes)

- **N-1 office bands.** Soft, continuous warm floor bands with cosine-eased per-bay variation and a few softly dimmed stretches. The lowest lit share on any floor is 89%, with no black bays.
- **N-2 notch.** Darker recessed glass on the stepped boxes (`MAT_glass_terrace`, emission 2.8), lit interiors, and one thin warm slab-edge line per step.
- **N-3 lobby.** Golden 2-storey glow (`MAT_podium_glass`, emission 3.5, `LOBBY` colour). It is the brightest region:
  - Cycles: 154.7 / 159.4 against 142.8 for the brightest façade patch;
  - live: 163.7 / 168.4 against 149.1.
- **N-4 trails.** Exported at ×0.35. The road lamp-pool albedo now comes from the vertex colour, so the wide pale road band in live is gone.
- **N-5 exposure.** Bottom-third luma:

  | Frame | Bottom third |
  |---|---:|
  | Reference | 80 |
  | Cycles v021 | 75 |
  | Live full v021 | 73 |
  | Live lite v021 | 74 |
  | v020 Cycles / live | 34 / 57 |

  This comes from a blue-grey below-horizon sky, a lighter ground and asphalt, brighter lamps, and `MAT_ground` exported at ×0.75.
- **N-6 premium façade.**
  - Deep-blue reflective glass, mirroring the PMREM sky in live.
  - Rooms behind the glass: baked ceiling panels and depth. The full model adds live interior mapping.
  - Champagne mullions.
  - Four pilaster and lobby uplights.
  - Paving roughness 0.35.
  - Bloom on light sources only.
  - The live tone mapping is stated in `manifest.json` → `render`.

## New in the manifest and the viewer

- `manifest.json` → `render`: AgX plus the calibrated Medium High Contrast look (pivot 0.606), PMREM sky, bloom (threshold 8, strength 0.22, radius 0.25, 4× MSAA HalfFloat), and interior mapping (full only).
- `web/build/v021/extras-schema.md`: every extras key with its type, range and meaning, plus which render steps are optional.
- `web/viewer-test/index.html`:
  - EffectComposer with bloom, `?bloom=0`;
  - interior mapping, `?interior=0`;
  - AgX look, `?look=0` and `?piv=`;
  - scene and post draw-call counts;
  - fan spin and auto-rotate stop under reduced motion; fan spin also stops when the tab is hidden or the canvas is off-screen.
- **Low-end fallback:** lite without bloom. Thirds are 97/116/104/70 and draw calls are at most 46.

## Known, unchanged

- The `fan_spin.note` text says `+=` while the viewer applies `−=`. This is text only; extras were frozen for v021.
- The MEP envelope check reports the same 4 power / smart items as v020.

## Evidence

- `renders/r4-corner/v021/` holds:
  - the three-panel, the crown, podium and notch crops, and the façade close-up;
  - the N-2 notch comparison and the N-4 ring crop;
  - the fans strip, the lower-left crop and the entered overview;
  - `n1_lit_share.txt`, `n3_luminance.txt`, `n5_thirds.txt`;
  - `guard_output_v021.txt`, `measure_hero_v021.txt`, `tris_by_system_v021.txt`, `sha256_v021.txt`.
- Private artifact "Al Jazira Corner Proof", v021 section.

## Next: v022 (realism)

Owner, 2026-10-24: the scene looks cartoonish next to the reference. Planned for v022, plan only so far:
- city context;
- real trees and textures (Poly Haven, CC0, approved);
- a detailed plaza.

v022 reverses the "No city" decision carried forward from v020, so the owner must confirm that explicitly.
