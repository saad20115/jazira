# P3-T5 final evidence (executor, non-authoritative)

Raw files produced by the executor on its own machine. **Non-authoritative:** numbers of record come only
from the CTO's verifier (AGENTS.md "Evidence integrity"). Nothing here is filtered; every run is kept
or, where its files were discarded, its console output is kept with the reason.

- `recordings/<flow>-<locale>/`: a WebM screen recording and a HAR waterfall (bodies omitted) per
  flow, from `scripts/evidence/p3-t5-recordings.mjs` against `next start` on port 3170 (the p3t5
  database, seeded with `pnpm seed`, home page published in en and ar, Arabic switched on).
  Flows: `desktop`, `keyboard`, `reduced` at 1440×900; `phone` at 390×844 touch. The script header
  lists each flow's steps.
- `recordings-run1.log`, `recordings-run2.log`: the console output of both runs.
