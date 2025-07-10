-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 10, 2025 at 07:52 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `autorepairpro_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
CREATE TABLE IF NOT EXISTS `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `address`, `phone`, `email`, `rating`, `is_active`, `created_at`, `updated_at`, `latitude`, `longitude`) VALUES
(6, 'Auto Repair Pro Main Branch', 'Edappally', '6590549876', 'test@gmailcom', 0.00, 1, '2025-07-07 20:04:23', '2025-07-07 20:08:34', 10.0254870, 76.3079848),
(7, 'Auto Repair Pro Sub Branch 1', 'Palarivattom', '7053807648', 'sub@gmailcom', 0.00, 1, '2025-07-07 20:05:24', '2025-07-07 20:08:43', 10.0003739, 76.3120698),
(8, 'Auto Repair Pro Small Branch ', 'Aluva', '3098539535', 'lbranch@gmail.com', 0.00, 1, '2025-07-07 20:06:23', '2025-07-07 20:08:38', 10.1077682, 76.3568532);

-- --------------------------------------------------------

--
-- Table structure for table `business_hours`
--

DROP TABLE IF EXISTS `business_hours`;
CREATE TABLE IF NOT EXISTS `business_hours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `is_closed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_branch_day` (`branch_id`,`day_of_week`)
) ENGINE=MyISAM AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `business_hours`
--

INSERT INTO `business_hours` (`id`, `branch_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`) VALUES
(42, 3, 'Sunday', NULL, NULL, 1),
(41, 3, 'Saturday', '08:00:00', '18:00:00', 0),
(40, 3, 'Friday', '08:00:00', '18:00:00', 0),
(39, 3, 'Thursday', '08:00:00', '18:00:00', 0),
(38, 3, 'Wednesday', '08:00:00', '18:00:00', 0),
(37, 3, 'Tuesday', '08:00:00', '18:00:00', 0),
(36, 3, 'Monday', '08:00:00', '18:00:00', 0),
(35, 2, 'Sunday', NULL, NULL, 1),
(34, 2, 'Saturday', '08:00:00', '17:00:00', 0),
(33, 2, 'Friday', '07:00:00', '19:00:00', 0),
(32, 2, 'Thursday', '07:00:00', '19:00:00', 0),
(31, 2, 'Wednesday', '07:00:00', '19:00:00', 0),
(30, 2, 'Tuesday', '07:00:00', '19:00:00', 0),
(29, 2, 'Monday', '07:00:00', '19:00:00', 0),
(28, 1, 'Sunday', NULL, NULL, 1),
(27, 1, 'Saturday', '09:00:00', '16:00:00', 0),
(26, 1, 'Friday', '08:00:00', '18:00:00', 0),
(25, 1, 'Thursday', '08:00:00', '18:00:00', 0),
(24, 1, 'Wednesday', '08:00:00', '18:00:00', 0),
(23, 1, 'Tuesday', '08:00:00', '18:00:00', 0),
(22, 1, 'Monday', '08:00:00', '18:00:00', 0);

-- --------------------------------------------------------

--
-- Table structure for table `contact_info`
--

DROP TABLE IF EXISTS `contact_info`;
CREATE TABLE IF NOT EXISTS `contact_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `contact_type` enum('phone','email','emergency','support') NOT NULL,
  `contact_value` varchar(255) NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `contact_info`
--

