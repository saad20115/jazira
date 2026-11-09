# R3b — Site life, façade detail, re-aimed views, final GLBs

All paths are under `C:\aljazira-3d`. Increments: `blend\aljazira_tower_r3_v001` (R3b rebuild), `_r3_v002` (thinner trails), `_r3_v003` (smart cam re-aim) = current master.

## What was added
**Light trails** (static, emissive; long-exposure look of the reference)
- `SITE_trails_white`: 5 lanes on the ring road (r 45.0–49.6 m, about 80% coverage). `SITE_trails_red`: 2 outer lanes (r 52.4 / 54.2 m, about 45% coverage). Plus streaks on the avenue and the tangent roads.
- Each streak is a "plus"-profile ribbon, 0.12–0.22 m wide and 0.55–0.85 m above the road, so it reads from any camera angle.
- Materials: `MAT_trail_white` #FFE9C8, emissive strength 14. `MAT_trail_red` #FF2A1A, strength 9.
- The trails are excluded from the AO bake.

**Vegetation and street lamps** (instanced)
- 3 variant meshes with vertex colours and one material (`MAT_vegetation`):
  - `VEG_palmA`: 10.5 m, 9 fronds, 23 instances.
  - `VEG_palmB`: 7.5 m, leaning, 7 fronds, 12 instances.
  - `VEG_treeC`: broadleaf, 18 instances.
- Lamps: `VEG_lamp_pole` and `VEG_lamp_head` (head emissive 15), 25 of each.
- Instances are linked duplicates under `SITE_inst_<variant>` empties. They export as **EXT_mesh_gpu_instancing** and load in three.js as `InstancedMesh` (verified in the viewer: 25 / 25 / 23 / 12 / 18).
- 25 warm point lights (`LGT_lamp_##`, 500 W) exist for the **offline Cycles render only**. glTF export uses `export_lights=False`, so the web relies on the emissive heads.

**Façade detail through textures** (no added geometry)
- New `tex_cw_normal` (2048×1536, 64×24 cells, Non-Color) on `MAT_glass_cw`: mullion bevels and spandrel lines.
- `tex_cw_emit` reworked:
  - Each floor has its own lit level and colour temperature.
  - Lit cells show ceiling light strips, blinds and desk lamps.
  - The dark glass has a navy self-glow gradient, so the tower never goes flat black.

## Cameras / stills (≥ 4 of 5 HOT anchors in frame)
| System | Anchors in frame | Note |
|---|---|---|
| hvac | 4/5 | |
| fire | 4/5 | |
| plumbing | 4/5 | |
| power | 5/5 | |
| smart | 4/5 | **Re-aimed.** The R3a view was dominated by the opaque gold podium roof. The new view comes from the SW at low level: pivot (-20, 3.3, 8), eye (-53, -15.8, 20.3), 28 mm. `cctv_entrance` (on the forecourt, 41 m south) is the one anchor left outside the frame. |

- Search tool: `blend\scripts\aim_search.py <system> [min]`. An anchor counts only if it is inside the frame (6% margin) **and** its sight line isn't blocked by opaque geometry. The façade, core and the system itself count as see-through.

## Renders (`renders\r3\`)
- `hero_2048.png` (Cycles, OptiX): **50.6 s** at 2048², VRAM **2141 MiB** peak vs 228 MiB idle (nvidia-smi, RTX 3050 Laptop). `hero_side_by_side.png` puts it next to `ref\tower-render.png`.
- `realtime_hero.png`: EEVEE render of the GLB, for comparison.
- End stills at 2048² with 256 spp, in seconds: hvac 68.0, fire 107.5, plumbing 147.0, power 90.7, smart 114.0.
- `hotspots_<s>.json`: {id, label, x, y, in_frame, world}, normalised with the origin at the top left.

## GLBs (`web\`)
| | tower.glb | tower-lite.glb | Budget |
|---|---|---|---|
| File size | **4,909,244 B (4.68 MiB)** | **1,176,924 B (1.12 MiB)** | ≤ 8 MB / ≤ 2.5 MB ✓ |
| Triangles stored (instances counted once) | 11,604 | 11,604 | ≤ 150k / ≤ 50k ✓ |
| Triangles rendered (all instances) | 17,706 | 17,706 | |
| Nodes / meshes / materials | 120 / 69 / 30 | same | |
| Textures | 11 × KTX2 | 10 × KTX2 | |
| Extensions | EXT_meshopt_compression, KHR_mesh_quantization, KHR_texture_basisu, EXT_mesh_gpu_instancing, KHR_materials_variants, KHR_materials_emissive_strength | same | |

