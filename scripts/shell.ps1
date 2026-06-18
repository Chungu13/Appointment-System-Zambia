# Open a Railway shell session on the production Django service
# Usage: .\scripts\shell.ps1
#
# Once connected, run Django commands directly on the server, e.g.:
#   python manage.py shell
#   python manage.py migrate_schemas --noinput
#   python manage.py createsuperuser

$ErrorActionPreference = "Stop"

# ── 1. Check Railway CLI ──────────────────────────────────────────────────────
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "Railway CLI not found. Installing via npm..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
        Write-Error "Railway CLI install failed. Install manually: npm i -g @railway/cli"
        exit 1
    }
}

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

# ── 4. Open shell ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Railway shell — Appointment-System-Zambia (production)" -ForegroundColor White
Write-Host "  You are now on the Railway server. Type 'exit' to close." -ForegroundColor DarkGray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

railway shell
