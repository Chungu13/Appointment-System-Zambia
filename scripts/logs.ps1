# Stream live Railway logs for the Appointment-System-Zambia service
# Usage: .\scripts\logs.ps1

$ErrorActionPreference = "Stop"

# ── 1. Check / install Railway CLI ───────────────────────────────────────────
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Railway CLI not found. Installing via npm..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
        Write-Error "Railway CLI install failed. Install manually: npm i -g @railway/cli"
        exit 1
    }
}

Write-Host "Railway CLI: $(railway --version)" -ForegroundColor Green

# ── 2. Check login status ─────────────────────────────────────────────────────
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Opening browser for Railway login..." -ForegroundColor Yellow
    railway login
}
Write-Host "Logged in as: $whoami" -ForegroundColor Green

# ── 3. Link project / environment / service ───────────────────────────────────
Write-Host "Linking to eloquent-endurance / production / Appointment-System-Zambia..." -ForegroundColor Cyan
railway link `
    --project  eloquent-endurance `
    --environment production `
    --service  "Appointment-System-Zambia"

# ── 4. Stream logs ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Streaming logs - Appointment-System-Zambia (production)" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

railway logs --lines 100
