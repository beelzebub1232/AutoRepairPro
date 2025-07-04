package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;

public class AdminHandler {
    public String handle(String method, String path, String body) {
        if (path.equals("/api/admin/jobs") && method.equals("GET")) {
            return getAllJobs();
        }
        // Add more admin routes here (e.g., managing users, inventory)
        return "{\"error\":\"Admin route not found\"}";
    }

    private String getAllJobs() {
        String sql = "SELECT j.id, u.full_name as customer_name, v.make, v.model, s.service_name, j.status " +
                     "FROM jobs j " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "ORDER BY j.booking_date DESC";

        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");

        try (Connection conn = DatabaseConnector.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            boolean first = true;
            while (rs.next()) {
                if (!first) {
                    jsonBuilder.append(",");
                }
                jsonBuilder.append("{");
                jsonBuilder.append("\"jobId\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"customerName\":\"").append(rs.getString("customer_name")).append("\",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append("\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\",");
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\"");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching jobs\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
}