package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class CustomerHandler {
    public String handle(String method, String path, String body) {
        // Get customer's jobs
        if (path.matches("/api/customer/jobs/\\d+") && method.equals("GET")) {
            try {
                int customerId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getCustomerJobs(customerId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid customer ID format\"}";
            }
        }
        
        // Book new appointment
        if (path.equals("/api/customer/bookings") && method.equals("POST")) {
            return bookAppointment(body);
        }
        
        // Make payment for a job
        if (path.matches("/api/customer/payment/\\d+") && method.equals("POST")) {
            try {
                int jobId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return makePayment(jobId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid job ID format\"}";
            }
        }
        
        // Get customer's vehicles
        if (path.matches("/api/customer/vehicles/\\d+") && method.equals("GET")) {
            try {
                int customerId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getCustomerVehicles(customerId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid customer ID format\"}";
            }
        }
        
        // Add new vehicle
        if (path.equals("/api/customer/vehicles") && method.equals("POST")) {
            return addVehicle(body);
        }
        
        return "{\"error\":\"Customer route not found\"}";
    }
    
    private String getCustomerJobs(int customerId) {
        String sql = "SELECT j.id, v.make, v.model, v.year, s.service_name, j.status, " +
                     "j.booking_date, j.completion_date, j.total_cost, j.notes " +
                     "FROM jobs j " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "WHERE j.customer_id = ? " +
                     "ORDER BY j.booking_date DESC";

        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");

        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, customerId);
            ResultSet rs = pstmt.executeQuery();
            
            boolean first = true;
            while (rs.next()) {
                if (!first) {
                    jsonBuilder.append(",");
                }
                jsonBuilder.append("{");
                jsonBuilder.append("\"jobId\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\",");
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
            return "{\"error\":\"Database error fetching customer jobs\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String bookAppointment(String body) {
        Map<String, String> params = parseBody(body);
        String customerIdStr = params.get("customerId");
        String vehicleIdStr = params.get("vehicleId");
        String serviceIdStr = params.get("serviceId");
        String bookingDate = params.get("bookingDate");
        String notes = params.get("notes");
        
        if (customerIdStr == null || vehicleIdStr == null || serviceIdStr == null) {
            return "{\"error\":\"Customer ID, Vehicle ID, and Service ID are required\"}";
        }
        
        try {
            int customerId = Integer.parseInt(customerIdStr);
            int vehicleId = Integer.parseInt(vehicleIdStr);
            int serviceId = Integer.parseInt(serviceIdStr);
            
            // Verify that the vehicle belongs to the customer
            String verifySql = "SELECT id FROM vehicles WHERE id = ? AND customer_id = ?";
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement verifyStmt = conn.prepareStatement(verifySql)) {
                
                verifyStmt.setInt(1, vehicleId);
                verifyStmt.setInt(2, customerId);
                ResultSet verifyRs = verifyStmt.executeQuery();
                
                if (!verifyRs.next()) {
                    return "{\"error\":\"Vehicle does not belong to this customer\"}";
                }
            }
            
            String sql = "INSERT INTO jobs (customer_id, vehicle_id, service_id, status, booking_date, notes) VALUES (?, ?, ?, 'Booked', ?, ?)";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                
                pstmt.setInt(1, customerId);
                pstmt.setInt(2, vehicleId);
                pstmt.setInt(3, serviceId);
                pstmt.setString(4, bookingDate != null ? bookingDate : "NOW()");
                pstmt.setString(5, notes);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    ResultSet generatedKeys = pstmt.getGeneratedKeys();
                    if (generatedKeys.next()) {
                        int jobId = generatedKeys.getInt(1);
                        return "{\"message\":\"Appointment booked successfully\", \"jobId\":" + jobId + "}";
                    }
                }
                return "{\"error\":\"Failed to book appointment\"}";
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid ID format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error booking appointment\"}";
        }
    }
    
    private String makePayment(int jobId) {
        // This is a dummy payment implementation
        String sql = "UPDATE jobs SET status = 'Paid' WHERE id = ? AND status = 'Invoiced'";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, jobId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Payment processed successfully\", \"status\":\"Paid\"}";
            } else {
                return "{\"error\":\"Job not found or not ready for payment\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error processing payment\"}";
        }
    }
    
    private String getCustomerVehicles(int customerId) {
        String sql = "SELECT id, make, model, year, vin FROM vehicles WHERE customer_id = ? ORDER BY make, model";
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("[");

        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setInt(1, customerId);
            ResultSet rs = pstmt.executeQuery();
            
            boolean first = true;
            while (rs.next()) {
                if (!first) {
                    jsonBuilder.append(",");
                }
                jsonBuilder.append("{");
                jsonBuilder.append("\"id\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"make\":\"").append(rs.getString("make")).append("\",");
                jsonBuilder.append("\"model\":\"").append(rs.getString("model")).append("\",");
                jsonBuilder.append("\"year\":").append(rs.getInt("year")).append(",");
                jsonBuilder.append("\"vin\":\"").append(rs.getString("vin") != null ? rs.getString("vin") : "").append("\"");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching customer vehicles\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String addVehicle(String body) {
        Map<String, String> params = parseBody(body);
        String customerIdStr = params.get("customerId");
        String make = params.get("make");
        String model = params.get("model");
        String yearStr = params.get("year");
        String vin = params.get("vin");
        
        if (customerIdStr == null || make == null || model == null || yearStr == null) {
            return "{\"error\":\"Customer ID, make, model, and year are required\"}";
        }
        
        try {
            int customerId = Integer.parseInt(customerIdStr);
            int year = Integer.parseInt(yearStr);
            
            String sql = "INSERT INTO vehicles (customer_id, make, model, year, vin) VALUES (?, ?, ?, ?, ?)";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                
                pstmt.setInt(1, customerId);
                pstmt.setString(2, make);
                pstmt.setString(3, model);
                pstmt.setInt(4, year);
                pstmt.setString(5, vin);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    ResultSet generatedKeys = pstmt.getGeneratedKeys();
                    if (generatedKeys.next()) {
                        int vehicleId = generatedKeys.getInt(1);
                        return "{\"message\":\"Vehicle added successfully\", \"vehicleId\":" + vehicleId + "}";
                    }
                }
                return "{\"error\":\"Failed to add vehicle\"}";
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid number format\"}";
        } catch (SQLException e) {
            if (e.getMessage().contains("Duplicate entry")) {
                return "{\"error\":\"VIN already exists\"}";
            }
            e.printStackTrace();
            return "{\"error\":\"Database error adding vehicle\"}";
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