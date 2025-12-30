Write-Host "Starting Sync Backend Server..." -ForegroundColor Green
Set-Location $PSScriptRoot
.\venv\Scripts\python.exe run_server.py

