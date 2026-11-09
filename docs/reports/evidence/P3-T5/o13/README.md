# P3-T5 round 6 evidence: O-13 dusk sky and lighting (non-authoritative)

Raw files the executor made. Nothing here is a number of record (AGENTS.md, evidence integrity). The CTO
verifier re-runs its own scripts, the e2e, Lighthouse and the DoD on the submitted SHA. Every run made is
here. The machine was loaded during these runs (the CTO's verifier and other sessions).

The build is `next start` of `7bda0b9` (O-13, before O-14) on port 3170, with my own `.env` and Docker
project `p3t5`. The round-5 "before" shots come from `d55dca2`. Intel HD 530, ANGLE D3D11.

- `shots/before/`, `shots/after/`, made with `scripts/evidence/p3-t5-lighting-shots.mjs`:
  - the card before the start (`00-image`, the poster), the live overview and all five systems;
  - at 1440×900 and 390×844 (touch), in `en` and `ar`.
- `v1-swap/`: the CTO's `verify/runs/P3-T5-r2/scripts/v1-swap.mjs`, with one line changed in my copy.
  The desktop cases click the card instead of hovering it, because since O-2 hover no longer starts the
  model. Q13 makes the top band the gate; whole-card luma and the floor band are information.
- `e2e/`: the whole P3-T5 spec on `next start`, `E2E_PRODUCTION_SERVER=1`, `chromium` and `gpu`.
- `cards-timeline/`, `cards-gates/`: the CTO's `verify/runs/P3-T5-r4/scripts/` scripts, unmodified
  (byte-identical copies), three runs per flow. This first set overlapped the CTO's verification of
  round 5 (`verify/runs/P3-T5-r5/`) on the same machine.
- `rerun/`: the same scripts again, after the CTO's run had finished. `cpu-before-*.txt` is the CPU load
  Windows reported just before each run.
- `lighthouse/`: Lighthouse 13.5.0 (`node_modules/.bin/lighthouse`, the CTO's flags), `/en`, three
  mobile runs and one desktop run. Two runs ended in the tool error `NO_NAVSTART`; they are kept.
