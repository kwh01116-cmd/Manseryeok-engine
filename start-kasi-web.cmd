@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 first, then double-click this file again.
  pause
  exit /b 1
)
node -e "const v=process.versions.node.split('.').map(Number);if(v[0]!==22||v[1]<19)process.exit(1)"
if errorlevel 1 (
  echo Node.js 22.19 or newer within version 22 is required.
  pause
  exit /b 1
)
call npm ci --no-audit --no-fund
if errorlevel 1 (
  pause
  exit /b 1
)
call npm run kasi:web
pause
