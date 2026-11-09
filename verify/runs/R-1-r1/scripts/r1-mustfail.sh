#!/usr/bin/env bash
# CTO verifier, R-1 must-fail: for each finding, put the fix's non-test files back to the base 34f3597 and run only
# that finding's new tests. Each must FAIL; then the files are restored and the same tests must PASS. Retries 0.
V=/d/jazira-verify/2026-11-09; R=$V/r1; L=$V/logs/r1/mustfail; mkdir -p "$L"; cd "$R" || exit 1
export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env; set +a
SUM="$L/summary.tsv"; echo -e "case\tphase\texit\tseconds" > "$SUM"
run(){ c=$1; ph=$2; shift 2; s=$(date +%s); corepack pnpm exec vitest run "$@" > "$L/$c-$ph.log" 2>&1; echo -e "$c\t$ph\t$?\t$(( $(date +%s)-s ))" >> "$SUM"; }
mf(){ c=$1; files=$2; shift 2; git checkout -q 34f3597 -- $files; git status --short > "$L/$c-reverted-status.txt"; run $c base "$@"; git checkout -q df4ecdc -- $files; git status --short > "$L/$c-restored-status.txt"; run $c fix "$@"; }
# A01: behavioural mutant (the base behaviour inside the new export): serializeJsonLd( -> JSON.stringify( in layout.tsx
LAY="src/app/(frontend)/[locale]/layout.tsx"; sed -i "s/return serializeJsonLd(/return JSON.stringify(/" "$LAY"; git diff --stat > "$L/A01-reverted-status.txt"; run A01 base src/lib/jsonLd.test.ts; git checkout -q df4ecdc -- "$LAY"; git status --short > "$L/A01-restored-status.txt"; run A01 fix src/lib/jsonLd.test.ts
mf A02-A10 "src/collections/Media.ts src/collections/Videos.ts src/security/uploadValidation.ts next.config.ts" src/security/uploadValidation.test.ts
mf A05-A06 "src/payload.config.ts" src/access/z1-config-enumeration.test.ts
mf A08-A09 "src/env.ts src/security/emailAdapter.ts" src/env.test.ts src/security/emailAdapter.test.ts
mf D14 "src/seed/materials.ts src/seed/p4-t2.ts" src/seed/materials.test.ts
mf A03 "tests/e2e/global-setup.ts tests/e2e/admin-smoke.spec.ts tests/int/p3-t12.int.test.ts" tests/e2e/global-setup.test.ts
INT=$(git diff --name-only 34f3597 df4ecdc -- 'tests/int/*.int.test.ts' | tr '\n' ' ')
mf E07 "$INT" tests/int/_helpers/testDbIsolation.test.ts
git status --short > "$L/final-status.txt"
echo done >> "$SUM"
