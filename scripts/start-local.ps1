[CmdletBinding()]
param(
  [switch]$WithInfra
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $repoRoot '.logs'
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

function Get-Listener {
  param([int]$Port)
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Ensure-PortAvailable {
  param(
    [int]$Port,
    [string]$Name
  )

  $listener = Get-Listener -Port $Port
  if ($null -eq $listener) {
    return
  }

  $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
  if ($processInfo.CommandLine -like "*$repoRoot*") {
    Stop-Process -Id $listener.OwningProcess -Force
    Start-Sleep -Seconds 1
    return
  }

  throw "$Name 端口 $Port 已被其他进程占用: $($processInfo.Name) ($($processInfo.ProcessId))"
}

function Resolve-PythonWithUvicorn {
  $candidates = @(
    (Join-Path $backendDir '.venv\Scripts\python.exe'),
    (Join-Path $repoRoot '.venv\Scripts\python.exe'),
    'python'
  )

  foreach ($candidate in $candidates) {
    $exists = $candidate -eq 'python' -or (Test-Path -LiteralPath $candidate)
    if (-not $exists) {
      continue
    }

    try {
      & $candidate -c "import uvicorn" 2>$null
      if ($LASTEXITCODE -eq 0) {
        return $candidate
      }
    } catch {
      continue
    }
  }

  throw '未找到可用的 Python + uvicorn 环境，请先执行 scripts\setup-local.ps1。'
}

function Start-ServiceProcess {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory,
    [string]$StdoutPath,
    [string]$StderrPath,
    [string]$PidPath
  )

  $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -RedirectStandardOutput $StdoutPath -RedirectStandardError $StderrPath -PassThru
  Set-Content -LiteralPath $PidPath -Value $process.Id -Encoding ASCII
  $process
}

function Wait-ForHttp {
  param(
    [string]$Url,
    [string]$Name,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 | Out-Null
      return
    } catch {
      Start-Sleep -Milliseconds 800
    }
  } while ((Get-Date) -lt $deadline)

  throw "$Name 启动超时，请检查日志。"
}

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
Ensure-EnvFile -ExamplePath (Join-Path $frontendDir '.env.example') -TargetPath (Join-Path $frontendDir '.env')
Ensure-EnvFile -ExamplePath (Join-Path $backendDir '.env.example') -TargetPath (Join-Path $backendDir '.env')

if (-not (Test-Path -LiteralPath (Join-Path $frontendDir 'node_modules'))) {
  throw '未检测到 frontend/node_modules，请先执行 scripts\setup-local.ps1。'
}

if ($WithInfra) {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if ($null -eq $docker) {
    throw '未检测到 Docker，无法启动 PostgreSQL / Redis 基础设施。'
  }

  Push-Location $repoRoot
  try {
    docker compose up -d
  } finally {
    Pop-Location
  }
}

Ensure-PortAvailable -Port 8000 -Name '后端'
Ensure-PortAvailable -Port 5174 -Name '前端'

$pythonExe = Resolve-PythonWithUvicorn

$backendProcess = Start-ServiceProcess `
  -FilePath $pythonExe `
  -Arguments @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000') `
  -WorkingDirectory $backendDir `
  -StdoutPath (Join-Path $logsDir 'backend.out.log') `
  -StderrPath (Join-Path $logsDir 'backend.err.log') `
  -PidPath (Join-Path $logsDir 'backend.pid')

$frontendProcess = Start-ServiceProcess `
  -FilePath 'npm.cmd' `
  -Arguments @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5174') `
  -WorkingDirectory $frontendDir `
  -StdoutPath (Join-Path $logsDir 'frontend.out.log') `
  -StderrPath (Join-Path $logsDir 'frontend.err.log') `
  -PidPath (Join-Path $logsDir 'frontend.pid')

Wait-ForHttp -Url 'http://127.0.0.1:8000/' -Name '后端'
Wait-ForHttp -Url 'http://127.0.0.1:5174/' -Name '前端'

[pscustomobject]@{
  frontend_url = 'http://127.0.0.1:5174/'
  backend_url = 'http://127.0.0.1:8000/'
  frontend_pid = $frontendProcess.Id
  backend_pid = $backendProcess.Id
  logs = $logsDir
} | Format-List
