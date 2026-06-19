@echo off
title EPION Launcher
echo =======================================================
echo        EPION PWA - LAUNCHER
echo =======================================================
echo.
echo Launching Backend API Server (Port 5000)...
start cmd /k "cd backend && title EPION API Backend && npm start"

echo Launching Frontend Client (Port 3000)...
start cmd /k "cd frontend && title EPION PWA Client && npm run dev"

echo.
echo =======================================================
echo Both servers are starting up:
echo 1. Backend REST API: http://localhost:5000
echo 2. PWA Frontend App: http://localhost:3000
echo =======================================================
echo.
pause
