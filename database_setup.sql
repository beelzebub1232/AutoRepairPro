CREATE DATABASE IF NOT EXISTS autorepairpro_db;
USE autorepairpro_db;

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS job_inventory;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

-- Users table with roles
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- In a real app, ALWAYS hash passwords
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services offered by the bodyshop
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT
);

-- Inventory of parts and materials
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    part_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL
);

-- Customer vehicles
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    vin VARCHAR(100) UNIQUE,
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- Repair jobs
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    service_id INT NOT NULL,
    assigned_employee_id INT,
    status ENUM('Booked', 'In Progress', 'Completed', 'Invoiced', 'Paid') NOT NULL,
    booking_date DATETIME NOT NULL,
    completion_date DATETIME,
    total_cost DECIMAL(10, 2),
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (assigned_employee_id) REFERENCES users(id)
);

-- Link table for parts used in a job
CREATE TABLE job_inventory (
    job_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity_used INT NOT NULL,
    PRIMARY KEY (job_id, inventory_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

-- Insert Sample Data
INSERT INTO users (username, password, full_name, role) VALUES
('admin', 'admin123', 'Admin User', 'admin'),
('tech1', 'tech123', 'Bob The Builder', 'employee'),
('tech2', 'tech123', 'Alice The Mechanic', 'employee'),
('johndoe', 'customer123', 'John Doe', 'customer');

INSERT INTO services (service_name, price, description) VALUES
('Standard Oil Change', 50.00, 'Includes up to 5 quarts of conventional oil and filter.'),
('Full Body Paint', 2500.00, 'Complete exterior repaint with single-stage enamel paint.'),
('Dent Repair - Small', 150.00, 'Repair for a single small dent (up to 2 inches).');

INSERT INTO inventory (part_name, quantity, price_per_unit) VALUES
('Oil Filter', 50, 8.50),
('Conventional Oil (Quart)', 200, 5.00),
('White Paint (Gallon)', 10, 75.00),
('Sandpaper Sheet', 100, 1.25);

INSERT INTO vehicles (customer_id, make, model, year, vin) VALUES
(4, 'Toyota', 'Camry', 2020, 'VIN12345JOHN');

INSERT INTO jobs (customer_id, vehicle_id, service_id, assigned_employee_id, status, booking_date) VALUES
(4, 1, 3, 2, 'In Progress', '2023-10-27 10:00:00');