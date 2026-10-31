@echo off
cd /d "%~dp0"
echo ========================================================
echo   Pushing SKLauncher Ultra to GitHub (Vagabond404)
echo ========================================================
echo Current Directory: %CD%
echo.
git push -u origin main
echo.
pause
