CREATE DATABASE IF NOT EXISTS hrspace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hrspace;

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS user_permissions;
DROP TABLE IF EXISTS forum_reports;
DROP TABLE IF EXISTS forum_reactions;
DROP TABLE IF EXISTS forum_replies;
DROP TABLE IF EXISTS forum_posts;
DROP TABLE IF EXISTS expense_payments;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS performance_reviews;
DROP TABLE IF EXISTS training_certificates;
DROP TABLE IF EXISTS training_enrollments;
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS payroll;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS access_requests;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'hr_manager', 'employee') NOT NULL DEFAULT 'employee',
  phone VARCHAR(40),
  department VARCHAR(100),
  designation VARCHAR(100),
  hire_date DATE,
  salary DECIMAL(12, 2) DEFAULT 0,
  avatar VARCHAR(255),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(80) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE access_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by INT,
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  work_date DATE NOT NULL,
  clock_in DATETIME,
  clock_out DATETIME,
  status ENUM('present', 'absent', 'late', 'leave') NOT NULL DEFAULT 'present',
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_work_date (user_id, work_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type VARCHAR(80) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by INT,
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE payroll (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pay_period DATE NOT NULL,
  basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  allowances DECIMAL(12, 2) NOT NULL DEFAULT 0,
  deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
  net_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'processed', 'paid') NOT NULL DEFAULT 'processed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE training_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  trainer VARCHAR(120),
  starts_at DATETIME NOT NULL,
  ends_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE training_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  training_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('enrolled', 'completed', 'cancelled') NOT NULL DEFAULT 'enrolled',
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_training_user (training_id, user_id),
  FOREIGN KEY (training_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE training_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT NOT NULL,
  certificate_code VARCHAR(80) NOT NULL UNIQUE,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  issued_by INT,
  UNIQUE KEY unique_enrollment_certificate (enrollment_id),
  FOREIGN KEY (enrollment_id) REFERENCES training_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE performance_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reviewer_id INT,
  review_period VARCHAR(50) NOT NULL,
  score DECIMAL(4, 2),
  goals TEXT,
  feedback TEXT,
  status ENUM('draft', 'submitted', 'approved') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(80) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  receipt_path VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected', 'paid') NOT NULL DEFAULT 'pending',
  reviewed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE expense_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(80) NOT NULL DEFAULT 'Bank Transfer',
  reference VARCHAR(120),
  paid_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_expense_payment (expense_id),
  FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
  FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE forum_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(80) DEFAULT 'General',
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  anonymous_alias VARCHAR(40),
  anonymous_color VARCHAR(20),
  tags JSON,
  sentiment VARCHAR(40) NOT NULL DEFAULT 'neutral',
  is_poll BOOLEAN NOT NULL DEFAULT FALSE,
  poll_data JSON,
  views INT NOT NULL DEFAULT 0,
  status ENUM('published', 'hidden', 'flagged') NOT NULL DEFAULT 'published',
  moderation_note VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE forum_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  parent_reply_id INT,
  user_id INT,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  anonymous_alias VARCHAR(40),
  anonymous_color VARCHAR(20),
  status ENUM('published', 'hidden', 'flagged') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_reply_id) REFERENCES forum_replies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE forum_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('post', 'reply') NOT NULL,
  target_id INT NOT NULL,
  user_id INT NOT NULL,
  reaction ENUM('like', 'heart', 'helpful') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_forum_reaction (target_type, target_id, user_id, reaction),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE forum_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('post', 'reply') NOT NULL,
  target_id INT NOT NULL,
  reporter_id INT,
  reason VARCHAR(180) NOT NULL,
  notes TEXT,
  status ENUM('pending', 'reviewed', 'dismissed') NOT NULL DEFAULT 'pending',
  action_taken VARCHAR(80),
  reviewed_by INT,
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO users
  (id, name, email, password, role, phone, department, designation, hire_date, salary)
VALUES
  (1, 'Admin User', 'admin@hrms.com', '$2a$10$7IAQrKRQwkIHv2eZSIRDj.S1O0ove29.KjCkCXD3369iJk9dTKngi', 'admin', '+880 1700-000001', 'Operations', 'System Admin', '2024-01-01', 120000.00),
  (2, 'HR Manager', 'hr@hrms.com', '$2a$10$cteqOigYNxjG6l8d.G7tNOSlBprtlBiCUvj03ljajfV.0CMwhd.Uq', 'hr_manager', '+880 1700-000002', 'Human Resources', 'HR Manager', '2024-02-01', 95000.00),
  (3, 'Employee User', 'employee@hrms.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+880 1700-000003', 'Engineering', 'Software Engineer', '2024-03-01', 75000.00),
  (4, 'Ayesha Rahman', 'ayesha@hrms.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+880 1700-000004', 'Finance', 'Accountant', '2024-04-15', 68000.00),
  (5, 'Tanvir Hasan', 'tanvir@hrms.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+880 1700-000005', 'Marketing', 'Marketing Executive', '2024-05-10', 62000.00);

INSERT INTO roles (id, code, name, description)
VALUES
  (1, 'admin', 'Administrator', 'Full system access across all HRSpace modules.'),
  (2, 'hr_manager', 'HR Manager', 'HR operations access for employees, attendance, leave, onboarding, training, and reports.'),
  (3, 'employee', 'Employee', 'Self-service access for personal HR tasks.');

INSERT INTO permissions (code, module, action, description)
VALUES
  ('dashboard.admin.view', 'dashboard', 'admin_view', 'View administrator dashboard and system-wide summaries.'),
  ('dashboard.hr.view', 'dashboard', 'hr_view', 'View HR manager dashboard and team summaries.'),
  ('dashboard.employee.view', 'dashboard', 'employee_view', 'View employee self-service dashboard.'),

  ('employees.view_all', 'employees', 'view_all', 'View all employee profiles and records.'),
  ('employees.view_self', 'employees', 'view_self', 'View own employee profile.'),
  ('employees.create', 'employees', 'create', 'Create employee accounts.'),
  ('employees.update_all', 'employees', 'update_all', 'Update any employee profile.'),
  ('employees.update_self', 'employees', 'update_self', 'Update own profile fields.'),
  ('employees.delete', 'employees', 'delete', 'Deactivate or delete employee accounts.'),

  ('attendance.view_all', 'attendance', 'view_all', 'View attendance for all employees.'),
  ('attendance.view_self', 'attendance', 'view_self', 'View own attendance records.'),
  ('attendance.manage_all', 'attendance', 'manage_all', 'Create or update attendance records for employees.'),
  ('attendance.clock_self', 'attendance', 'clock_self', 'Clock in and clock out for self.'),

  ('leave.view_all', 'leave', 'view_all', 'View all leave requests.'),
  ('leave.view_self', 'leave', 'view_self', 'View own leave requests.'),
  ('leave.request_self', 'leave', 'request_self', 'Submit own leave requests.'),
  ('leave.approve', 'leave', 'approve', 'Approve or reject employee leave requests.'),

  ('payroll.view_all', 'payroll', 'view_all', 'View payroll for all employees.'),
  ('payroll.view_self', 'payroll', 'view_self', 'View own payroll and payslips.'),
  ('payroll.manage', 'payroll', 'manage', 'Create and process payroll.'),

  ('expenses.view_all', 'expenses', 'view_all', 'View all expense claims.'),
  ('expenses.view_self', 'expenses', 'view_self', 'View own expense claims.'),
  ('expenses.submit_self', 'expenses', 'submit_self', 'Submit own expense claims.'),
  ('expenses.approve', 'expenses', 'approve', 'Approve or reject expense claims.'),

  ('training.view_all', 'training', 'view_all', 'View all training sessions and enrollments.'),
  ('training.view_self', 'training', 'view_self', 'View own training enrollments.'),
  ('training.manage', 'training', 'manage', 'Create and manage training sessions.'),
  ('training.enroll_self', 'training', 'enroll_self', 'Enroll self in training.'),

  ('performance.view_all', 'performance', 'view_all', 'View all performance reviews.'),
  ('performance.view_self', 'performance', 'view_self', 'View own performance reviews.'),
  ('performance.manage', 'performance', 'manage', 'Create and manage performance reviews.'),

  ('forum.view', 'forum', 'view', 'View forum posts and replies.'),
  ('forum.post', 'forum', 'post', 'Create forum posts and replies.'),
  ('forum.moderate', 'forum', 'moderate', 'Moderate forum content.'),

  ('roles.view', 'roles', 'view', 'View roles and permissions.'),
  ('roles.manage', 'roles', 'manage', 'Create and update roles and permissions.'),
  ('system.settings', 'system', 'settings', 'Manage system settings and platform configuration.'),
  ('reports.view', 'reports', 'view', 'View reports and analytics.');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'dashboard.hr.view',
  'employees.view_all',
  'employees.view_self',
  'employees.create',
  'employees.update_all',
  'employees.update_self',
  'attendance.view_all',
  'attendance.view_self',
  'attendance.manage_all',
  'attendance.clock_self',
  'leave.view_all',
  'leave.view_self',
  'leave.request_self',
  'leave.approve',
  'payroll.view_all',
  'payroll.view_self',
  'expenses.view_all',
  'expenses.view_self',
  'expenses.submit_self',
  'expenses.approve',
  'training.view_all',
  'training.view_self',
  'training.manage',
  'training.enroll_self',
  'performance.view_all',
  'performance.view_self',
  'performance.manage',
  'forum.view',
  'forum.post',
  'forum.moderate',
  'reports.view'
)
WHERE r.code = 'hr_manager';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'dashboard.employee.view',
  'employees.view_self',
  'employees.update_self',
  'attendance.view_self',
  'attendance.clock_self',
  'leave.view_self',
  'leave.request_self',
  'payroll.view_self',
  'expenses.view_self',
  'expenses.submit_self',
  'training.view_self',
  'training.enroll_self',
  'performance.view_self',
  'forum.view',
  'forum.post'
)
WHERE r.code = 'employee';

