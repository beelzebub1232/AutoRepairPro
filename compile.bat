@echo off
set LIB_DIR=lib
set JDBC_JAR=%LIB_DIR%\mysql-connector-j-8.0.33.jar
set BUILD_DIR=build
set SRC_DIR=src

if not exist "%JDBC_JAR%" (
    echo ERROR: MySQL JDBC driver not found at %JDBC_JAR%
    echo Please download it and place it in the 'lib' directory.
    exit /b 1
)

if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

echo Compiling Java source files...
javac -d %BUILD_DIR% -cp "%JDBC_JAR%" %SRC_DIR%\com\autorepairpro\*.java %SRC_DIR%\com\autorepairpro\db\*.java %SRC_DIR%\com\autorepairpro\handler\*.java %SRC_DIR%\com\autorepairpro\server\*.java

if %errorlevel% equ 0 (
    echo Compilation successful.
) else (
    echo Compilation failed.
)