package com.autorepairpro.handler;

import com.autorepairpro.db.DatabaseConnector;
import java.sql.*;
import java.util.*;
import java.io.*;
import java.math.BigDecimal;

public class AdminHandler {
    
    public String handleRequest(String path, String method, String requestBody) {
        try {
            String[] pathParts = path.split("/");
            
            if (pathParts.length < 4) {
                return createErrorResponse("Invalid admin route", 400);
            }
            
            String action = pathParts[3];
            
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
        try (Connection conn = DatabaseConnector.getConnection()) {
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
                    BigDecimal totalRevenue = rs.getBigDecimal("totalRevenue");
                    jsonBuilder.append("\"totalRevenue\":").append(totalRevenue != null ? totalRevenue : BigDecimal.ZERO).append(",");
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
        }
    }
    
    private String handleJobs(String method, String requestBody) {
        try (Connection conn = DatabaseConnector.getConnection()) {
            switch (method) {
                case "GET":
                    return getAllJobs(conn);
                case "POST":
                    return createJob(conn, requestBody);
                case "PUT":
                    return updateJob(conn, requestBody);
                default:
                    return createErrorResponse("Method not allowed", 405);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error handling jobs", 500);
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
                
                // Handle null timestamp
                Timestamp bookingDate = rs.getTimestamp("booking_date");
                job.put("bookingDate", bookingDate != null ? bookingDate.toString() : null);
                
                // Handle null BigDecimal
                BigDecimal totalCost = rs.getBigDecimal("total_cost");
                job.put("totalCost", totalCost != null ? totalCost : BigDecimal.ZERO);
                
                job.put("notes", rs.getString("notes"));
                job.put("customerName", rs.getString("customerName"));
                
                // Build vehicle string safely
                String make = rs.getString("make");
                String model = rs.getString("model");
                Integer year = rs.getObject("year", Integer.class);
                String vehicle = (make != null ? make : "") + " " + (model != null ? model : "") + 
                               (year != null ? " (" + year + ")" : "");
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
        try (Connection conn = DatabaseConnector.getConnection()) {
            if ("GET".equals(method)) {
                String sql = "SELECT id, username, full_name, email, phone, role, created_at " +
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
                        user.put("createdAt", rs.getTimestamp("created_at").toString());
                        user.put("isActive", true); // Default to true since we don't have is_active column
                        users.add(user);
                    }
                }
                
                return convertToJson(users);
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching users", 500);
        }
    }
    
    private String handleServices(String method, String requestBody) {
        try (Connection conn = DatabaseConnector.getConnection()) {
            if ("GET".equals(method)) {
                String sql = "SELECT id, service_name, price, description, estimated_duration, category " +
                           "FROM services ORDER BY service_name";
                
                List<Map<String, Object>> services = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
                    
                    while (rs.next()) {
                        Map<String, Object> service = new HashMap<>();
                        service.put("id", rs.getInt("id"));
                        service.put("serviceName", rs.getString("service_name"));
                        service.put("price", rs.getBigDecimal("price"));
                        service.put("description", rs.getString("description"));
                        service.put("estimatedDuration", rs.getInt("estimated_duration"));
                        service.put("category", rs.getString("category"));
                        service.put("isActive", true); // Default to true since we don't have is_active column
                        services.add(service);
                    }
                }
                
                return convertToJson(services);
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching services", 500);
        }
    }
    
    private String handleInventory(String method, String requestBody) {
        try (Connection conn = DatabaseConnector.getConnection()) {
            if ("GET".equals(method)) {
                String sql = "SELECT id, part_name, part_number, quantity, min_quantity, price_per_unit, " +
                           "category, supplier, location " +
                           "FROM inventory ORDER BY part_name";
                
                List<Map<String, Object>> inventory = new ArrayList<>();
                try (PreparedStatement pstmt = conn.prepareStatement(sql);
                     ResultSet rs = pstmt.executeQuery()) {
                    
                    while (rs.next()) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", rs.getInt("id"));
                        item.put("partName", rs.getString("part_name"));
                        item.put("partNumber", rs.getString("part_number"));
                        item.put("quantity", rs.getInt("quantity"));
                        item.put("minQuantity", rs.getInt("min_quantity"));
                        item.put("pricePerUnit", rs.getBigDecimal("price_per_unit"));
                        item.put("category", rs.getString("category"));
                        item.put("supplier", rs.getString("supplier"));
                        item.put("location", rs.getString("location"));
                        item.put("isActive", true); // Default to true since we don't have is_active column
                        item.put("lowStock", rs.getInt("quantity") <= rs.getInt("min_quantity"));
                        inventory.add(item);
                    }
                }
                
                return convertToJson(inventory);
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching inventory", 500);
        }
    }
    
    private String handleBranches(String method, String requestBody) {
        try (Connection conn = DatabaseConnector.getConnection()) {
            if ("GET".equals(method)) {
                String sql = "SELECT b.id, b.name, b.address, b.phone, b.email, b.latitude, b.longitude, b.rating, " +
                           "GROUP_CONCAT(DISTINCT bh.day_of_week, ': ', " +
                           "CASE WHEN bh.is_closed THEN 'Closed' " +
                           "ELSE CONCAT(TIME_FORMAT(bh.open_time, '%H:%i'), '-', TIME_FORMAT(bh.close_time, '%H:%i')) " +
                           "END ORDER BY FIELD(bh.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) as hours " +
                           "FROM branches b " +
                           "LEFT JOIN business_hours bh ON b.id = bh.branch_id " +
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
                        branch.put("phone", rs.getString("phone"));
                        branch.put("email", rs.getString("email"));
                        branch.put("latitude", rs.getBigDecimal("latitude"));
                        branch.put("longitude", rs.getBigDecimal("longitude"));
                        branch.put("rating", rs.getBigDecimal("rating"));
                        branch.put("isActive", true); // Default to true since we don't have is_active column
                        branch.put("hours", rs.getString("hours"));
                        branches.add(branch);
                    }
                }
                
                return convertToJson(branches);
            }
            return createErrorResponse("Method not allowed", 405);
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error fetching branches", 500);
        }
    }
    
