[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("Start", "Stop")]
  [string]$Action,

  [Parameter(Mandatory = $true)]
  [string]$ProjectRoot,

  [switch]$SkipBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$runtimeDirectory = Join-Path $resolvedProjectRoot ".buzz-runtime"
$sessionFile = Join-Path $runtimeDirectory "session.json"
$hostUrl = "http://localhost:5173/"
$hostHealthUrl = "http://127.0.0.1:5173/"
$buzzPorts = @(3001, 5173, 5174)

function Remove-SessionFile {
  if (Test-Path -LiteralPath $sessionFile) {
    Remove-Item -LiteralPath $sessionFile -Force
  }
}

function Read-Session {
  if (-not (Test-Path -LiteralPath $sessionFile)) {
    return $null
  }

  try {
    return Get-Content -LiteralPath $sessionFile -Raw | ConvertFrom-Json
  }
  catch {
    Write-Warning "Buzz runtime state was unreadable and will be removed."
    Remove-SessionFile
    return $null
  }
}

function Get-TrackedProcess {
  param([Parameter(Mandatory = $true)]$Session)

  try {
    $processId = [int]$Session.pid
    $expectedStartTicks = [long]$Session.startTimeUtcTicks
    $process = Get-Process -Id $processId -ErrorAction Stop
  }
  catch {
    return $null
  }

  if ($process.ProcessName -ine "cmd") {
    return $null
  }

  if ($process.StartTime.ToUniversalTime().Ticks -ne $expectedStartTicks) {
    return $null
  }

  return $process
}

function Get-ListeningBuzzPorts {
  $activePorts = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners().Port
  return @($buzzPorts | Where-Object { $activePorts -contains $_ })
}

function Get-TrackedProcessTree {
  param([Parameter(Mandatory = $true)][int]$RootProcessId)

  $processSnapshot = @(Get-CimInstance -ClassName Win32_Process | Select-Object ProcessId, ParentProcessId)
  $childrenByParent = @{}
  foreach ($entry in $processSnapshot) {
    $parentKey = [string]$entry.ParentProcessId
    if (-not $childrenByParent.ContainsKey($parentKey)) {
      $childrenByParent[$parentKey] = @()
    }
    $childrenByParent[$parentKey] += $entry
  }

  $result = @()
  $queue = New-Object System.Collections.Queue
  $queue.Enqueue([pscustomobject]@{ ProcessId = $RootProcessId; Depth = 0 })

  while ($queue.Count -gt 0) {
    $current = $queue.Dequeue()
    try {
      $process = Get-Process -Id $current.ProcessId -ErrorAction Stop
      $result += [pscustomobject]@{
        ProcessId = $process.Id
        StartTimeUtcTicks = $process.StartTime.ToUniversalTime().Ticks
        Depth = $current.Depth
      }
    }
    catch {
      continue
    }

    $childKey = [string]$current.ProcessId
    if ($childrenByParent.ContainsKey($childKey)) {
      foreach ($child in $childrenByParent[$childKey]) {
        $queue.Enqueue([pscustomobject]@{
          ProcessId = [int]$child.ProcessId
          Depth = $current.Depth + 1
        })
      }
    }
  }

  return $result
}

function Test-HostReady {
  try {
    $response = Invoke-WebRequest -Uri $hostHealthUrl -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  }
  catch {
    return $false
  }
}

