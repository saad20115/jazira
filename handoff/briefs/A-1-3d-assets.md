# A-1 — 3D & cinematic asset brief (Al Jazira tower)

For: the 3D artist / studio (or whoever the owner assigns). Owner of this brief: CTO.
Reference look: `design/assets/images/tower-render.png` and the section
`design/screenshots/sections/01-home/04-interactive-systems.png` (Figma 111:1608).

## 1. What we need and why
The home page shows a night-time glass tower. When a visitor picks an MEP system in the side
list, the camera moves cinematically to where that system lives in the building, the façade
turns semi-transparent, the system's equipment glows gold, and labels appear. The website plays
these as short videos (pre-rendered) and also offers a real-time 3D viewer of the same model.

## 2. The model (Blender, one master `.blend`)
- **Tower** matching the render: ~20-storey glass curtain wall with dark-blue glazing and warm
  interior lights, champagne-gold vertical fins and roof crown band, setback at the upper floors,
  2-storey gold-lit podium with entrance canopies, circular plaza with palms, lamps, roads with
  light trails. City context may be a matte/backplate in the same dusk palette.
- **MEP systems** as clean, recognisable assemblies (not engineering-accurate), each in its own
  collection named exactly:
  - `SYS_hvac` — rooftop chillers/cooling towers, AHUs, vertical duct risers, FCUs on 2–3 floors
  - `SYS_fire` — fire pump room (ground/basement), sprinkler risers + floor mains, alarm panel
  - `SYS_plumbing` — water tanks, booster pumps, water risers, drainage stacks
  - `SYS_power` — MV room, transformers, generator, cable-tray risers, floor lighting
  - `SYS_smart` — BMS/data room, ELV risers, CCTV cameras, access control at entrances
- Façade in a separate collection `ARCH_facade` so it can be ghosted.
- Brand colours: navy `#011025` / `#002854`, gold `#DFA82A` (glow `#EFCB76`).

## 3. Renders (Cycles)
| Item | Spec |
|---|---|
| `hero` still | Same framing as `tower-render.png`, 2048×2048, plus 1440 and 828 crops |
| 5 shots `hvac`, `fire`, `plumbing`, `power`, `smart` | Each starts **exactly** on the hero frame, camera moves to the system (4–6 s, ease-in-out), façade fades to ~15 % opacity, system glows gold with subtle flow animation (air/water/power), ends on a stable hold frame |
| `forward` and `reverse` clips per shot | 24 fps; reverse = the same move backwards (render or reverse in edit) |
| `endFrame` per shot | Still of the last frame, 2048×2048 |
| Formats | ProRes 422 HQ or PNG sequence masters; the dev team encodes to WebM/MP4 |
| Hotspots | JSON per shot: 3–6 points `{ id, x, y }` = 2D position (0–1) of key equipment in the end frame (e.g. "Chillers", "AHU", "Fire pumps"), exported from Blender camera projection |

Frame is **square-ish 1:1** (the site crops to the card; keep important action in the centre
80 %).

## 4. Real-time web model (for P3-T11)
- `tower.glb` ≤ 8 MB with textures: decimated geometry, **baked lightmaps** (no real-time
  shadows), KTX2 textures, meshopt or Draco compression; collections kept as named nodes
  (`ARCH_facade`, `SYS_*`); camera nodes `CAM_hero`, `CAM_hvac` … matching the shots.

## 5. Delivery & acceptance
- Delivered in a shared folder with the `.blend` master (we own all rights), renders, JSON, GLB.
- Review rounds: (1) clay/blockout + camera paths, (2) look-dev on hero still vs Figma render,
  (3) final shots. Each round approved by the owner; the CTO checks technical specs.
- The hero still must be visually accepted as a match for the Figma render by the client.
