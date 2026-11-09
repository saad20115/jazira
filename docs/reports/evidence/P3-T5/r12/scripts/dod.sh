#!/usr/bin/env bash
# Executor DoD (non-authoritative) from a fresh clone of the branch. Usage: dod.sh <sha> <cloneDir> <logDir>
SHA=$1; C=$2; L=$3
mkdir -p "$L"; rm -rf "$C"
git clone --no-local --branch p3-t5-live-3d /d/jazira-p3t5 "$C" > "$L/clone.log" 2>&1
cd "$C" || exit 1
git checkout -q "$SHA"; git log -1 --format='%H %an %s' >> "$L/clone.log"
(git lfs pull; echo "exit=$?") > "$L/lfs-pull.log" 2>&1
cp /d/jazira-p3t5/.env .env
step(){ n=$1; shift; "$@" > "$L/$n.log" 2>&1; echo "exit=$?" >> "$L/$n.log"; echo "$n $(tail -1 "$L/$n.log")"; }
step install corepack pnpm install --frozen-lockfile
step lint corepack pnpm lint
step typecheck corepack pnpm typecheck
step format-check corepack pnpm format:check
step test corepack pnpm test
step build corepack pnpm build
step audit-prod corepack pnpm audit --prod
step audit-full corepack pnpm audit
rm -f .env
echo DODDONE
