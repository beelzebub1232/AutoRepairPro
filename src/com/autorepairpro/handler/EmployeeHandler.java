package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;

public class EmployeeHandler {
    public String handle(String method, String path, String body) {
        // Example: /api/employee/jobs/2 (where 2 is employee ID)
        if (path.startsWith("/api/employee/jobs/") && method.equals("GET")) {
            try {
                int employeeId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getAssignedJobs(employeeId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid employee ID format\"}";
            }
        }
        return "{\"error\":\"Employee route not found\"}";
    }

    private String getAssignedJobs(int employeeId) {
        String sql = "SELECT j.id, u.full_name as customer_name, v.make, v.model, s.service_name, j.status " +
                     "FROM jobs j " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "WHERE j.assigned_employee_id = ? " +
                     "ORDER BY j.booking_date DESC";

        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");

        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, employeeId);
            ResultSet rs = pstmt.executeQuery();
            
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
            return "{\"error\":\"Database error fetching assigned jobs\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
}