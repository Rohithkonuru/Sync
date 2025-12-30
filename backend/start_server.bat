@echo off
echo Starting Sync Backend Server...
cd /d %~dp0
venv\Scripts\python.exe run_server.py
pause
