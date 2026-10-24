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
