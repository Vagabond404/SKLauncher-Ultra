@echo off
echo Starting SKLauncher 4.0 from source...
set RUNTIME="C:\Users\ange-\AppData\Local\Programs\sklauncher\sklauncher.exe"

if exist %RUNTIME% (
  echo Using installed SKLauncher Electron runtime: %RUNTIME%
  %RUNTIME% "%~dp0.."
) else (
  echo Launching via npx electron...
  npx electron "%~dp0.."
)
