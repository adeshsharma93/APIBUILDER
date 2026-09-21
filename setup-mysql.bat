@echo off
REM SQL API Builder - MySQL Quick Setup Script for Windows
REM This script helps you set up the application with MySQL

echo.
echo 🚀 SQL API Builder - MySQL Quick Setup
echo ======================================
echo.

REM Check if MySQL is installed
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MySQL is not installed or not in PATH!
    echo.
    echo Please install MySQL first:
    echo   - Download from https://dev.mysql.com/downloads/installer/
    echo   - Or use XAMPP/WAMP which includes MySQL
    echo.
    pause
    exit /b 1
)

echo ✅ MySQL is installed
echo.

REM Get MySQL credentials
echo 📝 Enter your MySQL credentials:
echo.
set /p MYSQL_HOST="MySQL Host (default: localhost): "
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

set /p MYSQL_PORT="MySQL Port (default: 3306): "
if "%MYSQL_PORT%"=="" set MYSQL_PORT=3306

set /p MYSQL_USER="MySQL Username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASSWORD="MySQL Password: "

set /p DB_NAME="Database Name (default: sql_api_builder): "
if "%DB_NAME%"=="" set DB_NAME=sql_api_builder

echo.
echo 🔧 Setting up configuration...

REM Generate random keys
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set ENCRYPTION_KEY=%%i
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i

REM Create .env file
(
echo # Server Configuration
echo PORT=3001
echo NODE_ENV=development
echo.
echo # MySQL Configuration
echo DB_TYPE=mysql
echo MYSQL_DB_HOST=%MYSQL_HOST%
echo MYSQL_DB_PORT=%MYSQL_PORT%
echo MYSQL_DB_USER=%MYSQL_USER%
echo MYSQL_DB_PASSWORD=%MYSQL_PASSWORD%
echo MYSQL_DB_NAME=%DB_NAME%
echo.
echo # Security Configuration
echo ENCRYPTION_KEY=%ENCRYPTION_KEY%
echo JWT_SECRET=%JWT_SECRET%
echo.
echo # CORS Configuration
echo CORS_ORIGINS=http://localhost:3000,http://localhost:5173
) > server\.env

echo ✅ Configuration file created
echo.

REM Create database
echo 🗄️  Creating database...
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create database. Please check your MySQL credentials.
    pause
    exit /b 1
)

echo ✅ Database created successfully
echo.

REM Run migrations
echo 📦 Running database migrations...
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %DB_NAME% < server\migrations\mysql\001_initial_schema.sql 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to run migrations
    pause
    exit /b 1
)

echo ✅ Migrations completed successfully
echo.

REM Install dependencies
echo 📥 Installing dependencies...
cd server
call npm install --silent
cd ..
call npm install --silent

echo ✅ Dependencies installed
echo.

echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo    1. Start the backend: cd server ^&^& npm run dev
echo    2. Start the frontend: npm run dev (in a new terminal)
echo    3. Open http://localhost:3000 in your browser
echo.
echo 📚 For detailed instructions, see MYSQL_SETUP_GUIDE.md
echo.
pause
