@echo off
echo ================================
echo Vibe Message - Quick Start Script
echo ================================
echo.

echo [1/6] Checking if .env exists...
if not exist "server\.env" (
    echo ERROR: server/.env not found!
    echo Please run: node server/src/scripts/setupEnv.js
    echo Then add VAPID keys to server/.env
    exit /b 1
)
echo ✓ server/.env found

echo.
echo [2/6] Creating frontend .env...
echo VITE_API_URL=http://localhost:3000 > frontend\.env
echo ✓ frontend/.env created

echo.
echo [3/6] Installing backend dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    exit /b 1
)
cd ..
echo ✓ Backend dependencies installed

echo.
echo [4/6] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)
cd ..
echo ✓ Frontend dependencies installed

echo.
echo [5/6] Installing SDK dependencies...
cd sdk
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install SDK dependencies
    exit /b 1
)
cd ..
echo ✓ SDK dependencies installed

echo.
echo [6/6] Setting up database...
cd server
call npm run db:setup
if errorlevel 1 (
    echo ERROR: Failed to setup database
    echo Make sure PostgreSQL is running and database exists
    exit /b 1
)
cd ..
echo ✓ Database schema created

echo.
echo ================================
echo ✓ Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Start backend:  cd server ^&^& npm run dev
echo 2. Start frontend: cd frontend ^&^& npm run dev
echo 3. Visit: http://localhost:5173
echo.
echo Super Admin Login:
echo   Email: admin@fcmclone.com
echo   Password: SuperAdmin@123
echo.
