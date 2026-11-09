# Al Jazira tower: 3D model

The 3D tower for the Al Jazira website. The current release is **v022n**: a night studio maquette on a turntable, released 2026-10-25.

| Path | What |
|---|---|
| `web/tower.glb`, `web/tower-lite.glb`, `web/manifest.json` | The release the site loads. Never overwrite them; build candidates go to `web/build/<ver>/`. |
| `web/stills/` | Night stills (hero + 5 system ends) and their hotspots. |
| `web/viewer-test/` | Reference three.js viewer. Run `npm ci` in it, serve `web/` over http, then open `viewer-test/index.html?model=tower`. |
| `web/build/v022n/extras-schema.md` | Every GLB extras key and the live-render contract. |
| `blend/` | Blender masters and `scripts/`, the full build pipeline (Blender 5.2). |
| `textures_v022n/` | Baked and generated textures for v022n. |
| `assets/polyhaven/` | CC0 assets; see `LICENCES.md`. |
| `ref/`, `reports/` | Design references and the release reports (`reports/RELEASE_v022n.md`). |

Git LFS stores the binaries (`.glb`, `.blend`, images). Renders, evidence and older candidates are not in this repo.
