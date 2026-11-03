#!/usr/bin/env bash
# CTO verifier, Antigravity P4-T2 r3 + P3-T14 r3 at 44e0c78. Retries 0 everywhere; every run kept.
R=/d/jazira-verify/2026-11-02/ag-r3; L=/d/jazira-verify/2026-11-02/logs/ag-r3; O=/d/jazira-verify/2026-11-02/lighthouse/ag-r3
PORT=3318; mkdir -p "$L" "$O"; cd "$R" || exit 1
P="corepack pnpm"; SUM="$L/summary.tsv"; echo -e "step\texit\tseconds" > "$SUM"
echo "HEAD $(git rev-parse HEAD)" > "$L/head.txt"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env; set +a
step install $P install --frozen-lockfile
step migrate-up $P payload migrate
step migrate-down $P payload migrate:down
step migrate-up-again $P payload migrate
step migrate-status $P payload migrate:status
step lint $P lint
step typecheck $P typecheck
step format-check $P format:check
step tokens-check $P tokens:check
step test $P test
step build $P build
step audit-full $P audit --prod
step audit-high $P audit --prod --audit-level high
step seed $P seed
PORT=$PORT $P start > "$L/next-start.log" 2>&1 &
SRV=$!; WPID=$(cat /proc/$SRV/winpid); echo "$SRV $WPID" > "$L/next-start.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/admin" && break; sleep 2; done
# e2e global setup creates the fixture admin; run the default suite once first, then publish home and run again
step e2e-default-pre $P exec playwright test --retries=0
step publish-home node /d/jazira-verify/2026-11-01/scripts/publish-as-fixture.mjs http://localhost:$PORT $R/tests/e2e/global-setup.ts true
step e2e-default $P exec playwright test --retries=0
step e2e-p3t14-prodflag env E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 tests/e2e/p3-t14-motion.e2e.spec.ts
step r50-images bash -c "curl -s http://localhost:$PORT/en | node -e 'let s=\"\";process.stdin.on(\"data\",d=>s+=d).on(\"end\",()=>{const m=s.split(\"<main\")[1].split(\"</main>\")[0];const imgs=m.match(/<img[^>]*>/g)||[];console.log(\"img in main:\",imgs.length);console.log(\"src via /_next/image:\",imgs.filter(i=>/src=\"\/_next\/image/.test(i)).length);console.log(\"src via /api/media/file:\",imgs.filter(i=>/src=\"\/api\/media\/file/.test(i)).length);console.log(\"with srcset:\",imgs.filter(i=>/srcSet=|srcset=/.test(i)).length)})'"
step arabic-off node /d/jazira-verify/2026-11-01/scripts/publish-as-fixture.mjs http://localhost:$PORT $R/tests/e2e/global-setup.ts false
echo "server left running: $SRV $WPID" >> "$SUM"
echo done >> "$SUM"
