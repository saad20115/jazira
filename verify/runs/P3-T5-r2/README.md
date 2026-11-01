# Verifier run P3-T5 r2 — 2026-11-01

- **Target:** branch tip `f3654a7` (code `5152819`; `f3654a7` touches only `docs/` and
  `handoff/reports/`).
- **Clone:** a fresh `git clone --no-local D:\jazira` into `D:\jazira-verify\2026-11-01\p3t5b`, checked
  out at `f3654a7`. LFS came with the clone. `3d/web/tower.glb` and `tower-lite.glb` match the v022n
  sha256 in the handover (`2fd41990…`, `382f8f67…`).
- **Environment:** Docker project `aljazira-verify3` (Postgres 5442, Mailpit 1038/8038), production
  `next start` on 3312. The `.env` is written by `scripts/make-env.mjs` with fresh random secrets. Not in
  the archive.
- **Retries:** 0 everywhere. Every run is kept.

## Runs that do not count (verifier errors, kept for the record)
1. **`7927937`, first clone.** My `.env` generator made an `IP_HASH_SALT` shorter than `src/env.ts`
   requires, so every `payload migrate` step failed. I stopped the run. See `void/summary-7927937-short-salt.tsv`.
2. **`f3654a7` e2e run 1.** I did not publish the home page in the verifier DB before e2e, so section 4
   was not on `/en`. The 4 P3-T5 tests that open Home failed on a missing card. This was my setup, not
   the code. The Lighthouse runs of that state were discarded too. See `void/`.

   Fix: `scripts/publish-as-fixture.mjs` logs in as the e2e fixture admin (test credentials from
   `tests/e2e/global-setup.ts`), publishes `home-page` (en, ar) and sets `arabicEnabled`. Then
   `scripts/run2-p3t5.sh` ran everything below again.

## Results of record
### DoD (`dod/summary.tsv`)
| Step | Result |
|---|---|
| install | exit 0, `Packages: +773` |
| migrate up → down → up → status | exit 0 |
| lint, typecheck, tokens-check, build | exit 0 |
| format-check | exit 1, only `src/migrations/20261101_133828_p4_t2_r2_media_placeholder.json` (P4-T2 R-20) |
| test | 414 / 416. The 2 failures are the P3-T14 R-42 tests (R-49) |
| audit `--prod` | 1 low (`deepmerge`); `--audit-level high` exit 0 |
| seed | exit 0 |

### e2e on `next start` (run 2, home published)
| Run | Result |
|---|---|
| default project, all specs (`e2e/e2e-default-full.log`) | 13 passed, 2 failed |
| `gpu` project, `E2E_GPU=1 E2E_PRODUCTION_SERVER=1` (`e2e/e2e-gpu.log`) | 9 / 9 passed |
| P3-T5 spec, default project with `E2E_PRODUCTION_SERVER=1` (`e2e/e2e-p3t5-default-prodflag.log`) | 4 / 4 passed |

The 2 default failures are not P3-T5:
- P3-T14 R-43 (`/en/styleguide` is 404 on `next start`, R-51);
- P3-T2 `/styleguide` (R-2).

### Lighthouse 13.5.0 on `/en` (`lighthouse/`), same machine as the R2 baseline (`7df0099`)
| Run | Perf | A11y | BP | SEO | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| mobile try 1 | 64 | 96 | 81 | 100 | 5310 | 353 | 0.001 |
| mobile try 2 | 65 | 96 | 81 | 100 | 5368 | 310 | 0.001 |
| mobile try 3 | 66 | 96 | 81 | 100 | 5394 | 291 | 0.001 |
| desktop | 97 | 96 | 81 | 100 | 1184 | 15 | 0.000 |

- R2 baseline: mobile 52 and 57 (one attempt `NO_NAVSTART`), desktop 95.
- The worst P3-T5 mobile run is not below the baseline, so the E5 "no more than 3 points below" gate
  holds.
- The ≥ 90 mobile budget is not met, as on the baseline. That is P3-T10.

### V-1 still → live swap (`scripts/v1-swap.mjs`, `v1-bands.mjs`, `v1-ground.mjs`; images in `v1/`)
Chromium with ANGLE D3D11 on the Intel HD 530 (lite tier). Card screenshots before and after the switch:
1440 DPR 1 (hover), 1440 DPR 2 (hover), and 390 DPR 3 (tap on `[data-open-3d-model]`).

| Case | Live after | Luma Δ (above the controls) | Top bg Δ RGB | Bottom bg Δ RGB | C3-2 ground band Δ RGB |
|---|---|---|---|---|---|
| 1440 DPR 1 | 3.2 s | −1.7 | −0.3 −0.9 −1.7 | +3.1 +2.2 +2.4 | −6.6 −9.8 −13.0 |
| 1440 DPR 2 | 0.9 s | −1.9 | −0.3 −0.9 −1.7 | +3.4 +2.3 +2.4 | −6.4 −9.2 −12.8 |
| 390 DPR 3 | 1.0 s | −1.6 | −0.7 −1.2 −2.1 | +2.1 +1.4 +2.6 | −7.5 −10.6 −13.8 |

- **The V-1 gate holds:** luma within ±5, and background within ±6 per channel.
- **The C3-2 ground band** (x 10–90 %, y 62–74 %, the band fixed in `c855747`) is still outside ±8 on G
  and B. C3-2 allowed this. The remainder goes to the 3D lead.
- **Phone, run 1** (`v1-run1-*` in the verifier folder): my script tapped the card, not the open button,
  so the card stayed a still. Not used.
- **Note:** the first-pass "floor" band (bottom 15 %) overlaps the zoom and reset controls that appear
  after activation. It is not a model measurement, and `v1-bands.mjs` replaces it.

### Mutation checks of the 2(a) fix (`scripts/p3t5-mutants.sh`, `mutants/`)
| Mutant | Result |
|---|---|
| M0 baseline | the 2(a) tests pass |
| M1: drop the panel's own Suspense boundary | **fails** (the system cannot be entered) |
| M2: the explorer itself `use()`s the read | **fails** (the card never renders before the data arrives) |
| M3: Suspense boundary around the explorer in the section | **fails** (structural test) |

Each mutant was reverted with `git checkout -- src/components/systems3d`. The "DIRTY" lines come from
two tracked `docs/reports/phase-1/e2e-admin-login-*.png` files, which the P1 e2e overwrites on every run.
That is not P3-T5.
