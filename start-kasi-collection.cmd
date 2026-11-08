@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if exist "runtime\node.exe" (
  "runtime\node.exe" ".kasi-build\local.js" wizard %*
  pause
  exit /b
)
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.19+ within version 22 is required. Or use the Windows x64 portable package.
  pause
  exit /b 1
)
node -e "const v=process.versions.node.split('.').map(Number);if(v[0]!==22||v[1]<19)process.exit(1)"
if errorlevel 1 (
  echo Node.js 22.19+ within version 22 is required.
  pause
  exit /b 1
)
call npm ci --no-audit --no-fund
if errorlevel 1 goto failed
call npm run kasi:build --silent
if errorlevel 1 goto failed
node .kasi-build\local.js wizard %*
pause
exit /b
:failed
echo Setup failed. No API collection started.
pause
exit /b 1
