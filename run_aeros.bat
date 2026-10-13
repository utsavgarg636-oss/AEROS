@echo off
echo =====================================================================
echo   A.E.R.O.S. - Automated Emergency Response & Optimization Network
echo   Starting Operations API & Spatial Dashboard...
echo =====================================================================

start "AEROS Backend API (FastAPI)" cmd /k "python api_server.py"
timeout /t 2 /nobreak >nul

cd frontend
start "AEROS Spatial Dashboard (Vite)" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo [OK] Backend API launching on:     http://127.0.0.1:8000
echo [OK] Spatial Dashboard running at: http://127.0.0.1:5173
echo.
pause
