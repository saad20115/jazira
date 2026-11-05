# A-1 v023 — owner request (2026-11-05) — paste into the "هلا" 3D session

**Owner decision, given directly to the site CTO on 2026-11-05: "نبقيها 3 ثواني".** The live tower must appear
within 3 s of a click, even when the visitor clicks the card right after scrolling to it. The code levers on the site
side are used up. What is left is less shader work in the first (hero) view of the lite model.

Build **v023** on top of the v022n release. Change only this:

1. **Fewer distinct materials in the lite GLB's hero view.** Each distinct combination of material features (texture
   slots, UV sets, texture transforms, alpha mode, double-sided, `KHR_materials_clearcoat`, `KHR_materials_specular`,
   emissive) costs one shader program to compile at start-up. Reduce how many of these combinations the objects
   visible from `CAM_hero` use:
   - merge materials that differ only in factor values (colour, roughness, metalness) into one shared feature set;
     carry per-object variation in vertex colours or an atlas instead;
   - drop clearcoat and specular from lite materials where the hero still does not need them;
   - use one UV layout per material where the bake allows it.
   The site CTO's rough count on the delivered v022n `tower-lite.glb`: 38 materials in about 19 distinct feature
   combinations. That count is an estimate from the glTF JSON, not a compile measurement. Report your own count before
   and after.

**Keep everything else unchanged:**
- the hero look: no visible change in the three-panel (ref | Cycles | live) at `CAM_hero`;
- the evening sky and top band of v022n (owner check O-13);
- `KHR_materials_variants` and every system's entered look;
- every extra, the hotspot empties and the naming contract (§10);
- budgets: lite ≤ 2.5 MB, lite ≤ 60 draw calls; full unchanged unless the same merge applies at no visual cost.

**v023 evidence** (in the same private artifact as before):
- the material feature-combination list for lite, before and after;
- three-panel and crown/podium crops (ref | Cycles | live);
- sizes, draw calls and a new SHA-256 table.

v022n stays the pinned release until the site CTO measures v023 on the verifier machine (click right after the scroll,
≤ 3 s) and the owner signs it off. When v023 is ready, tell the owner. The site imports it into `3d/` as a whole
release. Nobody edits `3d/` by hand.

**Not promised:** fewer materials should shorten the start-up compile, but nobody has measured by how much. If v023
does not reach 3 s, the owner decides again.
