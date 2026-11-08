@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if exist "runtime\node.exe" (
  "runtime\node.exe" ".kasi-build\local.js" validate %*
  pause
  exit /b
)
if not exist ".kasi-build\local.js" (
  echo Run setup with start-kasi-collection.cmd first. Validation itself requires no key or API calls.
  pause
  exit /b 1
)
node .kasi-build\local.js validate %*
pause