    private String handleInvoices(String method, String requestBody) {
        try (Connection conn = DatabaseConnector.getConnection()) {
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
                        invoice.put("amount", rs.getBigDecimal("amount"));
                        invoice.put("taxAmount", rs.getBigDecimal("tax_amount"));
                        invoice.put("totalAmount", rs.getBigDecimal("total_amount"));
                        invoice.put("status", rs.getString("status"));
                        invoice.put("dueDate", rs.getDate("due_date").toString());
                        invoice.put("createdAt", rs.getTimestamp("created_at").toString());
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
        }
    }
    
    private String handlePayments(String method, String requestBody) {
        try (Connection conn = DatabaseConnector.getConnection()) {
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
                        payment.put("amount", rs.getBigDecimal("amount"));
                        payment.put("paymentMethod", rs.getString("payment_method"));
                        payment.put("paymentStatus", rs.getString("payment_status"));
                        payment.put("transactionId", rs.getString("transaction_id"));
                        payment.put("paymentDate", rs.getTimestamp("payment_date").toString());
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
        }
    }
    
    private String handleReports(String[] pathParts, String method) {
        if (pathParts.length < 5) {
            return createErrorResponse("Report type not specified", 400);
        }
        
        String reportType = pathParts[4];
        // Remove query parameters if present
        if (reportType.contains("?")) {
            reportType = reportType.substring(0, reportType.indexOf("?"));
        }
        
        try (Connection conn = DatabaseConnector.getConnection()) {
            switch (reportType) {
                case "revenue":
                    return getRevenueReport(conn);
                case "part-usage":
                    return getPartUsageReport(conn);
                case "employee-performance":
                    return getEmployeePerformanceReport(conn);
                case "customer-activity":
                    return getCustomerActivityReport(conn);
                case "inventory-status":
                    return getInventoryStatusReport(conn);
                case "top-services":
                    return getTopServicesReport(conn);
                default:
                    return createErrorResponse("Report type not found: " + reportType, 404);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return createErrorResponse("Database error generating report: " + e.getMessage(), 500);
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
                    "WHERE u.role = 'employee' " +
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
    
    private String getInventoryStatusReport(Connection conn) throws SQLException {
        String sql = "SELECT " +
                    "SUM(CASE WHEN quantity > min_quantity THEN 1 ELSE 0 END) as inStock, " +
                    "SUM(CASE WHEN quantity <= min_quantity AND quantity > 0 THEN 1 ELSE 0 END) as lowStock, " +
                    "SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStock " +
                    "FROM inventory";
        
        List<Map<String, Object>> status = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            if (rs.next()) {
                Map<String, Object> inventoryStatus = new HashMap<>();
                inventoryStatus.put("inStock", rs.getInt("inStock"));
                inventoryStatus.put("lowStock", rs.getInt("lowStock"));
                inventoryStatus.put("outOfStock", rs.getInt("outOfStock"));
                status.add(inventoryStatus);
            }
        }
        
        return convertToJson(status);
    }
    
    private String getTopServicesReport(Connection conn) throws SQLException {
        String sql = "SELECT s.service_name, " +
                    "COUNT(j.id) as jobCount, " +
                    "COALESCE(SUM(i.total_amount), 0) as totalRevenue, " +
                    "COALESCE(AVG(i.total_amount), 0) as avgRevenue " +
                    "FROM services s " +
                    "LEFT JOIN jobs j ON s.id = j.service_id " +
                    "LEFT JOIN invoices i ON j.id = i.job_id " +
                    "GROUP BY s.id, s.service_name " +
                    "ORDER BY totalRevenue DESC " +
                    "LIMIT 10";
        
        List<Map<String, Object>> services = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                Map<String, Object> service = new HashMap<>();
                service.put("serviceName", rs.getString("service_name"));
                service.put("jobCount", rs.getInt("jobCount"));
                service.put("totalRevenue", rs.getBigDecimal("totalRevenue"));
                service.put("avgRevenue", rs.getBigDecimal("avgRevenue"));
                service.put("avgRating", 4.5); // Placeholder - would need ratings table
                services.add(service);
            }
        }
        
        return convertToJson(services);
    }
    
    private String handleSettings(String method, String requestBody) {
        try (Connection conn = DatabaseConnector.getConnection()) {
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
        }
    }
    
    private String handlePerformance(String method, String requestBody) {
        try (Connection conn = DatabaseConnector.getConnection()) {
            if ("GET".equals(method)) {
                String sql = "SELECT u.full_name, pm.metric_type, pm.metric_value, " +
                           "pm.period_start, pm.period_end " +
                           "FROM performance_metrics pm " +
                           "JOIN users u ON pm.employee_id = u.id " +
                           "WHERE u.role = 'employee' " +
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
}