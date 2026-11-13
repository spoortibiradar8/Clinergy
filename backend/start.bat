@echo off
title ClinErgy Python Backend
echo.
echo  ====================================================
echo   ClinErgy Clinical Energy ^& Asset Management
echo   Python FastAPI Backend  v2.0.0
echo  ====================================================
echo.

:: ── Check Python is installed ─────────────────────────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not on PATH.
    echo         Download from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: ── Move into backend directory ───────────────────────────────────────────
cd /d "%~dp0"

:: ── Create virtual environment if it doesn't exist ───────────────────────
if not exist "venv\Scripts\activate.bat" (
    echo [1/3] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:: ── Activate virtual environment ──────────────────────────────────────────
echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

:: ── Install / upgrade dependencies ───────────────────────────────────────
echo [3/3] Installing dependencies from requirements.txt...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] pip install failed. Check requirements.txt.
    pause
    exit /b 1
)

:: ── Launch the server ─────────────────────────────────────────────────────
echo.
echo  Starting Uvicorn on http://127.0.0.1:8000
echo  API Docs available at http://127.0.0.1:8000/docs
echo  Press Ctrl+C to stop.
echo.
uvicorn main:app --reload --host 127.0.0.1 --port 8000

pause
