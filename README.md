# AutoRepairPro - Automotive Bodyshop Management System

This project was bootstrapped with a Python script. It contains a complete, runnable web application with a raw Java backend and a vanilla JavaScript frontend.

## Project Structure

- `src/`: Contains all Java source code.
- `lib/`: Should contain the MySQL JDBC driver JAR file.
- `public/`: Contains all frontend assets (HTML, CSS, JS).
- `build/`: Will contain compiled `.class` files after running the compile script.
- `database_setup.sql`: SQL script to initialize the database.
- `compile.sh`/`compile.bat`: Scripts to compile the Java code.
- `run.sh`/`run.bat`: Scripts to run the Java web server.

## How to Run the Project

### Step 1: Prerequisites

1.  **Java Development Kit (JDK)**: Make sure you have a JDK (version 8 or later) installed.
2.  **MySQL Server**: Ensure you have a MySQL server running.

### Step 2: Setup

1.  **Download MySQL JDBC Driver**:
    - Download the "Platform Independent" `.jar` file from the [official MySQL website](https://dev.mysql.com/downloads/connector/j/).
    - Place the downloaded `mysql-connector-j-x.x.xx.jar` file into the `lib/` directory.
    - **IMPORTANT**: Rename the file to `mysql-connector-j-8.0.33.jar` or update the `compile` and `run` scripts to match your file's name.

2.  **Configure Database Connection**:
    - Open `AutoRepairPro/src/com/autorepairpro/db/DatabaseConnector.java`.
    - Update the `DB_USER` and `DB_PASSWORD` variables with your MySQL credentials.

3.  **Create Database**:
    - Connect to your MySQL server using a tool like MySQL Workbench or the command-line client.
    - Execute the contents of the `database_setup.sql` file to create the database, tables, and sample data.

### Step 3: Compile and Run

1.  **Open a terminal** or command prompt in the `AutoRepairPro` root directory.

2.  **Compile the code**:
    - **On Linux/macOS**: `bash compile.sh`
    - **On Windows**: `compile.bat`

3.  **Run the server**:
    - **On Linux/macOS**: `bash run.sh`
    - **On Windows**: `run.bat`

4.  **Access the Application**:
    - Open your web browser and navigate to: **http://localhost:8080**

### Sample Login Credentials

- **Admin**: `admin` / `admin123`
- **Employee**: `tech1` / `tech123`
- **Customer**: `johndoe` / `customer123`