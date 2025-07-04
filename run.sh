#!/bin/bash

LIB_DIR="lib"
JDBC_JAR="$LIB_DIR/mysql-connector-j-8.0.33.jar"
BUILD_DIR="build"

# Run the main class, setting the classpath to include the build directory and the JDBC driver
echo "Starting the AutoRepairPro server..."
java -cp "$BUILD_DIR:$JDBC_JAR" com.autorepairpro.Main