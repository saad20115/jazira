# A-1 v023 — match the Figma render (owner, 2026-11-11) — for the Blender session

**Owner, 2026-11-11:** "عندي مشكله في جودة المجسم ومطابقته للصوره في فيجما". The site CTO compared the
live tower with the Figma render and agrees. The owner chose a new model (v023) over code-only tuning,
and opens this Blender session with the model source.

This brief **adds to** `handoff/briefs/A-1-v023-request.md` (2026-11-05: fewer shader feature
combinations in the lite hero view, for the 3 s start). Both apply to v023.

## References
- Target: `design/assets/images/tower-render.png` (same file as `3d/ref/tower-render.png`).
- Live today: `handoff/briefs/A-1-v023/live-v022n-lite-2026-11-11.jpg`. It is the site preview at
  an 800 px wide viewport, **lite** model, on the owner's machine (Intel HD 530, DPR 1).
  One screenshot, non-authoritative.

## What differs (seen by the CTO in that screenshot)
1. **Glass.** Figma: dark navy, reflective, with clear mullions. Live: pale, does not read as glass.
2. **Lit windows.** Figma: scattered warm windows, each one distinct. Live: flat cream bands over most
   of the façade; the dark areas read as blotches.
3. **Gold pilasters.** Figma: warm glowing gold. Live: pale cream, close to white.
4. **Lobby.** Figma: strong amber, double height, with canopies. Live: small and pale.
5. **Crown.** Figma: glass with a clear LED line. Live: dark and flat with a thin line.
6. **Framing.** Figma: close, the tower fills the card. Live: far, small tower on the disc.
   (Camera distance is partly site code; say what `CAM_hero` should be.)

**Not a difference to fix:** the city. The owner removed it on 2026-10-22 (`docs/05-design.md` §18).

## Not yet separated: model or site
The site applies its own look on top of the release (`src/components/systems3d/renderContract.ts`,
`LiveLook`: exposure, environment, emissive scales and tints, AgX tone mapping). The CTO has **not**
measured how much of the pale look comes from those values and how much from the model.
- First check the v022n GLBs in the reference viewer (`3d/web/viewer-test`) next to the site.
- If the model looks right there and wrong on the site, report it: the fix is then site-side, and
  the CTO does it.

## The machine that matters
The owner's machine gets the **lite** model: integrated GPUs get lite, with no interior mapping and
no bloom (`src/components/systems3d/tier.ts`). So **lite must carry the Figma look by itself**.
Judge every change in lite first.

## Rules
- Nobody edits `3d/` in the site repository by hand. Build candidates go to a build folder
  (`web/build/v023/`); the site CTO imports a finished release as a whole.
- v022n stays the pinned release until the owner signs v023 off.
- Keep the contract: node, material and hotspot names, every extra
  (`3d/web/build/v022n/extras-schema.md`), `KHR_materials_variants`, and each system's entered look.
- Budgets as in the 2026-11-05 request (lite ≤ 2.5 MB, lite ≤ 60 draw calls), unless the owner
  agrees to more for the look. If the Figma look needs more, say how much and ask.
- No push to GitHub and no deploy.

## Evidence wanted for v023
- Three-panel at `CAM_hero`: Figma ref | Cycles | live **lite**, plus crops of crown, pilasters, lobby.
- Sizes, draw calls, SHA-256 table, and the feature-combination count before and after.
- A list of every changed material and texture.

When v023 is ready, tell the owner. The site CTO then imports it, runs the speed gates, and sends
the owner before/after pictures.
