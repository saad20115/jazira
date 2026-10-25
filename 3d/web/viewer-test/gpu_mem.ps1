# Sum of GPU memory (dedicated + shared, MB) for the Claude desktop app's processes, from Windows
# "GPU Process Memory" counters. Used by R3a to measure the viewer test page (the browser pane runs inside
# the app). Prints one line: "<dedicatedMB> <sharedMB>".
$pids = (Get-Process -Name 'Claude*' -ErrorAction SilentlyContinue).Id
$ded = 0.0; $sha = 0.0
foreach ($s in (Get-Counter '\GPU Process Memory(*)\Dedicated Usage', '\GPU Process Memory(*)\Shared Usage').CounterSamples) {
    if ($s.InstanceName -match '^pid_(\d+)_' -and $pids -contains [int]$Matches[1]) {
        if ($s.Path -match 'dedicated') { $ded += $s.CookedValue } else { $sha += $s.CookedValue }
    }
}
'{0:N1} {1:N1}' -f ($ded / 1MB), ($sha / 1MB)
