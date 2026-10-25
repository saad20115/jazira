# A-1 — 3D & cinematic asset brief (Al Jazira tower)

## 1. What we need
Night-time glass tower on the home page. When a visitor picks an MEP system in the side list, the camera moves cinematically to where that system lives, the façade turns semi-transparent, the system's equipment glows gold, labels appear. Played as short pre-rendered videos; plus a real-time 3D viewer of the same model.

## 2. Model (one master .blend)
- Tower matching the render: ~20-storey glass curtain wall, dark-blue glazing, warm interior lights, champagne-gold vertical fins and roof crown band, setback at upper floors, 2-storey gold-lit podium with entrance canopies, circular plaza with palms, lamps, roads with light trails. City context may be a backplate in the same dusk palette.
- MEP systems as clean recognisable assemblies (not engineering-accurate), each in its own collection named exactly: SYS_hvac (rooftop chillers/cooling towers, AHUs, duct risers, FCUs on 2–3 floors); SYS_fire (fire pump room ground/basement, sprinkler risers + floor mains, alarm panel); SYS_plumbing (water tanks, booster pumps, water risers, drainage stacks); SYS_power (MV room, transformers, generator, cable-tray risers, floor lighting); SYS_smart (BMS/data room, ELV risers, CCTV cameras, access control at entrances).
- Façade in collection ARCH_facade (to ghost it).
- Brand colours: navy #011025 / #002854, gold #DFA82A (glow #EFCB76).

## 3. Renders (Cycles)
- hero still: same framing as tower-render.png, 2048×2048 + 1440 and 828 crops.
- 5 shots hvac, fire, plumbing, power, smart: each starts EXACTLY on the hero frame, camera moves to the system (4–6 s, ease-in-out), façade fades to ~15% opacity, system glows gold with subtle flow animation, ends on a stable hold frame. 24 fps. forward + reverse per shot (reverse may be made with ffmpeg). endFrame still per shot 2048×2048. Masters: PNG sequences (or ProRes 422 HQ).
- Hotspots JSON per shot: 3–6 points {id, x, y} (0–1 in the end frame) of key equipment, from camera projection.
- Frame 1:1; keep action in the centre 80%.

## 4. Real-time web model
tower.glb ≤ 8 MB: decimated geometry, baked lightmaps, KTX2 textures, meshopt/Draco; nodes ARCH_facade, SYS_*; cameras CAM_hero, CAM_hvac … matching the shots.

## 5. Review rounds (stop after each, report to CTO)
R1 blockout (clay) + 5 camera paths as viewport previews; R2 look-dev: hero still vs tower-render.png side by side + render time per frame + peak VRAM; R3 final shots, JSON, GLB.

## 6. Revision — live model first (client decision, 2026-10-22; applies to R1 onwards)
- The live model runs INSIDE the page card in the browser (Three.js): visitors rotate, zoom, enter and exit each system there. The real-time GLB is now the main deliverable. The 5 cinematic video shots are DROPPED (only one end-frame still per system as fallback).
- City: reduce to a soft dusk backdrop — low-poly silhouettes + fog (or a blurred plate), plaza ring, a few palms and lamps. Focus = tower + MEP systems.
- Budgets for later rounds: tower-lite.glb ≤ 2.5 MB / ≤ 50k tris (first view); tower.glb ≤ 8 MB / ≤ 150k tris; textures ≤ 2K; glTF-PBR materials only; baked lighting; ARCH_facade materials must support real-time opacity 1 → 0.15 (alpha blend, no refraction).
- Per system add empties: PIVOT_<system> (orbit centre when inside), CAM_<system> (entry view), optional PATH_<system> waypoint, HOT_<system>_<n> (label anchors).
- CAM_hero still matches the Figma framing; the live model starts from that exact camera, so still and GLB must line up.
- For R1: keep the blockout + CAM_hero match + collections; city as simple low blocks only; low poly counts from the start; instead of 5 long camera animations, per system CAM_<system> + PIVOT_<system> (+ PATH_ if a straight move would clip through geometry) and a quick viewport preview of the move hero → system → back (any length, Workbench). Report triangle counts per collection.
