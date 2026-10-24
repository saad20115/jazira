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
turns semi-transparent, the system's equipment shows in near-natural MEP colours with a thin gold accent (§9), and labels appear. The website plays
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
| 5 shots `hvac`, `fire`, `plumbing`, `power`, `smart` | Each starts **exactly** on the hero frame, camera moves to the system (4–6 s, ease-in-out), façade fades to ~15 % opacity, system shows in near-natural colours with a thin gold accent and subtle flow (chevrons, §9), ends on a stable hold frame |
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
   - both adjacent faces are visible in the **same proportions as the reference**: between the gold
     pilasters the left face is about 195 px and the right face about 110 px at 1024 px. The
     reference governs, not a fixed 45°;
   - do not just orbit the camera around the old model.
2. **Glazing.** Both camera-facing faces are glass, with the same mullion rhythm, reflections and
   lit floors. There is no dark or blank face in the hero view.
3. **Stepped setback.** Build it on both faces at the camera corner, mirrored, with the same step
   count and depth as the reference. The gold pilasters follow the reference.
3a. **Crown: the gold edge follows the glass (owner, 2026-10-23, relayed by the 3D lead).** "The
   upper gold edge at the top of the tower should follow the glass path."
   - Drop the separate diagonal crown beam.
   - The champagne ring and the gold light line run on top of the glass parapet along the **whole
     roof outline**, including the notch edges.
   - ~~The line still rises 87.0 → 90.5 m~~ — superseded by 3c (the crown is level).
   - Gate: superseded by 3c.
3b. **Crown storey set back (owner, 2026-10-23, relayed by the 3D lead).** "The last step is two
   levels and the upper one is set back."
   - The crown storey (L22 + parapet) is set back 2.5 m from the S face along its whole length, as in
     the reference.
   - The S-face roof edge shows in front of it, with a lit slab-edge line.
   - The gold ring follows the set-back glass. The set-back storey stays, level as in 3c (the
     86.99 / 87.78 / 90.06 / 89.73 m refit is withdrawn).
