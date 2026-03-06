@echo off
echo Starting Smart Up Backend Server...
echo.

cd /d %~dp0

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo.
    echo Please create a .env file with your Supabase credentials.
    echo Copy env.example to .env and fill in your values.
    echo.
    pause
    exit /b 1
)

REM Start server
echo Starting server on http://localhost:3001...
echo.
node server.js

pause


