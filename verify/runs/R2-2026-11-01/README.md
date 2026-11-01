# Verifier run R2 — 2026-11-01 (P4-T2 r2 + P3-T14 r2)
- Target `7df0099` (P4-T2 code `dc7e650`, P3-T14 code `6e92ca2`), from a fresh `git clone D:\jazira` into
  `D:\jazira-verify\2026-11-01\r2`.
- Docker project `aljazira-verify2` (Postgres 5441, Mailpit 1036/8036). Production `next start` on 3311.
- `dod.sh`: the DoD in order, with retries 0. See `summary.tsv`, `format-check.log`, `test-summary.txt` and
  `e2e.log`.
- `db-digest.sh`: a row-level md5 for each of 110 public tables, taken before and after a second `pnpm seed`;
  the two digests are identical.
- `p4t2-probe.mjs`: anonymous and editor REST probes (media, placeholder files and sizes, drafts,
  versions, `reviewNote`). Output: `p4t2-probe.txt`.
- `p3t14-touch.mjs`: the ProjectCard `.ctaRow` at 390 px with touch on Home, and how public images are
  served.
- Numbers of record: `handoff/reviews/P4-T2.md` and `handoff/reviews/P3-T14.md`, §Round 2.
