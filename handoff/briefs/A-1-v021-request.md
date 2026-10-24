# A-1 v021 — owner request (2026-10-24) — paste into the "هلا" 3D session

**Owner decision, given directly to the site CTO on 2026-10-24: "تنصلح" — the four façade notes get fixed.**

Build **v021**, the final delivery, on top of the v020 release. Change only these four things:

1. **N-1, lit pattern.** The lit floors currently show hard-edged dark bay rectangles that read like a
   checkerboard. Replace them with soft, mostly continuous warm floor bands with gentle per-bay
   variation, as in `tower-render.png`.
2. **N-2, stepped notch.** It must be readable again from `CAM_hero`, as it was in v012:
   - darker recessed stepped glass;
   - lit interiors behind it;
   - one thin warm slab-edge line per step (brief §8.3c).

   This is the reference's most distinctive feature.
3. **N-3, lobby.** The lobby must be the brightest element in the frame: a glowing 2-storey glass
   box with a visible interior. The cream band above it must not out-shine it.
4. **N-4, live light trails.** Thin lines instead of the wide white bloom (right side of the live
   three-panel).

**Keep everything else unchanged:**
- geometry gates: pilasters ≤ 5 px, crown ≤ 12/9 px;
- the level crown at 88.75 m with the 2.5 m set-back;
- `fan_spin`;
- every extra (`camera_limits`, `enter.site_*`);
- the naming contract (§10);
- budgets: full ≤ 8 MB, lite ≤ 2.5 MB, lite ≤ 60 draw calls.

**v021 evidence** (in the same private artifact as before):
- three-panel, crown crop and podium crop (ref | Cycles | live);
- the HVAC fan spinning in live;
- re-rendered stills with a new `stills_manifest.json`;
- logged draw calls and sizes;
- a new SHA-256 table.

v020 stays the pinned release until the site CTO reviews v021 and the owner signs it off. When v021 is
ready, tell the owner.

## Added 2026-10-24: N-5, overall darkness (owner: "المنظر العام مظلم عكس الصوره الاصلية")
The owner reviewed a screenshot of the `build/v021/tower-lite` viewer.

Mean luma (0–255), v021 lite vs reference:

| Region | v021 lite | reference |
|---|---|---|
| whole frame | 81 | 90 |
| top third | 117 | 114 |
| middle third | 90 | 75 |
| **bottom third** | **37** | **80** |

The sky and tower are fine. The lower frame is the problem: the ground fade drops to near-black,
and the plaza reads dark.

**What to change:**
- Raise the ground and plaza exposure so the bottom-third mean is about 70–85, in both Cycles and live.
  - The ground fade should be dusk blue-grey, not black.
  - Add warm lamp pools on the paving.
  - Keep the planting visible and the forecourt lit.
- Keep the sky, tower and glass as they are.
- Re-verify that the entered views (`enter.site_*`) still match Cycles.

**Proof:** a luma table for Cycles and live, plus the three-panel.

## Added 2026-10-24: N-6, premium façade, glass, lighting and reflections
Owner, translated: "The building's façade and glass in the original image look luxurious and premium.
In the model they are very weak, and so are the lighting and its reflections."

**What makes the reference premium, and what to change:**

1. **Glass.** Deep blue, highly reflective glass that mirrors the dusk sky: lighter at the top,
   warm at the horizon, with visible Fresnel.
   - Cycles: real reflections (roughness about 0.03–0.08, a slight blue tint).
   - Live: a PMREM environment map built from the same sky gradient (`scene.environment`), with
     tone mapping matched to Cycles (state which one, ACES or AgX, in the manifest).
   - Never a flat colour texture.
2. **Depth behind the glass.** The interiors read as real rooms (ceiling light panels, depth,
   partitions), not flat yellow bands.
   - Full GLB: interior mapping (a baked interior atlas, or a parallax/cubemap interior shader).
   - Lite: a baked interior texture with a depth cue.
3. **Mullions.** Thin dark-bronze/champagne metal with crisp specular highlights that catch the
   light. A dense vertical rhythm as in the reference, not flat beige lines.
4. **Gold pilasters and frame.** Champagne-gold metal with a vertical **uplight wash** (brighter at
   the base, fading upward) and soft specular, plus the continuous LED line on the crown.
5. **Lighting and reflections.**
   - Base uplights washing the pilasters and lobby.
   - The lobby glow reflected softly on the forecourt paving (slightly glossy paving).
   - Warm lamp pools (with N-5).
   - Subtle selective bloom on the light sources only.
6. **Spandrels and slab edges.** Thin and dark, so the glass reads as one continuous curtain wall.

**Constraints:**
- Budgets are unchanged: full ≤ 8 MB, lite ≤ 2.5 MB, lite ≤ 60 draw calls.
- Interior mapping and the env map must stay within them. On weak GPUs, the lite file may fall back
  to the baked interior.

**Proof:**
- A façade close-up crop (ref | Cycles | live) at the same framing.
- The three-panel.
- Draw calls, GPU memory and sizes.
