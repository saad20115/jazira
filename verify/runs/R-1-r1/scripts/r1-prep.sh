#!/usr/bin/env bash
# CTO verifier, R-1 round 1: fresh clone at df4ecdc (r-1-safety), env, Docker project aljazira-verify17 (pg 5467, smtp 1063, ui 8063, app 3329).
set -e; V=/d/jazira-verify/2026-11-09; R=$V/r1; L=$V/logs/r1; mkdir -p $L
git clone -q --no-local /d/jazira $R; cd $R; git checkout -q df4ecdc; git lfs pull; git fsck --no-progress > $L/fsck.txt 2>&1; echo "fsck exit $?" >> $L/fsck.txt
git rev-parse HEAD > $L/head.txt
git diff --stat bfe0bd5 df4ecdc -- . ':!handoff' > $L/code-vs-tip.txt
node /d/jazira-verify/2026-11-01/scripts/make-env.mjs /d/jazira-verify/2026-11-05/p3t5l/.env .env 5467 1063 8063 3329
sed -i 's#postgres://#postgresql://#' .env
echo "E2E_ADMIN_PASSWORD=$(node -e 'console.log(require("crypto").randomBytes(24).toString("base64url"))')" >> .env
docker compose -p aljazira-verify17 -f docker-compose.dev.yml --env-file .env up -d
echo prep-done
