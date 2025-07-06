package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.HashMap;
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
        
        // Get customer's invoices
        if (path.matches("/api/customer/invoices/\\d+") && method.equals("GET")) {
            try {
                int customerId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getCustomerInvoices(customerId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid customer ID format\"}";
            }
        }
        
        // Get customer's payments
        if (path.matches("/api/customer/payments/\\d+") && method.equals("GET")) {
            try {
                int customerId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getCustomerPayments(customerId);
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
                return makePayment(jobId, body);
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
        
        // Get all branches
        if (path.equals("/api/branches") && method.equals("GET")) {
            return getAllBranches();
        }
        
        // Get customer profile
        if (path.matches("/api/customer/profile/\\d+") && method.equals("GET")) {
            try {
                int customerId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return getCustomerProfile(customerId);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid customer ID format\"}";
            }
        }
        
        // Update customer profile
        if (path.matches("/api/customer/profile/\\d+") && method.equals("PUT")) {
            try {
                int customerId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                return updateCustomerProfile(customerId, body);
            } catch (NumberFormatException e) {
                return "{\"error\":\"Invalid customer ID format\"}";
            }
        }
        
        return "{\"error\":\"Customer route not found\"}";
    }
    
    private String getCustomerJobs(int customerId) {
        String sql = "SELECT j.id, v.make, v.model, v.year, v.color, s.service_name, j.status, " +
                     "j.booking_date, j.estimated_completion_date, j.actual_completion_date, " +
                     "j.total_cost, j.labor_cost, j.parts_cost, j.notes, j.customer_notes, " +
                     "b.name as branch_name, b.address as branch_address, " +
                     "u.full_name as assigned_employee " +
                     "FROM jobs j " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "LEFT JOIN branches b ON j.branch_id = b.id " +
                     "LEFT JOIN users u ON j.assigned_employee_id = u.id " +
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
                jsonBuilder.append("\"vehicleColor\":\"").append(rs.getString("color") != null ? rs.getString("color") : "").append("\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\",");
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\",");
                jsonBuilder.append("\"bookingDate\":\"").append(rs.getTimestamp("booking_date")).append("\",");
                jsonBuilder.append("\"estimatedCompletionDate\":").append(rs.getTimestamp("estimated_completion_date") != null ? "\"" + rs.getTimestamp("estimated_completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"actualCompletionDate\":").append(rs.getTimestamp("actual_completion_date") != null ? "\"" + rs.getTimestamp("actual_completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"totalCost\":").append(rs.getBigDecimal("total_cost") != null ? rs.getBigDecimal("total_cost") : "null").append(",");
                jsonBuilder.append("\"laborCost\":").append(rs.getBigDecimal("labor_cost") != null ? rs.getBigDecimal("labor_cost") : "null").append(",");
                jsonBuilder.append("\"partsCost\":").append(rs.getBigDecimal("parts_cost") != null ? rs.getBigDecimal("parts_cost") : "null").append(",");
                jsonBuilder.append("\"notes\":\"").append(rs.getString("notes") != null ? rs.getString("notes") : "").append("\",");
                jsonBuilder.append("\"customerNotes\":\"").append(rs.getString("customer_notes") != null ? rs.getString("customer_notes") : "").append("\",");
                jsonBuilder.append("\"branchName\":\"").append(rs.getString("branch_name") != null ? rs.getString("branch_name") : "").append("\",");
                jsonBuilder.append("\"branchAddress\":\"").append(rs.getString("branch_address") != null ? rs.getString("branch_address") : "").append("\",");
                jsonBuilder.append("\"assignedEmployee\":\"").append(rs.getString("assigned_employee") != null ? rs.getString("assigned_employee") : "").append("\"");
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
    
    private String getCustomerInvoices(int customerId) {
        String sql = "SELECT i.id, i.invoice_number, i.amount, i.tax_amount, i.total_amount, " +
                     "i.status, i.due_date, i.created_at, j.id as job_id, " +
                     "v.make, v.model, v.year, s.service_name " +
                     "FROM invoices i " +
                     "JOIN jobs j ON i.job_id = j.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "WHERE j.customer_id = ? " +
                     "ORDER BY i.created_at DESC";

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
                jsonBuilder.append("\"invoiceId\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"invoiceNumber\":\"").append(rs.getString("invoice_number")).append("\",");
                jsonBuilder.append("\"jobId\":").append(rs.getInt("job_id")).append(",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\",");
                jsonBuilder.append("\"amount\":").append(rs.getBigDecimal("amount")).append(",");
                jsonBuilder.append("\"taxAmount\":").append(rs.getBigDecimal("tax_amount")).append(",");
                jsonBuilder.append("\"totalAmount\":").append(rs.getBigDecimal("total_amount")).append(",");
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\",");
                jsonBuilder.append("\"dueDate\":\"").append(rs.getDate("due_date")).append("\",");
                jsonBuilder.append("\"createdAt\":\"").append(rs.getTimestamp("created_at")).append("\"");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching customer invoices\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String getCustomerPayments(int customerId) {
        String sql = "SELECT p.id, p.amount, p.payment_method, p.payment_status, " +
                     "p.transaction_id, p.payment_date, p.notes, " +
                     "i.invoice_number, j.id as job_id, " +
                     "v.make, v.model, v.year, s.service_name " +
                     "FROM payments p " +
                     "JOIN invoices i ON p.invoice_id = i.id " +
                     "JOIN jobs j ON i.job_id = j.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "WHERE j.customer_id = ? " +
                     "ORDER BY p.payment_date DESC";

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
                jsonBuilder.append("\"paymentId\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"amount\":").append(rs.getBigDecimal("amount")).append(",");
                jsonBuilder.append("\"paymentMethod\":\"").append(rs.getString("payment_method")).append("\",");
                jsonBuilder.append("\"paymentStatus\":\"").append(rs.getString("payment_status")).append("\",");
                jsonBuilder.append("\"transactionId\":\"").append(rs.getString("transaction_id") != null ? rs.getString("transaction_id") : "").append("\",");
                jsonBuilder.append("\"paymentDate\":\"").append(rs.getTimestamp("payment_date")).append("\",");
                jsonBuilder.append("\"notes\":\"").append(rs.getString("notes") != null ? rs.getString("notes") : "").append("\",");
                jsonBuilder.append("\"invoiceNumber\":\"").append(rs.getString("invoice_number")).append("\",");
                jsonBuilder.append("\"jobId\":").append(rs.getInt("job_id")).append(",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\"");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching customer payments\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String bookAppointment(String body) {
        Map<String, String> params = parseBody(body);
        String customerIdStr = params.get("customerId");
        String vehicleIdStr = params.get("vehicleId");
        String serviceIdStr = params.get("serviceId");
        String branchIdStr = params.get("branchId");
        String bookingDate = params.get("bookingDate");
        String notes = params.get("notes");
        
        if (customerIdStr == null || vehicleIdStr == null || serviceIdStr == null) {
            return "{\"error\":\"Customer ID, Vehicle ID, and Service ID are required\"}";
        }
        
        try {
            int customerId = Integer.parseInt(customerIdStr);
            int vehicleId = Integer.parseInt(vehicleIdStr);
            int serviceId = Integer.parseInt(serviceIdStr);
            Integer branchId = branchIdStr != null ? Integer.parseInt(branchIdStr) : null;
            
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
            
            String sql = "INSERT INTO jobs (customer_id, vehicle_id, service_id, branch_id, status, booking_date, notes) VALUES (?, ?, ?, ?, 'Booked', ?, ?)";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                
                pstmt.setInt(1, customerId);
                pstmt.setInt(2, vehicleId);
                pstmt.setInt(3, serviceId);
                if (branchId != null) {
                    pstmt.setInt(4, branchId);
                } else {
                    pstmt.setNull(4, Types.INTEGER);
                }
                pstmt.setString(5, bookingDate != null ? bookingDate : "NOW()");
                pstmt.setString(6, notes);
                
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
    
    private String makePayment(int jobId, String body) {
        Map<String, String> params = parseBody(body);
        String paymentMethod = params.get("paymentMethod");
        String amount = params.get("amount");
        
        if (paymentMethod == null || amount == null) {
            return "{\"error\":\"Payment method and amount are required\"}";
        }
        
        try {
            // Get the invoice for this job
            String invoiceSql = "SELECT i.id, i.total_amount FROM invoices i WHERE i.job_id = ? AND i.status = 'Sent'";
            int invoiceId = 0;
            double invoiceAmount = 0;
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement invoiceStmt = conn.prepareStatement(invoiceSql)) {
                
                invoiceStmt.setInt(1, jobId);
                ResultSet rs = invoiceStmt.executeQuery();
                
                if (rs.next()) {
                    invoiceId = rs.getInt("id");
                    invoiceAmount = rs.getDouble("total_amount");
                } else {
                    return "{\"error\":\"No invoice found for this job\"}";
                }
            }
            
            // Create payment record
            String paymentSql = "INSERT INTO payments (invoice_id, amount, payment_method, payment_status, transaction_id) VALUES (?, ?, ?, 'Completed', ?)";
            String transactionId = "TXN-" + System.currentTimeMillis();
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement paymentStmt = conn.prepareStatement(paymentSql)) {
                
                paymentStmt.setInt(1, invoiceId);
                paymentStmt.setDouble(2, Double.parseDouble(amount));
                paymentStmt.setString(3, paymentMethod);
                paymentStmt.setString(4, transactionId);
                
                int affectedRows = paymentStmt.executeUpdate();
                if (affectedRows > 0) {
                    // Update invoice status
                    String updateInvoiceSql = "UPDATE invoices SET status = 'Paid' WHERE id = ?";
                    try (PreparedStatement updateStmt = conn.prepareStatement(updateInvoiceSql)) {
                        updateStmt.setInt(1, invoiceId);
                        updateStmt.executeUpdate();
                    }
                    
                    // Update job status
                    String updateJobSql = "UPDATE jobs SET status = 'Paid' WHERE id = ?";
                    try (PreparedStatement updateJobStmt = conn.prepareStatement(updateJobSql)) {
                        updateJobStmt.setInt(1, jobId);
                        updateJobStmt.executeUpdate();
                    }
                    
                    return "{\"message\":\"Payment processed successfully\", \"status\":\"Paid\", \"transactionId\":\"" + transactionId + "\"}";
                } else {
                    return "{\"error\":\"Failed to process payment\"}";
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error processing payment\"}";
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid amount format\"}";
        }
    }
    
    private String getCustomerVehicles(int customerId) {
        String sql = "SELECT id, make, model, year, vin, license_plate, color, mileage, created_at FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC";
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
                jsonBuilder.append("\"vin\":\"").append(rs.getString("vin") != null ? rs.getString("vin") : "").append("\",");
                jsonBuilder.append("\"licensePlate\":\"").append(rs.getString("license_plate") != null ? rs.getString("license_plate") : "").append("\",");
                jsonBuilder.append("\"color\":\"").append(rs.getString("color") != null ? rs.getString("color") : "").append("\",");
                jsonBuilder.append("\"mileage\":").append(rs.getInt("mileage") != 0 ? rs.getInt("mileage") : "null").append(",");
                jsonBuilder.append("\"createdAt\":\"").append(rs.getTimestamp("created_at")).append("\"");
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
        String licensePlate = params.get("licensePlate");
        String color = params.get("color");
        String mileageStr = params.get("mileage");
        
        if (customerIdStr == null || make == null || model == null || yearStr == null) {
            return "{\"error\":\"Customer ID, make, model, and year are required\"}";
        }
        
        try {
            int customerId = Integer.parseInt(customerIdStr);
            int year = Integer.parseInt(yearStr);
            Integer mileage = mileageStr != null ? Integer.parseInt(mileageStr) : null;
            
            String sql = "INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color, mileage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                
                pstmt.setInt(1, customerId);
                pstmt.setString(2, make);
                pstmt.setString(3, model);
                pstmt.setInt(4, year);
                pstmt.setString(5, vin);
                pstmt.setString(6, licensePlate);
                pstmt.setString(7, color);
                if (mileage != null) {
                    pstmt.setInt(8, mileage);
                } else {
                    pstmt.setNull(8, Types.INTEGER);
                }
                
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
            e.printStackTrace();
            return "{\"error\":\"Database error adding vehicle\"}";
        }
    }
    
    private String getAllBranches() {
        String sql = "SELECT id, name, address, phone, email, latitude, longitude, hours, rating FROM branches WHERE is_active = TRUE ORDER BY name";
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
                jsonBuilder.append("\"id\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"name\":\"").append(rs.getString("name")).append("\",");
                jsonBuilder.append("\"address\":\"").append(rs.getString("address")).append("\",");
                jsonBuilder.append("\"phone\":\"").append(rs.getString("phone") != null ? rs.getString("phone") : "").append("\",");
                jsonBuilder.append("\"email\":\"").append(rs.getString("email") != null ? rs.getString("email") : "").append("\",");
                jsonBuilder.append("\"latitude\":").append(rs.getBigDecimal("latitude")).append(",");
                jsonBuilder.append("\"longitude\":").append(rs.getBigDecimal("longitude")).append(",");
                jsonBuilder.append("\"hours\":\"").append(rs.getString("hours") != null ? rs.getString("hours") : "").append("\",");
                jsonBuilder.append("\"rating\":").append(rs.getBigDecimal("rating"));
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching branches\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String getCustomerProfile(int customerId) {
        String sql = "SELECT id, username, full_name, email, phone, created_at FROM users WHERE id = ? AND role = 'customer'";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, customerId);
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
                return "{\"error\":\"Customer not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching customer profile\"}";
        }
    }
    
    private String updateCustomerProfile(int customerId, String body) {
        Map<String, String> params = parseBody(body);
        String email = params.get("email");
        String phone = params.get("phone");
        
        String sql = "UPDATE users SET email = ?, phone = ? WHERE id = ? AND role = 'customer'";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, email);
            pstmt.setString(2, phone);
            pstmt.setInt(3, customerId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Profile updated successfully\"}";
            } else {
                return "{\"error\":\"Customer not found or no changes made\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error updating customer profile\"}";
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