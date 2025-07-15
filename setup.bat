@echo off
setlocal ENABLEDELAYEDEXPANSION

REM === AutoRepairPro Setup Script ===

REM 1. Check for MySQL client
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MySQL client (mysql.exe) not found in PATH.
    echo Please install MySQL and ensure mysql.exe is in your system PATH.
    pause
    exit /b 1
)

REM 2. Prompt for MySQL credentials
set /p DB_USER=Enter your MySQL username [root]: 
if "%DB_USER%"=="" set DB_USER=root
set /p DB_PASS=Enter your MySQL password (input will be visible): 

REM 3. Run the SQL file
echo.
echo [INFO] Setting up the database using autorepairpro_db.sql ...
mysql -u %DB_USER% -p%DB_PASS% < autorepairpro_db.sql
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to execute autorepairpro_db.sql. Please check your credentials and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Database setup completed.

REM 4. Check for JDBC driver
if exist "lib\mysql-connector-j-8.0.33.jar" (
    echo [INFO] MySQL JDBC driver found in lib/.
) else (
    echo [WARNING] MySQL JDBC driver (mysql-connector-j-8.0.33.jar) not found in lib/.
    echo Download it from: https://dev.mysql.com/downloads/connector/j/
    echo and place it in the lib/ directory.
)

echo.
echo [SETUP COMPLETE]
echo Next steps:
echo   1. Edit src\com\autorepairpro\db\DatabaseConnector.java with your DB credentials if needed.
echo   2. Run compile.bat to compile the project.
echo   3. Run run.bat to start the server.
echo   4. Open http://localhost:8080 in your browser.
echo.
pause 