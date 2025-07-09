package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class EmployeeHandler {
    public String handle(String method, String path, String body) {
        // Get assigned jobs
        if (path.matches("/api/employee/jobs/\\d+") && method.equals("GET")) {
            try {
                int employeeId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getAssignedJobs(employeeId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid employee ID format\"}";
            }
        }
        
        // Update job status
        if (path.matches("/api/employee/jobs/\\d+/status") && method.equals("PUT")) {
            try {
                String[] pathParts = path.split("/");
                int jobId = Integer.parseInt(pathParts[4]);
                return updateJobStatus(jobId, body);
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                return "{\"error\":\"Invalid job ID format\"}";
            }
        }
        
        // Use inventory for a job
        if (path.matches("/api/employee/jobs/\\d+/inventory") && method.equals("POST")) {
            try {
                String[] pathParts = path.split("/");
                int jobId = Integer.parseInt(pathParts[4]);
                return useInventoryForJob(jobId, body);
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                return "{\"error\":\"Invalid job ID format\"}";
            }
        }
        
        // Get job details including used parts
        if (path.matches("/api/employee/jobs/\\d+/details") && method.equals("GET")) {
            try {
                String[] pathParts = path.split("/");
                int jobId = Integer.parseInt(pathParts[4]);
                return getJobDetails(jobId);
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                return "{\"error\":\"Invalid job ID format\"}";
            }
        }
        
        // Get employee profile
        if (path.matches("/api/employee/profile/\\d+") && method.equals("GET")) {
            try {
                int employeeId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getEmployeeProfile(employeeId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid employee ID format\"}";
            }
        }
        
        // Update employee profile
        if (path.matches("/api/employee/profile/\\d+") && method.equals("PUT")) {
            try {
                int employeeId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return updateEmployeeProfile(employeeId, body);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid employee ID format\"}";
            }
        }
        
        // Get employee statistics
        if (path.matches("/api/employee/stats/\\d+") && method.equals("GET")) {
            try {
                int employeeId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getEmployeeStats(employeeId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid employee ID format\"}";
            }
        }
        
        // Get available inventory
        if (path.equals("/api/employee/inventory") && method.equals("GET")) {
            return getAvailableInventory();
        }
        
        // Get employee schedule
        if (path.matches("/api/employee/schedule/\\d+") && method.equals("GET")) {
            try {
                int employeeId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getEmployeeSchedule(employeeId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid employee ID format\"}";
            }
        }
        
        // Add job notes
        if (path.matches("/api/employee/jobs/\\d+/notes") && method.equals("POST")) {
            try {
                String[] pathParts = path.split("/");
                int jobId = Integer.parseInt(pathParts[4]);
                return addJobNotes(jobId, body);
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                return "{\"error\":\"Invalid job ID format\"}";
            }
        }
        
        return "{\"error\":\"Employee route not found\"}";
    }

    private String getAssignedJobs(int employeeId) {
        String sql = "SELECT j.id, u.full_name as customer_name, u.phone as customer_phone, " +
                     "v.make, v.model, v.year, v.vin, v.color, v.license_plate, " +
                     "s.service_name, s.description as service_description, s.estimated_duration, " +
                     "j.status, j.booking_date, j.estimated_completion_date, j.actual_completion_date, " +
                     "j.total_cost, j.labor_cost, j.parts_cost, j.notes, j.customer_notes, " +
                     "b.name as branch_name, b.address as branch_address " +
                     "FROM jobs j " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "LEFT JOIN branches b ON j.branch_id = b.id " +
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
                jsonBuilder.append("\"customerPhone\":\"").append(rs.getString("customer_phone") != null ? rs.getString("customer_phone") : "").append("\",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\",");
                jsonBuilder.append("\"vehicleColor\":\"").append(rs.getString("color") != null ? rs.getString("color") : "").append("\",");
                jsonBuilder.append("\"licensePlate\":\"").append(rs.getString("license_plate") != null ? rs.getString("license_plate") : "").append("\",");
                jsonBuilder.append("\"vin\":\"").append(rs.getString("vin") != null ? rs.getString("vin") : "").append("\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\",");
                jsonBuilder.append("\"serviceDescription\":\"").append(rs.getString("service_description") != null ? rs.getString("service_description") : "").append("\",");
                jsonBuilder.append("\"estimatedDuration\":").append(rs.getInt("estimated_duration") != 0 ? rs.getInt("estimated_duration") : "null").append(",");
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\",");
                jsonBuilder.append("\"bookingDate\":\"").append(rs.getTimestamp("booking_date")).append("\",");
                jsonBuilder.append("\"estimatedCompletionDate\":").append(rs.getTimestamp("estimated_completion_date") != null ? "\"" + rs.getTimestamp("estimated_completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"actualCompletionDate\":").append(rs.getTimestamp("actual_completion_date") != null ? "\"" + rs.getTimestamp("actual_completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"totalCost\":").append(rs.getBigDecimal("total_cost") != null ? rs.getBigDecimal("total_cost") : "null").append(",");
                jsonBuilder.append("\"laborCost\":").append(rs.getBigDecimal("labor_cost") != null ? rs.getBigDecimal("labor_cost") : "null").append(",");
                jsonBuilder.append("\"notes\":\"").append(rs.getString("notes") != null ? rs.getString("notes") : "").append("\",");
                jsonBuilder.append("\"customerNotes\":\"").append(rs.getString("customer_notes") != null ? rs.getString("customer_notes") : "").append("\",");
                jsonBuilder.append("\"branchName\":\"").append(rs.getString("branch_name") != null ? rs.getString("branch_name") : "").append("\",");
                jsonBuilder.append("\"branchAddress\":\"").append(rs.getString("branch_address") != null ? rs.getString("branch_address") : "").append("\"");
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
    
    private String updateJobStatus(int jobId, String body) {
        Map<String, String> params = parseBody(body);
        String status = params.get("status");
        String notes = params.get("notes");
        
        if (status == null) {
            return "{\"error\":\"Status is required\"}";
        }
        
        // Validate status values
        if (!status.equals("In Progress") && !status.equals("Completed")) {
            return "{\"error\":\"Invalid status. Must be 'In Progress' or 'Completed'\"}";
        }
        
        String sql;
        if (status.equals("Completed")) {
            sql = "UPDATE jobs SET status = ?, actual_completion_date = NOW()";
            if (notes != null && !notes.trim().isEmpty()) {
                sql += ", notes = CONCAT(COALESCE(notes, ''), ' | ', ?)";
            }
            sql += " WHERE id = ?";
        } else {
            sql = "UPDATE jobs SET status = ?";
            if (notes != null && !notes.trim().isEmpty()) {
                sql += ", notes = CONCAT(COALESCE(notes, ''), ' | ', ?)";
            }
            sql += " WHERE id = ?";
        }
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            int paramIndex = 1;
            pstmt.setString(paramIndex++, status);
            if (notes != null && !notes.trim().isEmpty()) {
                pstmt.setString(paramIndex++, notes);
            }
            pstmt.setInt(paramIndex, jobId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Job status updated successfully\", \"status\":\"" + status + "\"}";
            } else {
                return "{\"error\":\"Job not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error updating job status\"}";
        }
    }
    
    private String useInventoryForJob(int jobId, String body) {
        Map<String, String> params = parseBody(body);
        String inventoryIdStr = params.get("inventoryId");
        String quantityUsedStr = params.get("quantityUsed");
        
        if (inventoryIdStr == null || quantityUsedStr == null) {
            return "{\"error\":\"Inventory ID and quantity used are required\"}";
        }
        
        try {
            int inventoryId = Integer.parseInt(inventoryIdStr);
            int quantityUsed = Integer.parseInt(quantityUsedStr);
            
            if (quantityUsed <= 0) {
                return "{\"error\":\"Quantity used must be greater than 0\"}";
            }
            
            Connection conn = DatabaseConnector.getConnection();
            try {
                // Start transaction
                conn.setAutoCommit(false);
                
                // Check if enough inventory is available
                String checkSql = "SELECT quantity, price_per_unit FROM inventory WHERE id = ?";
                double unitPrice = 0;
                try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                    checkStmt.setInt(1, inventoryId);
                    ResultSet rs = checkStmt.executeQuery();
                    
                    if (!rs.next()) {
                        conn.rollback();
                        return "{\"error\":\"Inventory item not found\"}";
                    }
                    
                    int availableQuantity = rs.getInt("quantity");
                    unitPrice = rs.getDouble("price_per_unit");
                    
                    if (availableQuantity < quantityUsed) {
                        conn.rollback();
                        return "{\"error\":\"Insufficient inventory. Available: " + availableQuantity + ", Requested: " + quantityUsed + "\"}";
                    }
                }
                
                // Insert into job_inventory (or update if already exists)
                String insertSql = "INSERT INTO job_inventory (job_id, inventory_id, quantity_used, unit_price, total_price) VALUES (?, ?, ?, ?, ?) " +
                                  "ON DUPLICATE KEY UPDATE quantity_used = quantity_used + VALUES(quantity_used), total_price = (quantity_used + VALUES(quantity_used)) * unit_price";
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                    insertStmt.setInt(1, jobId);
                    insertStmt.setInt(2, inventoryId);
                    insertStmt.setInt(3, quantityUsed);
                    insertStmt.setDouble(4, unitPrice);
                    insertStmt.setDouble(5, quantityUsed * unitPrice);
                    insertStmt.executeUpdate();
                }
                
                // Update inventory quantity
                String updateSql = "UPDATE inventory SET quantity = quantity - ? WHERE id = ?";
                try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                    updateStmt.setInt(1, quantityUsed);
                    updateStmt.setInt(2, inventoryId);
                    updateStmt.executeUpdate();
                }
                
                // Update job parts cost
                String updateJobSql = "UPDATE jobs SET parts_cost = (SELECT SUM(total_price) FROM job_inventory WHERE job_id = ?) WHERE id = ?";
                try (PreparedStatement updateJobStmt = conn.prepareStatement(updateJobSql)) {
                    updateJobStmt.setInt(1, jobId);
                    updateJobStmt.setInt(2, jobId);
                    updateJobStmt.executeUpdate();
                }
                
                conn.commit();
                return "{\"message\":\"Inventory used successfully\", \"quantityUsed\":" + quantityUsed + "}";
                
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
                conn.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error using inventory\"}";
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid number format\"}";
        }
    }
    
    private String getJobDetails(int jobId) {
        String sql = "SELECT j.*, u.full_name as customer_name, u.phone as customer_phone, " +
                     "v.make, v.model, v.year, v.vin, v.color, v.license_plate, " +
                     "s.service_name, s.description as service_description, s.price as service_price, " +
                     "b.name as branch_name, b.address as branch_address " +
                     "FROM jobs j " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "LEFT JOIN branches b ON j.branch_id = b.id " +
                     "WHERE j.id = ?";
        String partsSql = "SELECT ji.quantity_used, ji.unit_price, ji.total_price, i.part_name, i.price_per_unit " +
                          "FROM job_inventory ji " +
                          "JOIN inventory i ON ji.inventory_id = i.id " +
                          "WHERE ji.job_id = ?";
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             PreparedStatement partsStmt = conn.prepareStatement(partsSql)) {

            pstmt.setInt(1, jobId);
            ResultSet rs = pstmt.executeQuery();
            if (rs.next()) {
                StringBuilder jsonBuilder = new StringBuilder();
                jsonBuilder.append("{");
                jsonBuilder.append("\"jobId\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"customerName\":\"").append(rs.getString("customer_name")).append("\",");
                jsonBuilder.append("\"customerPhone\":\"").append(rs.getString("customer_phone") != null ? rs.getString("customer_phone") : "").append("\",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\",");
                jsonBuilder.append("\"vehicleColor\":\"").append(rs.getString("color") != null ? rs.getString("color") : "").append("\",");
                jsonBuilder.append("\"licensePlate\":\"").append(rs.getString("license_plate") != null ? rs.getString("license_plate") : "").append("\",");
                jsonBuilder.append("\"vin\":\"").append(rs.getString("vin") != null ? rs.getString("vin") : "").append("\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\",");
                jsonBuilder.append("\"serviceDescription\":\"").append(rs.getString("service_description") != null ? rs.getString("service_description") : "").append("\",");
                jsonBuilder.append("\"servicePrice\":").append(rs.getBigDecimal("service_price") != null ? rs.getBigDecimal("service_price") : "null").append(",");
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\",");
                jsonBuilder.append("\"bookingDate\":\"").append(rs.getTimestamp("booking_date")).append("\",");
                // Remove estimatedCompletionDate and actualCompletionDate (not in schema)
                // jsonBuilder.append("\"estimatedCompletionDate\":").append(rs.getTimestamp("estimated_completion_date") != null ? "\"" + rs.getTimestamp("estimated_completion_date") + "\"" : "null").append(",");
                // jsonBuilder.append("\"actualCompletionDate\":").append(rs.getTimestamp("actual_completion_date") != null ? "\"" + rs.getTimestamp("actual_completion_date") + "\"" : "null").append(",");
                // Instead, use completion_date
                jsonBuilder.append("\"completionDate\":").append(rs.getTimestamp("completion_date") != null ? "\"" + rs.getTimestamp("completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"totalCost\":").append(rs.getBigDecimal("total_cost") != null ? rs.getBigDecimal("total_cost") : "null").append(",");
                // Remove laborCost (not in schema)
                // jsonBuilder.append("\"laborCost\":").append(rs.getBigDecimal("labor_cost") != null ? rs.getBigDecimal("labor_cost") : "null").append(",");
                jsonBuilder.append("\"notes\":\"").append(rs.getString("notes") != null ? rs.getString("notes") : "").append("\",");
                // Remove customerNotes (not in schema)
                // jsonBuilder.append("\"customerNotes\":\"").append(rs.getString("customer_notes") != null ? rs.getString("customer_notes") : "").append("\",");
                jsonBuilder.append("\"branchName\":\"").append(rs.getString("branch_name") != null ? rs.getString("branch_name") : "").append("\",");
                jsonBuilder.append("\"branchAddress\":\"").append(rs.getString("branch_address") != null ? rs.getString("branch_address") : "").append("\",");
                // Fetch used parts
                partsStmt.setInt(1, jobId);
                ResultSet partsRs = partsStmt.executeQuery();
                jsonBuilder.append("\"usedParts\":[");
                boolean firstPart = true;
                while (partsRs.next()) {
                    if (!firstPart) jsonBuilder.append(",");
                    jsonBuilder.append("{");
                    jsonBuilder.append("\"partName\":\"").append(partsRs.getString("part_name")).append("\",");
                    jsonBuilder.append("\"quantityUsed\":").append(partsRs.getInt("quantity_used")).append(",");
                    jsonBuilder.append("\"unitPrice\":").append(partsRs.getBigDecimal("unit_price") != null ? partsRs.getBigDecimal("unit_price") : "null").append(",");
                    jsonBuilder.append("\"totalPrice\":").append(partsRs.getBigDecimal("total_price") != null ? partsRs.getBigDecimal("total_price") : "null").append(",");
                    jsonBuilder.append("\"pricePerUnit\":").append(partsRs.getBigDecimal("price_per_unit") != null ? partsRs.getBigDecimal("price_per_unit") : "null");
                    jsonBuilder.append("}");
                    firstPart = false;
                }
                jsonBuilder.append("]");
                jsonBuilder.append("}");
                return jsonBuilder.toString();
            } else {
                return "{\"error\":\"Job not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching job details\"}";
        }
    }
    
    private String getEmployeeProfile(int employeeId) {
        String sql = "SELECT id, username, full_name, email, phone, created_at FROM users WHERE id = ? AND role = 'employee'";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, employeeId);
            ResultSet rs = pstmt.executeQuery();
            
            if (rs.next()) {
                return String.format(
                    "{\"id\":%d,\"username\":\"%s\",\"fullName\":\"%s\",\"email\":\"%s\",\"phone\":\"%s\",\"createdAt\":\"%s\"}",
                    rs.getInt("id"),
                    rs.getString("username"),
                    rs.getString("full_name"),
                    rs.getString("email") != null ? rs.getString("email") : "",
                    rs.getString("phone") != null ? rs.getString("phone") : "",
                    rs.getTimestamp("created_at")
                );
            } else {
                return "{\"error\":\"Employee not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching employee profile\"}";
        }
    }
    
    private String updateEmployeeProfile(int employeeId, String body) {
        Map<String, String> params = parseBody(body);
        String email = params.get("email");
        String phone = params.get("phone");
        
        String sql = "UPDATE users SET email = ?, phone = ? WHERE id = ? AND role = 'employee'";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, email);
            pstmt.setString(2, phone);
            pstmt.setInt(3, employeeId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Profile updated successfully\"}";
            } else {
                return "{\"error\":\"Employee not found or no changes made\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error updating employee profile\"}";
        }
    }
    
    private String getEmployeeStats(int employeeId) {
        String sql = "SELECT " +
                     "COUNT(*) as totalJobs, " +
                     "SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedJobs, " +
                     "SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as activeJobs, " +
                     "SUM(CASE WHEN status = 'Booked' THEN 1 ELSE 0 END) as bookedJobs, " +
                     "AVG(CASE WHEN actual_completion_date IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, booking_date, actual_completion_date) END) as avgCompletionTime " +
                     "FROM jobs WHERE assigned_employee_id = ?";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, employeeId);
            ResultSet rs = pstmt.executeQuery();
            
            if (rs.next()) {
                return String.format(
                    "{\"totalJobs\":%d,\"completedJobs\":%d,\"activeJobs\":%d,\"bookedJobs\":%d,\"avgCompletionTime\":%.1f}",
                    rs.getInt("totalJobs"),
                    rs.getInt("completedJobs"),
                    rs.getInt("activeJobs"),
                    rs.getInt("bookedJobs"),
                    rs.getDouble("avgCompletionTime")
                );
            } else {
                return "{\"totalJobs\":0,\"completedJobs\":0,\"activeJobs\":0,\"bookedJobs\":0,\"avgCompletionTime\":0}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching employee stats\"}";
        }
    }
    
    private String getAvailableInventory() {
        String sql = "SELECT id, part_name, part_number, quantity, price_per_unit, category, supplier FROM inventory WHERE quantity > 0 AND is_active = TRUE ORDER BY category, part_name";
        
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
                jsonBuilder.append("\"partName\":\"").append(rs.getString("part_name")).append("\",");
                jsonBuilder.append("\"partNumber\":\"").append(rs.getString("part_number") != null ? rs.getString("part_number") : "").append("\",");
                jsonBuilder.append("\"quantity\":").append(rs.getInt("quantity")).append(",");
                jsonBuilder.append("\"pricePerUnit\":").append(rs.getBigDecimal("price_per_unit")).append(",");
                jsonBuilder.append("\"category\":\"").append(rs.getString("category") != null ? rs.getString("category") : "").append("\",");
                jsonBuilder.append("\"supplier\":\"").append(rs.getString("supplier") != null ? rs.getString("supplier") : "").append("\"");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching inventory\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String getEmployeeSchedule(int employeeId) {
        String sql = "SELECT j.id, j.booking_date, j.estimated_completion_date, j.status, " +
                     "u.full_name as customer_name, v.make, v.model, v.year, s.service_name " +
                     "FROM jobs j " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "WHERE j.assigned_employee_id = ? AND j.booking_date >= CURDATE() " +
                     "ORDER BY j.booking_date ASC";
        
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
                jsonBuilder.append("\"bookingDate\":\"").append(rs.getTimestamp("booking_date")).append("\",");
                jsonBuilder.append("\"estimatedCompletionDate\":").append(rs.getTimestamp("estimated_completion_date") != null ? "\"" + rs.getTimestamp("estimated_completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\",");
                jsonBuilder.append("\"customerName\":\"").append(rs.getString("customer_name")).append("\",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\"");
                    jsonBuilder.append("}");
                    first = false;
                }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching employee schedule\"}";
            }

            jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String addJobNotes(int jobId, String body) {
        Map<String, String> params = parseBody(body);
        String notes = params.get("notes");
        
        if (notes == null || notes.trim().isEmpty()) {
            return "{\"error\":\"Notes are required\"}";
        }
        
        String sql = "UPDATE jobs SET notes = CONCAT(COALESCE(notes, ''), ' | ', ?) WHERE id = ?";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, notes);
            pstmt.setInt(2, jobId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Notes added successfully\"}";
            } else {
                return "{\"error\":\"Job not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error adding notes\"}";
        }
    }
    
    // Utility method for parsing JSON-like body
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
                result.put(key, value);
            }
        }
        
        return result;
    }
}