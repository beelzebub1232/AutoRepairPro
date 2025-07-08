package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.*;
import java.io.*;
import java.math.BigDecimal;

public class AdminHandler {
    
    public String handleRequest(String path, String method, String requestBody) {
        try {
            // Strip query string before splitting
            String cleanPath = path.split("\\?")[0];
            String[] pathParts = cleanPath.split("/");
            
            if (pathParts.length < 4) {
                return createErrorResponse("Invalid admin route", 400);
            }
            
            String action = pathParts[3];
            
            // New: Overview metrics and recent jobs endpoints
            if ("overview-metrics".equals(action)) {
                return getOverviewMetrics();
            }
            if ("recent-jobs".equals(action)) {
                // Support ?limit=5
                int limit = 5;
                if (path.contains("?limit=")) {
                    try {
                        String[] parts = path.split("\\?limit=");
                        limit = Integer.parseInt(parts[1].split("&")[0]);
                    } catch (Exception e) { /* fallback to default */ }
                }
                return getRecentJobs(limit);
            }
            
            switch (action) {
                case "dashboard":
                    return getDashboardStats();
                case "jobs":
                    return handleJobs(method, requestBody);
                case "users":
                    return handleUsers(method, requestBody);
                case "services":
                    return handleServices(method, requestBody);
                case "inventory":
                    return handleInventory(method, requestBody);
                case "branches":
                    return handleBranches(method, requestBody);
                case "invoices":
                    return handleInvoices(method, requestBody);
                case "payments":
                    return handlePayments(method, requestBody);
                case "reports":
                    return handleReports(pathParts, method);
                case "settings":
                    return handleSettings(method, requestBody);
                case "performance":
                    return handlePerformance(method, requestBody);
                default:
                    return createErrorResponse("Admin route not found", 404);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return createErrorResponse("Internal server error: " + e.getMessage(), 500);
        }
    }
    
    private String getDashboardStats() {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            // Total jobs
            String jobsSql = "SELECT COUNT(*) as total, " +
                           "SUM(CASE WHEN status = 'Booked' THEN 1 ELSE 0 END) as booked, " +
                           "SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress, " +
                           "SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed, " +
                           "SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid " +
                           "FROM jobs";
            
            // Total revenue
            String revenueSql = "SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM invoices WHERE status = 'Paid'";
            
            // Total customers
            String customersSql = "SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer' AND is_active = true";
            
            // Total employees
            String employeesSql = "SELECT COUNT(*) as totalEmployees FROM users WHERE role = 'employee' AND is_active = true";
            
            // Low stock items
            String lowStockSql = "SELECT COUNT(*) as lowStockItems FROM inventory WHERE quantity <= min_quantity AND is_active = true";

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
                    jsonBuilder.append("\"totalRevenue\":").append(rs.getBigDecimal("totalRevenue")).append(",");
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
            return createErrorResponse("Database error fetching dashboard stats", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String handleJobs(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                return getAllJobs(conn);
            } else if ("POST".equals(method)) {
                return createJob(conn, requestBody);
            } else if ("PUT".equals(method)) {
                return updateJob(conn, requestBody);
                }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error handling jobs", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String getAllJobs(Connection conn) throws SQLException {
        String sql = "SELECT j.id as jobId, j.status, j.booking_date, j.total_cost, j.notes, " +
                    "u.full_name as customerName, v.make, v.model, v.year, " +
                    "s.service_name, b.name as branchName, " +
                    "e.full_name as employeeName " +
                    "FROM jobs j " +
                    "JOIN users u ON j.customer_id = u.id " +
                    "JOIN vehicles v ON j.vehicle_id = v.id " +
                    "JOIN services s ON j.service_id = s.id " +
                    "JOIN branches b ON j.branch_id = b.id " +
                    "LEFT JOIN users e ON j.assigned_employee_id = e.id " +
                    "ORDER BY j.booking_date DESC";
            
        List<Map<String, Object>> jobs = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                Map<String, Object> job = new HashMap<>();
                job.put("jobId", rs.getInt("jobId"));
                job.put("status", rs.getString("status"));
                
                // Safe timestamp handling
                java.sql.Timestamp bookingDate = rs.getTimestamp("booking_date");
                job.put("bookingDate", bookingDate != null ? bookingDate.toString() : null);
                
                // Safe decimal handling
                java.math.BigDecimal totalCost = rs.getBigDecimal("total_cost");
                job.put("totalCost", totalCost);
                
                job.put("notes", rs.getString("notes"));
                job.put("customerName", rs.getString("customerName"));
                
                // Safe string concatenation
                String make = rs.getString("make");
                String model = rs.getString("model");
                int year = rs.getInt("year");
                String vehicle = (make != null ? make : "") + " " + (model != null ? model : "") + " (" + year + ")";
                job.put("vehicle", vehicle.trim());
                
                job.put("service", rs.getString("service_name"));
                job.put("branchName", rs.getString("branchName"));
                job.put("employeeName", rs.getString("employeeName"));
                jobs.add(job);
        }
        }
        
        return convertToJson(jobs);
    }
    
