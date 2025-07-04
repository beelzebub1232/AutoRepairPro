package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class AdminHandler {
    public String handle(String method, String path, String body) {
        // Existing jobs endpoint
        if (path.equals("/api/admin/jobs") && method.equals("GET")) {
            return getAllJobs();
        }
        
        // New job creation and management
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
        
        if (path.equals("/api/admin/inventory/alerts") && method.equals("GET")) {
            return getLowStockAlerts();
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
        
        // Reporting endpoints
        if (path.equals("/api/admin/reports/revenue") && method.equals("GET")) {
            return getRevenueReport();
        }
        
        if (path.equals("/api/admin/reports/part-usage") && method.equals("GET")) {
            return getPartUsageReport();
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

    // Existing method - getAllJobs
    private String getAllJobs() {
        String sql = "SELECT j.id, u.full_name as customer_name, v.make, v.model, s.service_name, j.status, " +
                     "emp.full_name as assigned_employee, j.total_cost, j.booking_date " +
                     "FROM jobs j " +
                     "JOIN users u ON j.customer_id = u.id " +
                     "JOIN vehicles v ON j.vehicle_id = v.id " +
                     "JOIN services s ON j.service_id = s.id " +
                     "LEFT JOIN users emp ON j.assigned_employee_id = emp.id " +
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
                jsonBuilder.append("\"status\":\"").append(rs.getString("status")).append("\",");
                jsonBuilder.append("\"assignedEmployee\":").append(rs.getString("assigned_employee") != null ? "\"" + rs.getString("assigned_employee") + "\"" : "null").append(",");
                jsonBuilder.append("\"totalCost\":").append(rs.getBigDecimal("total_cost") != null ? rs.getBigDecimal("total_cost") : "null").append(",");
                jsonBuilder.append("\"bookingDate\":\"").append(rs.getTimestamp("booking_date")).append("\"");
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
    
    // Job Management Methods
    private String createJob(String body) {
        Map<String, String> params = parseBody(body);
        String customerIdStr = params.get("customerId");
        String vehicleIdStr = params.get("vehicleId");
        String serviceIdStr = params.get("serviceId");
        String bookingDate = params.get("bookingDate");
        
        if (customerIdStr == null || vehicleIdStr == null || serviceIdStr == null) {
            return "{\"error\":\"Customer ID, Vehicle ID, and Service ID are required\"}";
        }
        
        try {
            int customerId = Integer.parseInt(customerIdStr);
            int vehicleId = Integer.parseInt(vehicleIdStr);
            int serviceId = Integer.parseInt(serviceIdStr);
            
            String sql = "INSERT INTO jobs (customer_id, vehicle_id, service_id, status, booking_date) VALUES (?, ?, ?, 'Booked', ?)";
            
            try (Connection conn = DatabaseConnector.getConnection();
                 PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                
                pstmt.setInt(1, customerId);
                pstmt.setInt(2, vehicleId);
                pstmt.setInt(3, serviceId);
                pstmt.setString(4, bookingDate != null ? bookingDate : "NOW()");
                
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
            // Calculate total cost: service price + parts cost
            String sql = "SELECT s.price as service_price, " +
                        "COALESCE(SUM(ji.quantity_used * i.price_per_unit), 0) as parts_cost " +
                        "FROM jobs j " +
                        "JOIN services s ON j.service_id = s.id " +
                        "LEFT JOIN job_inventory ji ON j.id = ji.job_id " +
                        "LEFT JOIN inventory i ON ji.inventory_id = i.id " +
                        "WHERE j.id = ? " +
                        "GROUP BY j.id, s.price";
            
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setInt(1, jobId);
                ResultSet rs = pstmt.executeQuery();
                
                if (rs.next()) {
                    double servicePrice = rs.getDouble("service_price");
                    double partsCost = rs.getDouble("parts_cost");
                    double totalCost = servicePrice + partsCost;
                    
                    // Update job with total cost and status
                    String updateSql = "UPDATE jobs SET total_cost = ?, status = 'Invoiced' WHERE id = ?";
                    try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                        updateStmt.setDouble(1, totalCost);
                        updateStmt.setInt(2, jobId);
                        
                        int affectedRows = updateStmt.executeUpdate();
                        if (affectedRows > 0) {
                            return "{\"message\":\"Invoice generated successfully\", \"totalCost\":" + totalCost + "}";
                        }
                    }
                }
                return "{\"error\":\"Job not found\"}";
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return "{\"error\":\"Database error generating invoice\"}";
        }
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