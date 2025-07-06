CREATE DATABASE IF NOT EXISTS autorepairpro_db;
USE autorepairpro_db;

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS job_inventory;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS users;

-- Users table with roles
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- In a real app, ALWAYS hash passwords
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role ENUM('admin', 'employee', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches table for multiple locations
CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    hours VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 4.5,
    is_active BOOLEAN DEFAULT TRUE
);

-- Services offered by the bodyshop
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    estimated_duration INT, -- in minutes
    is_active BOOLEAN DEFAULT TRUE
);

-- Inventory of parts and materials
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    part_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT NOT NULL DEFAULT 5,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    supplier VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- Customer vehicles
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    vin VARCHAR(100) UNIQUE,
    license_plate VARCHAR(50),
    color VARCHAR(50),
    mileage INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Repair jobs
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    service_id INT NOT NULL,
    branch_id INT,
    assigned_employee_id INT,
    status ENUM('Booked', 'In Progress', 'Completed', 'Invoiced', 'Paid') NOT NULL DEFAULT 'Booked',
    booking_date DATETIME NOT NULL,
    estimated_completion_date DATETIME,
    actual_completion_date DATETIME,
    total_cost DECIMAL(10, 2),
    labor_cost DECIMAL(10, 2),
    parts_cost DECIMAL(10, 2),
    notes TEXT,
    customer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (assigned_employee_id) REFERENCES users(id)
);

-- Invoices table
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Draft', 'Sent', 'Paid', 'Overdue') DEFAULT 'Draft',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Payments table
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

-- Link table for parts used in a job
CREATE TABLE job_inventory (
    job_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity_used INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (job_id, inventory_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

-- Insert Sample Data
INSERT INTO users (username, password, full_name, email, phone, role) VALUES
('admin', 'admin123', 'Admin User', 'admin@repairhub.com', '555-0100', 'admin'),
('tech1', 'tech123', 'Bob The Builder', 'bob@repairhub.com', '555-0101', 'employee'),
('tech2', 'tech123', 'Alice The Mechanic', 'alice@repairhub.com', '555-0102', 'employee'),
('johndoe', 'customer123', 'John Doe', 'john@example.com', '555-0200', 'customer'),
('janedoe', 'customer123', 'Jane Doe', 'jane@example.com', '555-0201', 'customer');

INSERT INTO branches (name, address, phone, email, latitude, longitude, hours, rating) VALUES
('RepairHub Pro Downtown', '123 Main Street, Downtown, City, State 12345', '555-1000', 'downtown@repairhub.com', 40.7128, -74.0060, 'Mon-Fri 8AM-6PM, Sat 9AM-4PM', 4.8),
('RepairHub Pro Uptown', '456 Oak Avenue, Uptown, City, State 12345', '555-1001', 'uptown@repairhub.com', 40.7589, -73.9851, 'Mon-Fri 7AM-7PM, Sat 8AM-5PM', 4.6),
('RepairHub Pro Westside', '789 Pine Road, Westside, City, State 12345', '555-1002', 'westside@repairhub.com', 40.7505, -74.0037, 'Mon-Sat 8AM-6PM', 4.7);

INSERT INTO services (service_name, price, description, estimated_duration) VALUES
('Standard Oil Change', 50.00, 'Includes up to 5 quarts of conventional oil and filter.', 30),
('Full Body Paint', 2500.00, 'Complete exterior repaint with single-stage enamel paint.', 1440),
('Dent Repair - Small', 150.00, 'Repair for a single small dent (up to 2 inches).', 120),
('Dent Repair - Medium', 300.00, 'Repair for medium-sized dents (2-6 inches).', 240),
('Dent Repair - Large', 500.00, 'Repair for large dents (6+ inches).', 360),
('Bumper Repair', 400.00, 'Repair and repaint of front or rear bumper.', 480),
('Windshield Replacement', 350.00, 'Complete windshield replacement with OEM glass.', 180),
('Brake Service', 200.00, 'Complete brake inspection and service.', 90),
('Tire Rotation', 40.00, 'Rotate all four tires and balance.', 45),
('Battery Replacement', 120.00, 'Replace car battery with testing.', 30);

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

INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color, mileage) VALUES
(4, 'Toyota', 'Camry', 2020, 'VIN12345JOHN', 'ABC123', 'White', 25000),
(4, 'Honda', 'Civic', 2018, 'VIN67890JOHN', 'XYZ789', 'Blue', 35000),
(5, 'Ford', 'F-150', 2021, 'VIN11111JANE', 'DEF456', 'Red', 15000),
(5, 'BMW', 'X5', 2019, 'VIN22222JANE', 'GHI789', 'Black', 28000);

-- Create some sample jobs
INSERT INTO jobs (customer_id, vehicle_id, service_id, branch_id, assigned_employee_id, status, booking_date, total_cost, notes) VALUES
(4, 1, 3, 1, 2, 'In Progress', '2023-10-27 10:00:00', 150.00, 'Small dent on passenger door'),
(4, 2, 1, 2, 3, 'Completed', '2023-10-25 09:00:00', 50.00, 'Regular maintenance'),
(5, 3, 6, 1, 2, 'Booked', '2023-11-01 14:00:00', 400.00, 'Front bumper damage from parking incident'),
(5, 4, 7, 3, 3, 'Invoiced', '2023-10-20 11:00:00', 350.00, 'Cracked windshield from stone chip');

-- Create invoices for completed jobs
INSERT INTO invoices (job_id, invoice_number, amount, tax_amount, total_amount, status, due_date) VALUES
(2, 'INV-2023-001', 50.00, 4.00, 54.00, 'Paid', '2023-11-25'),
(4, 'INV-2023-002', 350.00, 28.00, 378.00, 'Sent', '2023-11-20');

-- Create payments
INSERT INTO payments (invoice_id, amount, payment_method, payment_status, transaction_id) VALUES
(1, 54.00, 'Credit Card', 'Completed', 'TXN-001-2023');

-- Update job status for paid invoice
UPDATE jobs SET status = 'Paid' WHERE id = 2;