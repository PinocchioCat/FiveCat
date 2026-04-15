[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $repoRoot '.logs'

function Stop-FromPidFile {
  param([string]$PidFile)

  if (-not (Test-Path -LiteralPath $PidFile)) {
    return
  }

  $pidValue = Get-Content -LiteralPath $PidFile | Select-Object -First 1
  if ($pidValue -and (Get-Process -Id $pidValue -ErrorAction SilentlyContinue)) {
    Stop-Process -Id $pidValue -Force
  }

  Remove-Item -LiteralPath $PidFile -Force
}

Stop-FromPidFile -PidFile (Join-Path $logsDir 'frontend.pid')
Stop-FromPidFile -PidFile (Join-Path $logsDir 'backend.pid')