    private String createJob(Connection conn, String requestBody) throws SQLException {
        // Parse request body and create job
        // Implementation would parse JSON and insert into database
        return createSuccessResponse("Job created successfully");
    }
    
    private String updateJob(Connection conn, String requestBody) throws SQLException {
        // Parse request body and update job
        // Implementation would parse JSON and update database
        return createSuccessResponse("Job updated successfully");
    }
    
    private String handleUsers(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                String sql = "SELECT id, username, full_name, email, phone, role, created_at, is_active " +
                           "FROM users ORDER BY created_at DESC";
                
                List<Map<String, Object>> users = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
                    
                    while (rs.next()) {
                        Map<String, Object> user = new HashMap<>();
                        user.put("id", rs.getInt("id"));
                        user.put("username", rs.getString("username"));
                        user.put("fullName", rs.getString("full_name"));
                        user.put("email", rs.getString("email"));
                        user.put("phone", rs.getString("phone"));
                        user.put("role", rs.getString("role"));
                        
                        // Safe timestamp handling
                        java.sql.Timestamp createdAt = rs.getTimestamp("created_at");
                        user.put("createdAt", createdAt != null ? createdAt.toString() : null);
                        
                        // Safe boolean handling
                        user.put("isActive", rs.getBoolean("is_active"));
                        users.add(user);
                    }
                }
                
