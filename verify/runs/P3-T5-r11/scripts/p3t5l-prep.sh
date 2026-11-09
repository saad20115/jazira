#!/usr/bin/env bash
# CTO verifier, P3-T5 r11: fresh clone at d579282, env, Docker project aljazira-verify16 (pg 5466, smtp 1062, ui 8062, app 3328).
set -e; V=/d/jazira-verify/2026-11-05; R=$V/p3t5l; mkdir -p $V/logs/p3t5l
git clone -q --no-local /d/jazira-p3t5 $R; cd $R; git checkout -q d579282; git lfs pull; git fsck --no-progress > $V/logs/p3t5l/fsck.txt 2>&1; echo "fsck exit $?" >> $V/logs/p3t5l/fsck.txt
git diff --stat 331ae43 d579282 -- . ':!docs' ':!handoff/reports' > $V/logs/p3t5l/code-vs-tip.txt
node /d/jazira-verify/2026-11-01/scripts/make-env.mjs $V/p3t5k/.env .env 5466 1062 8062 3328
sed -i 's#postgres://#postgresql://#' .env
docker compose -p aljazira-verify16 -f docker-compose.dev.yml --env-file .env up -d
git rev-parse HEAD
