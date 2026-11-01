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
- `e2e/`: the P3-T5 e2e spec against `next start` (port 3170, `E2E_PRODUCTION_SERVER=1`): the default
  project and the `gpu` project (`E2E_GPU=1`, Intel HD 530 through ANGLE D3D11), first runs, plus
  the mutant run of the CPU-throttle test at rate 1 (expected to fail; it does).
- `next-start/`: one run each of `scripts/evidence/p3-t5-{css-gzip,interaction-perf,long-tasks,gpu-memory}.mjs`
  with its log. `lighthouse-run1.log` and `lighthouse-run2.log`: both Lighthouse attempts failed
  before any audit (the shared `run-lighthouse.mjs` helper's headless browser did not come up /
  closed its connection); no Lighthouse result exists from the executor.
- `standalone/`: the `@smoke` tests on `node .next/standalone/server.js` (with `public/` and
  `.next/static` copied in, `--env-file=.env`, `PORT=3170`).
  - `run1-without-sharp-dlls/`: every route answered 500. Next's file tracing copied
    `sharp-win32-x64-0.35.5.node` but not `libvips-42.dll` / `libvips-cpp-8.18.7.dll` (Windows), so
    the Payload instrumentation hook could not load sharp. The server's stderr is kept.
  - The top-level logs are run 2, after copying those two DLLs from `node_modules` into the
    git-ignored standalone folder by hand (a local workaround, not a code change).
