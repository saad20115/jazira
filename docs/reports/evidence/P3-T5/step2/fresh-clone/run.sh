#!/usr/bin/env bash
# Fresh-clone evidence for P3-T5 step 2: clone, LFS pull, install, build (sync runs first),
# then scan the client chunks. Every step logs start/end/exit. Re-runnable: it removes the clone first.
set -u
SCR="C:/Users/User21.CSE/AppData/Local/Temp/claude/D--jazira-p3t5/4826cabb-68e8-4efd-abbd-f7a167afa0eb/scratchpad"
CLONE="$SCR/fresh-step2"
LOGS="$SCR/fresh-step2-logs"
rm -rf "$CLONE" "$LOGS"
mkdir -p "$LOGS"

step() {
  local name="$1"; shift
  echo "[$name] start $(date -Is)" | tee -a "$LOGS/steps.log"
  "$@" > "$LOGS/$name.log" 2>&1
  local code=$?
  echo "[$name] end $(date -Is) exit $code" | tee -a "$LOGS/steps.log"
  return $code
}

step clone git clone --branch p3-t5-live-3d "file:///D:/jazira-p3t5" "$CLONE" || exit 1
cd "$CLONE" || exit 1
step lfs-pull git lfs pull || exit 1
{ git rev-parse HEAD; git lfs ls-files | wc -l; head -c 4 3d/web/tower.glb | od -c | head -1; } > "$LOGS/clone-state.log" 2>&1
cp "D:/jazira-p3t5/.env" .env
step install pnpm install --frozen-lockfile || exit 1
step build pnpm build || exit 1
step scan bash -c '
  for p in fflate meshoptimizer tween.js @tweenjs rapier3d @dimforge stats.js "Stats.js" "three.module" "REVISION = \"186\"" "WebGLRenderer"; do
    n=$(grep -rlF -- "$p" .next/static 2>/dev/null | wc -l)
    echo "client chunks containing \"$p\": $n"
  done
  echo "public/systems/v022n files: $(find public/systems/v022n -type f | wc -l)"
  git status --short
'
echo "done $(date -Is)" | tee -a "$LOGS/steps.log"