function Start-Buzz {
  New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null

  $existingSession = Read-Session
  if ($null -ne $existingSession) {
    $existingProcess = Get-TrackedProcess -Session $existingSession
    if ($null -ne $existingProcess) {
      Write-Host "Buzz is already running (tracked launcher PID $($existingProcess.Id))."
      if (-not $SkipBrowser) {
        Start-Process $hostUrl
      }
      return 0
    }

    Write-Host "Removing stale Buzz runtime state."
    Remove-SessionFile
  }

  $occupiedPorts = @(Get-ListeningBuzzPorts)
  if ($occupiedPorts.Count -gt 0) {
    throw "Cannot start Buzz because required port(s) $($occupiedPorts -join ', ') are already listening. No process was stopped."
  }

  $sessionId = [Guid]::NewGuid().ToString("N")
  $devCommand = "title Buzz Development - $sessionId && set BUZZ_SESSION_ID=$sessionId && npm.cmd run dev"
  $cmdArguments = "/d /s /c `"$devCommand`""

  Write-Host "Launching the canonical development command: npm.cmd run dev"
  $launcherProcess = Start-Process `
    -FilePath $env:ComSpec `
    -ArgumentList $cmdArguments `
    -WorkingDirectory $resolvedProjectRoot `
    -PassThru

  Start-Sleep -Milliseconds 150
  $launcherProcess.Refresh()
  if ($launcherProcess.HasExited) {
    throw "The Buzz development launcher exited immediately with code $($launcherProcess.ExitCode)."
  }

  $session = [ordered]@{
    version = 1
    sessionId = $sessionId
    projectRoot = $resolvedProjectRoot
    pid = $launcherProcess.Id
    startTimeUtcTicks = $launcherProcess.StartTime.ToUniversalTime().Ticks
    hostUrl = $hostUrl
    ports = $buzzPorts
    createdAtUtc = [DateTime]::UtcNow.ToString("o")
  }

  $temporarySessionFile = "$sessionFile.tmp"
  $session | ConvertTo-Json | Set-Content -LiteralPath $temporarySessionFile -Encoding UTF8
  Move-Item -LiteralPath $temporarySessionFile -Destination $sessionFile -Force

  Write-Host "Waiting for the Buzz host, controller, and server..."
  $deadline = [DateTime]::UtcNow.AddSeconds(60)
  while ([DateTime]::UtcNow -lt $deadline) {
    $launcherProcess.Refresh()
    if ($launcherProcess.HasExited) {
      Remove-SessionFile
      throw "The Buzz development launcher stopped before startup completed. Check the development window for the npm error."
    }

    $listeningPorts = @(Get-ListeningBuzzPorts)
    if (
      @($buzzPorts | Where-Object { $listeningPorts -notcontains $_ }).Count -eq 0 -and
      (Test-HostReady)
    ) {
      Write-Host "Buzz is ready at $hostUrl"
      if (-not $SkipBrowser) {
        Start-Process $hostUrl
      }
      return 0
    }

    Start-Sleep -Milliseconds 500
  }

  throw "Buzz is still running, but startup did not become ready within 60 seconds. Check the development window; use STOP_BUZZ.cmd to end this tracked session."
}

function Stop-Buzz {
  $session = Read-Session
  if ($null -eq $session) {
    Write-Host "Buzz is already stopped; no tracked launcher session exists."
    return 0
  }

  if ([string]$session.projectRoot -ine $resolvedProjectRoot) {
    throw "Buzz runtime state belongs to a different project path. No process was stopped."
  }

  $launcherProcess = Get-TrackedProcess -Session $session
  if ($null -eq $launcherProcess) {
    Write-Host "The tracked Buzz launcher is no longer running. Removing stale runtime state."
    Remove-SessionFile
    return 0
  }

  $processId = $launcherProcess.Id
  Write-Host "Stopping tracked Buzz launcher PID $processId and only its child process tree..."

  # Stop supervising parents before their workers so the dev runner cannot
  # respawn a child while a leaf-first process-tree shutdown is in progress.
  $trackedTree = @(Get-TrackedProcessTree -RootProcessId $processId)
  foreach ($trackedEntry in ($trackedTree | Sort-Object Depth, ProcessId)) {
    try {
      $candidate = Get-Process -Id $trackedEntry.ProcessId -ErrorAction Stop
      if ($candidate.StartTime.ToUniversalTime().Ticks -eq $trackedEntry.StartTimeUtcTicks) {
        Stop-Process -Id $trackedEntry.ProcessId -Force -ErrorAction Stop
      }
    }
    catch {
      if ($null -ne (Get-Process -Id $trackedEntry.ProcessId -ErrorAction SilentlyContinue)) {
        throw
      }
    }
  }
  Start-Sleep -Seconds 1

  if ($null -ne (Get-TrackedProcess -Session $session)) {
    throw "The tracked Buzz launcher could not be stopped. Runtime state was retained for another attempt."
  }

  Remove-SessionFile

  $deadline = [DateTime]::UtcNow.AddSeconds(10)
  do {
    $listeningPorts = @(Get-ListeningBuzzPorts)
    if ($listeningPorts.Count -eq 0) {
      Write-Host "Buzz stopped. Development ports 3001, 5173, and 5174 are released."
      return 0
    }
    Start-Sleep -Milliseconds 500
  } while ([DateTime]::UtcNow -lt $deadline)

  throw "The tracked Buzz process tree stopped, but port(s) $($listeningPorts -join ', ') remain in use. They were not killed because they may belong to unrelated processes."
}

try {
  if ($Action -eq "Start") {
    exit (Start-Buzz)
  }

  exit (Stop-Buzz)
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
