package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class AuthHandler {
    public String handle(String method, String path, String body) {
        if (path.equals("/api/auth/login") && method.equals("POST")) {
            return login(body);
        }
        
        // New registration endpoint
        if (path.equals("/api/auth/register") && method.equals("POST")) {
            return register(body);
        }
        
        // Public endpoint to get all services (for booking)
        if (path.equals("/api/services") && method.equals("GET")) {
            return getAllServices();
        }
        
        // Test endpoint to check database connection
        if (path.equals("/api/test") && method.equals("GET")) {
            return testDatabaseConnection();
        }
        
        return "{\"error\":\"Auth route not found\"}";
    }

    // Existing login method
    private String login(String body) {
        Map<String, String> params = parseBody(body);
        String username = params.get("username");
        String password = params.get("password");

        if (username == null || password == null) {
            return "{\"error\":\"Username and password are required\"}";
        }

        String sql = "SELECT role, full_name, id FROM users WHERE username = ? AND password = ?";
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, username);
            pstmt.setString(2, password); // In a real app, hash the password first!

            ResultSet rs = pstmt.executeQuery();

            if (rs.next()) {
                String role = rs.getString("role");
                String fullName = rs.getString("full_name");
                int userId = rs.getInt("id");
                // Successful login
                return String.format(
                    "{\"message\":\"Login successful\", \"role\":\"%s\", \"fullName\":\"%s\", \"userId\":%d}",
                    role, fullName, userId);
            } else {
                // Failed login
                return "{\"error\":\"Invalid credentials\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error during login\"}";
        }
    }
    
    // New registration method
    private String register(String body) {
        Map<String, String> params = parseBody(body);
        String username = params.get("username");
        String password = params.get("password");
        String fullName = params.get("fullName");
        
        if (username == null || password == null || fullName == null) {
            return "{\"error\":\"Username, password, and full name are required\"}";
        }
        
        // Check if username already exists
        String checkSql = "SELECT id FROM users WHERE username = ?";
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
            
            checkStmt.setString(1, username);
            ResultSet rs = checkStmt.executeQuery();
            
            if (rs.next()) {
                return "{\"error\":\"Username already exists\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error checking username\"}";
        }
        
        // Insert new customer
        String sql = "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'customer')";
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setString(1, username);
            pstmt.setString(2, password); // In production, hash this password
            pstmt.setString(3, fullName);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                ResultSet generatedKeys = pstmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    int userId = generatedKeys.getInt(1);
                    return String.format(
                        "{\"message\":\"Registration successful\", \"userId\":%d, \"role\":\"customer\", \"fullName\":\"%s\"}",
                        userId, fullName);
                }
            }
            return "{\"error\":\"Failed to register user\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error during registration\"}";
        }
    }
    
    // Public services endpoint
    private String getAllServices() {
        String sql = "SELECT id, service_name, price, description FROM services WHERE is_active = true ORDER BY service_name";
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");

        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            boolean first = true;
            while (rs.next()) {
                if (!first) {
                    jsonBuilder.append(",");
                }
                jsonBuilder.append("{");
                jsonBuilder.append("\"id\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"serviceName\":\"").append(escapeJson(rs.getString("service_name"))).append("\",");
                jsonBuilder.append("\"price\":").append(rs.getBigDecimal("price")).append(",");
                jsonBuilder.append("\"description\":\"").append(escapeJson(rs.getString("description") != null ? rs.getString("description") : "")).append("\"");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching services\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    // Test database connection
    private String testDatabaseConnection() {
        try (Connection conn = DatabaseConnector.getConnection()) {
            if (conn != null && !conn.isClosed()) {
                // Test a simple query
                String sql = "SELECT COUNT(*) as user_count FROM users WHERE is_active = true";
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        int userCount = rs.getInt("user_count");
                        return "{\"status\":\"success\", \"message\":\"Database connection working\", \"userCount\":" + userCount + "}";
                    }
                }
                return "{\"status\":\"success\", \"message\":\"Database connection working\"}";
            } else {
                return "{\"status\":\"error\", \"message\":\"Database connection failed\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"status\":\"error\", \"message\":\"Database error: " + escapeJson(e.getMessage()) + "\"}";
        }
    }

    // Utility method for parsing JSON-like body with improved validation
    private Map<String, String> parseBody(String body) {
        if (body == null || body.trim().isEmpty()) {
            return new HashMap<>();
        }
        
        // Simple JSON parsing for basic key-value pairs
        Map<String, String> result = new HashMap<>();
        body = body.trim();
        
        // Remove outer braces
        if (body.startsWith("{") && body.endsWith("}")) {
            body = body.substring(1, body.length() - 1);
        }
        
        // Split by comma, but be careful about commas in values
        String[] pairs = body.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
        
        for (String pair : pairs) {
            String[] keyValue = pair.split(":", 2);
            if (keyValue.length == 2) {
                String key = keyValue[0].trim().replace("\"", "");
                String value = keyValue[1].trim().replace("\"", "");
                
                // Basic input validation
                if (key.length() > 0 && key.length() <= 100 && value.length() <= 1000) {
                    result.put(key, value);
                }
            }
        }
        
        return result;
    }
    
    // Utility method to escape JSON strings
    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}