# v023b — delta on top of v023 (`web/build/v023/extras-schema.md` still applies)

Owner, 2026-11-11 (via QA): "شكل وعدد وتوزيع المضاء والمعتم غير منطقي وغير مطابق. ممكن نحاكي اللي موجود في الصوره".
Then, in this session: "عدل في نفس النسخه وخلي في منطق: سبب تدرج الإضاءة هو زاوية الرؤيه والجانب البعيد والقريب
... لما اعمل تدوير للمجسم يقل التدرج (ينعكس الوضع)".

> **OWNER SIGN-OFF 2026-11-12: "أعتمد الشكل"** (answer to "هل تعتمد شكل الجولة السابعة؟"), on the live lite preview and
> `renders/r4-corner/v023b/figma_vs_v023b_r7_hero.jpg`. Approves the LOOK of round 7: tower.glb `d7e975d9…63a9`,
> tower-lite.glb `01736727…a732`, manifest.json `39945794…5b49`. Not a promote word: `web/` stays v022n.

## CURRENT BUILD: read from the Figma picture (`AJ_WIN=figma`)
Owner: "مالذي يمنعك من محاكاة الاضاءه في صورة فيجما ؟" then "طابق مع فيجما". The lit / dim / dark offices of the two
front faces are now sampled from `ref/tower-render.png` (`figma_plan()` in `v023_textures.py`: each face rectified,
18.2 Figma floors × our 2.4 m panes, warm light = R − B). This replaces the invented zones below.
- Left front face `FAC_cw_S` keeps its panes (23.5..32 + 0..9); right front face `FAC_cw_E` has its UVs moved
  (u → 0.5 + 0.93 u) to its own panes 9..23. The other faces read the same panes.
- Figma's dark floors come through as they are (two floors above the lobby, one mid floor, one upper floor).
- Top floors (rows 18–23) stay unlit but for four rooms; the front stepped corner `FAC_cw_terrace` reads v − 8/24.
- Lit colour measured from the ref (0.77 / 0.65 / 0.41): room tone 1.0 / 0.84 / 0.42; lobby gold 1.0 / 0.76 / 0.30.
- `window_view_falloff` is now min 0.06, lo 0.25, hi 0.7 (0.5 / 0.95 dimmed both front faces at `CAM_hero`).
- Round 6 (2026-11-12, owner: "مالذي تنتظره" after QA's eye notes): a lit Figma floor is lit right across each face
  (each floor's own level lifts its weak panes; Figma's dark floors stay dark); lobby gold deeper (1.0 / 0.70 / 0.22,
  hue kept where it clipped to cream); warm lobby light spill added to `tex_sitelight` (plaza, plinth, canopies,
  planting) by `blend/scripts/v023b_spill.py` (the lobby glass as an area light, no new texture or draw call).
- Round 7 (2026-11-12, owner chose "ابدأ الجولة السابعة" after QA's four eye notes): each office (a run of 1–3 panes)
  has its own brightness and the odd office on a lit floor is on low light (pane gaps stay hairlines, owner
  2026-11-11); room tone 1.0 / 0.79 / 0.30 with the hue kept where the light strips clipped to white; lobby gold
  1.0 / 0.73 / 0.20, lighter 1 m mullions, brighter ground floor; lobby spill K 1.5 → 4.0 (a clear warm pool).
- Not done: Cycles not updated.

## Earlier in v023b: invented zones (`AJ_WIN=zones`, superseded)
- Office zones (owner, 2nd round: "المعتم فعليا ليس معتم هو مضاء خفيف لكن بسبب الاتجاه يظهر كأنه معتم ... الأدوار
  السفليه مقابل المدخل من الخلف معتمه المدخل فقط مضيء ... الأدوار 10 و 11 معتمه عدا كم غرفه علي مستوي الدور بالكامل"):
  the darker zones are LOW-LIGHT offices (about a third of full), in coherent blocks (2–3 floors × 2–5 panes), two
  part-low floors and a few single ones; the office floors right above the lobby (rows 2–4, z 7.2–18 m) are unlit,
  only the lobby glows; L10 and L11 are unlit except four rooms each. Terraces ~95 % lit, crown floor ~70 %.
- Narrow lit slits: a dark vertical every 0.6 m inside lit panes (picture only; glass mullions unchanged).
- Fuller lit band (desk / floor zone brighter); gentle brightness variation per floor and per pane.

- Top floors (owner: "الأدوار الخمسه العلويه مضاءه من منطقة الزاويه المتناقصه للداخل فقط والباقي معتم مع كم غرفه
  مضاءه فقط"): on the main faces rows 18–23 (L17–L22) are unlit except three rooms each; the stepped-in corner glass
  `FAC_cw_terrace` (front corner only; owner: "المتراجعة في الزاويه الاماميه فقط في الخلف معتمه") reads five rows
  lower (v − 5/24: lit office rows 13–17, then one unlit row). The back stays dark on those floors.
- Lobby (owner: "المدخل المضيء زجاجي شفاف"): `tex_podium_emit` is now the lit lobby seen through clear glass
  (golden double-height hall, downlight rows, pendants, columns at depth, mezzanine edge, counter, a mullion every
  1 m, transoms at 3.0 / 7.0 m) instead of a uniform amber panel. Same layout and size.

## Far sides: no longer baked dark
The v023 UV shifts (`FAC_cw_wing`, `FAC_cw_E` cut at y 1.6) are NOT applied in v023b: every face carries lit offices.
The near / far difference now comes from the view angle and follows the model when it turns.

## New scene extra `window_view_falloff` (the site MUST implement it, or the far sides read fully lit)
```json
{ "materials": ["MAT_glass_cw", "MAT_glass_wing", "MAT_glass_side", "MAT_glass_terrace"],
  "min": 0.06, "lo": 0.5, "hi": 0.95 }
```
`emissive *= min + (1 - min) * smoothstep(lo, hi, |dot(N, V)|)`, N = the flat face normal, V = the view ray, both
with the world up component removed (plan angle, so looking down does not dim every face). Reference: three.js
`onBeforeCompile` in `web/viewer-test/index.html` (`addFalloff`, inserted before `lights_physical_fragment`, so it
composes with interior mapping). One extra program variant key per glass material; no extra draw calls (lite hero 40).
Cycles builds the same factor from nodes (`blend/scripts/v023_cycles_match.py`).

## New scene extra `lit_glass_clarity` (site must implement)
Owner: "للمدخل المضيء زيد الشفافيه بنسبة 90 ٪ عن الحالي. الغرف والأماكن المضيئة بشكل عام شفافية الزجاج فيها اكثر من
المعتم بنسبه 85٪".
```json
{ "materials": { "MAT_glass_cw": 0.85, "MAT_glass_wing": 0.85, "MAT_glass_side": 0.85, "MAT_glass_terrace": 0.85,
                 "MAT_podium_glass": 0.90 }, "lo": 0.03, "hi": 0.30 }
```
`specular and clearcoat reflection *= 1 - clarity * smoothstep(lo, hi, lit)`, lit = the emissive map's brightest
channel (linear, before the view falloff). Glass over a lit room is clear; unlit glass keeps its full mirror.
Reference: `addGlassFx` in `web/viewer-test/index.html` (one shader for both extras, per-material uniforms).
Not yet mirrored in Cycles.
