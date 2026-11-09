(Get-Counter '\GPU Engine(*engtype_3D)\Utilization Percentage' -SampleInterval 2 -MaxSamples 3).CounterSamples | Where-Object { $_.CookedValue -gt 0.5 } | ForEach-Object { $_.InstanceName + ' ' + [math]::Round($_.CookedValue,1) }
Get-Process avpui -ErrorAction SilentlyContinue | ForEach-Object { 'avpui running ' + $_.Id }
'freeGB ' + [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB,1)
