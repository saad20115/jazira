# v022 (realism): plan and QA/CTO notes, ON HOLD until the owner's city decision is relayed by QA

Mocks: `renders/r4-corner/v022_mock/` (`mock22_ref_i_ii.png`). The script is scratchpad `mock22.py`, run on the v021 work copy; nothing was saved.

## Scope (CTO)

**Stills (Cycles), no cap:**
- full procedural city;
- haze that fades to the horizon sky colour;
- sea band (optional);
- horizon glow.

**Live:**
- a horizon-band city card, 4096 × 512, elevation −20..+15°, baked from the final stills city;
- a near ring of 20–40 low instanced blocks;
- the PMREM environment baked from the city panorama;
- no 600-block city;
- full model ≤ 7.6 MB, without touching LM_arch.

**Lite:**
- bloom off by default;
- the 60-call cap counts everything.

**Assets:**
- Poly Haven only (CC0), listed in `assets/polyhaven/LICENCES.md`;
- no palms or cars there, so both are procedural;
- cars in the stills only.

## Corrections against the ref (QA, from the mocks)

1. **Scale.** The camera looks down onto roofs.
   - Near and mid blocks 6–24 m; taller only far away.
   - Varied footprints: merge or split cells, setbacks, courtyards.
   - Break the grid alignment.
   - Roof clutter.
2. **Windows.**
   - 10–20% lit, warm 2700–3500 K, clustered by floor or unit.
   - Many fully dark buildings, beige/white plaster.
   - The city sits darker and warmer than the tower: the tower is the brightest mass after the lobby (check with luma).
3. **Foreground.**
   - Continue the ring road into a lit street grid.
   - Low walls and plots, street trees, parked cars (stills).
   - Palms along streets and medians, not scattered.
4. **Live card.** Use the 4096 × 512 band, not a full equirect.
5. **Sea.** Optional. A 10–15° yaw of the city grid may open the sunset gap toward the water. The camera does not move.
6. **Budgets.** 8 / 2.5 MB caps stand; live full target ≤ 7.6 MB.

**Owner decision still needed:** reversing the earlier "No city" decision.
