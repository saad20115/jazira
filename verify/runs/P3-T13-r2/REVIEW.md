# P3-T13 round 2 — verifier run (CTO session, 2026-11-01)

- Target `33cf02dd9fa5c624ad59c5b54637ecd2d4d91e3c` (HEAD `db0da2c`), from a fresh `git clone D:\jazira` into
  `D:\jazira-verify\2026-11-01\p3`.
- Docker project `aljazira-verify` (Postgres 5440, Mailpit 1035/8035), and a fresh `.env` with random
  secrets that are never printed.
- Production `next start` on 3310.
- `verifier-setup.mjs` creates a reviewer admin with a random password stored outside the repo,
  publishes `home-page` (en, ar) and sets `arabicEnabled=true` in this DB only.
- Instruments are copied from `verify/runs/P3-T13-r1` without logic changes (only the `createRequire`
  path). `analyze-r2.mjs` is the round-1 analyzer with the 1100 ms threshold.
- Numbers of record: see `handoff/reviews/P3-T13.md` §Round 2. They are counted from
  `matrix/results.json` using `implDecision.action`; the reason is given there.
- DoD logs are in `dod/` (`summary.tsv`, `test-summary.txt`, the reruns and `e2e3.log`).
- Sample frames: `matrix/frames-412-throttled-en-r1` (played) and `matrix/frames-412-throttled-ar-r1`
  (skipped).
