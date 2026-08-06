#!/usr/bin/env powershell
# Quorixa Backend Status Checker

$backendPath = 'C:\Users\mrniv\OneDrive\Desktop\projects\QUORIXA\quorixa\backend'
Set-Location -LiteralPath $backendPath

function Start-Backend() {
    Write-Host "🚀 Starting Quorixa Backend..." -ForegroundColor Yellow
    npm run dev
}

function Check-Health() {
    Write-Host "🔍 Checking health endpoint..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -TimeoutSec 5
        Write-Host "✅ Backend is running!" -ForegroundColor Green
        Write-Host "Response: $response" -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ Backend is not responding" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main script
Write-Host "=== Quorixa Backend Status ===" -ForegroundColor Green

# First check if server is running
if (Check-Health) {
    Write-Host "🎉 Backend is operational and ready!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Backend is not running" -ForegroundColor Yellow
    Write-Host "Starting backend now..." -ForegroundColor Yellow
    Start-Backend
}
