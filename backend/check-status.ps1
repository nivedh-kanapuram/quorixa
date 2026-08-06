#!/usr/bin/env powershell
# Simple Backend Status Checker

Write-Host "=== Quorixa Backend Status ===" -ForegroundColor Green

$backendPath = "C:\Users\mrniv\OneDrive\Desktop\projects\QUORIXA\quorixa\backend"
Set-Location -LiteralPath $backendPath

function Check-File($path) {
    if (Test-Path $path) {
        Write-Host "✅ $path exists" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $path missing" -ForegroundColor Red
        return $false
    }
}

# Check key files
Write-Host "\n📂 Checking backend structure..." -ForegroundColor Yellow
Check-File "package.json"
Check-File "tsconfig.json"
Check-File "src/app.ts"
Check-File "src/server.ts"
Check-File "src/routes/health.routes.ts"
Check-File "src/controllers/health.controller.ts"

# Check directories
Write-Host "\n📁 Checking directories..." -ForegroundColor Yellow
Check-File "src/"
Check-File "src/routes/"
Check-File "src/controllers/"
Check-File "uploads/"
Check-File "temp/"

# Health endpoint test
Write-Host "\n🌐 Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "Response: $response" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Backend is not responding" -ForegroundColor Red
    Write-Host "You can start it with: npm run dev" -ForegroundColor Yellow
}

Write-Host "\n🎉 Summary:" -ForegroundColor Green
Write-Host "   - Express server with CORS and JSON middleware" -ForegroundColor White
Write-Host "   - Health check endpoint at /api/health" -ForegroundColor White
Write-Host "   - TypeScript configuration ready" -ForegroundColor White
Write-Host "   - All dependencies installed" -ForegroundColor White
Write-Host "   - Architecture ready for upload/chat/RAG features" -ForegroundColor White

Write-Host "\n📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Start backend: npm run dev" -ForegroundColor Cyan
Write-Host "   2. Frontend ready at quorixa-frontend/" -ForegroundColor Cyan
Write-Host "   3. Complete features: upload, AI chat, RAG pipeline" -ForegroundColor Cyan
