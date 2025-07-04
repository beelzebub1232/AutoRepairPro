@echo off
set LIB_DIR=lib
set JDBC_JAR=%LIB_DIR%\mysql-connector-j-8.0.33.jar
set BUILD_DIR=build

echo Starting the AutoRepairPro server...
java -cp "%BUILD_DIR%;%JDBC_JAR%" com.autorepairpro.Main