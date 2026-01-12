$ErrorActionPreference = 'Stop'

function Write-Info([string]$Message) {
  Write-Host $Message -ForegroundColor Cyan
}

function Write-Warn([string]$Message) {
  Write-Host $Message -ForegroundColor Yellow
}

function Write-Fail([string]$Message) {
  Write-Host $Message -ForegroundColor Red
}

Set-Location -Path $PSScriptRoot

Write-Info "Starting dev server (Vite) from: $PSScriptRoot"

# Refresh PATH from persisted environment variables so newly-installed Node.js is picked up
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$pathParts = @($machinePath, $userPath) | Where-Object { $_ -and $_.Trim() } | ForEach-Object { $_.Trim().TrimEnd(';') }
$env:Path = ($pathParts -join ';')

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Fail "Node.js is not installed or not on PATH. Install Node.js LTS, then try again."
  exit 1
}

$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
  $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
}

Write-Info ("node: " + (node -v))
if ($npmCmd) {
  Write-Info ("npm:  " + (& $npmCmd.Source -v))
} else {
  Write-Warn "npm not found in this shell. Will try to start Vite via node directly."
}

$nodeModulesPath = Join-Path $PSScriptRoot 'node_modules'
if (-not (Test-Path -Path $nodeModulesPath)) {
  if (-not $npmCmd) {
    Write-Fail "node_modules not found and npm is unavailable. Reinstall Node.js (includes npm), then run: npm install"
    exit 1
  }

  Write-Info "node_modules not found; running npm install..."
  & $npmCmd.Source install
}

if (-not (Test-Path -Path (Join-Path $PSScriptRoot '.env.local'))) {
  Write-Warn ".env.local not found. If the app needs AI evaluation, create .env.local (see .env.example) with OPENAI_API_KEY=... and/or GEMINI_API_KEY=..."
}

$devUrl = 'http://localhost:3000/'
Write-Info "Starting: npm run dev:full"
Write-Info "Then open: $devUrl"

try {
  Start-Process $devUrl | Out-Null
} catch {
  # Non-fatal (some systems block Start-Process for URLs)
}

$viteBin = Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'
$concurrentlyBin = Join-Path $PSScriptRoot 'node_modules\concurrently\dist\bin\concurrently.js'

if ($npmCmd) {
  & $npmCmd.Source run dev:full
} elseif (Test-Path -Path $viteBin) {
  if (Test-Path -Path $concurrentlyBin) {
    node $concurrentlyBin -k -n web,ai -c cyan,magenta "node $viteBin --host :: --port 3000" "node $PSScriptRoot\server\index.mjs"
  } else {
    node $viteBin --host :: --port 3000
  }
} else {
  Write-Fail "Vite not found. Run: npm install"
  exit 1
}
