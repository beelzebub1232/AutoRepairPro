package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.*;
import java.io.*;

public class CustomerHandler {
    
    public String handleRequest(String path, String method, String requestBody) {
        try {
            String[] pathParts = path.split("/");
            
            if (pathParts.length < 4) {
                return createErrorResponse("Invalid customer route", 400);
            }
            
            String action = pathParts[3];
            
            switch (action) {
                case "jobs":
                    return handleJobs(pathParts, method, requestBody);
                case "vehicles":
                    return handleVehicles(pathParts, method, requestBody);
                case "book":
                    return handleBooking(method, requestBody);
                case "bookings":
                    return handleBookings(method, requestBody);
                case "pay":
                    return handlePayment(method, requestBody);
                case "payment":
                    // Support /api/customer/payment/{jobId}
                    if (pathParts.length >= 5 && method.equals("POST")) {
                        // Inject jobId into request body for payment logic
                        String jobId = pathParts[4];
                        Map<String, Object> data = parseJson(requestBody);
                        if (data == null) data = new HashMap<>();
                        data.put("jobId", jobId);
                        String newBody = "{";
                        int i = 0;
                        for (Map.Entry<String, Object> entry : data.entrySet()) {
                            if (i > 0) newBody += ",";
                            newBody += "\"" + entry.getKey() + "\":";
                            if (entry.getValue() instanceof String) {
                                newBody += "\"" + entry.getValue() + "\"";
                            } else {
                                newBody += entry.getValue();
                            }
                            i++;
                        }
                        newBody += "}";
                        return handlePayment(method, newBody);
                    }
                    return createErrorResponse("Invalid payment route or method", 404);
                case "invoice":
                    return handleInvoice(pathParts, method);
                case "branches":
                    return getBranches();
                case "profile":
                    return handleProfile(pathParts, method, requestBody);
                default:
                    return createErrorResponse("Customer route not found", 404);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse("Internal server error: " + e.getMessage(), 500);
            }
        }
        
    private String handleJobs(String[] pathParts, String method, String requestBody) {
        if (pathParts.length < 5) {
            return createErrorResponse("Customer ID not provided", 400);
    }
    
        try {
            int customerId = Integer.parseInt(pathParts[4]);
            
            try (Connection conn = DatabaseConnector.getConnection()) {
                String sql = "SELECT j.id as jobId, j.status, j.booking_date, j.completion_date, j.total_cost, j.notes, " +
                           "v.make, v.model, v.year, v.color, " +
                           "s.service_name, s.price, " +
                           "b.name as branchName, b.address as branchAddress, " +
                           "e.full_name as employeeName " +
                     "FROM jobs j " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                           "JOIN branches b ON j.branch_id = b.id " +
                           "LEFT JOIN users e ON j.assigned_employee_id = e.id " +
                     "WHERE j.customer_id = ? " +
                     "ORDER BY j.booking_date DESC";

                List<Map<String, Object>> jobs = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, customerId);
            ResultSet rs = pstmt.executeQuery();
            
            while (rs.next()) {
                        Map<String, Object> job = new HashMap<>();
                        job.put("jobId", rs.getInt("jobId"));
                        job.put("status", rs.getString("status"));
                        job.put("bookingDate", rs.getTimestamp("booking_date").toString());
                        job.put("completionDate", rs.getTimestamp("completion_date") != null ? rs.getTimestamp("completion_date").toString() : null);
                        job.put("totalCost", rs.getBigDecimal("total_cost"));
                        job.put("notes", rs.getString("notes"));
                        job.put("vehicle", rs.getString("make") + " " + rs.getString("model") + " (" + rs.getInt("year") + ")");
                        job.put("vehicleColor", rs.getString("color"));
                        job.put("service", rs.getString("service_name"));
                        job.put("servicePrice", rs.getBigDecimal("price"));
                        job.put("branchName", rs.getString("branchName"));
                        job.put("branchAddress", rs.getString("branchAddress"));
                        job.put("employeeName", rs.getString("employeeName"));
                        jobs.add(job);
                    }
                }
                
                return convertToJson(jobs);
            }
        } catch (NumberFormatException e) {
            return createErrorResponse("Invalid customer ID format", 400);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching customer jobs", 500);
        }
    }
    
    private String handleVehicles(String[] pathParts, String method, String requestBody) {
        if (pathParts.length < 5) {
            return createErrorResponse("Customer ID not provided", 400);
        }
        
        try {
            int customerId = Integer.parseInt(pathParts[4]);
            
            try (Connection conn = DatabaseConnector.getConnection()) {
                if ("GET".equals(method)) {
                    String sql = "SELECT id, make, model, year, vin, license_plate, color, mileage, created_at " +
                               "FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC";
                    
                    List<Map<String, Object>> vehicles = new ArrayList<>();
                    try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                        pstmt.setInt(1, customerId);
                        ResultSet rs = pstmt.executeQuery();
                        
                        while (rs.next()) {
                            Map<String, Object> vehicle = new HashMap<>();
                            vehicle.put("id", rs.getInt("id"));
                            vehicle.put("make", rs.getString("make"));
                            vehicle.put("model", rs.getString("model"));
                            vehicle.put("year", rs.getInt("year"));
                            vehicle.put("vin", rs.getString("vin"));
                            vehicle.put("licensePlate", rs.getString("license_plate"));
                            vehicle.put("color", rs.getString("color"));
                            vehicle.put("mileage", rs.getInt("mileage"));
                            vehicle.put("createdAt", rs.getTimestamp("created_at").toString());
                            vehicles.add(vehicle);
                        }
                    }
                    
                    return convertToJson(vehicles);
                } else if ("POST".equals(method)) {
                    return addVehicle(conn, customerId, requestBody);
                }
                return createErrorResponse("Method not allowed", 405);
            }
        } catch (NumberFormatException e) {
            return createErrorResponse("Invalid customer ID format", 400);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error handling vehicles", 500);
        }
    }
    
    private String addVehicle(Connection conn, int customerId, String requestBody) throws SQLException {
        // Parse request body
        Map<String, Object> data = parseJson(requestBody);
        if (data == null) {
            return createErrorResponse("Invalid JSON body", 400);
        }
        String make = (String) data.get("make");
        String model = (String) data.get("model");
        Integer year = parseIntSafe(data.get("year"));
        String vin = (String) data.getOrDefault("vin", "");
        String licensePlate = (String) data.getOrDefault("licensePlate", "");
        String color = (String) data.getOrDefault("color", "");
        Integer mileage = parseIntSafe(data.getOrDefault("mileage", null));
        if (make == null || make.isEmpty() || model == null || model.isEmpty() || year == null) {
            return createErrorResponse("Missing required vehicle fields", 400);
        }
        String sql = "INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color, mileage, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, customerId);
            pstmt.setString(2, make);
            pstmt.setString(3, model);
            pstmt.setInt(4, year);
            // VIN: insert NULL if empty or blank
            if (vin == null || vin.trim().isEmpty()) {
                pstmt.setNull(5, java.sql.Types.VARCHAR);
            } else {
                pstmt.setString(5, vin);
            }
            pstmt.setString(6, licensePlate);
            pstmt.setString(7, color);
            if (mileage != null) {
                pstmt.setInt(8, mileage);
            } else {
                pstmt.setNull(8, java.sql.Types.INTEGER);
            }
            int rows = pstmt.executeUpdate();
            if (rows > 0) {
                return createSuccessResponse("Vehicle added successfully");
            } else {
                return createErrorResponse("Failed to add vehicle", 500);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error adding vehicle", 500);
        }
    }
    
    private String handleBooking(String method, String requestBody) {
        if (!"POST".equals(method)) {
            return createErrorResponse("Method not allowed", 405);
        }
        
        try (Connection conn = DatabaseConnector.getConnection()) {
            // Parse request body and create booking
            // Implementation would parse JSON and insert into database
            return createSuccessResponse("Appointment booked successfully");
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error booking appointment", 500);
        }
    }
    
    private String handlePayment(String method, String requestBody) {
        if (!"POST".equals(method)) {
            return createErrorResponse("Method not allowed", 405);
        }
        try (Connection conn = DatabaseConnector.getConnection()) {
            // Parse request body and process payment
            Map<String, Object> data = parseJson(requestBody);
            if (data == null) {
                return createErrorResponse("Invalid JSON body", 400);
            }
            Object jobIdObj = data.get("jobId");
            String paymentMethod = (String) data.getOrDefault("paymentMethod", "");
            if (jobIdObj == null) {
                return createErrorResponse("Missing jobId", 400);
            }
            Integer jobId;
            try {
                jobId = Integer.parseInt(jobIdObj.toString());
            } catch (Exception e) {
                return createErrorResponse("Invalid jobId", 400);
            }
            // Find the invoice for this job
            String findInvoiceSql = "SELECT id, total_amount FROM invoices WHERE job_id = ?";
            Integer invoiceId = null;
            double invoiceAmount = 0.0;
            try (PreparedStatement findStmt = conn.prepareStatement(findInvoiceSql)) {
                findStmt.setInt(1, jobId);
                ResultSet rs = findStmt.executeQuery();
                if (rs.next()) {
                    invoiceId = rs.getInt("id");
                    invoiceAmount = rs.getDouble("total_amount");
                } else {
                    return createErrorResponse("Invoice not found for job", 404);
                }
            }
            // Update invoice status to 'Paid'
            String updateInvoiceSql = "UPDATE invoices SET status = 'Paid' WHERE id = ?";
            try (PreparedStatement updateStmt = conn.prepareStatement(updateInvoiceSql)) {
                updateStmt.setInt(1, invoiceId);
                updateStmt.executeUpdate();
            }
            // Optionally, record payment in a payments table (if exists)
            // Optionally, update job status to 'Paid' and set completion_date
            String updateJobSql = "UPDATE jobs SET status = 'Paid', completion_date = NOW() WHERE id = ?";
            try (PreparedStatement updateJobStmt = conn.prepareStatement(updateJobSql)) {
                updateJobStmt.setInt(1, jobId);
                updateJobStmt.executeUpdate();
            }
            // Optionally, return the amount paid in the response
            return createSuccessResponse("Payment processed successfully. Amount paid: " + invoiceAmount);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error processing payment", 500);
        }
    }
    
    private String getBranches() {
        try (Connection conn = DatabaseConnector.getConnection()) {
            String sql = "SELECT b.id, b.name, b.address, b.latitude, b.longitude, b.rating, " +
                        "GROUP_CONCAT(DISTINCT bh.day_of_week, ': ', " +
                        "CASE WHEN bh.is_closed THEN 'Closed' " +
                        "ELSE CONCAT(TIME_FORMAT(bh.open_time, '%H:%i'), '-', TIME_FORMAT(bh.close_time, '%H:%i')) " +
                        "END ORDER BY FIELD(bh.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) as hours, " +
                        "GROUP_CONCAT(DISTINCT s.service_name ORDER BY s.service_name) as services " +
                        "FROM branches b " +
                        "LEFT JOIN business_hours bh ON b.id = bh.branch_id " +
                        "LEFT JOIN services s ON s.is_active = true " +
                        "WHERE b.is_active = true " +
                        "GROUP BY b.id " +
                        "ORDER BY b.name";
            
            List<Map<String, Object>> branches = new ArrayList<>();
            try (PreparedStatement pstmt = conn.prepareStatement(sql);
                 ResultSet rs = pstmt.executeQuery()) {
                
                while (rs.next()) {
                    Map<String, Object> branch = new HashMap<>();
                    branch.put("id", rs.getInt("id"));
                    branch.put("name", rs.getString("name"));
                    branch.put("address", rs.getString("address"));
                    branch.put("latitude", rs.getBigDecimal("latitude"));
                    branch.put("longitude", rs.getBigDecimal("longitude"));
                    branch.put("rating", rs.getBigDecimal("rating"));
                    branch.put("hours", rs.getString("hours"));
                    
                    // Parse services string into array
                    String servicesStr = rs.getString("services");
                    if (servicesStr != null) {
                        String[] services = servicesStr.split(",");
                        branch.put("services", Arrays.asList(services));
            } else {
                        branch.put("services", new ArrayList<>());
                    }
                    
                    // Get contact information
                    branch.put("contact", getBranchContact(conn, rs.getInt("id")));
                    
                    branches.add(branch);
            }
            }
            
            return convertToJson(branches);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching branches", 500);
        }
    }
    
    private Map<String, String> getBranchContact(Connection conn, int branchId) throws SQLException {
        String sql = "SELECT contact_type, contact_value FROM contact_info " +
                    "WHERE branch_id = ? AND is_active = true AND is_primary = true";

        Map<String, String> contact = new HashMap<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, branchId);
            ResultSet rs = pstmt.executeQuery();
            
            while (rs.next()) {
                String type = rs.getString("contact_type");
                String value = rs.getString("contact_value");
                contact.put(type, value);
        }
        }
        
        return contact;
    }
    
    private String handleProfile(String[] pathParts, String method, String requestBody) {
        if (pathParts.length < 5) {
            return createErrorResponse("Customer ID not provided", 400);
        }
        
        try {
            int customerId = Integer.parseInt(pathParts[4]);
            
            try (Connection conn = DatabaseConnector.getConnection()) {
                if ("GET".equals(method)) {
                    String sql = "SELECT id, username, full_name, email, phone, created_at " +
                               "FROM users WHERE id = ? AND role = 'customer'";
                    
                    try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setInt(1, customerId);
                        ResultSet rs = pstmt.executeQuery();
                        
                        if (rs.next()) {
                            Map<String, Object> profile = new HashMap<>();
                            profile.put("id", rs.getInt("id"));
                            profile.put("username", rs.getString("username"));
                            profile.put("fullName", rs.getString("full_name"));
                            profile.put("email", rs.getString("email"));
                            profile.put("phone", rs.getString("phone"));
                            profile.put("createdAt", rs.getTimestamp("created_at").toString());
                            
                            return convertToJson(Collections.singletonList(profile));
                        } else {
                            return createErrorResponse("Customer not found", 404);
                        }
                    }
                } else if ("PUT".equals(method)) {
                    return updateProfile(conn, customerId, requestBody);
                }
                return createErrorResponse("Method not allowed", 405);
            }
        } catch (NumberFormatException e) {
            return createErrorResponse("Invalid customer ID format", 400);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error handling profile", 500);
        }
    }
    
    private String updateProfile(Connection conn, int customerId, String requestBody) throws SQLException {
        // Parse request body and update profile
        // Implementation would parse JSON and update database
        return createSuccessResponse("Profile updated successfully");
    }
    
    // Utility methods
    private String convertToJson(List<Map<String, Object>> data) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < data.size(); i++) {
            if (i > 0) json.append(",");
            json.append("{");
            Map<String, Object> item = data.get(i);
            int j = 0;
            for (Map.Entry<String, Object> entry : item.entrySet()) {
                if (j > 0) json.append(",");
                json.append("\"").append(entry.getKey()).append("\":");
                if (entry.getValue() instanceof String) {
                    json.append("\"").append(entry.getValue()).append("\"");
                } else if (entry.getValue() instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<?> list = (List<?>) entry.getValue();
                    json.append(convertListToJson(list));
                } else if (entry.getValue() instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> map = (Map<String, Object>) entry.getValue();
                    json.append(convertMapToJson(map));
                } else {
                    json.append(entry.getValue());
                }
                j++;
            }
            json.append("}");
        }
        json.append("]");
        return json.toString();
    }
    
    private String convertListToJson(List<?> list) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) json.append(",");
            json.append("\"").append(list.get(i)).append("\"");
        }
        json.append("]");
        return json.toString();
    }
    
    private String convertMapToJson(Map<String, Object> map) {
        StringBuilder json = new StringBuilder("{");
        int i = 0;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (i > 0) json.append(",");
            json.append("\"").append(entry.getKey()).append("\":\"");
            json.append(entry.getValue()).append("\"");
            i++;
        }
        json.append("}");
        return json.toString();
    }
    
    private String createSuccessResponse(String message) {
        return "{\"status\":\"success\",\"message\":\"" + message + "\"}";
    }
    
         private String createErrorResponse(String message, int statusCode) {
         return "{\"status\":\"error\",\"message\":\"" + message + "\",\"code\":" + statusCode + "}";
    }

    // --- NEW: Handle /api/customer/bookings ---
    private String handleBookings(String method, String requestBody) {
        if (!"POST".equals(method)) {
            return createErrorResponse("Method not allowed", 405);
        }
        try (Connection conn = DatabaseConnector.getConnection()) {
            // Parse JSON body
            Map<String, Object> data = parseJson(requestBody);
            if (data == null) {
                return createErrorResponse("Invalid JSON body", 400);
            }
            // Validate required fields
            Integer customerId = parseIntSafe(data.get("customerId"));
            Integer vehicleId = parseIntSafe(data.get("vehicleId"));
            Integer serviceId = parseIntSafe(data.get("serviceId"));
            Integer branchId = parseIntSafe(data.get("branchId"));
            String bookingDate = (String) data.get("bookingDate");
            String notes = (String) data.getOrDefault("notes", "");
            if (customerId == null || vehicleId == null || serviceId == null || branchId == null || bookingDate == null || bookingDate.isEmpty()) {
                return createErrorResponse("Missing required booking fields", 400);
            }
            // Fetch service price
            String priceSql = "SELECT price FROM services WHERE id = ?";
            java.math.BigDecimal servicePrice = null;
            try (PreparedStatement priceStmt = conn.prepareStatement(priceSql)) {
                priceStmt.setInt(1, serviceId);
                ResultSet priceRs = priceStmt.executeQuery();
                if (priceRs.next()) {
                    servicePrice = priceRs.getBigDecimal("price");
                } else {
                    return createErrorResponse("Service not found", 404);
                }
            }
            // Insert new job (appointment) with total_cost set to service price
            String sql = "INSERT INTO jobs (customer_id, vehicle_id, service_id, branch_id, status, booking_date, notes, total_cost) VALUES (?, ?, ?, ?, 'Booked', ?, ?, ?)";
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setInt(1, customerId);
                pstmt.setInt(2, vehicleId);
                pstmt.setInt(3, serviceId);
                pstmt.setInt(4, branchId);
                pstmt.setString(5, bookingDate.replace('T', ' ')); // Accept both 'YYYY-MM-DD HH:MM' and 'YYYY-MM-DDTHH:MM'
                pstmt.setString(6, notes);
                pstmt.setBigDecimal(7, servicePrice);
                int rows = pstmt.executeUpdate();
                if (rows > 0) {
                    return createSuccessResponse("Appointment booked successfully");
                } else {
                    return createErrorResponse("Failed to book appointment", 500);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error booking appointment", 500);
        }
    }

    // --- NEW: Fetch invoice details for a job ---
    private String handleInvoice(String[] pathParts, String method) {
        if (!"GET".equals(method)) {
            return createErrorResponse("Method not allowed", 405);
        }
        if (pathParts.length < 5) {
            return createErrorResponse("Job ID not provided", 400);
        }
        int jobId;
        try {
            jobId = Integer.parseInt(pathParts[4]);
        } catch (NumberFormatException e) {
            return createErrorResponse("Invalid job ID format", 400);
        }
        try (Connection conn = DatabaseConnector.getConnection()) {
            String sql = "SELECT id, invoice_number, amount, tax_amount, total_amount, status, due_date, created_at FROM invoices WHERE job_id = ?";
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setInt(1, jobId);
                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    Map<String, Object> invoice = new HashMap<>();
                    invoice.put("id", rs.getInt("id"));
                    invoice.put("invoiceNumber", rs.getString("invoice_number"));
                    invoice.put("amount", rs.getBigDecimal("amount"));
                    invoice.put("taxAmount", rs.getBigDecimal("tax_amount"));
                    invoice.put("totalAmount", rs.getBigDecimal("total_amount"));
                    invoice.put("status", rs.getString("status"));
                    invoice.put("dueDate", rs.getTimestamp("due_date") != null ? rs.getTimestamp("due_date").toString() : null);
                    invoice.put("createdAt", rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toString() : null);
                    return convertToJson(Collections.singletonList(invoice));
                } else {
                    return createErrorResponse("Invoice not found for job", 404);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching invoice", 500);
        }
    }

    // --- Helper: Parse JSON string to Map ---
    private Map<String, Object> parseJson(String json) {
        try {
            // Use basic parsing (no external libraries)
            // Only works for flat JSON objects with string/number values
            Map<String, Object> map = new HashMap<>();
            json = json.trim();
            if (json.startsWith("{") && json.endsWith("}")) {
                json = json.substring(1, json.length() - 1);
                String[] pairs = json.split(",");
                for (String pair : pairs) {
                    String[] kv = pair.split(":", 2);
                    if (kv.length == 2) {
                        String key = kv[0].trim().replaceAll("^\"|\"$", "");
                        String value = kv[1].trim();
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                            map.put(key, value);
                        } else if (value.matches("-?\\d+")) {
                            map.put(key, Integer.parseInt(value));
                        } else {
                            map.put(key, value);
                        }
                    }
                }
                return map;
            }
        } catch (Exception e) {
            // Ignore parse errors
        }
        return null;
    }

    // --- Helper: Parse Integer safely ---
    private Integer parseIntSafe(Object obj) {
        if (obj == null) return null;
        try {
            if (obj instanceof Integer) return (Integer) obj;
            if (obj instanceof String) return Integer.parseInt((String) obj);
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }
}