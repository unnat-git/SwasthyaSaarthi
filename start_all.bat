@echo off
echo Starting Swastai Healthcare Platform...

echo Launching FastAPI Backend on http://localhost:8008 ...
start "FastAPI Backend" cmd /k "cd /d C:\Users\rajun\Desktop\swastai\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8008 --reload"

echo Launching Next.js Frontend on http://localhost:3005 ...
start "Next.js Frontend" cmd /k "cd /d C:\Users\rajun\Desktop\swastai && npm run dev -- -p 3005"

echo.
echo Platform Started Successfully!
echo Backend API Docs: http://localhost:8008/docs
echo Frontend PWA: http://localhost:3005
echo.
