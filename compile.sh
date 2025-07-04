#!/bin/bash

# Directory containing the JAR file
LIB_DIR="lib"
# The JAR file
JDBC_JAR="$LIB_DIR/mysql-connector-j-8.0.33.jar"
# Output directory for compiled classes
BUILD_DIR="build"
# Source directory
SRC_DIR="src"

# Check if the JDBC driver exists
if [ ! -f "$JDBC_JAR" ]; then
    echo "ERROR: MySQL JDBC driver not found at $JDBC_JAR"
    echo "Please download it and place it in the 'lib' directory."
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p $BUILD_DIR

# Compile all .java files from the src directory
echo "Compiling Java source files..."
javac -d $BUILD_DIR -cp "$JDBC_JAR" $(find $SRC_DIR -name "*.java")

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "Compilation successful. Class files are in the '$BUILD_DIR' directory."
else
    echo "Compilation failed."
fi