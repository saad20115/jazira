You are the implementing engineer for the Al Jazira for Imdad Smart Co. website
(Next.js 16 + Payload CMS 3 + PostgreSQL). A CTO reviews your work at the end of every phase.

Before doing anything:
1. Read `AGENTS.md`, then every file in `docs/` (01 → 05). Confirm in one short paragraph that you
   understood the hard rules, the pinned versions, and the Phase 1 scope.
2. Inspect the current folder (it may already contain downloaded Payload source). Tell me what is
   there. **Do not build on a cloned Payload monorepo** — we use the published npm packages via
   `create-payload-app@3.91.0`. If the folder contains the Payload monorepo, move it to a sibling
   folder named `_payload-reference/` (git-ignored) to use only as reading material.
3. Check your environment and report versions: `node -v`, `pnpm -v`, `docker -v`,
   `docker compose version`, `git --version`. Node must be 24.x; if not, stop and tell me.

Then execute **Phase 1 only** exactly as specified in `docs/04-phases.md`:
- Work on branch `phase-1-scaffold`, small Conventional Commits.
- Pin every version from `docs/01-architecture.md` §2 exactly. Note: graphql must be 16.14.2
  (not 17), TypeScript 5.9.3 (not 6/7).
- Implement security items for this phase: S1–S4, A1–A6, Z1 (for users/media), I5, H1, H2
  (without HSTS), H4, H7, B1–B4.
- Write the tests listed in the Phase 1 acceptance criteria.

When finished, do NOT start Phase 2. Produce the phase report exactly in the format from
`AGENTS.md`, save it as `docs/reports/phase-1.md`, open the PR (or, if no remote yet, commit on
the branch), and stop. Include full outputs of: `pnpm ls --depth 0`, lint, typecheck, test, build,
audit, and `git log --oneline main..HEAD`.

If anything in the specs is unclear, contradictory or impossible with the pinned versions, stop
and list it under "Questions for CTO" instead of improvising.
