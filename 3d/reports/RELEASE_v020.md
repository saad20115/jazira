# RELEASE v020 — Al Jazira tower, spinning HVAC fans

**Supersedes v019c** (`reports/RELEASE_v019c.md`; archived at `C:\aljazira-3d-backup\release_v019c\`, hashes re-verified unchanged on 2026-10-23).
Owner approval (relayed by CTO/QA, 2026-10-23): "I approve v020 as a new version for the site. Move it to web and inform the CTO and هلا."
The release is exactly the bytes the owner previewed in `web/build/v020/`. They were copied to `web/` with no re-export.
Snapshot: `C:\aljazira-3d-backup\release_v020\` (taken 2026-10-23 20:37:08 +0300; the copies hash identical to `web/`).

## Frozen files (sha256)

| File | Bytes | sha256 |
|---|---:|---|
| `web/tower.glb` | 7,180,984 | `ef31638cf5364f5ee24294651f5c15ef1ef02897655a5e910e2dcba73f93b7aa` |
| `web/tower-lite.glb` | 2,189,388 | `8f48a42f729dbc63af4b6cd6af04ddbd9453adf2619ac7218cea6c5216e8f61e` |
| `web/manifest.json` | 7,159 | `76c8193184cd7704aed3e2c841d578ed0cfa0a303fa1237679a87ce7a4ff5510` |

These three are not overwritten from here on. Any further experiment goes to `web/build/<version>/` (`compress.ps1 -OutDir`), and only with the owner's go-ahead.

Snapshot contents:
- the three files above;
- `web/viewer-test/index.html`, which implements `fan_spin`;
- `web/compress.ps1` and `web/guard.mjs`, which have the `-OutDir` / out-dir build support;
- `blend/aljazira_tower_r5c_v020.blend` (master copy) + `blend/scripts/`;
- `textures/`;
- evidence: `renders/r4-corner/v020/`.

## Final numbers

| | full (`tower.glb`) | lite (`tower-lite.glb`) |
|---|---:|---:|
| Size | 7,180,984 B (budget 7.5 MB) | 2,189,388 B (budget 2.4 MB) |
| Triangles | 53,312 | 43,936 (budget 45k) |
| GPU textures | ~12.34 MB, 14 × KTX2 | ~6.09 MB, 14 × KTX2 |
| Draw calls — hero | 58 | 36 |
| Draw calls — hvac / fire / plumbing / power / smart (entered) | 88 / 85 / 77 / 63 / 65 | 46 / 44 / 42 / 42 / 42 |

**Triangles per system (full / lite):**
- hvac 9,932 / 7,152
- fire 9,352 / 7,376
- plumbing 6,556 / 4,660
- power 6,328 / 4,804
- smart 5,032 / 3,832

**Against v019c:**
- Triangles: full −476 (the modelled blades are gone); lite +196 (lite had no blades and now has rotor discs).
- Draw calls: +1 in the hero and in hvac (HVAC_fans).
- Textures: +1 (`tex_hvac_fans`).

**Guard:** `GUARD OK` (`renders/r4-corner/v020/guard_output_v020.txt`).

## New extras: `SYS_hvac.fan_spin`

```json
{"material": "MAT_hvac_fans", "rpm": 45, "play": "entered", "ramp_s": 1,
 "note": "texture.center = (0.5, 0.5); texture.rotation += rpm / 60 * 2 pi * dt * level"}
```

- `HVAC_fans` is one mesh with one material: every chiller and cooling-tower rotor as a flat 16-gon disc under its guard, with UVs on the full centred square.
- `MAT_hvac_fans` uses `tex_hvac_fans`: 6 blades in #3A3F45 with a trailing smear band, alphaMode MASK at cutoff 0.5, KTX2 ETC1S, 512² in full and 256² in lite.
- **Viewer behaviour:**
  - On load it sets `map.center = (0.5, 0.5)`.
  - Each frame: `map.rotation -= rpm / 60 · 2π · dt · level`, which is clockwise seen from above.
  - `level` ramps 0 → 1 over `ramp_s` when hvac is entered, and back on exit.
  - The fans fade with `enter.other_systems_opacity` when another system is entered.
  - Test hook: `window.fanSpin`.
- **Known text-only item:** the `note` string says `+=`, but the viewer applies `−=`. It has no effect on behaviour. Per the CTO, the fix waits for the next owner-approved version.

All v019c extras are unchanged, including `enter.site_emissive_scale` 0.08 and `enter.site_occlusion_scale` 0.7.

## Owner decisions carried forward

- Corner massing.
- Level crown at 88.75 m.
- Pilasters to 82.0 m with the 1 m return.
- Natural-colour systems.
- No city.
- Calibrated entered-deck tone from v019c.
- **New:** HVAC fans spin while HVAC is entered.
