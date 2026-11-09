#!/usr/bin/env bash
# CTO verifier, P3-T5 r12: fresh clone at 1cf1f8d, env, Docker project aljazira-verify18 (pg 5468, smtp 1064, ui 8064, app 3330).
set -e; V=/d/jazira-verify/2026-11-09; R=$V/p3t5m; mkdir -p $V/logs/p3t5m
git clone -q --no-local /d/jazira-p3t5 $R; cd $R; git checkout -q 1cf1f8d; git lfs pull; git fsck --no-progress > $V/logs/p3t5m/fsck.txt 2>&1; echo "fsck exit $?" >> $V/logs/p3t5m/fsck.txt
git diff --stat fa5694e 1cf1f8d -- . ':!docs' ':!handoff/reports' > $V/logs/p3t5m/code-vs-tip.txt
node /d/jazira-verify/2026-11-01/scripts/make-env.mjs /d/jazira-verify/2026-11-05/p3t5l/.env .env 5468 1064 8064 3330
sed -i 's#postgres://#postgresql://#' .env
docker compose -p aljazira-verify18 -f docker-compose.dev.yml --env-file .env up -d
git rev-parse HEAD
