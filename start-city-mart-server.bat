@echo off
REM Start City Mart backend server from the correct project folder
echo Starting City Mart Server...
echo.

REM Navigate to project directory
cd /d C:\Users\HP\Desktop\city-mart--main

REM Check if server is already running and kill it
echo Checking for existing Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Stopping existing Node.js processes...
    taskkill /F /IM node.exe >NUL 2>&1
    timeout /t 2 /nobreak >NUL
)

REM Start the server
echo Starting server on port 3000...
echo.
node server.js

REM Pause to keep window open if there's an error
pause
