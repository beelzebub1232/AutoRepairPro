package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class AdminHandler {
    public String handle(String method, String path, String body) {
        // Dashboard statistics
        if (path.equals("/api/admin/dashboard/stats") && method.equals("GET")) {
            return getDashboardStats();
        }
        
        // Jobs management
        if (path.equals("/api/admin/jobs") && method.equals("GET")) {
            return getAllJobs();
        }
        
        if (path.equals("/api/admin/jobs") && method.equals("POST")) {
            return createJob(body);
        }
        
        if (path.matches("/api/admin/jobs/\\d+/assign") && method.equals("PUT")) {
            int jobId = extractIdFromPath(path, "/api/admin/jobs/", "/assign");
            return assignEmployee(jobId, body);
        }
        
        if (path.matches("/api/admin/jobs/\\d+/invoice") && method.equals("POST")) {
            int jobId = extractIdFromPath(path, "/api/admin/jobs/", "/invoice");
            return generateInvoice(jobId);
        }
        
        if (path.matches("/api/admin/jobs/\\d+") && method.equals("PUT")) {
            int jobId = extractIdFromPath(path, "/api/admin/jobs/", "");
            return updateJob(jobId, body);
        }
        
        if (path.matches("/api/admin/jobs/\\d+") && method.equals("DELETE")) {
            int jobId = extractIdFromPath(path, "/api/admin/jobs/", "");
            return deleteJob(jobId);
        }
        
        // Branches management
        if (path.equals("/api/admin/branches") && method.equals("GET")) {
            return getAllBranches();
        }
        
        if (path.equals("/api/admin/branches") && method.equals("POST")) {
            return addBranch(body);
        }
        
        if (path.matches("/api/admin/branches/\\d+") && method.equals("PUT")) {
            int branchId = extractIdFromPath(path, "/api/admin/branches/", "");
            return updateBranch(branchId, body);
        }
        
        if (path.matches("/api/admin/branches/\\d+") && method.equals("DELETE")) {
            int branchId = extractIdFromPath(path, "/api/admin/branches/", "");
            return deleteBranch(branchId);
        }
        
        // Services management
        if (path.equals("/api/admin/services") && method.equals("GET")) {
            return getAllServices();
        }
        
        if (path.equals("/api/admin/services") && method.equals("POST")) {
            return addService(body);
        }
        
        if (path.matches("/api/admin/services/\\d+") && method.equals("PUT")) {
            int serviceId = extractIdFromPath(path, "/api/admin/services/", "");
            return updateService(serviceId, body);
        }
        
        if (path.matches("/api/admin/services/\\d+") && method.equals("DELETE")) {
            int serviceId = extractIdFromPath(path, "/api/admin/services/", "");
            return deleteService(serviceId);
        }
        
        // Inventory management
        if (path.equals("/api/admin/inventory") && method.equals("GET")) {
            return getAllInventory();
        }
        
        if (path.equals("/api/admin/inventory") && method.equals("POST")) {
            return addInventoryItem(body);
        }
        
        if (path.matches("/api/admin/inventory/\\d+") && method.equals("PUT")) {
            int inventoryId = extractIdFromPath(path, "/api/admin/inventory/", "");
            return updateInventoryItem(inventoryId, body);
        }
        
        if (path.matches("/api/admin/inventory/\\d+") && method.equals("DELETE")) {
            int inventoryId = extractIdFromPath(path, "/api/admin/inventory/", "");
            return deleteInventoryItem(inventoryId);
        }
        
        if (path.equals("/api/admin/inventory/alerts") && method.equals("GET")) {
            return getLowStockAlerts();
        }
        
        if (path.equals("/api/admin/inventory/reorder") && method.equals("POST")) {
            return reorderInventory(body);
        }
        
        // User management
        if (path.equals("/api/admin/users") && method.equals("GET")) {
            return getAllUsers();
        }
        
        if (path.equals("/api/admin/users") && method.equals("POST")) {
            return addUser(body);
        }
        
        if (path.matches("/api/admin/users/\\d+") && method.equals("PUT")) {
            int userId = extractIdFromPath(path, "/api/admin/users/", "");
            return updateUser(userId, body);
        }
        
        if (path.matches("/api/admin/users/\\d+") && method.equals("DELETE")) {
            int userId = extractIdFromPath(path, "/api/admin/users/", "");
            return deleteUser(userId);
        }
        
        // Invoices and payments
        if (path.equals("/api/admin/invoices") && method.equals("GET")) {
            return getAllInvoices();
        }
        
        if (path.matches("/api/admin/invoices/\\d+") && method.equals("GET")) {
            int invoiceId = extractIdFromPath(path, "/api/admin/invoices/", "");
            return getInvoiceDetails(invoiceId);
        }
        
        if (path.equals("/api/admin/payments") && method.equals("GET")) {
            return getAllPayments();
        }
        
        // Reporting endpoints
        if (path.equals("/api/admin/reports/revenue") && method.equals("GET")) {
            return getRevenueReport();
        }
        
        if (path.equals("/api/admin/reports/part-usage") && method.equals("GET")) {
            return getPartUsageReport();
        }
        
        if (path.equals("/api/admin/reports/employee-performance") && method.equals("GET")) {
            return getEmployeePerformanceReport();
        }
        
        if (path.equals("/api/admin/reports/branch-performance") && method.equals("GET")) {
            return getBranchPerformanceReport();
        }
        
        if (path.equals("/api/admin/reports/customer-activity") && method.equals("GET")) {
            return getCustomerActivityReport();
        }
        
        return "{\"error\":\"Admin route not found\"}";
    }
    
    private int extractIdFromPath(String path, String prefix, String suffix) {
        String idStr = path.substring(prefix.length());
        if (!suffix.isEmpty()) {
            idStr = idStr.substring(0, idStr.indexOf(suffix));
        }
        return Integer.parseInt(idStr);
    }

    // Dashboard Statistics
    private String getDashboardStats() {
        try (Connection conn = DatabaseConnector.getConnection()) {
            // Total jobs
            String jobsSql = "SELECT COUNT(*) as total, " +
                           "SUM(CASE WHEN status = 'Booked' THEN 1 ELSE 0 END) as booked, " +
                           "SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress, " +
                           "SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed, " +
                           "SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid " +
                           "FROM jobs";
            
            // Total revenue
            String revenueSql = "SELECT SUM(total_amount) as totalRevenue FROM invoices WHERE status = 'Paid'";
            
            // Total customers
            String customersSql = "SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer'";
            
            // Total employees
            String employeesSql = "SELECT COUNT(*) as totalEmployees FROM users WHERE role = 'employee'";
            
            // Low stock items
            String lowStockSql = "SELECT COUNT(*) as lowStockItems FROM inventory WHERE quantity <= min_quantity";
            
            StringBuilder jsonBuilder = new StringBuilder();
            jsonBuilder.append("{");
            
            // Jobs stats
            try (PreparedStatement pstmt = conn.prepareStatement(jobsSql);
                 ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    jsonBuilder.append("\"totalJobs\":").append(rs.getInt("total")).append(",");
                    jsonBuilder.append("\"bookedJobs\":").append(rs.getInt("booked")).append(",");
                    jsonBuilder.append("\"inProgressJobs\":").append(rs.getInt("inProgress")).append(",");
                    jsonBuilder.append("\"completedJobs\":").append(rs.getInt("completed")).append(",");
                    jsonBuilder.append("\"paidJobs\":").append(rs.getInt("paid")).append(",");
                }
            }
            
            // Revenue
            try (PreparedStatement pstmt = conn.prepareStatement(revenueSql);
                 ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    jsonBuilder.append("\"totalRevenue\":").append(rs.getBigDecimal("totalRevenue") != null ? rs.getBigDecimal("totalRevenue") : "0").append(",");
                }
            }
            
            // Customers
            try (PreparedStatement pstmt = conn.prepareStatement(customersSql);
                 ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    jsonBuilder.append("\"totalCustomers\":").append(rs.getInt("totalCustomers")).append(",");
                }
            }
            
            // Employees
            try (PreparedStatement pstmt = conn.prepareStatement(employeesSql);
                 ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    jsonBuilder.append("\"totalEmployees\":").append(rs.getInt("totalEmployees")).append(",");
                }
            }
            
            // Low stock
            try (PreparedStatement pstmt = conn.prepareStatement(lowStockSql);
                 ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    jsonBuilder.append("\"lowStockItems\":").append(rs.getInt("lowStockItems"));
                }
            }
            
            jsonBuilder.append("}");
            return jsonBuilder.toString();
            
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching dashboard stats\"}";
        }
    }

    // Enhanced Jobs Management
    private String getAllJobs() {
        String sql = "SELECT j.id, u.full_name as customer_name, u.phone as customer_phone, " +
                     "v.make, v.model, v.year, v.color, v.license_plate, " +
                     "s.service_name, s.price as service_price, " +
                     "j.status, j.booking_date, j.estimated_completion_date, j.actual_completion_date, " +
                     "j.total_cost, j.labor_cost, j.parts_cost, j.notes, j.customer_notes, " +
                     "emp.full_name as assigned_employee, b.name as branch_name " +
                     "FROM jobs j " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "LEFT JOIN users emp ON j.assigned_employee_id = emp.id " +
                     "LEFT JOIN branches b ON j.branch_id = b.id " +
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
                jsonBuilder.append("\"customerPhone\":\"").append(rs.getString("customer_phone") != null ? rs.getString("customer_phone") : "").append("\",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\",");
                jsonBuilder.append("\"vehicleColor\":\"").append(rs.getString("color") != null ? rs.getString("color") : "").append("\",");
                jsonBuilder.append("\"licensePlate\":\"").append(rs.getString("license_plate") != null ? rs.getString("license_plate") : "").append("\",");
                jsonBuilder.append("\"service\":\"").append(rs.getString("service_name")).append("\",");
                jsonBuilder.append("\"servicePrice\":").append(rs.getBigDecimal("service_price")).append(",");
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\",");
                jsonBuilder.append("\"bookingDate\":\"").append(rs.getTimestamp("booking_date")).append("\",");
                jsonBuilder.append("\"estimatedCompletionDate\":").append(rs.getTimestamp("estimated_completion_date") != null ? "\"" + rs.getTimestamp("estimated_completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"actualCompletionDate\":").append(rs.getTimestamp("actual_completion_date") != null ? "\"" + rs.getTimestamp("actual_completion_date") + "\"" : "null").append(",");
                jsonBuilder.append("\"totalCost\":").append(rs.getBigDecimal("total_cost") != null ? rs.getBigDecimal("total_cost") : "null").append(",");
                jsonBuilder.append("\"laborCost\":").append(rs.getBigDecimal("labor_cost") != null ? rs.getBigDecimal("labor_cost") : "null").append(",");
                jsonBuilder.append("\"partsCost\":").append(rs.getBigDecimal("parts_cost") != null ? rs.getBigDecimal("parts_cost") : "null").append(",");
                jsonBuilder.append("\"notes\":\"").append(rs.getString("notes") != null ? rs.getString("notes") : "").append("\",");
                jsonBuilder.append("\"customerNotes\":\"").append(rs.getString("customer_notes") != null ? rs.getString("customer_notes") : "").append("\",");
                jsonBuilder.append("\"assignedEmployee\":").append(rs.getString("assigned_employee") != null ? "\"" + rs.getString("assigned_employee") + "\"" : "null").append(",");
                jsonBuilder.append("\"branchName\":\"").append(rs.getString("branch_name") != null ? rs.getString("branch_name") : "").append("\"");
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
    
    private String createJob(String body) {
        Map<String, String> params = parseBody(body);
        String customerIdStr = params.get("customerId");
        String vehicleIdStr = params.get("vehicleId");
        String serviceIdStr = params.get("serviceId");
        String branchIdStr = params.get("branchId");
        String employeeIdStr = params.get("employeeId");
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
            Integer employeeId = employeeIdStr != null ? Integer.parseInt(employeeIdStr) : null;
            
            String sql = "INSERT INTO jobs (customer_id, vehicle_id, service_id, branch_id, assigned_employee_id, status, booking_date, notes) VALUES (?, ?, ?, ?, ?, 'Booked', ?, ?)";
            
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
                if (employeeId != null) {
                    pstmt.setInt(5, employeeId);
                } else {
                    pstmt.setNull(5, Types.INTEGER);
                }
                pstmt.setString(6, bookingDate != null ? bookingDate : "NOW()");
                pstmt.setString(7, notes);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    ResultSet generatedKeys = pstmt.getGeneratedKeys();
                    if (generatedKeys.next()) {
                        int jobId = generatedKeys.getInt(1);
                        return "{\"message\":\"Job created successfully\", \"jobId\":" + jobId + "}";
                    }
                }
                return "{\"error\":\"Failed to create job\"}";
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid ID format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error creating job\"}";
        }
    }
    
    private String updateJob(int jobId, String body) {
        Map<String, String> params = parseBody(body);
        String status = params.get("status");
        String branchIdStr = params.get("branchId");
        String employeeIdStr = params.get("employeeId");
        String notes = params.get("notes");
        String totalCostStr = params.get("totalCost");
        String laborCostStr = params.get("laborCost");
        String partsCostStr = params.get("partsCost");
        
        StringBuilder sqlBuilder = new StringBuilder("UPDATE jobs SET ");
        boolean hasUpdates = false;
        
        if (status != null) {
            sqlBuilder.append("status = ?");
            hasUpdates = true;
        }
        
        if (branchIdStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("branch_id = ?");
            hasUpdates = true;
        }
        
        if (employeeIdStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("assigned_employee_id = ?");
            hasUpdates = true;
        }
        
        if (notes != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("notes = ?");
            hasUpdates = true;
        }
        
        if (totalCostStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("total_cost = ?");
            hasUpdates = true;
        }
        
        if (laborCostStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("labor_cost = ?");
            hasUpdates = true;
        }
        
        if (partsCostStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("parts_cost = ?");
            hasUpdates = true;
        }
        
        if (!hasUpdates) {
            return "{\"error\":\"No fields to update\"}";
        }
        
        sqlBuilder.append(" WHERE id = ?");
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sqlBuilder.toString())) {
            
            int paramIndex = 1;
            
            if (status != null) {
                pstmt.setString(paramIndex++, status);
            }
            
            if (branchIdStr != null) {
                pstmt.setInt(paramIndex++, Integer.parseInt(branchIdStr));
            }
            
            if (employeeIdStr != null) {
                pstmt.setInt(paramIndex++, Integer.parseInt(employeeIdStr));
            }
            
            if (notes != null) {
                pstmt.setString(paramIndex++, notes);
            }
            
            if (totalCostStr != null) {
                pstmt.setDouble(paramIndex++, Double.parseDouble(totalCostStr));
            }
            
            if (laborCostStr != null) {
                pstmt.setDouble(paramIndex++, Double.parseDouble(laborCostStr));
            }
            
            if (partsCostStr != null) {
                pstmt.setDouble(paramIndex++, Double.parseDouble(partsCostStr));
            }
            
            pstmt.setInt(paramIndex, jobId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Job updated successfully\"}";
            } else {
                return "{\"error\":\"Job not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error updating job\"}";
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid number format\"}";
        }
    }
    
    private String deleteJob(int jobId) {
        String sql = "DELETE FROM jobs WHERE id = ?";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, jobId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Job deleted successfully\"}";
            } else {
                return "{\"error\":\"Job not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error deleting job\"}";
        }
    }
    
    private String assignEmployee(int jobId, String body) {
        Map<String, String> params = parseBody(body);
        String employeeIdStr = params.get("employeeId");
        
        if (employeeIdStr == null) {
            return "{\"error\":\"Employee ID is required\"}";
        }
        
        try {
            int employeeId = Integer.parseInt(employeeIdStr);
            
            String sql = "UPDATE jobs SET assigned_employee_id = ? WHERE id = ?";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql)) {
                
                pstmt.setInt(1, employeeId);
                pstmt.setInt(2, jobId);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    return "{\"message\":\"Employee assigned successfully\"}";
                } else {
                    return "{\"error\":\"Job not found\"}";
                }
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid employee ID format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error assigning employee\"}";
        }
    }
    
    private String generateInvoice(int jobId) {
        try (Connection conn = DatabaseConnector.getConnection()) {
            // Check if job exists and is completed
            String checkSql = "SELECT j.total_cost, j.customer_id, u.full_name as customer_name " +
                             "FROM jobs j " +
                             "JOIN users u ON j.customer_id = u.id " +
                             "WHERE j.id = ? AND j.status = 'Completed'";
            
            try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                checkStmt.setInt(1, jobId);
                ResultSet rs = checkStmt.executeQuery();
                
                if (!rs.next()) {
                    return "{\"error\":\"Job not found or not completed\"}";
                }
                
                double totalCost = rs.getDouble("total_cost");
                int customerId = rs.getInt("customer_id");
                String customerName = rs.getString("customer_name");
                
                // Calculate tax (8% example)
                double taxAmount = totalCost * 0.08;
                double totalAmount = totalCost + taxAmount;
                
                // Generate invoice number
                String invoiceNumber = "INV-" + System.currentTimeMillis();
                
                // Create invoice
                String insertSql = "INSERT INTO invoices (job_id, invoice_number, amount, tax_amount, total_amount, status, due_date) VALUES (?, ?, ?, ?, ?, 'Sent', DATE_ADD(CURDATE(), INTERVAL 30 DAY))";
                
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                    insertStmt.setInt(1, jobId);
                    insertStmt.setString(2, invoiceNumber);
                    insertStmt.setDouble(3, totalCost);
                    insertStmt.setDouble(4, taxAmount);
                    insertStmt.setDouble(5, totalAmount);
                    
                    int affectedRows = insertStmt.executeUpdate();
                    if (affectedRows > 0) {
                        // Update job status
                        String updateSql = "UPDATE jobs SET status = 'Invoiced' WHERE id = ?";
                        try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                            updateStmt.setInt(1, jobId);
                            updateStmt.executeUpdate();
                        }
                        
                        ResultSet generatedKeys = insertStmt.getGeneratedKeys();
                        if (generatedKeys.next()) {
                            int invoiceId = generatedKeys.getInt(1);
                            return String.format(
                                "{\"message\":\"Invoice generated successfully\", \"invoiceId\":%d, \"invoiceNumber\":\"%s\", \"amount\":%.2f, \"taxAmount\":%.2f, \"totalAmount\":%.2f}",
                                invoiceId, invoiceNumber, totalCost, taxAmount, totalAmount
                            );
                        }
                    }
                }
            }
            
            return "{\"error\":\"Failed to generate invoice\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error generating invoice\"}";
        }
    }
    
    // Branches Management
    private String getAllBranches() {
        String sql = "SELECT id, name, address, phone, email, latitude, longitude, hours, rating, is_active FROM branches ORDER BY name";
        
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
                jsonBuilder.append("\"rating\":").append(rs.getBigDecimal("rating")).append(",");
                jsonBuilder.append("\"isActive\":").append(rs.getBoolean("is_active"));
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
    
    private String addBranch(String body) {
        Map<String, String> params = parseBody(body);
        String name = params.get("name");
        String address = params.get("address");
        String phone = params.get("phone");
        String email = params.get("email");
        String latitudeStr = params.get("latitude");
        String longitudeStr = params.get("longitude");
        String hours = params.get("hours");
        String ratingStr = params.get("rating");
        
        if (name == null || address == null) {
            return "{\"error\":\"Name and address are required\"}";
        }
        
        String sql = "INSERT INTO branches (name, address, phone, email, latitude, longitude, hours, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setString(1, name);
            pstmt.setString(2, address);
            pstmt.setString(3, phone);
            pstmt.setString(4, email);
            pstmt.setString(5, latitudeStr);
            pstmt.setString(6, longitudeStr);
            pstmt.setString(7, hours);
            pstmt.setString(8, ratingStr != null ? ratingStr : "4.5");
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                ResultSet generatedKeys = pstmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    int branchId = generatedKeys.getInt(1);
                    return "{\"message\":\"Branch added successfully\", \"branchId\":" + branchId + "}";
                }
            }
            return "{\"error\":\"Failed to add branch\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error adding branch\"}";
        }
    }
    
    private String updateBranch(int branchId, String body) {
        Map<String, String> params = parseBody(body);
        String name = params.get("name");
        String address = params.get("address");
        String phone = params.get("phone");
        String email = params.get("email");
        String latitudeStr = params.get("latitude");
        String longitudeStr = params.get("longitude");
        String hours = params.get("hours");
        String ratingStr = params.get("rating");
        String isActiveStr = params.get("isActive");
        
        StringBuilder sqlBuilder = new StringBuilder("UPDATE branches SET ");
        boolean hasUpdates = false;
        
        if (name != null) {
            sqlBuilder.append("name = ?");
            hasUpdates = true;
        }
        
        if (address != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("address = ?");
            hasUpdates = true;
        }
        
        if (phone != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("phone = ?");
            hasUpdates = true;
        }
        
        if (email != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("email = ?");
            hasUpdates = true;
        }
        
        if (latitudeStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("latitude = ?");
            hasUpdates = true;
        }
        
        if (longitudeStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("longitude = ?");
            hasUpdates = true;
        }
        
        if (hours != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("hours = ?");
            hasUpdates = true;
        }
        
        if (ratingStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("rating = ?");
            hasUpdates = true;
        }
        
        if (isActiveStr != null) {
            if (hasUpdates) sqlBuilder.append(", ");
            sqlBuilder.append("is_active = ?");
            hasUpdates = true;
        }
        
        if (!hasUpdates) {
            return "{\"error\":\"No fields to update\"}";
        }
        
        sqlBuilder.append(" WHERE id = ?");
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sqlBuilder.toString())) {
            
            int paramIndex = 1;
            
            if (name != null) {
                pstmt.setString(paramIndex++, name);
            }
            
            if (address != null) {
                pstmt.setString(paramIndex++, address);
            }
            
            if (phone != null) {
                pstmt.setString(paramIndex++, phone);
            }
            
            if (email != null) {
                pstmt.setString(paramIndex++, email);
            }
            
            if (latitudeStr != null) {
                pstmt.setDouble(paramIndex++, Double.parseDouble(latitudeStr));
            }
            
            if (longitudeStr != null) {
                pstmt.setDouble(paramIndex++, Double.parseDouble(longitudeStr));
            }
            
            if (hours != null) {
                pstmt.setString(paramIndex++, hours);
            }
            
            if (ratingStr != null) {
                pstmt.setDouble(paramIndex++, Double.parseDouble(ratingStr));
            }
            
            if (isActiveStr != null) {
                pstmt.setBoolean(paramIndex++, Boolean.parseBoolean(isActiveStr));
            }
            
            pstmt.setInt(paramIndex, branchId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Branch updated successfully\"}";
            } else {
                return "{\"error\":\"Branch not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error updating branch\"}";
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid number format\"}";
        }
    }
    
    private String deleteBranch(int branchId) {
        String sql = "DELETE FROM branches WHERE id = ?";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, branchId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Branch deleted successfully\"}";
            } else {
                return "{\"error\":\"Branch not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error deleting branch\"}";
        }
    }
    
    // Enhanced Inventory Management
    private String deleteInventoryItem(int inventoryId) {
        String sql = "UPDATE inventory SET is_active = FALSE WHERE id = ?";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, inventoryId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Inventory item deleted successfully\"}";
            } else {
                return "{\"error\":\"Inventory item not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error deleting inventory item\"}";
        }
    }
    
    private String reorderInventory(String body) {
        Map<String, String> params = parseBody(body);
        String inventoryIdStr = params.get("inventoryId");
        String quantityStr = params.get("quantity");
        
        if (inventoryIdStr == null || quantityStr == null) {
            return "{\"error\":\"Inventory ID and quantity are required\"}";
        }
        
        try {
            int inventoryId = Integer.parseInt(inventoryIdStr);
            int quantity = Integer.parseInt(quantityStr);
            
            String sql = "UPDATE inventory SET quantity = quantity + ? WHERE id = ?";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql)) {
                
                pstmt.setInt(1, quantity);
                pstmt.setInt(2, inventoryId);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    return "{\"message\":\"Inventory reordered successfully\", \"quantityAdded\":" + quantity + "}";
                } else {
                    return "{\"error\":\"Inventory item not found\"}";
                }
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid number format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error reordering inventory\"}";
        }
    }
    
    // Enhanced User Management
    private String deleteUser(int userId) {
        String sql = "DELETE FROM users WHERE id = ? AND role != 'admin'";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, userId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"User deleted successfully\"}";
            } else {
                return "{\"error\":\"User not found or cannot delete admin\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error deleting user\"}";
        }
    }
    
    // Invoice and Payment Management
    private String getAllInvoices() {
        String sql = "SELECT i.id, i.invoice_number, i.amount, i.tax_amount, i.total_amount, " +
                     "i.status, i.due_date, i.created_at, " +
                     "j.id as job_id, u.full_name as customer_name, " +
                     "v.make, v.model, v.year, s.service_name " +
                     "FROM invoices i " +
                     "JOIN jobs j ON i.job_id = j.id " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "ORDER BY i.created_at DESC";
        
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
                jsonBuilder.append("\"invoiceId\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"invoiceNumber\":\"").append(rs.getString("invoice_number")).append("\",");
                jsonBuilder.append("\"jobId\":").append(rs.getInt("job_id")).append(",");
                jsonBuilder.append("\"customerName\":\"").append(rs.getString("customer_name")).append("\",");
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
            return "{\"error\":\"Database error fetching invoices\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String getInvoiceDetails(int invoiceId) {
        String sql = "SELECT i.*, j.id as job_id, u.full_name as customer_name, u.phone as customer_phone, " +
                     "v.make, v.model, v.year, v.vin, s.service_name, s.description as service_description " +
                     "FROM invoices i " +
                     "JOIN jobs j ON i.job_id = j.id " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "WHERE i.id = ?";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, invoiceId);
            ResultSet rs = pstmt.executeQuery();
            
            if (rs.next()) {
                return String.format(
                    "{\"invoiceId\":%d,\"invoiceNumber\":\"%s\",\"jobId\":%d,\"customerName\":\"%s\",\"customerPhone\":\"%s\",\"vehicle\":\"%s %s (%d)\",\"vin\":\"%s\",\"service\":\"%s\",\"serviceDescription\":\"%s\",\"amount\":%.2f,\"taxAmount\":%.2f,\"totalAmount\":%.2f,\"status\":\"%s\",\"dueDate\":\"%s\",\"createdAt\":\"%s\"}",
                    rs.getInt("id"),
                    rs.getString("invoice_number"),
                    rs.getInt("job_id"),
                    rs.getString("customer_name"),
                    rs.getString("customer_phone") != null ? rs.getString("customer_phone") : "",
                    rs.getString("make"),
                    rs.getString("model"),
                    rs.getInt("year"),
                    rs.getString("vin") != null ? rs.getString("vin") : "",
                    rs.getString("service_name"),
                    rs.getString("service_description") != null ? rs.getString("service_description") : "",
                    rs.getDouble("amount"),
                    rs.getDouble("tax_amount"),
                    rs.getDouble("total_amount"),
                    rs.getString("status"),
                    rs.getDate("due_date"),
                    rs.getTimestamp("created_at")
                );
            } else {
                return "{\"error\":\"Invoice not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching invoice details\"}";
        }
    }
    
    private String getAllPayments() {
        String sql = "SELECT p.id, p.amount, p.payment_method, p.payment_status, " +
                     "p.transaction_id, p.payment_date, p.notes, " +
                     "i.invoice_number, j.id as job_id, " +
                     "u.full_name as customer_name, v.make, v.model, v.year " +
                     "FROM payments p " +
                     "JOIN invoices i ON p.invoice_id = i.id " +
                     "JOIN jobs j ON i.job_id = j.id " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "ORDER BY p.payment_date DESC";
        
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
                jsonBuilder.append("\"paymentId\":").append(rs.getInt("id")).append(",");
                jsonBuilder.append("\"amount\":").append(rs.getBigDecimal("amount")).append(",");
                jsonBuilder.append("\"paymentMethod\":\"").append(rs.getString("payment_method")).append("\",");
                jsonBuilder.append("\"paymentStatus\":\"").append(rs.getString("payment_status")).append("\",");
                jsonBuilder.append("\"transactionId\":\"").append(rs.getString("transaction_id") != null ? rs.getString("transaction_id") : "").append("\",");
                jsonBuilder.append("\"paymentDate\":\"").append(rs.getTimestamp("payment_date")).append("\",");
                jsonBuilder.append("\"notes\":\"").append(rs.getString("notes") != null ? rs.getString("notes") : "").append("\",");
                jsonBuilder.append("\"invoiceNumber\":\"").append(rs.getString("invoice_number")).append("\",");
                jsonBuilder.append("\"jobId\":").append(rs.getInt("job_id")).append(",");
                jsonBuilder.append("\"customerName\":\"").append(rs.getString("customer_name")).append("\",");
                jsonBuilder.append("\"vehicle\":\"").append(rs.getString("make")).append(" ").append(rs.getString("model")).append(" (").append(rs.getInt("year")).append(")\"");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching payments\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    // Enhanced Reporting
    private String getEmployeePerformanceReport() {
        String sql = "SELECT u.full_name, " +
                     "COUNT(j.id) as totalJobs, " +
                     "SUM(CASE WHEN j.status = 'Completed' THEN 1 ELSE 0 END) as completedJobs, " +
                     "AVG(CASE WHEN j.actual_completion_date IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, j.booking_date, j.actual_completion_date) END) as avgCompletionTime, " +
                     "SUM(j.total_cost) as totalRevenue " +
                     "FROM users u " +
                     "LEFT JOIN jobs j ON u.id = j.assigned_employee_id " +
                     "WHERE u.role = 'employee' " +
                     "GROUP BY u.id, u.full_name " +
                     "ORDER BY completedJobs DESC";
        
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
                jsonBuilder.append("\"employeeName\":\"").append(rs.getString("full_name")).append("\",");
                jsonBuilder.append("\"totalJobs\":").append(rs.getInt("totalJobs")).append(",");
                jsonBuilder.append("\"completedJobs\":").append(rs.getInt("completedJobs")).append(",");
                jsonBuilder.append("\"avgCompletionTime\":").append(rs.getDouble("avgCompletionTime")).append(",");
                jsonBuilder.append("\"totalRevenue\":").append(rs.getBigDecimal("totalRevenue") != null ? rs.getBigDecimal("totalRevenue") : "0");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching employee performance report\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String getBranchPerformanceReport() {
        String sql = "SELECT b.name, " +
                     "COUNT(j.id) as totalJobs, " +
                     "SUM(CASE WHEN j.status = 'Completed' THEN 1 ELSE 0 END) as completedJobs, " +
                     "SUM(j.total_cost) as totalRevenue, " +
                     "AVG(b.rating) as avgRating " +
                     "FROM branches b " +
                     "LEFT JOIN jobs j ON b.id = j.branch_id " +
                     "WHERE b.is_active = TRUE " +
                     "GROUP BY b.id, b.name " +
                     "ORDER BY totalRevenue DESC";
        
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
                jsonBuilder.append("\"branchName\":\"").append(rs.getString("name")).append("\",");
                jsonBuilder.append("\"totalJobs\":").append(rs.getInt("totalJobs")).append(",");
                jsonBuilder.append("\"completedJobs\":").append(rs.getInt("completedJobs")).append(",");
                jsonBuilder.append("\"totalRevenue\":").append(rs.getBigDecimal("totalRevenue") != null ? rs.getBigDecimal("totalRevenue") : "0").append(",");
                jsonBuilder.append("\"avgRating\":").append(rs.getBigDecimal("avgRating"));
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching branch performance report\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String getCustomerActivityReport() {
        String sql = "SELECT u.full_name, u.email, " +
                     "COUNT(j.id) as totalJobs, " +
                     "SUM(j.total_cost) as totalSpent, " +
                     "MAX(j.booking_date) as lastVisit, " +
                     "COUNT(DISTINCT v.id) as totalVehicles " +
                     "FROM users u " +
                     "LEFT JOIN jobs j ON u.id = j.customer_id " +
                     "LEFT JOIN vehicles v ON u.id = v.customer_id " +
                     "WHERE u.role = 'customer' " +
                     "GROUP BY u.id, u.full_name, u.email " +
                     "ORDER BY totalSpent DESC";
        
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
                jsonBuilder.append("\"customerName\":\"").append(rs.getString("full_name")).append("\",");
                jsonBuilder.append("\"email\":\"").append(rs.getString("email") != null ? rs.getString("email") : "").append("\",");
                jsonBuilder.append("\"totalJobs\":").append(rs.getInt("totalJobs")).append(",");
                jsonBuilder.append("\"totalSpent\":").append(rs.getBigDecimal("totalSpent") != null ? rs.getBigDecimal("totalSpent") : "0").append(",");
                jsonBuilder.append("\"lastVisit\":\"").append(rs.getTimestamp("lastVisit") != null ? rs.getTimestamp("lastVisit") : "").append("\",");
                jsonBuilder.append("\"totalVehicles\":").append(rs.getInt("totalVehicles"));
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching customer activity report\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    // Services Management Methods
    private String getAllServices() {
        String sql = "SELECT * FROM services ORDER BY service_name";
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
                jsonBuilder.append("\"serviceName\":\"").append(rs.getString("service_name")).append("\",");
                jsonBuilder.append("\"price\":").append(rs.getBigDecimal("price")).append(",");
                jsonBuilder.append("\"description\":\"").append(rs.getString("description") != null ? rs.getString("description") : "").append("\"");
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
    
    private String addService(String body) {
        Map<String, String> params = parseBody(body);
        String serviceName = params.get("serviceName");
        String priceStr = params.get("price");
        String description = params.get("description");
        
        if (serviceName == null || priceStr == null) {
            return "{\"error\":\"Service name and price are required\"}";
        }
        
        try {
            double price = Double.parseDouble(priceStr);
            
            String sql = "INSERT INTO services (service_name, price, description) VALUES (?, ?, ?)";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                
                pstmt.setString(1, serviceName);
                pstmt.setDouble(2, price);
                pstmt.setString(3, description);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    ResultSet generatedKeys = pstmt.getGeneratedKeys();
                    if (generatedKeys.next()) {
                        int serviceId = generatedKeys.getInt(1);
                        return "{\"message\":\"Service added successfully\", \"serviceId\":" + serviceId + "}";
                    }
                }
                return "{\"error\":\"Failed to add service\"}";
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid price format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error adding service\"}";
        }
    }
    
    private String updateService(int serviceId, String body) {
        Map<String, String> params = parseBody(body);
        String serviceName = params.get("serviceName");
        String priceStr = params.get("price");
        String description = params.get("description");
        
        if (serviceName == null || priceStr == null) {
            return "{\"error\":\"Service name and price are required\"}";
        }
        
        try {
            double price = Double.parseDouble(priceStr);
            
            String sql = "UPDATE services SET service_name = ?, price = ?, description = ? WHERE id = ?";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql)) {
                
                pstmt.setString(1, serviceName);
                pstmt.setDouble(2, price);
                pstmt.setString(3, description);
                pstmt.setInt(4, serviceId);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    return "{\"message\":\"Service updated successfully\"}";
                } else {
                    return "{\"error\":\"Service not found\"}";
                }
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid price format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error updating service\"}";
        }
    }
    
    private String deleteService(int serviceId) {
        String sql = "DELETE FROM services WHERE id = ?";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, serviceId);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"Service deleted successfully\"}";
            } else {
                return "{\"error\":\"Service not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error deleting service\"}";
        }
    }
    
    // Inventory Management Methods
    private String getAllInventory() {
        String sql = "SELECT * FROM inventory ORDER BY part_name";
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
                jsonBuilder.append("\"partName\":\"").append(rs.getString("part_name")).append("\",");
                jsonBuilder.append("\"quantity\":").append(rs.getInt("quantity")).append(",");
                jsonBuilder.append("\"pricePerUnit\":").append(rs.getBigDecimal("price_per_unit"));
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
    
    private String addInventoryItem(String body) {
        Map<String, String> params = parseBody(body);
        String partName = params.get("partName");
        String quantityStr = params.get("quantity");
        String priceStr = params.get("pricePerUnit");
        
        if (partName == null || quantityStr == null || priceStr == null) {
            return "{\"error\":\"Part name, quantity, and price per unit are required\"}";
        }
        
        try {
            int quantity = Integer.parseInt(quantityStr);
            double pricePerUnit = Double.parseDouble(priceStr);
            
            String sql = "INSERT INTO inventory (part_name, quantity, price_per_unit) VALUES (?, ?, ?)";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                
                pstmt.setString(1, partName);
                pstmt.setInt(2, quantity);
                pstmt.setDouble(3, pricePerUnit);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    ResultSet generatedKeys = pstmt.getGeneratedKeys();
                    if (generatedKeys.next()) {
                        int inventoryId = generatedKeys.getInt(1);
                        return "{\"message\":\"Inventory item added successfully\", \"inventoryId\":" + inventoryId + "}";
                    }
                }
                return "{\"error\":\"Failed to add inventory item\"}";
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid number format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error adding inventory item\"}";
        }
    }
    
    private String updateInventoryItem(int inventoryId, String body) {
        Map<String, String> params = parseBody(body);
        String partName = params.get("partName");
        String quantityStr = params.get("quantity");
        String priceStr = params.get("pricePerUnit");
        
        if (partName == null || quantityStr == null || priceStr == null) {
            return "{\"error\":\"Part name, quantity, and price per unit are required\"}";
        }
        
        try {
            int quantity = Integer.parseInt(quantityStr);
            double pricePerUnit = Double.parseDouble(priceStr);
            
            String sql = "UPDATE inventory SET part_name = ?, quantity = ?, price_per_unit = ? WHERE id = ?";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql)) {
                
                pstmt.setString(1, partName);
                pstmt.setInt(2, quantity);
                pstmt.setDouble(3, pricePerUnit);
                pstmt.setInt(4, inventoryId);
                
                int affectedRows = pstmt.executeUpdate();
                if (affectedRows > 0) {
                    return "{\"message\":\"Inventory item updated successfully\"}";
                } else {
                    return "{\"error\":\"Inventory item not found\"}";
                }
            }
        } catch (NumberFormatException e) {
            return "{\"error\":\"Invalid number format\"}";
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error updating inventory item\"}";
        }
    }
    
    private String getLowStockAlerts() {
        String sql = "SELECT * FROM inventory WHERE quantity < 10 ORDER BY quantity ASC";
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
                jsonBuilder.append("\"partName\":\"").append(rs.getString("part_name")).append("\",");
                jsonBuilder.append("\"quantity\":").append(rs.getInt("quantity")).append(",");
                jsonBuilder.append("\"pricePerUnit\":").append(rs.getBigDecimal("price_per_unit"));
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching low stock alerts\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    // User Management Methods
    private String getAllUsers() {
        String sql = "SELECT id, username, full_name, role, created_at FROM users ORDER BY role, full_name";
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
                jsonBuilder.append("\"username\":\"").append(rs.getString("username")).append("\",");
                jsonBuilder.append("\"fullName\":\"").append(rs.getString("full_name")).append("\",");
                jsonBuilder.append("\"role\":\"").append(rs.getString("role")).append("\",");
                jsonBuilder.append("\"createdAt\":\"").append(rs.getTimestamp("created_at")).append("\"");
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching users\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String addUser(String body) {
        Map<String, String> params = parseBody(body);
        String username = params.get("username");
        String password = params.get("password");
        String fullName = params.get("fullName");
        String role = params.get("role");
        
        if (username == null || password == null || fullName == null || role == null) {
            return "{\"error\":\"Username, password, full name, and role are required\"}";
        }
        
        String sql = "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setString(1, username);
            pstmt.setString(2, password); // In production, hash this password
            pstmt.setString(3, fullName);
            pstmt.setString(4, role);
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                ResultSet generatedKeys = pstmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    int userId = generatedKeys.getInt(1);
                    return "{\"message\":\"User added successfully\", \"userId\":" + userId + "}";
                }
            }
            return "{\"error\":\"Failed to add user\"}";
        } catch (SQLException e) {
            if (e.getMessage().contains("Duplicate entry")) {
                return "{\"error\":\"Username already exists\"}";
            }
            e.printStackTrace();
            return "{\"error\":\"Database error adding user\"}";
        }
    }
    
    private String updateUser(int userId, String body) {
        Map<String, String> params = parseBody(body);
        String username = params.get("username");
        String fullName = params.get("fullName");
        String role = params.get("role");
        String password = params.get("password");
        
        if (username == null || fullName == null || role == null) {
            return "{\"error\":\"Username, full name, and role are required\"}";
        }
        
        String sql;
        if (password != null && !password.isEmpty()) {
            sql = "UPDATE users SET username = ?, full_name = ?, role = ?, password = ? WHERE id = ?";
        } else {
            sql = "UPDATE users SET username = ?, full_name = ?, role = ? WHERE id = ?";
        }
        
        try (Connection conn = DatabaseConnector.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, username);
            pstmt.setString(2, fullName);
            pstmt.setString(3, role);
            
            if (password != null && !password.isEmpty()) {
                pstmt.setString(4, password); // In production, hash this password
                pstmt.setInt(5, userId);
            } else {
                pstmt.setInt(4, userId);
            }
            
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                return "{\"message\":\"User updated successfully\"}";
            } else {
                return "{\"error\":\"User not found\"}";
            }
        } catch (SQLException e) {
            if (e.getMessage().contains("Duplicate entry")) {
                return "{\"error\":\"Username already exists\"}";
            }
            e.printStackTrace();
            return "{\"error\":\"Database error updating user\"}";
        }
    }
    
    // Reporting Methods
    private String getRevenueReport() {
        String sql = "SELECT " +
                    "DATE_FORMAT(completion_date, '%Y-%m') as month, " +
                    "COUNT(*) as jobs_completed, " +
                    "SUM(total_cost) as total_revenue " +
                    "FROM jobs " +
                    "WHERE status = 'Paid' AND completion_date IS NOT NULL " +
                    "GROUP BY DATE_FORMAT(completion_date, '%Y-%m') " +
                    "ORDER BY month DESC " +
                    "LIMIT 12";
        
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
                jsonBuilder.append("\"month\":\"").append(rs.getString("month")).append("\",");
                jsonBuilder.append("\"jobsCompleted\":").append(rs.getInt("jobs_completed")).append(",");
                jsonBuilder.append("\"totalRevenue\":").append(rs.getBigDecimal("total_revenue") != null ? rs.getBigDecimal("total_revenue") : 0);
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching revenue report\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    private String getPartUsageReport() {
        String sql = "SELECT " +
                    "i.part_name, " +
                    "SUM(ji.quantity_used) as total_used, " +
                    "COUNT(DISTINCT ji.job_id) as jobs_count " +
                    "FROM job_inventory ji " +
                    "JOIN inventory i ON ji.inventory_id = i.id " +
                    "GROUP BY i.id, i.part_name " +
                    "ORDER BY total_used DESC " +
                    "LIMIT 20";
        
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
                jsonBuilder.append("\"partName\":\"").append(rs.getString("part_name")).append("\",");
                jsonBuilder.append("\"totalUsed\":").append(rs.getInt("total_used")).append(",");
                jsonBuilder.append("\"jobsCount\":").append(rs.getInt("jobs_count"));
                jsonBuilder.append("}");
                first = false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error fetching part usage report\"}";
        }

        jsonBuilder.append("]");
        return jsonBuilder.toString();
    }
    
    // Utility method for parsing JSON-like body
    private Map<String, String> parseBody(String body) {
        return Stream.of(body.replace("{", "").replace("}", "").replace("\"", "").split(","))
                .map(s -> s.split(":", 2))
                .filter(a -> a.length == 2)
                .collect(Collectors.toMap(a -> a[0].trim(), a -> a[1].trim()));
    }
}