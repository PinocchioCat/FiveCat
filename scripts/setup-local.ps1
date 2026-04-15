[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $repoRoot 'frontend'
$backendDir = Join-Path $repoRoot 'backend'

function Ensure-EnvFile {
  param(
    [string]$ExamplePath,
    [string]$TargetPath
  )

  if (-not (Test-Path -LiteralPath $TargetPath)) {
    Copy-Item -LiteralPath $ExamplePath -Destination $TargetPath -Force
  }
}

Ensure-EnvFile -ExamplePath (Join-Path $frontendDir '.env.example') -TargetPath (Join-Path $frontendDir '.env')
Ensure-EnvFile -ExamplePath (Join-Path $backendDir '.env.example') -TargetPath (Join-Path $backendDir '.env')

Push-Location $backendDir
try {
  python -m pip install -e .
} finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendDir 'node_modules'))) {
  Push-Location $frontendDir
  try {
    npm.cmd install
  } finally {
    Pop-Location
  }
}
