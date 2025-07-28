@echo off
REM Fee Calculation Engine - Quick Setup Script (Windows)
REM This script will get you running in under 5 minutes!

echo 🚀 Fee Calculation Engine - Quick Setup
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available. Please reinstall Node.js.
    pause
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 📄 Setting up environment...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo ✅ Created .env file from .env.example
        echo ⚠️  Please edit .env file with your database credentials before continuing.
        echo.
        echo Press any key when you've configured your .env file...
        pause >nul
    ) else (
        echo ⚠️  No .env.example found. Creating basic .env file...
        (
            echo # Database Configuration
            echo DB_HOST=localhost
            echo DB_PORT=3306
            echo DB_USERNAME=root
            echo DB_PASSWORD=your_password
            echo DB_DATABASE=fee_calc
            echo DB_SYNCHRONIZE=true
            echo DB_LOGGING=true
            echo.
            echo # Application Port
            echo PORT=3000
        ) > .env
        echo ✅ Created basic .env file
        echo ⚠️  Please edit .env file with your database credentials before continuing.
        echo.
        echo Press any key when you've configured your .env file...
        pause >nul
    )
) else (
    echo ✅ .env file already exists
)

echo.
echo 🗄️  Setting up database...

REM Try to run migrations
echo Running database migrations...
call npm run migration:run
if errorlevel 1 (
    echo ❌ Database migration failed. Please check:
    echo    1. MySQL is running
    echo    2. Database credentials in .env are correct
    echo    3. Database 'fee_calc' exists ^(or create it manually^)
    pause
    exit /b 1
)
echo ✅ Database migrations completed

REM Try to seed rules
echo.
echo 🌱 Seeding initial rules...
call npm run seed:rules
if errorlevel 1 (
    echo ⚠️  Rule seeding failed, but you can continue. Rules can be added via API.
) else (
    echo ✅ Initial rules seeded successfully
)

echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo 🚀 To start the service:
echo    npm run start:dev
echo.
echo 📖 Once running, the service will be available at:
echo    http://localhost:3000
echo.
echo 📚 Documentation:
echo    • README.md - Complete setup and usage guide
echo    • API_SAMPLES.md - Ready-to-use API examples
echo.
echo 🧪 Quick test ^(after starting the service^):
echo    curl -X POST http://localhost:3000/transactions/calculate-fee-pure ^
echo      -H "Content-Type: application/json" ^
echo      -d "{\"transaction\":{\"type\":\"POS\",\"amount\":75,\"currency\":\"EUR\"},\"client\":{\"name\":\"Test\",\"creditScore\":300,\"segment\":\"standard\"}}"
echo.
echo Happy calculating! 💰
echo.
pause