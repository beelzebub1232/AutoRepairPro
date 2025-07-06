-- AutoRepairPro Database Schema - Enhanced Version
-- This schema supports dynamic data management instead of hardcoded values

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS job_inventory;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS users;

-- Create Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'employee', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create Branches table
CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Business Hours table for dynamic hours management
CREATE TABLE business_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_day (branch_id, day_of_week)
);

-- Create Contact Information table for dynamic contact details
CREATE TABLE contact_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT,
    contact_type ENUM('phone', 'email', 'emergency', 'support') NOT NULL,
    contact_value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Create System Settings table for configurable values
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Services table
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    estimated_duration INT, -- in minutes
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Inventory table
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    part_name VARCHAR(100) NOT NULL,
    part_number VARCHAR(50) UNIQUE,
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT NOT NULL DEFAULT 5,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    supplier VARCHAR(100),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Vehicles table
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    vin VARCHAR(17) UNIQUE,
    license_plate VARCHAR(20),
    color VARCHAR(30),
    mileage INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Jobs table
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    service_id INT NOT NULL,
    branch_id INT NOT NULL,
    assigned_employee_id INT,
    status ENUM('Booked', 'In Progress', 'Completed', 'Invoiced', 'Paid', 'Cancelled') DEFAULT 'Booked',
    booking_date TIMESTAMP NOT NULL,
    completion_date TIMESTAMP NULL,
    total_cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (assigned_employee_id) REFERENCES users(id)
);