INSERT INTO `contact_info` (`id`, `branch_id`, `contact_type`, `contact_value`, `is_primary`, `is_active`) VALUES
(15, 2, 'emergency', '555-1001', 0, 1),
(14, 2, 'email', 'uptown@repairhub.com', 1, 1),
(13, 2, 'phone', '555-1001', 1, 1),
(12, 1, 'emergency', '555-1000', 0, 1),
(11, 1, 'email', 'downtown@repairhub.com', 1, 1),
(10, 1, 'phone', '555-1000', 1, 1),
(16, 3, 'phone', '555-1002', 1, 1),
(17, 3, 'email', 'westside@repairhub.com', 1, 1),
(18, 3, 'emergency', '555-1002', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
CREATE TABLE IF NOT EXISTS `inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `part_name` varchar(100) NOT NULL,
  `part_number` varchar(50) DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `min_quantity` int NOT NULL DEFAULT '5',
  `price_per_unit` decimal(10,2) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `part_number` (`part_number`)
) ENGINE=MyISAM AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `part_name`, `part_number`, `quantity`, `min_quantity`, `price_per_unit`, `category`, `supplier`, `location`, `is_active`, `created_at`, `updated_at`) VALUES
(32, 'Tire (205/55R16)', 'TIRE-001', 12, 4, 120.00, 'Tires', 'TireCorp', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(31, 'Car Battery', 'BAT-001', 8, 2, 85.00, 'Electrical', 'BatteryCo', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(30, 'Brake Pads', 'BRAKE-001', 25, 5, 45.00, 'Brakes', 'BrakeCorp', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(29, 'Windshield Glass', 'WS-001', 3, 1, 200.00, 'Glass', 'GlassCo', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(28, 'Bumper Cover', 'BUMP-001', 5, 1, 250.00, 'Body Parts', 'BodyParts Inc', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(22, 'Oil Filter', 'OF-001', 50, 10, 8.50, 'Filters', 'AutoParts Co', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(23, 'Conventional Oil (Quart)', 'OIL-001', 200, 20, 5.00, 'Lubricants', 'OilCorp', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(24, 'Synthetic Oil (Quart)', 'OIL-002', 150, 15, 8.00, 'Lubricants', 'OilCorp', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(25, 'White Paint (Gallon)', 'PAINT-001', 10, 2, 75.00, 'Paint', 'PaintPro', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(26, 'Black Paint (Gallon)', 'PAINT-002', 8, 2, 75.00, 'Paint', 'PaintPro', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(27, 'Sandpaper Sheet', 'SAND-001', 100, 20, 1.25, 'Supplies', 'SupplyCo', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(33, 'Headlight Assembly', 'LIGHT-001', 6, 2, 180.00, 'Lighting', 'LightCo', NULL, 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('Draft','Sent','Paid','Overdue','Cancelled') DEFAULT 'Draft',
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `job_id` (`job_id`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `job_id`, `invoice_number`, `amount`, `tax_amount`, `total_amount`, `status`, `due_date`, `created_at`, `updated_at`) VALUES
(15, 2, 'INV-2023-001', 50.00, 4.00, 54.00, 'Paid', '2023-11-25', '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(16, 4, 'INV-2023-002', 350.00, 28.00, 378.00, 'Sent', '2023-11-20', '2025-07-10 07:38:52', '2025-07-10 07:38:52');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `service_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `assigned_employee_id` int DEFAULT NULL,
  `status` enum('Booked','In Progress','Completed','Invoiced','Paid','Cancelled') DEFAULT 'Booked',
  `booking_date` timestamp NOT NULL,
  `completion_date` timestamp NULL DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parts_cost` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `service_id` (`service_id`),
  KEY `branch_id` (`branch_id`),
  KEY `assigned_employee_id` (`assigned_employee_id`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `customer_id`, `vehicle_id`, `service_id`, `branch_id`, `assigned_employee_id`, `status`, `booking_date`, `completion_date`, `total_cost`, `notes`, `created_at`, `updated_at`, `parts_cost`) VALUES
(25, 4, 1, 3, 1, 2, 'In Progress', '2023-10-27 04:30:00', NULL, 150.00, 'Small dent on passenger door', '2025-07-10 07:38:52', '2025-07-10 07:38:52', 0.00),
(26, 4, 2, 1, 2, 3, 'Completed', '2023-10-25 03:30:00', NULL, 50.00, 'Regular maintenance', '2025-07-10 07:38:52', '2025-07-10 07:38:52', 0.00),
(27, 5, 3, 6, 1, 2, 'Booked', '2023-11-01 08:30:00', NULL, 400.00, 'Front bumper damage from parking incident', '2025-07-10 07:38:52', '2025-07-10 07:38:52', 0.00),
(28, 5, 4, 7, 3, 3, 'Invoiced', '2023-10-20 05:30:00', NULL, 350.00, 'Cracked windshield from stone chip', '2025-07-10 07:38:52', '2025-07-10 07:38:52', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `job_inventory`
--

DROP TABLE IF EXISTS `job_inventory`;
CREATE TABLE IF NOT EXISTS `job_inventory` (
  `job_id` int NOT NULL,
  `inventory_id` int NOT NULL,
  `quantity_used` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`job_id`,`inventory_id`),
  KEY `inventory_id` (`inventory_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parts`
--

DROP TABLE IF EXISTS `parts`;
CREATE TABLE IF NOT EXISTS `parts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `part_name` varchar(255) NOT NULL,
  `price_per_unit` decimal(10,2) NOT NULL,
  `quantity` int DEFAULT '0',
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('Credit Card','Debit Card','Cash','Bank Transfer','Digital Wallet') NOT NULL,
  `payment_status` enum('Pending','Completed','Failed','Refunded') DEFAULT 'Pending',
  `transaction_id` varchar(255) DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `invoice_id`, `amount`, `payment_method`, `payment_status`, `transaction_id`, `payment_date`, `notes`) VALUES
