CREATE DATABASE IF NOT EXISTS hostel_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hostel_management;

CREATE TABLE IF NOT EXISTS hostels (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type ENUM('Boys', 'Girls', 'Co-ed') NOT NULL,
  gender ENUM('Male', 'Female', 'Co-ed') NOT NULL,
  floors INT UNSIGNED NOT NULL DEFAULT 1,
  total_rooms INT UNSIGNED NOT NULL DEFAULT 0,
  total_capacity INT UNSIGNED NOT NULL DEFAULT 0,
  warden VARCHAR(120) NULL,
  warden_phone VARCHAR(30) NULL,
  address VARCHAR(255) NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (floors > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(30) PRIMARY KEY,
  hostel_id VARCHAR(30) NOT NULL,
  room_number VARCHAR(30) NOT NULL,
  floor INT UNSIGNED NOT NULL,
  room_type ENUM('Single', 'Double', 'Triple', 'Four Bed') NOT NULL,
  capacity INT UNSIGNED NOT NULL,
  occupancy INT UNSIGNED NOT NULL DEFAULT 0,
  rent DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('Available', 'Partially Occupied', 'Full', 'Maintenance') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rooms_hostel_number (hostel_id, room_number),
  CONSTRAINT fk_rooms_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (capacity > 0),
  CHECK (occupancy <= capacity)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  department VARCHAR(120) NULL,
  session VARCHAR(30) NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  dob DATE NULL,
  address VARCHAR(255) NULL,
  guardian_name VARCHAR(120) NULL,
  guardian_phone VARCHAR(30) NULL,
  hostel_id VARCHAR(30) NULL,
  room_id VARCHAR(30) NULL,
  admission_date DATE NULL,
  status ENUM('Active', 'Inactive', 'Checked Out') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_students_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS allocations (
  id VARCHAR(30) PRIMARY KEY,
  student_id VARCHAR(30) NOT NULL,
  hostel_id VARCHAR(30) NOT NULL,
  room_id VARCHAR(30) NOT NULL,
  bed_number INT UNSIGNED NOT NULL,
  allocation_date DATE NOT NULL,
  checkout_date DATE NULL,
  status ENUM('Active', 'Ended') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_allocations_student FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_allocations_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_allocations_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (bed_number > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(30) PRIMARY KEY,
  student_id VARCHAR(30) NOT NULL,
  month_label VARCHAR(30) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NULL,
  method ENUM('Bank Transfer', 'Card', 'Cash', 'Mobile Wallet') NULL,
  transaction_id VARCHAR(100) NULL UNIQUE,
  status ENUM('Paid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_student_month (student_id, month_label),
  CONSTRAINT fk_payments_student FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(30) PRIMARY KEY,
  student_id VARCHAR(30) NOT NULL,
  room_id VARCHAR(30) NULL,
  category ENUM('Electricity', 'Water', 'Internet', 'Cleaning', 'Food', 'Maintenance', 'Security', 'Other') NOT NULL,
  subject VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  complaint_date DATE NOT NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaints_student FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_complaints_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(30) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  notice_date DATE NOT NULL,
  author VARCHAR(120) NOT NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  audience VARCHAR(80) NOT NULL DEFAULT 'All Students',
  status ENUM('Draft', 'Published', 'Archived') NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'student') NOT NULL,
  hostel_id VARCHAR(30) NULL,
  student_id VARCHAR(30) NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO settings (setting_key, setting_value)
VALUES
  ('hostelName', 'Campus Hostel Management'),
  ('currency', 'USD'),
  ('theme', 'light')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Demo accounts. Replace these passwords before using the application in production.
INSERT INTO users (id, name, email, password, role)
VALUES
  ('USR-001', 'Admin User', 'admin@hostel.com', 'admin123', 'admin'),
  ('USR-002', 'Daniel Reyes', 'manager@hostel.com', 'manager123', 'manager')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);
