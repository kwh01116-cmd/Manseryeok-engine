@echo off
setlocal DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
if not exist "runtime\node.exe" (
  echo Put this file in the extracted collection folder next to start-kasi-collection.cmd.
  pause
  exit /b 1
)
if not exist ".private\kasi-local-1950-2026\monthly-xml\pages\solar-1950-0-0-xml-1.json" (
  echo No cached 1950 response found. Put this patch into the SAME extracted folder used for collection.
  pause
  exit /b 1
)
"runtime\node.exe" ".kasi-build\diagnose.js"
set "KASI_DIAGNOSTIC_EXIT=%ERRORLEVEL%"
pause
exit /b %KASI_DIAGNOSTIC_EXIT%
