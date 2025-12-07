@echo off
echo Starting Quantum Mempool Monitor...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

REM Navigate to project directory
cd /d "%~dp0\.."

REM Run the PowerShell startup script
powershell -ExecutionPolicy Bypass -File "scripts\run-quantum-monitor.ps1" -Minimal

pause
