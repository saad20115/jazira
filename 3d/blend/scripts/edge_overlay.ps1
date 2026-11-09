param([string]$render, [string]$out, [int]$size = 900)
# Model edges (red) over the reference, for camera matching.
$ff = "C:\Users\HOME\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
& $ff -y -loglevel error -i $render -i C:\aljazira-3d\ref\tower-render.png -filter_complex "[0:v]format=gray,edgedetect=low=0.02:high=0.06,dilation,format=gray,split[e1][e2];[e2]lut=y=0,split[g][b];[g][b][e1]mergeplanes=0x001020:gbrp[ec];[1:v]format=gbrp,colorchannelmixer=rr=0.5:gg=0.5:bb=0.5[bg];[bg][ec]blend=all_mode=screen,scale=${size}:${size}" $out