-- Create Invoices table
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Create Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Digital Wallet') NOT NULL,
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Create Job Inventory link table
CREATE TABLE job_inventory (
    job_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity_used INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id, inventory_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

-- Create Performance Metrics table for employee tracking
CREATE TABLE performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    metric_type ENUM('jobs_completed', 'customer_rating', 'efficiency_score', 'attendance') NOT NULL,
    metric_value DECIMAL(10, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert essential system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('company_name', 'RepairHub Pro', 'string', 'Company name displayed throughout the application', true),
('company_address', '123 Main Street, Downtown, City, State 12345', 'string', 'Main company address', true),
('company_phone', '555-0000', 'string', 'Main company phone number', true),
('company_email', 'info@repairhub.com', 'string', 'Main company email', true),
('tax_rate', '0.08', 'number', 'Default tax rate for invoices (8%)', false),
('currency_symbol', '$', 'string', 'Currency symbol for pricing', true),
('default_branch_id', '1', 'number', 'Default branch for new bookings', false),
('max_booking_days_ahead', '30', 'number', 'Maximum days ahead for booking appointments', false),
('auto_invoice_generation', 'true', 'boolean', 'Automatically generate invoices when jobs are completed', false),
('low_stock_threshold', '5', 'number', 'Default minimum quantity threshold for inventory alerts', false);

-- Insert sample users (keep minimal for production)
INSERT INTO users (username, password, full_name, email, phone, role) VALUES
('admin', 'admin123', 'Admin User', 'admin@repairhub.com', '555-0100', 'admin'),
('tech1', 'tech123', 'Bob The Builder', 'bob@repairhub.com', '555-0101', 'employee'),
('tech2', 'tech123', 'Alice The Mechanic', 'alice@repairhub.com', '555-0102', 'employee'),
('johndoe', 'customer123', 'John Doe', 'john@example.com', '555-0200', 'customer'),
('janedoe', 'customer123', 'Jane Doe', 'jane@example.com', '555-0201', 'customer');

-- Insert sample branches
INSERT INTO branches (name, address, phone, email, latitude, longitude, rating) VALUES
('RepairHub Pro Downtown', '123 Main Street, Downtown, City, State 12345', '555-1000', 'downtown@repairhub.com', 40.7128, -74.0060, 4.8),
('RepairHub Pro Uptown', '456 Oak Avenue, Uptown, City, State 12345', '555-1001', 'uptown@repairhub.com', 40.7589, -73.9851, 4.6),
('RepairHub Pro Westside', '789 Pine Road, Westside, City, State 12345', '555-1002', 'westside@repairhub.com', 40.7505, -74.0037, 4.7);

-- Insert business hours for all branches
INSERT INTO business_hours (branch_id, day_of_week, open_time, close_time, is_closed) VALUES
-- Downtown Branch
(1, 'Monday', '08:00:00', '18:00:00', false),
(1, 'Tuesday', '08:00:00', '18:00:00', false),
(1, 'Wednesday', '08:00:00', '18:00:00', false),
(1, 'Thursday', '08:00:00', '18:00:00', false),
(1, 'Friday', '08:00:00', '18:00:00', false),
(1, 'Saturday', '09:00:00', '16:00:00', false),
(1, 'Sunday', NULL, NULL, true),
-- Uptown Branch
(2, 'Monday', '07:00:00', '19:00:00', false),
(2, 'Tuesday', '07:00:00', '19:00:00', false),
(2, 'Wednesday', '07:00:00', '19:00:00', false),
(2, 'Thursday', '07:00:00', '19:00:00', false),
(2, 'Friday', '07:00:00', '19:00:00', false),
(2, 'Saturday', '08:00:00', '17:00:00', false),
(2, 'Sunday', NULL, NULL, true),
-- Westside Branch
(3, 'Monday', '08:00:00', '18:00:00', false),
(3, 'Tuesday', '08:00:00', '18:00:00', false),
(3, 'Wednesday', '08:00:00', '18:00:00', false),
(3, 'Thursday', '08:00:00', '18:00:00', false),
(3, 'Friday', '08:00:00', '18:00:00', false),
(3, 'Saturday', '08:00:00', '18:00:00', false),
(3, 'Sunday', NULL, NULL, true);

-- Insert contact information for branches
INSERT INTO contact_info (branch_id, contact_type, contact_value, is_primary) VALUES
(1, 'phone', '555-1000', true),
(1, 'email', 'downtown@repairhub.com', true),
(1, 'emergency', '555-1000', false),
(2, 'phone', '555-1001', true),
(2, 'email', 'uptown@repairhub.com', true),
(2, 'emergency', '555-1001', false),
(3, 'phone', '555-1002', true),
(3, 'email', 'westside@repairhub.com', true),
(3, 'emergency', '555-1002', false);

-- Insert sample services
INSERT INTO services (service_name, price, description, estimated_duration, category) VALUES
('Standard Oil Change', 50.00, 'Includes up to 5 quarts of conventional oil and filter.', 30, 'Maintenance'),
('Full Body Paint', 2500.00, 'Complete exterior repaint with single-stage enamel paint.', 1440, 'Body Work'),
('Dent Repair - Small', 150.00, 'Repair for a single small dent (up to 2 inches).', 120, 'Body Work'),
('Dent Repair - Medium', 300.00, 'Repair for medium-sized dents (2-6 inches).', 240, 'Body Work'),
('Dent Repair - Large', 500.00, 'Repair for large dents (6+ inches).', 360, 'Body Work'),
('Bumper Repair', 400.00, 'Repair and repaint of front or rear bumper.', 480, 'Body Work'),
('Windshield Replacement', 350.00, 'Complete windshield replacement with OEM glass.', 180, 'Glass'),
('Brake Service', 200.00, 'Complete brake inspection and service.', 90, 'Maintenance'),
('Tire Rotation', 40.00, 'Rotate all four tires and balance.', 45, 'Maintenance'),
('Battery Replacement', 120.00, 'Replace car battery with testing.', 30, 'Electrical');

-- Insert sample inventory
INSERT INTO inventory (part_name, part_number, quantity, min_quantity, price_per_unit, category, supplier) VALUES
('Oil Filter', 'OF-001', 50, 10, 8.50, 'Filters', 'AutoParts Co'),
('Conventional Oil (Quart)', 'OIL-001', 200, 20, 5.00, 'Lubricants', 'OilCorp'),
('Synthetic Oil (Quart)', 'OIL-002', 150, 15, 8.00, 'Lubricants', 'OilCorp'),
('White Paint (Gallon)', 'PAINT-001', 10, 2, 75.00, 'Paint', 'PaintPro'),
('Black Paint (Gallon)', 'PAINT-002', 8, 2, 75.00, 'Paint', 'PaintPro'),
('Sandpaper Sheet', 'SAND-001', 100, 20, 1.25, 'Supplies', 'SupplyCo'),
('Bumper Cover', 'BUMP-001', 5, 1, 250.00, 'Body Parts', 'BodyParts Inc'),
('Windshield Glass', 'WS-001', 3, 1, 200.00, 'Glass', 'GlassCo'),
('Brake Pads', 'BRAKE-001', 25, 5, 45.00, 'Brakes', 'BrakeCorp'),
('Car Battery', 'BAT-001', 8, 2, 85.00, 'Electrical', 'BatteryCo'),
('Tire (205/55R16)', 'TIRE-001', 12, 4, 120.00, 'Tires', 'TireCorp'),
('Headlight Assembly', 'LIGHT-001', 6, 2, 180.00, 'Lighting', 'LightCo');

-- Insert sample vehicles
INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color, mileage) VALUES
(4, 'Toyota', 'Camry', 2020, 'VIN12345JOHN', 'ABC123', 'White', 25000),
(4, 'Honda', 'Civic', 2018, 'VIN67890JOHN', 'XYZ789', 'Blue', 35000),
(5, 'Ford', 'F-150', 2021, 'VIN11111JANE', 'DEF456', 'Red', 15000),
(5, 'BMW', 'X5', 2019, 'VIN22222JANE', 'GHI789', 'Black', 28000);

-- Insert sample jobs
INSERT INTO jobs (customer_id, vehicle_id, service_id, branch_id, assigned_employee_id, status, booking_date, total_cost, notes) VALUES
(4, 1, 3, 1, 2, 'In Progress', '2023-10-27 10:00:00', 150.00, 'Small dent on passenger door'),
(4, 2, 1, 2, 3, 'Completed', '2023-10-25 09:00:00', 50.00, 'Regular maintenance'),
(5, 3, 6, 1, 2, 'Booked', '2023-11-01 14:00:00', 400.00, 'Front bumper damage from parking incident'),
(5, 4, 7, 3, 3, 'Invoiced', '2023-10-20 11:00:00', 350.00, 'Cracked windshield from stone chip');

-- Insert sample invoices
INSERT INTO invoices (job_id, invoice_number, amount, tax_amount, total_amount, status, due_date) VALUES
(2, 'INV-2023-001', 50.00, 4.00, 54.00, 'Paid', '2023-11-25'),
(4, 'INV-2023-002', 350.00, 28.00, 378.00, 'Sent', '2023-11-20');

-- Insert sample payments
INSERT INTO payments (invoice_id, amount, payment_method, payment_status, transaction_id) VALUES
(1, 54.00, 'Credit Card', 'Completed', 'TXN-001-2023');

-- Insert sample performance metrics
INSERT INTO performance_metrics (employee_id, metric_type, metric_value, period_start, period_end) VALUES
(2, 'jobs_completed', 15, '2023-10-01', '2023-10-31'),
(2, 'customer_rating', 4.5, '2023-10-01', '2023-10-31'),
(3, 'jobs_completed', 12, '2023-10-01', '2023-10-31'),
(3, 'customer_rating', 4.2, '2023-10-01', '2023-10-31');

-- Update job status for paid invoice
UPDATE jobs SET status = 'Paid' WHERE id = 2;