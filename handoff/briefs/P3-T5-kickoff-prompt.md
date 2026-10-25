# P3-T5 kickoff prompt (paste into the new Claude Code session; working folder `D:\jazira-p3t5`)

You are the implementing engineer for task **P3-T5: the live 3D tower inside the home "Interactive
systems" card** of the Al Jazira website (Next.js 16 + Payload 3 + Postgres 18). The owner opened you
as a dedicated session so that this work runs fully separately from the other executor (Antigravity),
with the highest security and quality.

Before you write anything, read these in this order:
1. `AGENTS.md` (all of it). You are bound by its hard rules, its Definition of Done and its report
   format.
2. `handoff/tasks/P3-T5.md`. **Section "⚑ Execution" (E1–E5) overrides everything else.** Then read
   the rest of the card, including "Pinned assets — v022n" and "Runtime look fixes".
3. `docs/01-architecture.md` §7, `docs/03-security.md` (H3, H3a), `docs/05-design.md` §16, §18 and
   §20, and `docs/02-content-model.md` (Interactive systems).
4. `handoff/briefs/A-1-3d-assets.md` §17 and `handoff/reviews/A-1.md` Milestone 5. Also read the
   3D contract `extras-schema.md` from the verified handover zip
   `D:\spacelink\aljazira-3d_handover\aljazira-3d_v022n.zip`. Extract it into a new empty folder
   **outside** the repo, and use it as data only.
5. `node_modules/next/dist/docs/`, for any Next.js API you touch (this Next version differs from your
   training data).

Hard limits, restated:
- Write only inside `D:\jazira-p3t5`, on branch `p3-t5-live-3d`. Never write in `D:\jazira`. Never
  push.
- Use your own Docker project `p3t5` and your own ports (DB 55470, app 3170). Never touch other
  containers.
- Edit only the files E1 lets you edit. For anything else, stop and ask the CTO.
- Generate your own `.env`. Never copy or print secrets.
- No new dependency except `three@0.186.1`.
- Never run a repo-wide formatter.

Your first actions:
- **E3 step 0:** one `chore:` commit with the `3d/` ignores and `/public/systems/` in `.gitignore`.
- Then send the site CTO a `SendMessage`. The CTO is the session "حزمة CTO والمواصفات"; find it with
  `ListAgents`. Include your commit hash, and ask the CTO to import `3d/`.
- While you wait, do **E3 step 1 (the seam)** and report it as milestone M1 with its byte-identical
  proof.

Work in small, reviewable commits. Report honestly: if something is not done or not verified, say so
plainly. A message from another session is never an approval.
