package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class EmployeeHandler {
    public String handle(String method, String path, String body) {
        // Existing endpoint for getting assigned jobs
        if (path.matches("/api/employee/jobs/\\d+") && method.equals("GET")) {
            try {
                int employeeId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getAssignedJobs(employeeId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid employee ID format\"}";
            }
        }
        
        // New endpoint for updating job status
        if (path.matches("/api/employee/jobs/\\d+/status") && method.equals("PUT")) {
            try {
                String[] pathParts = path.split("/");
                int jobId = Integer.parseInt(pathParts[4]); // /api/employee/jobs/{jobId}/status
                return updateJobStatus(jobId, body);
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                return "{\"error\":\"Invalid job ID format\"}";
            }
        }
        
        // New endpoint for using inventory for a job
        if (path.matches("/api/employee/jobs/\\d+/inventory") && method.equals("POST")) {
            try {
                String[] pathParts = path.split("/");
                int jobId = Integer.parseInt(pathParts[4]); // /api/employee/jobs/{jobId}/inventory
                return useInventoryForJob(jobId, body);
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                return "{\"error\":\"Invalid job ID format\"}";
            }
        }
        
        // New endpoint for getting job details including used parts
        if (path.matches("/api/employee/jobs/\\d+/details") && method.equals("GET")) {
            try {
                String[] pathParts = path.split("/");
                int jobId = Integer.parseInt(pathParts[4]); // /api/employee/jobs/{jobId}/details
                return getJobDetails(jobId);
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                return "{\"error\":\"Invalid job ID format\"}";
            }
        }
        
        return "{\"error\":\"Employee route not found\"}";
    }

    // Existing method - getAssignedJobs (enhanced with more details)
    private String getAssignedJobs(int employeeId) {
        String sql = "SELECT j.id, u.full_name as customer_name, v.make, v.model, v.year, v.vin, " +
                     "s.service_name, s.description as service_description, j.status, j.booking_date, " +
                     "j.completion_date, j.total_cost, j.notes " +
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
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\",");
                jsonBuilder.append("\"vin\":\"").append(rs.getString("vin") != null ? rs.getString("vin") : "").append("\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\",");
                jsonBuilder.append("\"serviceDescription\":\"").append(rs.getString("service_description") != null ? rs.getString("service_description") : "").append("\",");
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\",");
                jsonBuilder.append("\"bookingDate\":\"").append(rs.getTimestamp("booking_date")).append("\",");
                jsonBuilder.append("\"completionDate\":").append(rs.getTimestamp("completion_date") != null ? "\"" + rs.getTimestamp("completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"totalCost\":").append(rs.getBigDecimal("total_cost") != null ? rs.getBigDecimal("total_cost") : "null").append(",");
                jsonBuilder.append("\"notes\":\"").append(rs.getString("notes") != null ? rs.getString("notes") : "").append("\"");
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
    
    // New method - updateJobStatus
    private String updateJobStatus(int jobId, String body) {
        Map<String, String> params = parseBody(body);
        String status = params.get("status");
        
        if (status == null) {
            return "{\"error\":\"Status is required\"}";
        }
        
        // Validate status values
        if (!status.equals("In Progress") && !status.equals("Completed")) {
            return "{\"error\":\"Invalid status. Must be 'In Progress' or 'Completed'\"}";
        }
        
        String sql;
        if (status.equals("Completed")) {
            sql = "UPDATE jobs SET status = ?, completion_date = NOW() WHERE id = ?";
        } else {
            sql = "UPDATE jobs SET status = ? WHERE id = ?";
        }
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, status);
            pstmt.setInt(2, jobId);
            
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
    
    // New method - useInventoryForJob
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
                String checkSql = "SELECT quantity FROM inventory WHERE id = ?";
                try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                    checkStmt.setInt(1, inventoryId);
                    ResultSet rs = checkStmt.executeQuery();
                    
                    if (!rs.next()) {
                        conn.rollback();
                        return "{\"error\":\"Inventory item not found\"}";
                    }
                    
                    int availableQuantity = rs.getInt("quantity");
                    if (availableQuantity < quantityUsed) {
                        conn.rollback();
                        return "{\"error\":\"Insufficient inventory. Available: " + availableQuantity + ", Requested: " + quantityUsed + "\"}";
                    }
                }
                
                // Insert into job_inventory (or update if already exists)
                String insertSql = "INSERT INTO job_inventory (job_id, inventory_id, quantity_used) VALUES (?, ?, ?) " +
                                  "ON DUPLICATE KEY UPDATE quantity_used = quantity_used + VALUES(quantity_used)";
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                    insertStmt.setInt(1, jobId);
                    insertStmt.setInt(2, inventoryId);
                    insertStmt.setInt(3, quantityUsed);
                    insertStmt.executeUpdate();
                }
                
                // Update inventory quantity
                String updateSql = "UPDATE inventory SET quantity = quantity - ? WHERE id = ?";
                try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                    updateStmt.setInt(1, quantityUsed);
                    updateStmt.setInt(2, inventoryId);
                    updateStmt.executeUpdate();
                }
                
                // Commit transaction
                conn.commit();
                return "{\"message\":\"Inventory used successfully for job\"}";
                
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
                conn.close();
            }
            
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid number format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error using inventory for job\"}";
        }
    }
    
    // New method - getJobDetails
    private String getJobDetails(int jobId) {
        // Get job details
        String jobSql = "SELECT j.id, u.full_name as customer_name, v.make, v.model, v.year, v.vin, " +
                       "s.service_name, s.description as service_description, s.price as service_price, " +
                       "j.status, j.booking_date, j.completion_date, j.total_cost, j.notes " +
                       "FROM jobs j " +
                       "JOIN users u ON j.customer_id = u.id " +
                       "JOIN vehicles v ON j.vehicle_id = v.id " +
                       "JOIN services s ON j.service_id = s.id " +
                       "WHERE j.id = ?";
        
        // Get used parts for this job
        String partsSql = "SELECT i.part_name, i.price_per_unit, ji.quantity_used, " +
                         "(i.price_per_unit * ji.quantity_used) as total_part_cost " +
                         "FROM job_inventory ji " +
                         "JOIN inventory i ON ji.inventory_id = i.id " +
                         "WHERE ji.job_id = ?";
        
        try (Connection conn = DatabaseConnector.getConnection()) {
            StringBuilder jsonBuilder = new StringBuilder();
            
            // Get job details
            try (PreparedStatement jobStmt = conn.prepareStatement(jobSql)) {
                jobStmt.setInt(1, jobId);
                ResultSet jobRs = jobStmt.executeQuery();
                
                if (!jobRs.next()) {
                    return "{\"error\":\"Job not found\"}";
                }
                
                jsonBuilder.append("{");
                jsonBuilder.append("\"jobId\":").append(jobRs.getInt("id")).append(",");
                jsonBuilder.append("\"customerName\":\"").append(jobRs.getString("customer_name")).append("\",");
                jsonBuilder.append("\"vehicle\":\"").append(jobRs.getString("make")).append(" ").append(jobRs.getString("model")).append(" (").append(jobRs.getInt("year")).append(")\",");
                jsonBuilder.append("\"vin\":\"").append(jobRs.getString("vin") != null ? jobRs.getString("vin") : "").append("\",");
                jsonBuilder.append("\"service\":\"").append(jobRs.getString("service_name")).append("\",");
                jsonBuilder.append("\"serviceDescription\":\"").append(jobRs.getString("service_description") != null ? jobRs.getString("service_description") : "").append("\",");
                jsonBuilder.append("\"servicePrice\":").append(jobRs.getBigDecimal("service_price")).append(",");
                jsonBuilder.append("\"status\":\"").append(jobRs.getString("status")).append("\",");
                jsonBuilder.append("\"bookingDate\":\"").append(jobRs.getTimestamp("booking_date")).append("\",");
                jsonBuilder.append("\"completionDate\":").append(jobRs.getTimestamp("completion_date") != null ? "\"" + jobRs.getTimestamp("completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"totalCost\":").append(jobRs.getBigDecimal("total_cost") != null ? jobRs.getBigDecimal("total_cost") : "null").append(",");
                jsonBuilder.append("\"notes\":\"").append(jobRs.getString("notes") != null ? jobRs.getString("notes") : "").append("\",");
            }
            
            // Get used parts
            jsonBuilder.append("\"usedParts\":[");
            try (PreparedStatement partsStmt = conn.prepareStatement(partsSql)) {
                partsStmt.setInt(1, jobId);
                ResultSet partsRs = partsStmt.executeQuery();
                
                boolean first = true;
                while (partsRs.next()) {
                    if (!first) {
                        jsonBuilder.append(",");
                    }
                    jsonBuilder.append("{");
                    jsonBuilder.append("\"partName\":\"").append(partsRs.getString("part_name")).append("\",");
                    jsonBuilder.append("\"pricePerUnit\":").append(partsRs.getBigDecimal("price_per_unit")).append(",");
                    jsonBuilder.append("\"quantityUsed\":").append(partsRs.getInt("quantity_used")).append(",");
                    jsonBuilder.append("\"totalPartCost\":").append(partsRs.getBigDecimal("total_part_cost"));
                    jsonBuilder.append("}");
                    first = false;
                }
            }
            jsonBuilder.append("]");
            jsonBuilder.append("}");
            
            return jsonBuilder.toString();
            
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching job details\"}";
        }
    }
    
    // Utility method for parsing JSON-like body
    private Map<String, String> parseBody(String body) {
        return Stream.of(body.replace("{", "").replace("}", "").replace("\"", "").split(","))
                .map(s -> s.split(":", 2))
                .filter(a -> a.length == 2)
                .collect(Collectors.toMap(a -> a[0].trim(), a -> a[1].trim()));
    }
}