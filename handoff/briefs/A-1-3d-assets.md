# A-1 — 3D asset brief (Al Jazira tower)

> **Revised 2026-10-22:** the client wants the live model **inside the page card** (rotate, zoom,
> enter/exit systems) and **less city detail**. The real-time GLB is now the main deliverable;
> pre-rendered shots are reduced to end-frame stills per system (fallback). See §6.

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

## 6. Revision 2026-10-22 — priorities now
1. **Real-time first.** `tower-lite.glb` ≤ 2.5 MB (first view) and `tower.glb` ≤ 8 MB (full), both
   with baked lighting matching the hero still; ≤ 150k triangles full / ≤ 50k lite; textures
   ≤ 2K, KTX2-ready; materials glTF-PBR only (no Blender-only nodes).
2. **City reduced:** no detailed buildings. Use a soft dusk backdrop — low-poly silhouettes with fog
   or a blurred plate — plus the plaza ring, a few palms and lamps. The tower and systems carry
   the scene.
3. **Hero still** from `CAM_hero` still matches the Figma framing; it is the first paint, and the
   live model starts at the same camera, so the still and the GLB must line up.
4. **Systems:** each `SYS_*` collection exported as its own node, plus an empty `PIVOT_<system>`
   (orbit centre when inside), `CAM_<system>` (entry viewpoint) and optional `PATH_<system>`
   waypoint, and `HOT_<system>_<n>` empties for labels.
5. **Façade ghosting:** `ARCH_facade` materials must work with opacity 1 → 0.15 in real time
   (alpha blend, no refraction).
6. **Fallback stills:** one end-frame still per system from its `CAM_<system>` (2048 and 1080),
   plus a JSON of each `HOT_<system>_<n>` projected to 2D (0–1) in that still, for labels on weak
   devices.
   The 5 cinematic video shots are **dropped** unless the CTO asks for them later.

## 7. Revision 2026-10-22 (evening, client) — city removed, look first
Supersedes §6 item 2. Priority is now **look and motion** over further compression work.
1. **No city:** delete all context blocks, city lights and far roads. Keep only the plot (plaza
   ring, forecourt, palms, lamps at the base). Background = clean dusk sky gradient + ground fade,
   identical in the Cycles still and the GLB/viewer.
2. **Camera limits in scene `extras`:** `minDistance`, `maxDistance` (tower ≥ ~55 % of frame
   height at max), polar min/max (never under the ground), pan clamp around the tower. The site
   reads them; it does not hard-code its own.
3. **Match `tower-render.png`:** dense thin mullions (not a checkerboard), reflective sky-gradient
   glass, the dark east face, luminous gold pilasters, stepped setback and open crown frame, glazed
   2-storey lobby with bronze canopies, the west-wing volume, landscaped forecourt. The freed
   budget goes to the tower (still ≤ 150k tris full / ≤ 50k lite, sizes as §6).
4. **Entry motion:** eased moves with no clipping, gradual façade ghost, section cuts where needed,
   exact reverse back to `CAM_hero`.
5. **Hero still without city — confirmed by the owner (2026-10-22):** same dusk sky as the live
   model; the Figma city backdrop is an approved deviation.

## 8. Revision 2026-10-23 (owner) — the tower faces the camera with a corner, not a façade
Supersedes §7 item 3 wherever they disagree (e.g. "the dark east face" in `CAM_hero`).
The owner compared the current model with `design/assets/images/tower-render.png`. The model does not match.

**What the reference shows:**
- The camera looks at the tower **at a corner**, not straight at one façade.
- The **two faces that meet at the corner nearest the camera are both glass curtain walls**, with
  dense thin mullions and reflective glass on both.
- The **stepped setback** (the cascading glass recess) appears on **both** sides of that corner,
  mirrored.

**Required:**
1. **Orientation and plan.** Rework the plan and massing so the reference reads the same way from
   `CAM_hero`:
   - the camera-facing corner sits near the vertical centre line of the frame;
   - both adjacent faces are visible at a similar angle, about 45° each;
   - do not just orbit the camera around the old model.
2. **Glazing.** Both camera-facing faces are glass, with the same mullion rhythm, reflections and
   lit floors. There is no dark or blank face in the hero view.
3. **Stepped setback.** Build it on both faces at the camera corner, mirrored, with the same step
   count and depth as the reference. The open crown frame and the gold pilasters follow the
   reference.
4. **Base.** The lobby, canopies and forecourt line up with the new orientation (the lobby faces
   the camera as in the reference).
5. **Proof** (before any further motion or compression work):
   - a side-by-side of `tower-render.png` and the new Cycles still from `CAM_hero`, with an
     overlay at 50 % opacity;
   - the same frame from the GLB in the viewer;
   - a top (plan) view with the camera position marked.

   Budgets, no city, sky and camera-limit rules from §6–§7 are unchanged.