(3, 1, 54.00, 'Credit Card', 'Completed', 'TXN-001-2023', '2025-07-10 07:38:52', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `performance_metrics`
--

DROP TABLE IF EXISTS `performance_metrics`;
CREATE TABLE IF NOT EXISTS `performance_metrics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `metric_type` enum('jobs_completed','customer_rating','efficiency_score','attendance') NOT NULL,
  `metric_value` decimal(10,2) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `performance_metrics`
--

INSERT INTO `performance_metrics` (`id`, `employee_id`, `metric_type`, `metric_value`, `period_start`, `period_end`, `notes`, `created_at`) VALUES
(9, 2, 'jobs_completed', 15.00, '2023-10-01', '2023-10-31', NULL, '2025-07-10 07:38:52'),
(10, 2, 'customer_rating', 4.50, '2023-10-01', '2023-10-31', NULL, '2025-07-10 07:38:52'),
(11, 3, 'jobs_completed', 12.00, '2023-10-01', '2023-10-31', NULL, '2025-07-10 07:38:52'),
(12, 3, 'customer_rating', 4.20, '2023-10-01', '2023-10-31', NULL, '2025-07-10 07:38:52');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
CREATE TABLE IF NOT EXISTS `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text,
  `estimated_duration` int DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `service_name`, `price`, `description`, `estimated_duration`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(29, 'Tire Rotation', 40.00, 'Rotate all four tires and balance.', 45, 'Maintenance', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(28, 'Brake Service', 200.00, 'Complete brake inspection and service.', 90, 'Maintenance', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(21, 'Standard Oil Change', 50.00, 'Includes up to 5 quarts of conventional oil and filter.', 30, 'Maintenance', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(22, 'Full Body Paint', 2500.00, 'Complete exterior repaint with single-stage enamel paint.', 1440, 'Body Work', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(23, 'Dent Repair - Small', 150.00, 'Repair for a single small dent (up to 2 inches).', 120, 'Body Work', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(24, 'Dent Repair - Medium', 300.00, 'Repair for medium-sized dents (2-6 inches).', 240, 'Body Work', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(25, 'Dent Repair - Large', 500.00, 'Repair for large dents (6+ inches).', 360, 'Body Work', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(26, 'Bumper Repair', 400.00, 'Repair and repaint of front or rear bumper.', 480, 'Body Work', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(27, 'Windshield Replacement', 350.00, 'Complete windshield replacement with OEM glass.', 180, 'Glass', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(30, 'Battery Replacement', 120.00, 'Replace car battery with testing.', 30, 'Electrical', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=MyISAM AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_public`, `created_at`, `updated_at`) VALUES
(21, 'company_name', 'RepairHub Pro', 'string', 'Company name displayed throughout the application', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(22, 'company_address', '123 Main Street, Downtown, City, State 12345', 'string', 'Main company address', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(23, 'company_phone', '555-0000', 'string', 'Main company phone number', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(24, 'company_email', 'info@repairhub.com', 'string', 'Main company email', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(25, 'tax_rate', '0.08', 'number', 'Default tax rate for invoices (8%)', 0, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(26, 'currency_symbol', '$', 'string', 'Currency symbol for pricing', 1, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(27, 'default_branch_id', '1', 'number', 'Default branch for new bookings', 0, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(28, 'max_booking_days_ahead', '30', 'number', 'Maximum days ahead for booking appointments', 0, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(29, 'auto_invoice_generation', 'true', 'boolean', 'Automatically generate invoices when jobs are completed', 0, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(30, 'low_stock_threshold', '5', 'number', 'Default minimum quantity threshold for inventory alerts', 0, '2025-07-10 07:38:52', '2025-07-10 07:38:52');

-- --------------------------------------------------------

--
-- Table structure for table `used_parts`
--

DROP TABLE IF EXISTS `used_parts`;
CREATE TABLE IF NOT EXISTS `used_parts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `part_id` int NOT NULL,
  `quantity_used` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `job_id` (`job_id`),
  KEY `part_id` (`part_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','employee','customer') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `email`, `phone`, `role`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 'admin', 'admin123', 'Admin User', 'admin@repairhub.com', '555-0100', 'admin', '2025-07-07 14:33:36', '2025-07-07 14:33:36', 1);

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `make` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `year` int NOT NULL,
  `vin` varchar(17) DEFAULT NULL,
  `license_plate` varchar(20) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `mileage` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vin` (`vin`),
  KEY `customer_id` (`customer_id`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `customer_id`, `make`, `model`, `year`, `vin`, `license_plate`, `color`, `mileage`, `created_at`, `updated_at`) VALUES
(11, 4, 'Toyota', 'Camry', 2020, 'VIN12345JOHN', 'ABC123', 'White', 25000, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(12, 4, 'Honda', 'Civic', 2018, 'VIN67890JOHN', 'XYZ789', 'Blue', 35000, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(13, 5, 'Ford', 'F-150', 2021, 'VIN11111JANE', 'DEF456', 'Red', 15000, '2025-07-10 07:38:52', '2025-07-10 07:38:52'),
(14, 5, 'BMW', 'X5', 2019, 'VIN22222JANE', 'GHI789', 'Black', 28000, '2025-07-10 07:38:52', '2025-07-10 07:38:52');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
