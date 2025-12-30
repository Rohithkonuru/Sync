@echo off
echo ===================================================
echo Starting Sync Production Server
echo ===================================================
echo.
echo This script starts the backend server which now also serves
echo the compiled frontend application.
echo.
echo Access the application at: http://localhost:8000
echo.

cd backend
if exist venv\Scripts\activate (
    call venv\Scripts\activate
) else (
    echo Virtual environment not found. Please set up the backend first.
    pause
    exit /b
)

python run_server.py
pause
