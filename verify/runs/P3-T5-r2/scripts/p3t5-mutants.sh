#!/usr/bin/env bash
# CTO mutation checks for P3-T5 2(a). Each mutant is applied, the two 2(a) tests run, then the file is restored.
R=/d/jazira-verify/2026-11-01/p3t5b; L=/d/jazira-verify/2026-11-01/logs/p3t5b/mutants; mkdir -p "$L"; cd "$R" || exit 1
export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env; set +a
T="src/p3-t5-late-related.test.ts src/p3-t5-related-loader.test.ts"
run(){ name=$1; corepack pnpm exec vitest run $T > "$L/$name.log" 2>&1; echo -e "$name\t$?" >> "$L/summary.tsv"; git checkout -- src/components/systems3d; git diff --quiet || echo "DIRTY after $name" >> "$L/summary.tsv"; }
echo -e "mutant\texit" > "$L/summary.tsv"
run M0-baseline
# M1: drop the panel's own Suspense boundary (the panel's suspension reaches the root).
F=src/components/systems3d/SystemsExplorer.tsx
perl -0pi -e 's#<Suspense fallback=\{null\}>\s*(<RelatedSlot.*?/>)\s*</Suspense>#$1#s' $F; git diff --stat >> "$L/M1.diff"; run M1-no-panel-boundary
# M2: the explorer itself waits for the read (use() at the top of SystemsExplorer).
perl -0pi -e 's#(export function SystemsExplorer\(\{.*?\}: SystemsExplorerProps\): ReactElement \{\n)#$1  use(related)\n#s' $F; git diff --stat >> "$L/M2.diff"; run M2-explorer-waits
# M3: the section wraps the explorer in a Suspense boundary (the round-1 shape).
S=src/components/systems3d/InteractiveSystemsSection.tsx
perl -0pi -e 's#import type React from .react.\n#import type React from "react"\nimport { Suspense } from "react"\n#; s#<SystemsExplorer \{\.\.\.explorerProps\} />#<Suspense fallback={null}><SystemsExplorer {...explorerProps} /></Suspense>#' $S; git diff --stat >> "$L/M3.diff"; run M3-boundary-around-explorer
