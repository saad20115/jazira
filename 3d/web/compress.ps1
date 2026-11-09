# Repeatable GLB compression for the Al Jazira live model (R3a, guards + pools in R4).
#   powershell -ExecutionPolicy Bypass -File C:\aljazira-3d\web\compress.ps1
# Inputs:  web\src\tower_src.glb, web\src\tower-lite_src.glb   (Blender: blend\scripts\export_glb.py ... AUTO full|lite)
# Outputs: web\tower.glb, web\tower-lite.glb, web\inspect_<name>.md, web\manifest.json
# Needs:   Node (npx), KTX-Software 4.4.2 (toktx) in C:\Program Files\KTX-Software\bin.
#   normal, per-panel metal/roughness, baked lamp pools, pilaster wash, studio room light (v022n) -> KTX2 UASTC level 2 + Zstd 18
#                             (pools + wash + room are smooth gradients: ETC1S bands / blotches)
#   occlusion                 -> UASTC in tower, ETC1S in tower-lite (size budget)
#   baseColor + other emissive-> KTX2 ETC1S quality 255
#   geometry                  -> EXT_meshopt_compression (quantised, medium)
# Then guard.mjs fails the run on a budget breach, a non-KTX2 texture or a GPU texture estimate over its cap.
# Options:
#   -Names tower-lite        re-run one file only
#   -Rdo 2                   UASTC RDO (lambda) on the occlusion slot
#   -LiteAo uastc            tower-lite occlusion in UASTC instead of ETC1S
#   -Suffix _x               experiment: write build\<name>_x.glb (+ inspect), skip the release guard
#   -OutDir build\v020       candidate build (the release web\*.glb + manifest are frozen, v019c): read
#                            <OutDir>\src\<name>_src.glb, write <OutDir>\<name>.glb + inspect + its own manifest.json
# A single slot must be written without braces: '{normalTexture}' has no comma, is not brace-expanded and matches nothing.
param([string[]]$Names = @('tower', 'tower-lite'), [double]$Rdo = 0,
      [ValidateSet('etc1s', 'uastc')][string]$LiteAo = 'etc1s', [string]$Suffix = '', [string]$OutDir = '')
$ErrorActionPreference = 'Stop'
$CLI_VERSION = '4.5.1'
$CLI = "@gltf-transform/cli@$CLI_VERSION"
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') + ';C:\Program Files\KTX-Software\bin'
$web = $PSScriptRoot
$build = Join-Path $web 'build'
New-Item -ItemType Directory -Force $build | Out-Null

function GT([string[]]$a) {
    & npx --yes $CLI @a
    if ($LASTEXITCODE -ne 0) { throw "gltf-transform $($a[0]) failed" }
}

$UASTC = @('--level', '2', '--zstd', '18')
$AO_RDO = if ($Rdo -gt 0) { @('--rdo', '--rdo-lambda', "$Rdo") } else { @() }
foreach ($name in $Names) {
    $dst = if ($OutDir) { Join-Path $web $OutDir } else { $web }
    $src = Join-Path $dst "src\${name}_src.glb"
    $t = @(1..5 | ForEach-Object { Join-Path $build "$name$Suffix.$_.glb" })
    $out = if ($Suffix) { Join-Path $build "$name$Suffix.glb" } else { Join-Path $dst "$name.glb" }
    $md = if ($Suffix) { Join-Path $build "inspect_$name$Suffix.md" } else { Join-Path $dst "inspect_$name.md" }
    $ao = if ($name -eq 'tower' -or $LiteAo -eq 'uastc') { 'uastc' } else { 'etc1s' }
    $start = Get-Date
    GT (@('uastc', $src, $t[0], '--slots', '{normalTexture,metallicRoughnessTexture}') + $UASTC)
    GT (@('uastc', $t[0], $t[1], '--slots', 'emissiveTexture', '--pattern', '{tex_lamp_pools*,tex_pilaster_wash*,tex_roomlight*}') + $UASTC)
    if ($ao -eq 'uastc') {
        GT (@('uastc', $t[1], $t[2], '--slots', 'occlusionTexture') + $UASTC + $AO_RDO)
        $etc = '{baseColorTexture,emissiveTexture}'
    } else {
        Copy-Item $t[1] $t[2]
        $etc = '{baseColorTexture,emissiveTexture,occlusionTexture}'
    }
    GT @('etc1s', $t[2], $t[3], '--slots', $etc, '--quality', '255')      # already-KTX2 textures are left alone
    GT @('meshopt', $t[3], $out, '--level', 'medium')
    GT @('inspect', $out, '--format', 'md') | Out-File -Encoding utf8 $md
    '{0}{1}: {2:N0} bytes in {3:N1} s (occlusion {4}{5})' -f $name, $Suffix, (Get-Item $out).Length,
        ((Get-Date) - $start).TotalSeconds, $ao, $(if ($Rdo -gt 0 -and $ao -eq 'uastc') { ", RDO lambda $Rdo" } else { '' })
}

if (-not $Suffix) {
    $toktx = ((cmd /c 'toktx --version 2>&1') -join ' ').Trim()       # toktx prints its version on stderr
    & node (Join-Path $web 'guard.mjs') $web $toktx $CLI_VERSION $(if ($OutDir) { Join-Path $web $OutDir } else { $web })
    if ($LASTEXITCODE -ne 0) { throw 'release guard failed (see GUARD FAILED above)' }
}
