# 00 — Machine setup handover (DESKTOP-FDD1KEI)

> **Paths:** since R3a the project lives at `C:\aljazira-3d` (the S: share is offline). Read every `S:\...` path below as `C:\...`.

Setup was approved by the CTO session on 2026-10-22. No modelling has started yet.

## Machine
- Windows 11 Pro 10.0.26200
- i7-12700H (14 cores, 20 threads), 15.7 GB RAM
- NVIDIA RTX 3050 Laptop GPU, 4 GB VRAM, driver 610.62
- Intel UHD (iGPU)
- Free disk: C: 122.6 GB, S: 318.9 GB. The project lives on S:.
- Blender 5.2.3 LTS at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`
- Cycles devices: CUDA and OptiX both see the RTX 3050.

## Tools
| Tool | Version | Path |
|---|---|---|
| uv / uvx | 0.13.5 (46776a95d 2026-10-21) | `C:\Users\HOME\AppData\Local\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\` |
| ffmpeg | 9.0.2-full_build (gyan.dev) | `C:\Users\HOME\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe` |
| git | 2.53.0.windows.1 | `C:\Program Files\Git\cmd\git.exe` |
| node | v24.13.1 | `C:\Program Files\nodejs\node.exe` |
| python | **none** (only the Microsoft Store stub) | use uv-managed Python 3.12 |

The `claude` CLI is not on PATH. The app's bundled copy is `C:\Users\HOME\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\2.1.308\c17a819afb40\claude.exe`. The version folder changes when the app updates.

## uv workaround (MSIX)
The Claude desktop app runs as an MSIX package, so its writes under `AppData\Roaming` are virtualized. That breaks uv's managed-Python junctions, and uv fails with:

```
Missing expected target directory for Python minor version link
```

Set the variable below per command (it is **not** set system-wide) and pass `--python 3.12`:

```powershell
$env:UV_PYTHON_INSTALL_DIR = "$env:USERPROFILE\.uv-python"
uvx --python 3.12 mcp-for-blender==2.2.2 --help
```

A new shell may also need PATH refreshed:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
```

## Blender MCP (mcp-for-blender==2.2.2, pinned)
- Addon installed with `uvx --python 3.12 mcp-for-blender==2.2.2 install-addon`. It is at:
  `C:\Users\HOME\AppData\Roaming\Blender Foundation\Blender\5.2\scripts\addons\blender_mcp.py`
  - Size 287,396 bytes, bl_info version 1.8
  - sha256 `229EE114F0504B486BDD24BBC8B08FA9B22112F5E831EF8B2E9CC507E9CCBBFE`
- The addon is enabled and saved in Blender user preferences.
- Telemetry consent is OFF (the default).
- MCP server registered at user scope (all projects) with this command:

```powershell
& "C:\Users\HOME\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\2.1.308\c17a819afb40\claude.exe" mcp add -s user blender -e DISABLE_TELEMETRY=true -e "UV_PYTHON_INSTALL_DIR=C:\Users\HOME\.uv-python" -- "C:\Users\HOME\AppData\Local\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\uvx.exe" --python 3.12 mcp-for-blender==2.2.2
```

  `claude mcp get blender` reported `Status: √ Connected`.
- Socket server: auto-start is on, and it listens on **127.0.0.1:9876 only**. This was verified with `Get-NetTCPConnection`. `get_scene_info` and `get_telemetry_consent` both returned success (consent false).
- Integrations:
  - Poly Haven is ON.
  - Hyper3D, Hunyuan3D, Sketchfab, Tripo, Meshy and Poly Pizza are OFF.
  - These are **Scene properties**, so they are saved per .blend. **Re-enable Poly Haven in the master .blend** once it is created, and keep the rest off.
- When Blender's stdout is redirected on Windows, the console output is buffered (see `blender-console.log`), so it may be empty.

## Working folder
`S:\aljazira-3d\` contains `ref\`, `blend\`, `renders\`, `web\` and `reports\`.

## References (Figma file `tD3pU1vtvSr8akTMJPFLkA`)
| File | Figma source | Size | Dimensions |
|---|---|---|---|
| `ref\tower-render.png` | 170:1050 "IMG / tower-render" raw fill: **the look to match** | 1,934,619 B | 1024×1024 |
| `ref\04-interactive-systems.png` | 111:1608 Home › Interactive systems, screenshot 1:1 (whole section) | 860,338 B | 1440×922 |
| `ref\3d-building.png` | 116:1199 "3D Building" component export (12 Angle frames) | 2,611,899 B | 2600×1900 |
| `ref\3d-building-angle-raw.png` | 116:1199 raw fill | 1,934,619 B | 1024×1024 |
| `ref\A-1-3d-assets.md` | CTO brief (verbatim) | — | — |

The "3D Building" angle image is byte-identical to `tower-render.png`, so there is no real 3D source.

## Render guidance from the CTO (for later)
- Cycles settings: OptiX device, OptiX denoiser, adaptive sampling.
- Keep VRAM under 3.5 GB:
  - instance trees, lamps and cars
  - use a photo backplate or low-poly blocks for the city context
  - keep textures at 2K or smaller
- First deliverable: ONE hero still at 1440×1440, timed.
- Follow the review rounds in the brief (R1 blockout, R2 look-dev, R3 finals), and stop after each round to report to the CTO.
