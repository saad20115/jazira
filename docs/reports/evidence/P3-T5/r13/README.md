# P3-T5 round 13 evidence: the round 14 regression (the sheen's programs) and O-19 (non-authoritative)

Raw files the executor made. Nothing here is a number of record. The machine was shared and loaded
(other sessions, the CTO's verifier servers, Antigravity's R-1); `cpu.txt` in each bisect slot holds
the load reading before it. The verifier's quiet run decides every gate. Builds are `next start` on
port 3170, with my own `.env` and Docker project `p3t5`. Retries 0; every run is kept.

Builds used (each a full `pnpm build` of the source at that commit):
- `r11b` = `331ae43` (round 11);
- `s` = `3385150` (O-15);
- `w` = `2b7abb3` (O-15 and O-18);
- `r12` = `fa5694e` (round 12: + the O-14b rest change);
- `fix` = `ab1339c` (this round: the folded sheen, with O-19).

Contents:
- `programs/`: `programs.mjs` counts, from outside the code, the WebGL programs the page links. An
  init script wraps `WebGL2RenderingContext.prototype.linkProgram`.
  - The scenario: scroll to the card, wait, click Fire Fighting (`onscreen3s` after 3 s, `immediate`
    at once), wait, then click HVAC.
  - Each JSON has a summary: programs linked before the click, from the click to live, from live to
    the HVAC click, and after.
  - Each JSON also lists every program, with when it was linked and its fragment shader's features:
    `+SHEEN`, `+INTERIOR`, `+ROOM` and the `#define`s.
  - `count/`: r11b and r12 (first pass, no features); `count2/`: r11b and r12 with features;
    `count4/`: fix; `count5/`: s and w. Run by `scripts/count.sh`.
- `bisect/`: the CTO's gate script (an unchanged copy of `verify/runs/P3-T5-r11/scripts/
  cards-gates.mjs`), `onscreen3s` then `immediate`, on each build in the mirrored order
  r11b, s, w, r12, fix, fix, r12, w, s, r11b (`scripts/bisect.sh`). `result.json` and `probe.json`
  per run; videos are not kept.
- `runs-c/`: on the fix (`scripts/run-c.sh`): the P3-T5 e2e (both projects), the look shots
  (`o15-fix/`, the same set as round 12's `o15/after/`), and the sky check (`sky-swap/`).
- `mutants/`: this round's must-fail mutants, each applied, run and reverted. Their e2e runs used
  `next dev` of the mutated tree.
  - `m19-escape-keeps-row`: Escape exits without collapsing the row (round 12's Escape). The
    `@gpu O-19` test fails on the open row.
  - `m20-no-focus-move`: no focus move to the header when the row collapses with focus in its panel.
    The `@gpu O-19` test fails on the header-button focus.
- `dod-fresh-clone/`: the DoD from a new clone of the branch at the final code.
- `scripts/`: every script above.
