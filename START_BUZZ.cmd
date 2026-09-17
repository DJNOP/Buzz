@echo off
setlocal

set "BUZZ_ROOT=%~dp0"

echo.
echo ========================================
echo Starting Buzz development environment
echo ========================================
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%BUZZ_ROOT%scripts\buzz-session.ps1" -Action Start -ProjectRoot "%BUZZ_ROOT%."
set "BUZZ_EXIT_CODE=%ERRORLEVEL%"

if not "%BUZZ_EXIT_CODE%"=="0" (
  echo.
  echo Buzz did not start successfully. Review the message above and the Buzz development window.
  pause
)

exit /b %BUZZ_EXIT_CODE%
