@echo off
echo =====================================================================
echo   A.E.R.O.S. - Automated Emergency Response & Optimization Network
echo   Starting Operations API & Spatial Dashboard...
echo =====================================================================

cd /d "%~dp0"

set "PYTHON_CMD=python"
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_CMD=%~dp0.venv\Scripts\python.exe"
)

start "AEROS Backend API (FastAPI)" cmd /k ""%PYTHON_CMD%" api_server.py"
timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend"
start "AEROS Spatial Dashboard (Vite)" cmd /k "npm.cmd run dev -- --host 127.0.0.1 --port 5173"

echo.
echo [OK] Backend API launching on:     http://127.0.0.1:8000
echo [OK] Spatial Dashboard running at: http://127.0.0.1:5173
echo.
pause