- **Verified intact:**
  - 6 cameras.
  - 5 variants `highlight_<s>` on 19 meshes.
  - 7 BLEND materials.
  - Node extras: `facade_opacity`, `interior_opacity`, `floor_slabs`, HOT `label`s.
  - Scene extras `enter = {facade_opacity 0.15, interior_opacity 0.25, glass_emissive_scale 0.3, transparent_depth_write false, floor_slab_opacity 1}`.
- **tower-lite change:** its occlusion maps (LM_arch 1K, LM_site, LM_systems) are now ETC1S instead of UASTC. After the R3b AO rebake, UASTC put lite at 2.73 MB, over budget. The full tower keeps UASTC AO.
- **Pipeline fix:** in `compress.ps1`, the lite slot pattern `'{normalTexture}'` matched nothing, because a brace group with no comma is not expanded. The lite normal map therefore shipped as PNG, about 16.8 MB on the GPU. It is now `'normalTexture'` → UASTC, 4.2 MB on the GPU. `compress.ps1 -Names tower-lite` re-runs one file.

## Viewer measurements (`web\viewer-test`, three.js 0.186.1)
- **Conditions:** Intel UHD iGPU (ANGLE D3D11), browser pane hidden, Blender GUI open but idle, AnyDesk running. `syncBench` uses `gl.finish()` per frame; 120 frames for the hero, 90 per system.
- **Noise:** run-to-run variance is high on this machine, so I report ranges over 2–3 runs, not a single value.

| | tower | tower-lite (after the fix) | R3a for reference (tower / lite) |
|---|---|---|---|
| Load (fetch + decode + parse, local) | 0.80–2.5 s | 1.06–1.70 s | 1.12 s / 0.84–1.76 s |
| Hero 1080², avg ms | 4.3–6.4 | 3.7–7.9 | 3.2 / 4.0 |
| Entered system 1080², avg ms | 4.8–12.9 (plumbing worst) | 2.5–9.1 | 2.1–5.2 |
| Draw calls, hero / entered | 99 / 82–88 | same | 96 / 79–87 |
| renderer.info | 81 geometries, 13 textures | same | 78 / 12–13 |

- Even the worst frames stay well under 16.7 ms, so 60 fps vsync is safe on the iGPU.
- The cost increase over R3a comes from the trails, the instanced site detail and the normal map. Draw calls went up by only 3, thanks to instancing.

## Files changed this round
- `blend\scripts\build_site_detail.py` (new), `build_site.py`, `build_textures.py` (tex_cw_normal, richer tex_cw_emit), `build_materials.py`, `bake_ao.py` (skip trails/instances/roads), `build_views.py` (smart cam), `lib.py` (`recentre`), `aim_search.py`, `count_tris.py`, `rebuild_r3b.py`, `apply_views.py`
- `web\compress.ps1` (lite slots, `-Names`), `web\tower.glb`, `web\tower-lite.glb`, `web\inspect_*.md`
- `renders\r3\*`

## Notes
- **Blender MCP reconnected.** The owner reopened Blender, and the master is now open in the GUI. All R3b jobs ran as background processes and are finished.

## Questions
1. **Normal map VRAM:** `tex_cw_normal` is a perfectly repeating cell pattern. It weighs 2 KB in the file but 4.2 MB on the GPU at 2048×1536. A 32×64 px tile with REPEAT wrapping (plus `KHR_texture_transform`, which GLTFLoader supports) would cut that to under 10 KB. That only matters on low-end mobile. Do it in R4?
2. **Street lamps on the web:** they are emissive heads only, with no real lights. OK, or do you want a cheap fake light pool (an additive decal under each lamp)?
3. Still open from R3a: tower.glb LM_arch at 2K UASTC (about 2.6 MB of the 4.7 MB) versus ETC1S, and whether exact Chrome GPU memory can be left to the integration test.
