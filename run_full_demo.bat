@echo off
REM Full pipeline demo: geocode + Sentinel-2 + weather + Flock. Requires Python 3.11 or 3.12.
setlocal
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
  echo Using existing .venv
  .venv\Scripts\python.exe demo.py
  exit /b %errorlevel%
)

py -3.12 --version >nul 2>&1
if %errorlevel% equ 0 (
  echo Creating Python 3.12 venv for full pipeline...
  py -3.12 -m venv .venv
  call .venv\Scripts\activate.bat
  pip install -r requirements.txt
  python demo.py
  exit /b %errorlevel%
)

py -3.11 --version >nul 2>&1
if %errorlevel% equ 0 (
  echo Creating Python 3.11 venv for full pipeline...
  py -3.11 -m venv .venv
  call .venv\Scripts\activate.bat
  pip install -r requirements.txt
  python demo.py
  exit /b %errorlevel%
)

echo.
echo [ERROR] Python 3.11 or 3.12 is required for the full pipeline (Sentinel-2).
echo Install from https://www.python.org/downloads/ then run:
echo   py -3.12 -m venv .venv
echo   .venv\Scripts\activate
echo   pip install -r requirements.txt
echo   python demo.py
echo.
exit /b 1
