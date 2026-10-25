# R3a — Compression, tower / tower-lite, viewer proof

## Project location changed
- **The project now lives at `C:\aljazira-3d`.** The `S:` network share went offline mid-round (the owner warned about this). Everything was mirrored to C first.
- All scripts were re-pointed to `C:\aljazira-3d`, and the master `.blend` now references its textures on C (0 missing).
- A dated snapshot is kept at `C:\aljazira-3d-backup\2026-10-22`.
- Older reports still say `S:\…`; read those paths as `C:\…`.

## KTX2 tool (toktx)
- **KTX-Software v4.4.2** (`toktx v4.4.2`) was installed **with the owner's explicit approval**, given in chat before your "no installs this weekend" note arrived.
- Source: the official GitHub release `KTX-Software-4.4.2-Windows-x64.exe` (6,417,024 bytes, SHA-256 `1F323B0F…2957FE`), Authenticode **valid, signed by The Khronos Group Inc**. Silent install to `C:\Program Files\KTX-Software`.
- So R3a uses **KTX2 as originally specified**. The WebP fallback was not needed.

## Pipeline (repeatable)
```powershell
# 1. Blender -> uncompressed source GLBs (factory startup; user prefs untouched)
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup C:\aljazira-3d\blend\aljazira_tower.blend -P C:\aljazira-3d\blend\scripts\export_glb.py -- C:\aljazira-3d\web\src\tower_src.glb AUTO full
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup C:\aljazira-3d\blend\aljazira_tower.blend -P C:\aljazira-3d\blend\scripts\export_glb.py -- C:\aljazira-3d\web\src\tower-lite_src.glb AUTO lite
# 2. Compression (web\compress.ps1)
powershell -ExecutionPolicy Bypass -File C:\aljazira-3d\web\compress.ps1
```
`compress.ps1` runs **`@gltf-transform/cli@4.5.1`** (pinned) through npx, per file:
1. `uastc <src> <t1> --slots "{occlusionTexture,normalTexture}" --level 2 --zstd 18`
2. `etc1s <t1> <t2> --slots "{baseColorTexture,emissiveTexture}" --quality 255`
3. `meshopt <t2> <out> --level medium` (EXT_meshopt_compression + KHR_mesh_quantization)
4. `inspect <out> --format md` → `web\inspect_<name>.md`

It takes 21–41 s per file on this laptop.

**Export changes:**
- `lite` mode: no context AO (MAT_city loses its occlusion, CTX_blocks its LM UV), and LM_arch at 1K.
- Scene extras now carry **only `enter`**. Blender 5 had been writing the Blender-MCP add-on's state (`blendermcp_*`) into the scene extras; it is now stripped, via `bl_system_properties_get()`, and verified absent in both GLBs.

## Results
| | tower.glb | tower-lite.glb | Budget |
|---|---|---|---|
| File size | **4,085,664 B (3.90 MiB)** | **2,382,680 B (2.27 MiB)** | ≤ 8 MB / ≤ 2.5 MB ✓ |
| Triangles | 10,838 | 10,838 | ≤ 150k / ≤ 50k ✓ |
| Textures | 10 × KTX2 | 9 × KTX2 (no LM_context) | ≤ 2K ✓ |
| Texture GPU size (inspect estimate) | ≈ 13.3 MB | ≈ 7.7 MB | was ≈ 67 MB as JPEG/PNG |
| Required extensions | EXT_meshopt_compression, KHR_mesh_quantization, KHR_texture_basisu | same | |
| Also used | KHR_materials_emissive_strength, KHR_materials_variants | same | |

**Textures**
- **UASTC + Zstd** (occlusion): LM_arch (2K full = 1.99 MB, 1K lite = 580 KB), LM_systems 744 KB, LM_site 479 KB, LM_context 282 KB (full only).
- **ETC1S** (baseColor/emissive): tex_cw_emit 2048×1536 = 191 KB, ground_lights 68 KB, podium 10 KB, city base/emit 6 KB each, sky 3 KB.
- Most of the full file is the 2K UASTC AO atlas. If you want tower.glb nearer 3 MB, LM_arch can go ETC1S with a small quality loss.

**Verified intact after compression** (`blend\scripts\glb_check.mjs` + inspect):
- 117 nodes and 66 meshes with their names.
- 6 cameras.
- 32 node extras (`facade_opacity`, `interior_opacity`, `floor_slabs`, HOT `label`s).
- 5 variants `highlight_<s>` mapped on 19 meshes.
- 7 BLEND materials.
- Scene extras: `enter = {facade_opacity 0.15, interior_opacity 0.25, glass_emissive_scale 0.3, transparent_depth_write false, floor_slab_opacity 1}`.

## Camera re-aim for the stills tier (≥ 4 of 5 HOT anchors in frame)
| System | Change | Anchors in frame |
|---|---|---|
| hvac | none | 4/5 |
| fire | none | 4/5 |
| power | none | 5/5 |
| smart | `CAM_smart` re-aimed to look from the front-right over the entrance into the L01 BMS room: eye (4.3, −60.1, 23.3) → pivot (−14, −10, 10), 28 mm | 5/5 |
| plumbing | `CAM_plumbing` re-aimed to look from the rear-west at the GF plant room and risers: eye (−39.6, 30.6, 34.3) → pivot (−4, 10, 16), 28 mm (the roof tank is out) | 4/5 |