                return convertToJson(users);
                }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching users", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String handleServices(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                String sql = "SELECT id, service_name, price, description, estimated_duration, category, is_active " +
                           "FROM services WHERE is_active = true ORDER BY service_name";
                
                List<Map<String, Object>> services = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                        Map<String, Object> service = new HashMap<>();
                        service.put("id", rs.getInt("id"));
                        service.put("serviceName", rs.getString("service_name"));
                        
                        // Safe decimal handling
                        java.math.BigDecimal price = rs.getBigDecimal("price");
                        service.put("price", price);
                        
                        service.put("description", rs.getString("description"));
                        
                        // Safe integer handling
                        int estimatedDuration = rs.getInt("estimated_duration");
                        service.put("estimatedDuration", rs.wasNull() ? null : estimatedDuration);
                        
                        service.put("category", rs.getString("category"));
                        service.put("isActive", rs.getBoolean("is_active"));
                        services.add(service);
                    }
                }
                
                return convertToJson(services);
            } else if ("POST".equals(method)) {
                // Add new service
                Map<String, Object> data = parseJson(requestBody);
                if (data == null) {
                    return createErrorResponse("Invalid JSON body", 400);
                }
                String serviceName = (String) data.get("serviceName");
                Object priceObj = data.get("price");
                String description = (String) data.getOrDefault("description", "");
                Object estimatedDurationObj = data.get("estimatedDuration");
                String category = (String) data.getOrDefault("category", "");
                
                if (serviceName == null || serviceName.trim().isEmpty() || priceObj == null) {
                    return createErrorResponse("Missing required fields: serviceName, price", 400);
                }
                java.math.BigDecimal price;
                try {
                    price = new java.math.BigDecimal(priceObj.toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid price value", 400);
                }
                Integer estimatedDuration = null;
                if (estimatedDurationObj != null) {
                    try {
                        estimatedDuration = Integer.parseInt(estimatedDurationObj.toString());
                    } catch (Exception e) {
                        return createErrorResponse("Invalid estimatedDuration value", 400);
                    }
                }
                String insertSql = "INSERT INTO services (service_name, price, description, estimated_duration, category, is_active) VALUES (?, ?, ?, ?, ?, true)";
                try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
                    pstmt.setString(1, serviceName);
                    pstmt.setBigDecimal(2, price);
                    pstmt.setString(3, description);
                    if (estimatedDuration != null) {
                        pstmt.setInt(4, estimatedDuration);
                    } else {
                        pstmt.setNull(4, java.sql.Types.INTEGER);
                    }
                    pstmt.setString(5, category);
                    int rows = pstmt.executeUpdate();
                    if (rows > 0) {
                        return createSuccessResponse("Service added successfully");
                    } else {
                        return createErrorResponse("Failed to add service", 500);
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    return createErrorResponse("Database error adding service", 500);
                }
            } else if ("PUT".equals(method)) {
                // Update existing service
                Map<String, Object> data = parseJson(requestBody);
                if (data == null) {
                    return createErrorResponse("Invalid JSON body", 400);
                }
                Object idObj = data.get("id");
                if (idObj == null) {
                    return createErrorResponse("Missing service id", 400);
                }
                Integer id;
                try {
                    id = Integer.parseInt(idObj.toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid service id", 400);
                }
                String serviceName = (String) data.get("serviceName");
                Object priceObj = data.get("price");
                String description = (String) data.getOrDefault("description", "");
                Object estimatedDurationObj = data.get("estimatedDuration");
                String category = (String) data.getOrDefault("category", "");
                
                String updateSql = "UPDATE services SET service_name=?, price=?, description=?, estimated_duration=?, category=? WHERE id=?";
                try (PreparedStatement pstmt = conn.prepareStatement(updateSql)) {
                    pstmt.setString(1, serviceName);
                    if (priceObj != null) {
                        pstmt.setBigDecimal(2, new java.math.BigDecimal(priceObj.toString()));
                    } else {
                        pstmt.setNull(2, java.sql.Types.DECIMAL);
                    }
                    pstmt.setString(3, description);
                    if (estimatedDurationObj != null) {
                        pstmt.setInt(4, Integer.parseInt(estimatedDurationObj.toString()));
                    } else {
                        pstmt.setNull(4, java.sql.Types.INTEGER);
                    }
                    pstmt.setString(5, category);
                    pstmt.setInt(6, id);
                    int rows = pstmt.executeUpdate();
                    if (rows > 0) {
                        return createSuccessResponse("Service updated successfully");
                    } else {
                        return createErrorResponse("Service not found or could not be updated", 404);
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    return createErrorResponse("Database error updating service", 500);
                }
            } else if ("DELETE".equals(method)) {
                // Hard delete service
                Map<String, Object> data = parseJson(requestBody);
                if (data == null) {
                    return createErrorResponse("Invalid JSON body", 400);
                }
                Object idObj = data.get("id");
                if (idObj == null) {
                    return createErrorResponse("Missing service id", 400);
                }
                Integer id;
                try {
                    id = Integer.parseInt(idObj.toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid service id", 400);
                }
                String deleteSql = "DELETE FROM services WHERE id=?";
                try (PreparedStatement pstmt = conn.prepareStatement(deleteSql)) {
                    pstmt.setInt(1, id);
                    int rows = pstmt.executeUpdate();
                    if (rows > 0) {
                        return createSuccessResponse("Service deleted successfully");
                    } else {
                        return createErrorResponse("Service not found or could not be deleted", 404);
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    return createErrorResponse("Database error deleting service", 500);
                }
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching services", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String handleInventory(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                String sql = "SELECT id, part_name, quantity, min_quantity, price_per_unit, category, supplier, location, is_active FROM inventory WHERE is_active = true ORDER BY part_name";
                List<Map<String, Object>> inventory = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", rs.getInt("id"));
                        item.put("partNumber", rs.getInt("id")); // Use id as partNumber
                        item.put("partName", rs.getString("part_name"));
                        int quantity = rs.getInt("quantity");
                        item.put("quantity", quantity);
                        int minQuantity = rs.getInt("min_quantity");
                        item.put("minQuantity", minQuantity);
                        java.math.BigDecimal pricePerUnit = rs.getBigDecimal("price_per_unit");
                        item.put("pricePerUnit", pricePerUnit);
                        item.put("category", rs.getString("category"));
                        item.put("supplier", rs.getString("supplier"));
                        item.put("location", rs.getString("location"));
                        item.put("isActive", rs.getBoolean("is_active"));
                        item.put("lowStock", quantity <= minQuantity);
                        inventory.add(item);
                    }
                }
                return convertToJson(inventory);
            } else if ("POST".equals(method)) {
                // Add new inventory item (id is auto-incremented and used as partNumber)
                Map<String, Object> data = parseJson(requestBody);
                if (data == null) {
                    return createErrorResponse("Invalid JSON body", 400);
                }
                String partName = (String) data.get("partName");
                Object quantityObj = data.get("quantity");
                Object minQuantityObj = data.get("minQuantity");
                Object pricePerUnitObj = data.get("pricePerUnit");
                String category = (String) data.getOrDefault("category", "");
                String supplier = (String) data.getOrDefault("supplier", "");
                String location = (String) data.getOrDefault("location", "");
                if (partName == null || partName.trim().isEmpty() || quantityObj == null || minQuantityObj == null || pricePerUnitObj == null) {
                    return createErrorResponse("Missing required fields: partName, quantity, minQuantity, pricePerUnit", 400);
                }
                int quantity, minQuantity;
                java.math.BigDecimal pricePerUnit;
                try {
                    quantity = Integer.parseInt(quantityObj.toString());
                    minQuantity = Integer.parseInt(minQuantityObj.toString());
                    pricePerUnit = new java.math.BigDecimal(pricePerUnitObj.toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid quantity, minQuantity, or pricePerUnit value", 400);
                }
                String insertSql = "INSERT INTO inventory (part_name, quantity, min_quantity, price_per_unit, category, supplier, location, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, true)";
                try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
                    pstmt.setString(1, partName);
                    pstmt.setInt(2, quantity);
                    pstmt.setInt(3, minQuantity);
                    pstmt.setBigDecimal(4, pricePerUnit);
                    pstmt.setString(5, category);
                    pstmt.setString(6, supplier);
                    pstmt.setString(7, location);
                    int rows = pstmt.executeUpdate();
                    if (rows > 0) {
                        return createSuccessResponse("Inventory item added successfully");
                    } else {
                        return createErrorResponse("Failed to add inventory item", 500);
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    return createErrorResponse("Database error adding inventory item", 500);
                }
            } else if ("PUT".equals(method)) {
                // Update inventory item (id is used as partNumber)
                Map<String, Object> data = parseJson(requestBody);
                if (data == null) {
                    return createErrorResponse("Invalid JSON body", 400);
                }
                Object idObj = data.get("id");
                if (idObj == null) {
                    return createErrorResponse("Missing inventory id", 400);
                }
                Integer id;
                try {
                    id = Integer.parseInt(idObj.toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid inventory id", 400);
                }
                String partName = (String) data.get("partName");
                Object quantityObj = data.get("quantity");
                Object minQuantityObj = data.get("minQuantity");
                Object pricePerUnitObj = data.get("pricePerUnit");
                String category = (String) data.getOrDefault("category", "");
                String supplier = (String) data.getOrDefault("supplier", "");
                String location = (String) data.getOrDefault("location", "");
                if (partName == null || partName.trim().isEmpty() || quantityObj == null || minQuantityObj == null || pricePerUnitObj == null) {
                    return createErrorResponse("Missing required fields: partName, quantity, minQuantity, pricePerUnit", 400);
                }
                int quantity, minQuantity;
                java.math.BigDecimal pricePerUnit;
                try {
                    quantity = Integer.parseInt(quantityObj.toString());
                    minQuantity = Integer.parseInt(minQuantityObj.toString());
                    pricePerUnit = new java.math.BigDecimal(pricePerUnitObj.toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid quantity, minQuantity, or pricePerUnit value", 400);
                }
                String updateSql = "UPDATE inventory SET part_name=?, quantity=?, min_quantity=?, price_per_unit=?, category=?, supplier=?, location=? WHERE id=?";
                try (PreparedStatement pstmt = conn.prepareStatement(updateSql)) {
                    pstmt.setString(1, partName);
                    pstmt.setInt(2, quantity);
                    pstmt.setInt(3, minQuantity);
                    pstmt.setBigDecimal(4, pricePerUnit);
                    pstmt.setString(5, category);
                    pstmt.setString(6, supplier);
                    pstmt.setString(7, location);
                    pstmt.setInt(8, id);
                    int rows = pstmt.executeUpdate();
                    if (rows > 0) {
                        return createSuccessResponse("Inventory item updated successfully");
                    } else {
                        return createErrorResponse("Inventory item not found or could not be updated", 404);
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    return createErrorResponse("Database error updating inventory item", 500);
                }
            } else if ("DELETE".equals(method)) {
                // Hard delete inventory item
                Map<String, Object> data = parseJson(requestBody);
                if (data == null) {
                    return createErrorResponse("Invalid JSON body", 400);
                }
                Object idObj = data.get("id");
                if (idObj == null) {
                    return createErrorResponse("Missing inventory id", 400);
                }
                Integer id;
                try {
                    id = Integer.parseInt(idObj.toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid inventory id", 400);
                }
                String deleteSql = "DELETE FROM inventory WHERE id=?";
                try (PreparedStatement pstmt = conn.prepareStatement(deleteSql)) {
                    pstmt.setInt(1, id);
                    int rows = pstmt.executeUpdate();
                    if (rows > 0) {
                        return createSuccessResponse("Inventory item deleted successfully");
                    } else {
                        return createErrorResponse("Inventory item not found or could not be deleted", 404);
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    return createErrorResponse("Database error deleting inventory item", 500);
                }
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching inventory", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String handleBranches(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                String selectSql = "SELECT b.id, b.name, b.address, b.phone, b.email, b.latitude, b.longitude, b.rating, " +
                           "b.is_active, " +
                           "GROUP_CONCAT(DISTINCT bh.day_of_week, ': ', " +
                           "CASE WHEN bh.is_closed THEN 'Closed' " +
                           "ELSE CONCAT(TIME_FORMAT(bh.open_time, '%H:%i'), '-', TIME_FORMAT(bh.close_time, '%H:%i')) " +
                           "END ORDER BY FIELD(bh.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) as hours " +
                           "FROM branches b " +
                           "LEFT JOIN business_hours bh ON b.id = bh.branch_id " +
                           "WHERE b.is_active = true " +
                           "GROUP BY b.id " +
                           "ORDER BY b.name";
                List<Map<String, Object>> branches = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(selectSql);
                     ResultSet rs = pstmt.executeQuery()) {
                    
                    while (rs.next()) {
                        Map<String, Object> branch = new HashMap<>();
                        branch.put("id", rs.getInt("id"));
                        branch.put("name", rs.getString("name"));
                        branch.put("address", rs.getString("address"));
                        branch.put("phone", rs.getString("phone"));
                        branch.put("email", rs.getString("email"));
                        java.math.BigDecimal latitude = rs.getBigDecimal("latitude");
                        branch.put("latitude", latitude);
                        java.math.BigDecimal longitude = rs.getBigDecimal("longitude");
                        branch.put("longitude", longitude);
                        java.math.BigDecimal rating = rs.getBigDecimal("rating");
                        branch.put("rating", rating);
                        branch.put("isActive", rs.getBoolean("is_active"));
                        branch.put("hours", rs.getString("hours"));
                        branches.add(branch);
                    }
                }
                return convertToJson(branches);
            } else if ("POST".equals(method)) {
                // Add branch logic
                Map<String, Object> data = parseJson(requestBody);
                if (data == null) {
                    return createErrorResponse("Invalid JSON body", 400);
                }
                String name = (String) data.get("name");
                String address = (String) data.get("address");
                String phone = (String) data.getOrDefault("phone", "");
                String email = (String) data.getOrDefault("email", "");
                BigDecimal latitude = null, longitude = null;
                try {
                    latitude = new BigDecimal(data.get("latitude").toString());
                    longitude = new BigDecimal(data.get("longitude").toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid or missing latitude/longitude", 400);
                }
                if (name == null || name.isEmpty() || address == null || address.isEmpty() || latitude == null || longitude == null) {
                    return createErrorResponse("Missing required branch fields", 400);
                }
                String insertSql = "INSERT INTO branches (name, address, phone, email, latitude, longitude, is_active) VALUES (?, ?, ?, ?, ?, ?, true)";
                try (PreparedStatement pstmt = conn.prepareStatement(insertSql)) {
                    pstmt.setString(1, name);
                    pstmt.setString(2, address);
                    pstmt.setString(3, phone);
                    pstmt.setString(4, email);
                    pstmt.setBigDecimal(5, latitude);
                    pstmt.setBigDecimal(6, longitude);
                    int rows = pstmt.executeUpdate();
                    if (rows > 0) {
                        return createSuccessResponse("Branch added successfully");
                    } else {
                        return createErrorResponse("Failed to add branch", 500);
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    return createErrorResponse("Database error adding branch", 500);
                }
            } else if ("PUT".equals(method)) {
                // Edit branch logic
                Map<String, Object> data = parseJson(requestBody);
                if (data == null) {
                    return createErrorResponse("Invalid JSON body", 400);
                }
                Integer id = null;
                try {
                    id = Integer.parseInt(data.get("id").toString());
                } catch (Exception e) {
                    return createErrorResponse("Invalid or missing branch ID", 400);
                }
                String name = (String) data.get("name");
                String address = (String) data.get("address");
                String phone = (String) data.getOrDefault("phone", "");
                String email = (String) data.getOrDefault("email", "");
                // Optionally support lat/lng update
                BigDecimal latitude = null, longitude = null;
                try {
                    latitude = data.get("latitude") != null ? new BigDecimal(data.get("latitude").toString()) : null;
                    longitude = data.get("longitude") != null ? new BigDecimal(data.get("longitude").toString()) : null;
                } catch (Exception e) {
                    // ignore, allow null
                }
                if (id == null || name == null || name.isEmpty() || address == null || address.isEmpty()) {
                    return createErrorResponse("Missing required branch fields", 400);
                }
                String updateSql = "UPDATE branches SET name=?, address=?, phone=?, email=?" +
                    (latitude != null ? ", latitude=?" : "") +
                    (longitude != null ? ", longitude=?" : "") +
                    " WHERE id=?";
                try (PreparedStatement pstmt = conn.prepareStatement(updateSql)) {
                    int idx = 1;
                    pstmt.setString(idx++, name);
                    pstmt.setString(idx++, address);
                    pstmt.setString(idx++, phone);
                    pstmt.setString(idx++, email);
                    if (latitude != null) pstmt.setBigDecimal(idx++, latitude);
                    if (longitude != null) pstmt.setBigDecimal(idx++, longitude);
                    pstmt.setInt(idx, id);
                    int rows = pstmt.executeUpdate();
                    if (rows > 0) {
                        return createSuccessResponse("Branch updated successfully");
                    } else {
                        return createErrorResponse("Branch not found or could not be updated", 404);
                    }
                } catch (SQLException e) {
                    e.printStackTrace();
                    return createErrorResponse("Database error updating branch", 500);
                }
            } else if ("DELETE".equals(method)) {
                // Support DELETE /api/admin/branches/{id}
                // Parse branch ID from request path (ThreadLocal or static var not available, so use a workaround)
                String currentPath = Thread.currentThread().getStackTrace()[2].getMethodName(); // Not reliable, so instead:
                // Instead, require the handler to be called with the full path, so add a new method for DELETE with path param
                return createErrorResponse("DELETE not supported on this route. Use /api/admin/branches/{id}", 405);
            } else {
                return createErrorResponse("Method not allowed", 405);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching branches", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String handleInvoices(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                String sql = "SELECT i.id, i.invoice_number, i.amount, i.tax_amount, i.total_amount, " +
                           "i.status, i.due_date, i.created_at, " +
                           "j.id as jobId, u.full_name as customerName, s.service_name " +
                           "FROM invoices i " +
                           "JOIN jobs j ON i.job_id = j.id " +
                           "JOIN users u ON j.customer_id = u.id " +
                           "JOIN services s ON j.service_id = s.id " +
                           "ORDER BY i.created_at DESC";
                
                List<Map<String, Object>> invoices = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
                    
                    while (rs.next()) {
                        Map<String, Object> invoice = new HashMap<>();
                        invoice.put("id", rs.getInt("id"));
                        invoice.put("invoiceNumber", rs.getString("invoice_number"));
                        
                        // Safe decimal handling
                        java.math.BigDecimal amount = rs.getBigDecimal("amount");
                        invoice.put("amount", amount);
                        
                        java.math.BigDecimal taxAmount = rs.getBigDecimal("tax_amount");
                        invoice.put("taxAmount", taxAmount);
                        
                        java.math.BigDecimal totalAmount = rs.getBigDecimal("total_amount");
                        invoice.put("totalAmount", totalAmount);
                        
                        invoice.put("status", rs.getString("status"));
                        
                        // Safe date handling
                        java.sql.Date dueDate = rs.getDate("due_date");
                        invoice.put("dueDate", dueDate != null ? dueDate.toString() : null);
                        
                        // Safe timestamp handling
                        java.sql.Timestamp createdAt = rs.getTimestamp("created_at");
                        invoice.put("createdAt", createdAt != null ? createdAt.toString() : null);
                        
                        invoice.put("jobId", rs.getInt("jobId"));
                        invoice.put("customerName", rs.getString("customerName"));
                        invoice.put("serviceName", rs.getString("service_name"));
                        invoices.add(invoice);
                    }
                }
                
                return convertToJson(invoices);
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching invoices", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String handlePayments(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                String sql = "SELECT p.id, p.amount, p.payment_method, p.payment_status, " +
                           "p.transaction_id, p.payment_date, p.notes, " +
                           "i.invoice_number, u.full_name as customerName " +
                           "FROM payments p " +
                           "JOIN invoices i ON p.invoice_id = i.id " +
                           "JOIN jobs j ON i.job_id = j.id " +
                           "JOIN users u ON j.customer_id = u.id " +
                           "ORDER BY p.payment_date DESC";
                
                List<Map<String, Object>> payments = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
                    
                    while (rs.next()) {
                        Map<String, Object> payment = new HashMap<>();
                        payment.put("id", rs.getInt("id"));
                        
                        // Safe decimal handling
                        java.math.BigDecimal amount = rs.getBigDecimal("amount");
                        payment.put("amount", amount);
                        
                        payment.put("paymentMethod", rs.getString("payment_method"));
                        payment.put("paymentStatus", rs.getString("payment_status"));
                        payment.put("transactionId", rs.getString("transaction_id"));
                        
                        // Safe timestamp handling
                        java.sql.Timestamp paymentDate = rs.getTimestamp("payment_date");
                        payment.put("paymentDate", paymentDate != null ? paymentDate.toString() : null);
                        
                        payment.put("notes", rs.getString("notes"));
                        payment.put("invoiceNumber", rs.getString("invoice_number"));
                        payment.put("customerName", rs.getString("customerName"));
                        payments.add(payment);
            }
                }
                
                return convertToJson(payments);
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching payments", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String handleReports(String[] pathParts, String method) {
        // Debug log for path parts
        System.out.println("handleReports pathParts: " + java.util.Arrays.toString(pathParts));
        if (pathParts.length < 5) {
            return createErrorResponse("Report type not specified", 400);
        }
        String reportType = pathParts[4];
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            switch (reportType) {
                case "revenue":
                    return getRevenueReport(conn);
                case "part-usage":
                    return getPartUsageReport(conn);
                case "employee-performance":
                    return getEmployeePerformanceReport(conn);
                case "customer-activity":
                    return getCustomerActivityReport(conn);
                default:
                    return createErrorResponse("Report type not found", 404);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error generating report", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String getRevenueReport(Connection conn) throws SQLException {
        String sql = "SELECT DATE_FORMAT(i.created_at, '%Y-%m') as month, " +
                    "COALESCE(SUM(i.total_amount), 0) as totalRevenue " +
                    "FROM invoices i " +
                    "WHERE i.status = 'Paid' " +
                    "AND i.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) " +
                    "GROUP BY DATE_FORMAT(i.created_at, '%Y-%m') " +
                    "ORDER BY month";
        
        List<Map<String, Object>> revenue = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                Map<String, Object> month = new HashMap<>();
                month.put("month", rs.getString("month"));
                month.put("totalRevenue", rs.getBigDecimal("totalRevenue"));
                revenue.add(month);
            }
        }
        
        return convertToJson(revenue);
    }
    
    private String getPartUsageReport(Connection conn) throws SQLException {
        String sql = "SELECT i.part_name, COALESCE(SUM(ji.quantity_used), 0) as totalUsed " +
                    "FROM inventory i " +
                    "LEFT JOIN job_inventory ji ON i.id = ji.inventory_id " +
                    "WHERE i.is_active = true " +
                    "GROUP BY i.id, i.part_name " +
                    "ORDER BY totalUsed DESC " +
                    "LIMIT 10";
        
        List<Map<String, Object>> usage = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                Map<String, Object> part = new HashMap<>();
                part.put("partName", rs.getString("part_name"));
                part.put("totalUsed", rs.getInt("totalUsed"));
                usage.add(part);
            }
        }
        
        return convertToJson(usage);
    }
    
    private String getEmployeePerformanceReport(Connection conn) throws SQLException {
        String sql = "SELECT u.full_name, " +
                    "COUNT(j.id) as jobsCompleted, " +
                    "COALESCE(AVG(pm.metric_value), 0) as avgRating " +
                    "FROM users u " +
                    "LEFT JOIN jobs j ON u.id = j.assigned_employee_id AND j.status = 'Completed' " +
                    "LEFT JOIN performance_metrics pm ON u.id = pm.employee_id AND pm.metric_type = 'customer_rating' " +
                    "WHERE u.role = 'employee' AND u.is_active = true " +
                    "GROUP BY u.id, u.full_name " +
                    "ORDER BY jobsCompleted DESC";
        
        List<Map<String, Object>> performance = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                Map<String, Object> employee = new HashMap<>();
                employee.put("employeeName", rs.getString("full_name"));
                employee.put("jobsCompleted", rs.getInt("jobsCompleted"));
                employee.put("avgRating", rs.getBigDecimal("avgRating"));
                performance.add(employee);
            }
        }
        
        return convertToJson(performance);
                }
    
    private String getCustomerActivityReport(Connection conn) throws SQLException {
        String sql = "SELECT DATE_FORMAT(u.created_at, '%Y-%m') as month, " +
                    "COUNT(*) as newCustomers " +
                    "FROM users u " +
                    "WHERE u.role = 'customer' " +
                    "AND u.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) " +
                    "GROUP BY DATE_FORMAT(u.created_at, '%Y-%m') " +
                    "ORDER BY month";
        
        List<Map<String, Object>> activity = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                Map<String, Object> month = new HashMap<>();
                month.put("month", rs.getString("month"));
                month.put("newCustomers", rs.getInt("newCustomers"));
                month.put("returningCustomers", 0); // Would need more complex logic for returning customers
                activity.add(month);
            }
        }
        
        return convertToJson(activity);
    }
    
    private String handleSettings(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                String sql = "SELECT setting_key, setting_value, setting_type, description, is_public " +
                           "FROM system_settings ORDER BY setting_key";
                
                List<Map<String, Object>> settings = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
                    
                    while (rs.next()) {
                        Map<String, Object> setting = new HashMap<>();
                        setting.put("key", rs.getString("setting_key"));
                        setting.put("value", rs.getString("setting_value"));
                        setting.put("type", rs.getString("setting_type"));
                        setting.put("description", rs.getString("description"));
                        setting.put("isPublic", rs.getBoolean("is_public"));
                        settings.add(setting);
                    }
                }
                
                return convertToJson(settings);
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching settings", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }
    
    private String handlePerformance(String method, String requestBody) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            if ("GET".equals(method)) {
                String sql = "SELECT u.full_name, pm.metric_type, pm.metric_value, " +
                           "pm.period_start, pm.period_end " +
                           "FROM performance_metrics pm " +
                           "JOIN users u ON pm.employee_id = u.id " +
                           "WHERE u.role = 'employee' AND u.is_active = true " +
                           "ORDER BY pm.period_start DESC, u.full_name";
        
                List<Map<String, Object>> metrics = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                        Map<String, Object> metric = new HashMap<>();
                        metric.put("employeeName", rs.getString("full_name"));
                        metric.put("metricType", rs.getString("metric_type"));
                        metric.put("metricValue", rs.getBigDecimal("metric_value"));
                        metric.put("periodStart", rs.getDate("period_start").toString());
                        metric.put("periodEnd", rs.getDate("period_end").toString());
                        metrics.add(metric);
                    }
                }
                
                return convertToJson(metrics);
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching performance metrics", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
    }
    }
    
    // --- Overview Metrics Endpoint ---
    private String getOverviewMetrics() {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            // Metrics: total jobs, in progress, completed, total revenue, status counts
            String jobsSql = "SELECT COUNT(*) as total, " +
                    "SUM(CASE WHEN status = 'Booked' THEN 1 ELSE 0 END) as booked, " +
                    "SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress, " +
                    "SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed, " +
                    "SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled " +
                    "FROM jobs";
            String revenueSql = "SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM invoices WHERE status = 'Paid'";

            int totalJobs = 0, inProgress = 0, completed = 0, booked = 0, cancelled = 0;
            double totalRevenue = 0;
            // Status counts for chart
            Map<String, Integer> statusCounts = new LinkedHashMap<>();
            statusCounts.put("Booked", 0);
            statusCounts.put("In Progress", 0);
            statusCounts.put("Completed", 0);
            statusCounts.put("Cancelled", 0);

            try (PreparedStatement pstmt = conn.prepareStatement(jobsSql);
                 ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    totalJobs = rs.getInt("total");
                    booked = rs.getInt("booked");
                    inProgress = rs.getInt("inProgress");
                    completed = rs.getInt("completed");
                    cancelled = rs.getInt("cancelled");
                    statusCounts.put("Booked", booked);
                    statusCounts.put("In Progress", inProgress);
                    statusCounts.put("Completed", completed);
                    statusCounts.put("Cancelled", cancelled);
                }
            }
            try (PreparedStatement pstmt = conn.prepareStatement(revenueSql);
                 ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    totalRevenue = rs.getBigDecimal("totalRevenue").doubleValue();
                }
            }
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"totalJobs\":" + totalJobs + ",");
            json.append("\"inProgress\":" + inProgress + ",");
            json.append("\"completed\":" + completed + ",");
            json.append("\"totalRevenue\":" + totalRevenue + ",");
            json.append("\"statusCounts\":{");
            int i = 0;
            for (Map.Entry<String, Integer> entry : statusCounts.entrySet()) {
                json.append("\"" + entry.getKey() + "\":" + entry.getValue());
                if (++i < statusCounts.size()) json.append(",");
            }
            json.append("}}");
            return json.toString();
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching overview metrics", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
    }

    // --- Recent Jobs Endpoint ---
    private String getRecentJobs(int limit) {
        Connection conn = null;
        try {
            conn = DatabaseConnector.getConnection();
            String sql = "SELECT j.id as jobId, u.full_name as customerName, s.service_name as service, j.status, j.booking_date " +
                    "FROM jobs j " +
                    "JOIN users u ON j.customer_id = u.id " +
                    "JOIN services s ON j.service_id = s.id " +
                    "ORDER BY j.booking_date DESC LIMIT ?";
            List<Map<String, Object>> jobs = new ArrayList<>();
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setInt(1, limit);
                try (ResultSet rs = pstmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> job = new HashMap<>();
                        job.put("jobId", rs.getInt("jobId"));
                        job.put("customerName", rs.getString("customerName"));
                        job.put("service", rs.getString("service"));
                        job.put("status", rs.getString("status"));
                        java.sql.Timestamp bookingDate = rs.getTimestamp("booking_date");
                        job.put("bookingDate", bookingDate != null ? bookingDate.toString() : null);
                        jobs.add(job);
                    }
                }
            }
            return convertToJson(jobs);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching recent jobs", 500);
        } finally {
            DatabaseConnector.closeConnection(conn);
        }
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
    
    private String createSuccessResponse(String message) {
        return "{\"status\":\"success\",\"message\":\"" + message + "\"}";
        }

    private String createErrorResponse(String message, int statusCode) {
        return "{\"status\":\"error\",\"message\":\"" + message + "\",\"code\":" + statusCode + "}";
    }

    private Map<String, Object> parseJson(String json) {
        try {
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

    // Add a new method to handle DELETE /api/admin/branches/{id}
    public String handleBranchDelete(String path) {
        try (Connection conn = DatabaseConnector.getConnection()) {
            String[] pathParts = path.split("/");
            if (pathParts.length < 5) {
                return createErrorResponse("Branch ID not provided", 400);
            }
            int branchId;
            try {
                branchId = Integer.parseInt(pathParts[4]);
            } catch (NumberFormatException e) {
                return createErrorResponse("Invalid branch ID", 400);
            }
            // Optionally, check for jobs or dependencies before deleting
            String deleteSql = "DELETE FROM branches WHERE id = ?";
            try (PreparedStatement pstmt = conn.prepareStatement(deleteSql)) {
                pstmt.setInt(1, branchId);
                int rows = pstmt.executeUpdate();
                if (rows > 0) {
                    return createSuccessResponse("Branch deleted successfully");
                } else {
                    return createErrorResponse("Branch not found or could not be deleted", 404);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error deleting branch", 500);
        }
    }
}