# P3-T5 round 8 evidence: O-9a and O-9b after the CTO's round 9 (non-authoritative)

Raw files the executor made; nothing here is a number of record. The machine was loaded throughout
(other sessions and apps), so none of these runs is a fair measure of speed; the verifier's
quiet-machine run decides. Videos, screenshots and Chrome traces are kept outside the repository.

The final build is `next start` of `2491795` on port 3170, with my own `.env` and Docker project
`p3t5` (the seeded home page published, as the verifier does).

- `e2e/`: the whole P3-T5 spec on the final build, `chromium` and `gpu` projects, retries 0.
- `gates/`: the CTO's `cards-gates.mjs`, `cards-timeline.mjs` and `sky-swap.mjs` from `ca2fc0a`
  (unmodified copies, run by `gates.sh`): `immediate`, `latest`, `onscreen3s` and the timeline three
  runs each, `throttle10` and `held` two runs each, the O-13 sky swap in `en`.
- `mutants/`: the must-fail mutants of this round, each applied, run and reverted:
  - `m6-clones-not-filled`: a fill that does not reach GLTFLoader's clones
    (`src/p3-t5-pending-textures.test.ts` fails);
  - `m7-parse-waits-for-transcode`: the plugin resolves only after the transcode (the same test fails).
- `timelines/`: three runs of the CTO's `immediate` flow with temporary timing marks in the viewer
  (never committed), on an earlier build of this round's placeholder change (`createViewer.ts` then
  also had an abortable download helper, removed before the commit; the flow is the same). Each file
  lists, from the click, the viewer's steps (`start`, `ctx`, `ext`, `data`, `parsed`, `bounds`,
  `texturesReady`, `compiled`, `links`, `envReady`, `probe1`), the card's states, long tasks and frame
  gaps. These are the remaining serial steps the report names.
- `later-clicks/`:
  - `transition-immediate-*-probe.json`: the CTO's `immediate` flow on the transition build (the raw
    page probe; the later clicks' long tasks and gaps are in it);
  - `dom-log-probe.json`: the same flow with a DOM mutation log added to the probe (`dom`: added and
    removed elements with their time), used to find what changes after a later click.
- `dod-fresh-clone/`: the DoD from a new `file://` clone of the branch at `2491795`.
