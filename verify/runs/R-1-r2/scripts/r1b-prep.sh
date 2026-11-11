#!/usr/bin/env bash
# CTO verifier, R-1 round 2: fresh clone at 0b325e5 (code 45a1bd3), env, Docker project aljazira-verify19 (pg 5469, smtp 1071, ui 8071, app 3329).
set -e; V=/d/jazira-verify/2026-11-09; R=$V/r1b; L=$V/logs/r1b; mkdir -p $L
git clone -q --no-local /d/jazira $R; cd $R; git checkout -q 0b325e5; git lfs pull; git fsck --no-progress > $L/fsck.txt 2>&1; echo "fsck exit $?" >> $L/fsck.txt
git rev-parse HEAD > $L/head.txt
git diff --stat 45a1bd3 0b325e5 -- . ':!handoff' > $L/code-vs-tip.txt
node /d/jazira-verify/2026-11-01/scripts/make-env.mjs /d/jazira-verify/2026-11-05/p3t5l/.env .env 5469 1071 8071 3329
sed -i 's#postgres://#postgresql://#' .env
echo "E2E_ADMIN_PASSWORD=$(node -e 'console.log(require("crypto").randomBytes(24).toString("base64url"))')" >> .env
echo "E2E_DATABASE_URL=$(grep '^TEST_DATABASE_URL=' .env | cut -d= -f2-)" >> .env
docker compose -p aljazira-verify19 -f docker-compose.dev.yml --env-file .env up -d
echo prep-done
