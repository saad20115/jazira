# Phase 3 evidence from P3-T10 — non-authoritative

These files were produced by the executor (the CTO acting as executor on the owner's instruction of
2026-11-10). They are **not numbers of record**. Numbers of record come only from the independent
verifier on a clean clone.

- `visual/`: `pnpm visual` output, 6 pages × 3 widths (1440, 768, 390) × 2 locales, JPEG, plus
  `index.html` placing each 1440 `en` page next to its Figma export. Taken on a local build
  (`next start`, port 3346, the e2e test database), with Arabic switched on for the run and off after.
- `lighthouse/`: Lighthouse 13.5.0 mobile on `/ar`, `/ar/projects/<slug>` and `/en`, HTML and JSON.
  The machine was under load during these runs (the desktop compositor held about a third of the
  GPU), so performance values from them are not a measurement of the site.
