#!/usr/bin/env powershell
# QUORIXA Backend starter.
# Starts the backend only if a healthy instance is not already running on PORT.
# Default health check: http://localhost:5000/api/v1/health

$ErrorActionPreference = 'Stop'

$projectRoot = 'C:\Users\mrniv\OneDrive\Desktop\projects\QUORIXA'
$backendPath = Join-Path $projectRoot 'backend'
$port = 5000
$healthUrl = "http://localhost:$port/api/v1/health"

function Test-BackendHealthy([int]$TimeoutSeconds = 4) {
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec $TimeoutSeconds -ErrorAction Stop
        return $response.success -eq $true
    } catch {
        return $false
    }
}

function Test-PortInUse([int]$Port) {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

Write-Host '=== QUORIXA Backend ===' -ForegroundColor Green
Write-Host "Project root: $backendPath" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath (Join-Path $backendPath 'package.json'))) {
    Write-Host "[ERROR] Could not find package.json under $backendPath" -ForegroundColor Red
    Write-Host '        Update `$projectRoot` at the top of this script.' -ForegroundColor Red
    exit 1
}

if (Test-BackendHealthy) {
    Write-Host "[OK] Backend is already running and healthy at $healthUrl" -ForegroundColor Green
    Write-Host '     No new process was started.' -ForegroundColor Green
    exit 0
}

if (Test-PortInUse $port) {
    Write-Host "[WARN] Port $port is busy but the health check failed ($healthUrl)." -ForegroundColor Yellow
    Write-Host '       Inspect processes with: Get-NetTCPConnection -LocalPort 5000' -ForegroundColor Yellow
}

Write-Host 'Starting QUORIXA backend ...' -ForegroundColor Yellow
Write-Host "Health check will be available at $healthUrl" -ForegroundColor Cyan

$process = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev' -WorkingDirectory $backendPath -WindowStyle Hidden -PassThru
Write-Host "Backend process started (PID $($process.Id))." -ForegroundColor Cyan

$started = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    Start-Sleep -Seconds 1
    if (Test-BackendHealthy) {
        $started = $true
        break
    }
}

if ($started) {
    Write-Host "[OK] Backend is up and healthy: $healthUrl" -ForegroundColor Green
} else {
    Write-Host '[ERROR] Backend did not become healthy within 30 seconds.' -ForegroundColor Red
    Write-Host '        Check the backend logs and .env configuration.' -ForegroundColor Red
    exit 1
}