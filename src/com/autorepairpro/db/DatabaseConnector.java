package com.autorepairpro.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnector {
    // --- IMPORTANT ---
    // Update these values with your actual MySQL database credentials.
    private static final String DB_URL = "jdbc:mysql://localhost:3306/autorepairpro_db";
    private static final String DB_USER = "root"; // Replace with your MySQL username
    private static final String DB_PASSWORD = ""; // Replace with your MySQL password

    private static Connection connection = null;

    // Private constructor to prevent instantiation.
    private DatabaseConnector() {}

    public static Connection getConnection() {
        try {
            // Load the MySQL JDBC driver.
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            if (connection == null || connection.isClosed()) {
                connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
            }
        } catch (SQLException | ClassNotFoundException e) {
            System.err.println("Database connection failed!");
            e.printStackTrace();
            return null;
        }
        return connection;
    }
}