3c. **Crown is level (owner, 2026-10-23: "there are deviations in the parapet at the top of the
   building and the shape is unprofessional"; 3D lead decision).**
   - The reference image is not perspective-consistent. Fitting its 2D line put kinks in the
     parapet.
   - The parapet and crown are **one level height, 88.75 m**, planar, with mitred corners. The
     2.5 m set-back storey is kept.
   - The gold line on top is a single continuous straight line.
   - The notch terraces get one thin warm slab-edge line per step, with glass returns and no drawn
     outlines.
   - **Gate (final, 2026-10-23):**
     - level and planar is mandatory;
     - the crown edge overlay is a regression check: ≤ 12 px at the crown's far ends, ≤ 9 px
       elsewhere. A sweep showed no level crown can meet ≤ 10 / ≤ 5 against this reference;
     - pilasters ≤ 5 px (unchanged).
4. **Base.** The lobby, canopies and forecourt line up with the new orientation (the lobby faces
   the camera as in the reference).
5. **Proof** (before any further motion or compression work):
   - a side-by-side of `tower-render.png` and the new Cycles still from `CAM_hero`, with an
     overlay at 50 % opacity;
   - the same frame from the GLB in the viewer;
   - a top (plan) view with the camera position marked.

   Budgets, no city, sky and camera-limit rules from §6–§7 are unchanged.

## 9. Revision 2026-10-23 (owner, via the 3D lead) — systems in near-natural colours
"The five systems need near-natural colours, showing some logical details." This supersedes
"equipment glows gold" in §1 and §3.
- **Colours.** Entered systems use natural MEP colour coding, lifted slightly for night:
  - fire: red;
  - plumbing: blue water pipes, off-white GRP tanks;
  - HVAC: grey and galvanised;
  - power: RAL 7035 switchgear, galvanised trays;
  - smart: black racks with LED and screen emission.
- **Gold.** Brand gold (`#DFA82A` / `#EFCB76`) stays only as a thin accent glow on the selected
  system's key equipment and on the HOT markers.
- **Logical details.**
  - Flow chevrons, optionally UV-scrolled in live; this is the "subtle flow".
  - Valves with handwheels, gauges, supports, panel seams and status LEDs.
- **Mechanism unchanged.** `KHR_materials_variants` `highlight_<s>` now swaps to the lifted natural
  materials.
  - One vertex-colour material per system, plus at most one emissive, to hold lite ≤ 60 draw calls.
  - Budgets, schema and file names are unchanged.


## 10. GLB naming contract for the site (v019, 2026-10-23)
P3-T5 may reference **only** these names. Child mesh names are internal and can change.
- **Roots:** `SYS_<s>`.
- **Empties:** `HOT_*`, `PIVOT_*`, `CAM_*`, `PATH_*`.
- **Meshes:** `floor_slabs`, plus `<S>_equipment` and `<S>_glow` per system (HVAC, FIRE, PLUMB, POWER,
  SMART). `*_glow` is hidden at rest and shown only for the entered system.
- **Materials:** `MAT_<s>_glow`, `MAT_concrete_floor`.
- **Variants:** `KHR_materials_variants` `highlight_<s>`.
- **Extras:** all scene `extras`, including `camera_limits`, mirrored in `manifest.json`.
- **`extras.enter`** (values the viewer applies on entering a system and restores on exit):
  - `facade_opacity`;
  - `interior_opacity`;
  - **`site_emissive_scale`** (v019c final: **0.08**). While a system is entered, it multiplies
    `emissiveIntensity` on the SITE/POD site-lit materials (`MAT_stone`, bronze canopies, paving,
    planting).
  - **`site_occlusion_scale`** (v019c final: **0.7**). While entered, `aoMapIntensity` on the same
    materials is lerped from 1 to this value, so the sky reaches them and they read navy, as in the
    Cycles end stills, not black.
  - Both are restored to 1.0 on exit and are animated with the same fade as `facade_opacity`.
  - The list of affected materials is part of `extras-schema.md`, not hard-coded in the site.
  - Reference implementation: the 3D test viewer (`web/viewer-test/index.html`, `SITE_LIT` +
    `applyFade`). The 3D lead ships it as a reference file with the assets.
  - The 3D lead supplies the full `extras` schema (key, type, range, meaning) as
    `extras-schema.md` next to `manifest.json`. New keys are additive only.

Removed in v019: the per-equipment meshes (`HVAC_roof_plant` … `SMART_access_control`). No site code or
spec referenced them (checked on `main` and `phase-3-frontend`).

Pilasters (owner, v019b): they stop at 82.0 m with a 1 m gold parapet return to the set-back crown
storey.

## 11. Release v019c — frozen (2026-10-23)
The owner signed off v019c, relayed by the 3D lead. Whether the open notes N-1..N-4 are waived is
being confirmed directly with the owner; see `handoff/reviews/A-1.md`.

| File | Bytes | SHA-256 |
|---|---|---|
| `tower.glb` | 7,166,540 | `4d581efaf77d28ef2ea13d5c9aef49dbcfb3519b87e2e150e2089751c8cadf4d` |
| `tower-lite.glb` | 2,187,356 | `7af5fa75b4247bd6fd8f18ad7f0935cf2e1871c3611ffc73d900eacb7173543e` |
| `manifest.json` | 6,764 | `3176e2eeea218e18495f34432fad82f3b9a7f44ea178174641a7f821d865473e` |

- **Locations on the 3D machine:**
  - release notes: `C:\aljazira-3d\reports\RELEASE_v019c.md`;
  - snapshot: `C:\aljazira-3d-backup\release_v019c\`.
- **Any change** becomes a new version, needs owner approval, and gets a new hash table here.

## 12. v020 in progress (owner, 2026-10-23): "the HVAC fans need to rotate and spin"
**v020 is the final delivery** (owner, direct, 2026-10-23: "I approve v019c, but fix the four notes
before the final delivery"). It must include the fan spin below **and** the façade notes N-1..N-4 from
`handoff/reviews/A-1.md`:
- soft, continuous lit floor bands;
- the stepped notch readable from CAM_hero;
- the lobby as the brightest element;
- live light trails without the wide bloom.
This is not released. v019c (§11) stays the pinned release until the owner approves v020 in the live
preview and a new hash table is added here.
- **Naming contract (§10) additions:**
  - mesh `HVAC_fans` under `SYS_hvac`, with material `MAT_hvac_fans`: a blade texture on discs, each
    disc UV-mapped to the full 0–1 square;
  - +1 draw call when hvac is entered, with lite still ≤ 60.
- **Extras on `SYS_hvac`:**
  `fan_spin = { material: "MAT_hvac_fans", rpm: ~45, play: "entered", ramp_s: 1.0 }`.
- **Site playback:**
  - set `map.center = (0.5, 0.5)`;
  - while hvac is entered, add ω·dt to `map.rotation` each frame, ramping up and down over `ramp_s`;
  - no glTF animation clip and no new extensions;
  - **`prefers-reduced-motion: reduce` → no spin** (the site's motion rule);
  - stop when the tab is hidden or the card is off-screen.
- **Reference:** `web/viewer-test/index.html`.

## 13. Release v020 approved (owner, relayed by the 3D lead, 2026-10-23); supersedes v019c
"I approve v020 as a new version for the site."
- **What changed from v019c:**
  - mesh `HVAC_fans` and material `MAT_hvac_fans` (alphaMode MASK);
  - new texture `tex_hvac_fans` (14 KTX2 per file);
  - `SYS_hvac.fan_spin = {material:"MAT_hvac_fans", rpm:45, play:"entered", ramp_s:1}`.
- **Playback:**
  - `map.center = (0.5, 0.5)`;
  - `map.rotation -= rpm/60·2π·dt·level`, clockwise from above;
  - `level` ramps 0↔1 over `ramp_s` on enter and exit;
  - no spin under reduced motion, a hidden tab or an off-screen card (§12).
- **Numbers:**

  | File | Size | Tris | Draw calls |
  |---|---|---|---|
  | full | 7,180,984 B | 53,312 | hero 58 / hvac 88 |
  | lite | 2,189,388 B | 43,936 | hero 36 / hvac 46 |

- **Pinned v020 hash table** (the 3D lead verified that web\ = build020 = snapshot
  `C:ljazira-3d-backup
elease_v020\`; release notes `C:ljazira-3d
eports\RELEASE_v020.md`):

| File | Bytes | SHA-256 |
|---|---|---|
| `tower.glb` | 7,180,984 | `ef31638cf5364f5ee24294651f5c15ef1ef02897655a5e910e2dcba73f93b7aa` |
| `tower-lite.glb` | 2,189,388 | `8f48a42f729dbc63af4b6cd6af04ddbd9453adf2619ac7218cea6c5216e8f61e` |
| `manifest.json` | 7,159 | `76c8193184cd7704aed3e2c841d578ed0cfa0a303fa1237679a87ce7a4ff5510` |

- **Draw calls** (re-measured on the live files):
  - full: hero 58, systems 63–88;
  - lite: hero 36, systems 42–46.
- **Known text-only defect:** the `fan_spin` `note` string says "+=". The behaviour is **"−="
  (clockwise from above)**, and the site follows the behaviour. The text is fixed in the next
  version.
- The v019c archive stays intact (§11).
- **The final delivery is still conditional:** the owner's direct instruction requires N-1..N-4 to
  be fixed before the final delivery (§12). v020 is the current release, not the final one, until
  they are fixed and reviewed.

## 14. Stills package from v020 (2026-10-23)
Location on the 3D machine: `C:ljazira-3d\web\stills\`. The 3D lead verified all 37 files against
`stills_manifest.json`.
- **Card hero** (a 1:1 CAM_hero frame; the live crossfade registers with no doubled edges):
  - webp 2048 / 1440 / 828 at 250,856 / 156,462 / 72,664 B;
  - jpg fallbacks and the PNG master.
- **System end stills ×5** (hvac, fire, plumbing, power, smart):
  - webp 1440 (50–106 KB) and 2048 (80–167 KB);
  - jpg fallbacks and PNG masters;
  - the same entered state as live.
- **`<s>_hotspots.json` ×5:** `{id, label, x, y, in_frame, world}`, with x/y from 0 to 1 measured
  from the top-left. Reprojection against the live GLB: max 0.12 px at 2048 over 21 anchors.
- **`stills_manifest.json`:** name, bytes, w×h and SHA-256 per file, plus the source release and
  render settings.
  - Its own SHA-256 starts `6aa11f34…`. **The full hash must be read from the delivered file and
    pinned here when P3-T5 starts.**
- **Accepted difference:** the live sky reads slightly lighter and the trails slightly wider than
  the Cycles still, so the crossfade shows a small brightness shift, not a jump.
- **Façade notes N-1..N-4:** the owner told the site CTO directly that they must be fixed before the
  final delivery. They are still open, so the stills will be re-rendered with them (v021).

## 15. v021 candidate (3D lead report, 2026-10-24): N-1..N-6 built; not promoted
The 3D lead reports v021 is built and QA-passed. It is **not promoted**: `web/` is still v020, which
stays the pinned release until the site CTO reviews v021 and the owner signs it off.

| File | Bytes | SHA-256 |
|---|---|---|
| `tower.glb` | 7,097,856 | `341f1e3b494bd9572d85cf62ce0107723348cc44537cdb600c90c6eaefb56b51` |
| `tower-lite.glb` | 2,099,116 | `54fd2c1fae54d738facc9634bf8bc0411359999f0c95d0f64804feec2220893c` |
| `manifest.json` | — | `6013a7b1ec11ac1eca8c0cc7822282059d42aabd6b4dd44bb365504b46032508` |
| `stills_manifest.json` | — | `9ea52865f5b2d758a96902cf6507d9162ba665d794d361d0c05a3e4e2fd3ec56` |

The full table is in `renders/r4-corner/v021/sha256_v021.txt` on the 3D machine.

**N-5, mean luma by thirds (whole / top / middle / bottom):**

| | whole | top | middle | bottom |
|---|---|---|---|---|
| Reference | 90 | 114 | 75 | 80 |
| Cycles | 93 | 108 | 97 | 75 |
| Live full | 95 | 115 | 96 | 73 |
| Live lite | 99 | 117 | 106 | 74 |

The bottom third meets the 70–85 target.

**N-6:**
- deep-blue glass with a live PMREM sky;
- interior mapping in full, baked rooms in lite;
- champagne mullions;
- pilaster and lobby uplights;
- selective bloom (threshold 8).

**New manifest `render` contract** (`web/build/v021/extras-schema.md`):
- AgX, look "Medium High Contrast", calibrated pivot 0.606;
- optional bloom, MSAA and interior mapping, each with a fallback;
- lite defaults to bloom off.

The reference viewer stops the fan on reduced motion, a hidden tab, or when off-screen.

**Still owed before acceptance:**
- the façade close-up crop (ref | Cycles | live);
- the three-panel and crown/podium crops;
- draw calls (lite ≤ 60) and GPU memory for full and lite.

**P3-T5** wires against the v021 contract. Hashes are pinned only after the owner signs off.

**Announced next: v022** (realism: city backdrop, paving, palms).
- Same extras schema plus a city card (+3–5 draw calls, one unlit BLEND material).
- Caps: full ≤ 7.6 MB, lite ≤ 2.4 MB, lite ≤ 60 calls including post.

## 16. v022 pivot reported by the 3D lead (2026-10-25): maquette on a turntable, daylight studio
- **Reported as the owner's decision. The site CTO is confirming it directly with the owner.**
- The tower becomes an architectural maquette on a turntable plinth in a lit studio room, with the
  roundabout track around it, in white daylight. No city.
- **Render-contract changes:**
  - the dusk `sky` extras are replaced by a studio environment block (room background + PMREM);
  - idle animation: the plinth root rotates, not the camera, and user orbit stays;
  - bloom probably off, no night trails, low window emission.
- **Unchanged:**
  - system enter/exit, section clipping, fans, hotspots, variants, KTX2/meshopt;
  - budgets: 8 MB / 2.5 MB.
- **The visual reference changes** from the Figma dusk render to "professional physical
  architectural-model photo" quality. The home-page card still is re-rendered in the studio.
- **P3-T5:** hold the sky/environment wiring until the contract delta and the updated
  `extras-schema.md` arrive. The rest of the schema stands.