The PATH_ clearance check is unchanged: fire and plumbing have one waypoint each. The R2 stills in `renders\r2` predate the plumbing re-aim; all stills get re-rendered in R3b.

## Viewer proof (`web\viewer-test\`)
- `index.html` loads three.js **0.186.1** from a local copy (`npm install --save-exact three@0.186.1` into `web\viewer-test\node_modules`), with GLTFLoader + MeshoptDecoder + KTX2Loader (local basis transcoder), HDRLoader and OrbitControls.
- It loads `?model=tower|tower-lite` and starts at **CAM_hero** with `setViewOffset(W, H, 0, +0.227·H, W, H)`. This **sign is confirmed**: the tower sits at 11–75% of the frame height, as in the Cycles hero.
- OrbitControls targets `PIVOT_hero`.
- The 5 buttons toggle enter/exit:
  - `KHR_materials_variants` swap (the three.js variants-example approach);
  - opacity, depthWrite and glass emission set from `scene.userData.enter`;
  - the system's `floor_slabs` stay opaque (cloned material);
  - a camera move through PATH_ waypoints to CAM_<s> / PIVOT_<s> while the view offset eases to 0.
- Also: FogExp2(0x3C485D, 0.0006), AgX tone mapping, environment = same HDRI at intensity 0.2.
- Served with `npx --yes http-server@14.1.1 C:\aljazira-3d -p 8080 -c-1` (`.claude\launch.json` → "viewer-test"). Open `http://localhost:8080/web/viewer-test/?model=tower`.

**Logic check** (after entering fire, read back from the live scene):

| Mesh | State after enter |
|---|---|
| FIRE_pump_room | `MAT_fire_highlight` |
| HVAC_roof_plant | still `MAT_hvac_metal` |
| FAC_cw_S | opacity 0.15, depthWrite false, emissiveIntensity 0.3 |
| CORE_slab_GF | opacity 1 |
| CORE_slab_L10, CORE_core | opacity 0.25, depthWrite false |
| Camera | at CAM_fire |

**Measurements**
- GPU used by the browser pane: **Intel UHD Graphics (iGPU, ANGLE D3D11)**, not the RTX 3050.

| | tower-lite | tower |
|---|---|---|
| Load (fetch + decode + parse, local server) | 0.84–1.76 s | 1.12 s |
| Render, hero view, 1080² (avg / p95) | 3.99 / 5.4 ms → **≈ 250 fps** | 3.21 / 6.0 ms → **≈ 310 fps** |
| Render, system entered, 1080² (avg) | 2.4–5.1 ms (hvac worst) | 2.1–5.2 ms (plumbing worst) |
| Draw calls | 96 hero / 79–87 entered | same |
| renderer.info | 78 geometries, 12 textures | 78 geometries, 13 textures |
| JS heap | ≈ 45–70 MB | similar |
| GPU memory, Windows "GPU Process Memory" counters for the app's processes | +81 MB on first load from a fresh pane (87 → 168 MB shared), including the WebGL context, shaders, the HDR + PMREM env and the model | the delta isn't reliable: the app's GPU process pools memory and doesn't release between pages (202 MB after unloading) |

**Limits of these measurements:**
- **FPS:** the browser pane was hidden during the test, which throttles `requestAnimationFrame`, so a live FPS counter reads about 4. I measured synchronous render cost instead (`syncBench`: 90–120 frames around the orbit, `gl.finish()` per frame). That is the pure render time. Real FPS will be vsync-capped at 60 with a lot of headroom on this iGPU.
- **GPU memory:** Chrome's Task Manager isn't reachable from this session. Run `viewer-test\bench.js` → `await runR3a(1080)` in a visible Chrome with its Task Manager open to get an exact per-tab figure.

## Files
- `web\tower.glb`, `web\tower-lite.glb`, `web\src\*_src.glb`, `web\inspect_tower.md`, `web\inspect_tower-lite.md`, `web\compress.ps1`
- `web\viewer-test\index.html`, `bench.js`, `gpu_mem.ps1`, `package.json`, `node_modules\three@0.186.1`
- `blend\scripts\export_glb.py` (lite mode, scene-extras cleanup), `build_views.py` (enter extras, re-aimed CAM_smart/CAM_plumbing), `render_ends.py` (reads `enter`)
- `tools\ktx-installer\KTX-Software-4.4.2-Windows-x64.exe`

## Issues
- **Blender MCP disconnected** after the move to C (port 9876 not listening). All Blender work continues through background Blender processes, which are all scripted. The interactive Blender window still has the master open; it must **not** be saved over while those jobs run.
- `S:` is offline. The C copy is complete and verified, with no missing textures.

## Questions
1. tower.glb: keep LM_arch as 2K UASTC (best AO quality, about 2 MB), or switch it to ETC1S to get to about 3 MB?
2. Exact Chrome GPU memory needs a visible Chrome session. OK to leave that to Antigravity's integration test?
