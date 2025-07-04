package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class AuthHandler {
    public String handle(String method, String path, String body) {
        if (path.equals("/api/auth/login") && method.equals("POST")) {
            return login(body);
        }
        return "{\"error\":\"Auth route not found\"}";
    }

    private String login(String body) {
        // Simple manual JSON parsing for "username" and "password"
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

    // A very basic parser for `{key:value,key2:value2}`.
    private Map<String, String> parseBody(String body) {
        return Stream.of(body.replace("{", "").replace("}", "").replace("\"", "").split(","))
                .map(s -> s.split(":", 2))
                .collect(Collectors.toMap(a -> a[0].trim(), a -> a[1].trim()));
    }
}