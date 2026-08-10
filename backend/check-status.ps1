#!/usr/bin/env powershell
# QUORIXA Backend Status Checker
# Checks the backend at the current project path on port 5000.

$ErrorActionPreference = 'SilentlyContinue'

$backendPath = 'C:\Users\mrniv\OneDrive\Desktop\projects\QUORIXA\backend'
$healthUrl = 'http://localhost:5000/api/v1/health'

Write-Host '=== QUORIXA Backend Status ===' -ForegroundColor Green

Write-Host "Backend folder: $backendPath" -ForegroundColor Yellow
Write-Host -NoNewline '   package.json  '
Write-Host (if (Test-Path (Join-Path $backendPath 'package.json')) { '[OK]' } else { '[MISSING]' })
Write-Host -NoNewline '   src/app.ts    '
Write-Host (if (Test-Path (Join-Path $backendPath 'src\app.ts')) { '[OK]' } else { '[MISSING]' })
Write-Host -NoNewline '   src/server.ts '
Write-Host (if (Test-Path (Join-Path $backendPath 'src\server.ts')) { '[OK]' } else { '[MISSING]' })
Write-Host -NoNewline '   .env exists   '
Write-Host (if (Test-Path (Join-Path $backendPath '.env')) { '[OK]' } else { '[MISSING]' })

Write-Host "Testing health endpoint at $healthUrl ..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 4
    Write-Host '[OK] Backend is running and healthy!' -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host '[ERROR] Backend is not responding.' -ForegroundColor Red
    Write-Host '         Start it with:  powershell -File .\start-backend.ps1' -ForegroundColor Yellow
}

Write-Host 'Useful endpoints:' -ForegroundColor White
Write-Host '   Health:   http://localhost:5000/api/v1/health' -ForegroundColor Cyan
Write-Host '   Library:  http://localhost:5000/api/v1/library' -ForegroundColor Cyan
Write-Host '   Chat:     http://localhost:5000/api/v1/chat/query' -ForegroundColor Cyan
Write-Host '   Frontend: http://localhost:5173' -ForegroundColor Cyan