CREATE VIEW user_permissions AS
SELECT
  u.id AS user_id,
  u.email,
  u.role,
  p.code AS permission_code,
  p.module,
  p.action
FROM users u
JOIN roles r ON r.code = u.role
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id;

INSERT INTO attendance
  (user_id, work_date, clock_in, clock_out, status, notes)
VALUES
  (3, CURDATE(), CONCAT(CURDATE(), ' 09:05:00'), CONCAT(CURDATE(), ' 17:10:00'), 'present', 'Regular shift'),
  (4, CURDATE(), CONCAT(CURDATE(), ' 09:25:00'), CONCAT(CURDATE(), ' 17:00:00'), 'late', 'Late arrival'),
  (5, CURDATE(), CONCAT(CURDATE(), ' 08:55:00'), CONCAT(CURDATE(), ' 17:05:00'), 'present', 'Regular shift'),
  (3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:00:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:00:00'), 'present', NULL),
  (4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, NULL, 'leave', 'Approved leave');

INSERT INTO leave_requests
  (user_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at)
VALUES
  (3, 'Annual Leave', DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 9 DAY), 'Family event', 'pending', NULL, NULL),
  (4, 'Sick Leave', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Fever', 'approved', 2, NOW()),
  (5, 'Casual Leave', DATE_ADD(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Personal work', 'pending', NULL, NULL);

INSERT INTO payroll
  (user_id, pay_period, basic_salary, allowances, deductions, net_pay, status)
VALUES
  (3, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 75000.00, 5000.00, 2500.00, 77500.00, 'processed'),
  (4, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 68000.00, 3500.00, 1800.00, 69700.00, 'processed'),
  (5, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 62000.00, 3000.00, 1500.00, 63500.00, 'processed');

INSERT INTO training_sessions
  (id, title, description, trainer, starts_at, ends_at)
VALUES
  (1, 'Workplace Safety', 'Quarterly workplace safety training.', 'HR Team', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR),
  (2, 'Leadership Basics', 'Managerial communication and feedback skills.', 'People Ops', DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 3 HOUR);

INSERT INTO training_enrollments
  (training_id, user_id, status, progress)
VALUES
  (1, 3, 'enrolled', 25),
  (1, 4, 'completed', 100),
  (2, 5, 'enrolled', 10);

INSERT INTO training_certificates
  (enrollment_id, certificate_code, issued_by)
VALUES
  (2, 'CERT-DEMO-0002', 2);

INSERT INTO performance_reviews
  (user_id, reviewer_id, review_period, score, goals, feedback, status)
VALUES
  (3, 2, 'Q2 2026', 4.40, 'Improve delivery predictability and mentor junior staff.', 'Strong technical contribution.', 'submitted'),
  (4, 2, 'Q2 2026', 4.10, 'Automate monthly expense reconciliation.', 'Reliable ownership of finance operations.', 'approved');

INSERT INTO expenses
  (user_id, category, amount, expense_date, description, status, reviewed_by)
VALUES
  (3, 'Travel', 2500.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Client visit transport', 'pending', NULL),
  (4, 'Office Supplies', 1800.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Stationery purchase', 'approved', 2),
  (5, 'Internet', 1200.00, DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'Remote work internet allowance', 'paid', 2);

INSERT INTO expense_payments
  (expense_id, amount, payment_date, method, reference, paid_by)
VALUES
  (3, 1200.00, CURDATE(), 'Bank Transfer', 'PAY-EXP-0003', 2);

INSERT INTO forum_posts
  (user_id, title, body, category, is_anonymous, anonymous_alias, anonymous_color, tags, sentiment, views)
VALUES
  (2, 'Welcome to HRSpace', 'Use this forum for HR questions, announcements, and team discussions.', 'Announcement', FALSE, 'Owl', '#7C5FB5', JSON_ARRAY('announcement', 'hr'), 'positive', 124),
  (3, 'Remote work equipment request', 'What is the process for requesting an extra monitor?', 'General', TRUE, 'Panda', '#9A77CF', JSON_ARRAY('equipment', 'remote-work'), 'neutral', 57);

INSERT INTO forum_replies
  (post_id, user_id, body, is_anonymous, anonymous_alias, anonymous_color)
VALUES
  (2, 2, 'Please submit an expense request with the quotation attached.', FALSE, 'Owl', '#7C5FB5');

INSERT INTO forum_reactions
  (target_type, target_id, user_id, reaction)
VALUES
  ('post', 1, 3, 'like'),
  ('post', 1, 4, 'heart'),
  ('post', 2, 2, 'helpful'),
  ('reply', 1, 3, 'like');
