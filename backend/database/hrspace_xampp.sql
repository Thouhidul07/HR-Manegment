CREATE DATABASE IF NOT EXISTS hrspace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hrspace;

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS user_permissions;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS user_documents;
DROP TABLE IF EXISTS job_applications;
DROP TABLE IF EXISTS job_circulars;
DROP TABLE IF EXISTS work_breakdown_structures;
DROP TABLE IF EXISTS forum_reports;
DROP TABLE IF EXISTS forum_reactions;
DROP TABLE IF EXISTS forum_replies;
DROP TABLE IF EXISTS forum_posts;
DROP TABLE IF EXISTS project_comments;
DROP TABLE IF EXISTS project_milestones;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS project_tasks;
DROP TABLE IF EXISTS expense_payments;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS cv_candidates;
DROP TABLE IF EXISTS peer_reviews;
DROP TABLE IF EXISTS performance_reviews;
DROP TABLE IF EXISTS training_certificates;
DROP TABLE IF EXISTS training_enrollments;
DROP TABLE IF EXISTS training_sessions;
DROP TABLE IF EXISTS lifecycle_cases;
DROP TABLE IF EXISTS lifecycle_steps;
DROP TABLE IF EXISTS lifecycle_tasks;
DROP TABLE IF EXISTS payroll;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS access_requests;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_profile_settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  domain VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO companies (id, name, domain)
VALUES (1, 'NexoraTech Ltd', 'nexoratech.com');

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL DEFAULT 1,
  employee_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'hr_manager', 'project_manager', 'employee') NOT NULL DEFAULT 'employee',
  phone VARCHAR(40),
  department VARCHAR(100),
  designation VARCHAR(100),
  hire_date DATE,
  salary DECIMAL(12, 2) DEFAULT 0,
  avatar VARCHAR(255),
  status ENUM('pending', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
);


CREATE TABLE user_profile_settings (
  user_id INT PRIMARY KEY,
  display_name VARCHAR(120),
  date_of_birth DATE,
  gender VARCHAR(40),
  nationality VARCHAR(80),
  marital_status VARCHAR(80),
  city VARCHAR(100),
  country VARCHAR(100),
  bio TEXT,
  emergency_contact_name VARCHAR(120),
  emergency_contact_phone VARCHAR(60),
  blood_group VARCHAR(20),
  linkedin_url VARCHAR(255),
  language VARCHAR(80) NOT NULL DEFAULT 'English',
  timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Dhaka',
  theme_preference ENUM('light','dark','system') NOT NULL DEFAULT 'system',
  notify_leave_updates TINYINT(1) NOT NULL DEFAULT 1,
  notify_schedule_changes TINYINT(1) NOT NULL DEFAULT 1,
  notify_payslip_available TINYINT(1) NOT NULL DEFAULT 1,
  forum_anonymous_mode TINYINT(1) NOT NULL DEFAULT 0,
  forum_allow_anonymous_posting TINYINT(1) NOT NULL DEFAULT 1,
  forum_hide_identity TINYINT(1) NOT NULL DEFAULT 0,
  forum_notify_replies TINYINT(1) NOT NULL DEFAULT 1,
  privacy_show_directory TINYINT(1) NOT NULL DEFAULT 1,
  privacy_show_phone TINYINT(1) NOT NULL DEFAULT 1,
  privacy_show_email TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  type VARCHAR(60) NOT NULL DEFAULT 'info',
  title VARCHAR(180) NOT NULL,
  body TEXT,
  link VARCHAR(255),
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read, created_at),
  INDEX idx_notifications_company (company_id, created_at)
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('general','performance','expense','training','attendance','leave','onboarding','offboarding','custom') NOT NULL DEFAULT 'general',
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  status ENUM('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
  assigned_to INT NOT NULL,
  assigned_by INT NOT NULL,
  due_date DATE,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
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
  company_id INT NOT NULL DEFAULT 1,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  trainer VARCHAR(120),
  starts_at DATETIME NOT NULL,
  ends_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
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

CREATE TABLE lifecycle_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('onboarding','offboarding') NOT NULL,
  status ENUM('not_started','in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
  start_date DATE,
  target_date DATE,
  completed_at DATETIME,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE lifecycle_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  type ENUM('onboarding','offboarding') NOT NULL,
  step_order INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_lifecycle_step (company_id, type, step_order),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE lifecycle_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  case_id INT NOT NULL,
  step_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_by INT,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES lifecycle_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES lifecycle_steps(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
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

CREATE TABLE peer_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reviewee_id INT NOT NULL,
  reviewer_id INT,
  project VARCHAR(160) NOT NULL,
  duration VARCHAR(80) NOT NULL,
  review_text TEXT NOT NULL,
  communication_rating TINYINT NOT NULL,
  technical_rating TINYINT NOT NULL,
  teamwork_rating TINYINT NOT NULL,
  leadership_rating TINYINT NOT NULL,
  strengths TEXT,
  improvements TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('submitted', 'approved', 'archived') NOT NULL DEFAULT 'submitted',
  review_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE cv_candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL DEFAULT 1,
  name VARCHAR(140) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(60),
  position VARCHAR(160) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  skills JSON,
  experience DECIMAL(4, 1) NOT NULL DEFAULT 0,
  education VARCHAR(255),
  match_percentage INT NOT NULL DEFAULT 0,
  status ENUM('pending', 'shortlisted', 'rejected') NOT NULL DEFAULT 'pending',
  key_strengths JSON,
  concerns JSON,
  cv_file_path VARCHAR(255),
  uploaded_by INT,
  upload_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
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

CREATE TABLE project_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('todo', 'in-progress', 'in-review', 'completed') NOT NULL DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  assignee VARCHAR(120) NOT NULL,
  assignee_avatar VARCHAR(8),
  deadline DATE NOT NULL,
  project VARCHAR(120) NOT NULL,
  tags TEXT,
  estimated_hours DECIMAL(6, 2),
  comments INT NOT NULL DEFAULT 0,
  attachments INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  owner_id INT,
  status ENUM('planning', 'active', 'on-hold', 'completed') NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(80) NOT NULL DEFAULT 'Member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_project_member (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE project_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending', 'in-progress', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE project_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE work_breakdown_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  parent_id INT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  assigned_to INT NULL,
  status ENUM('todo', 'in-progress', 'in-review', 'completed') NOT NULL DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  start_date DATE NULL,
  due_date DATE NULL,
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES work_breakdown_structures(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE job_circulars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL DEFAULT 1,
  title VARCHAR(180) NOT NULL,
  department VARCHAR(100) NOT NULL,
  employment_type ENUM('Full-time', 'Part-time', 'Contract') NOT NULL DEFAULT 'Full-time',
  location VARCHAR(160) NOT NULL,
  salary_range VARCHAR(100),
  description TEXT,
  requirements JSON,
  responsibilities JSON,
  benefits JSON,
  deadline DATE,
  status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL DEFAULT 1,
  circular_id INT NOT NULL,
  applicant_name VARCHAR(140) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(60) NOT NULL,
  cover_letter TEXT,
  cv_file VARCHAR(255),
  skills JSON,
  experience_years DECIMAL(4, 1) NOT NULL DEFAULT 0,
  status ENUM('submitted', 'reviewing', 'shortlisted', 'rejected', 'hired') NOT NULL DEFAULT 'submitted',
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (circular_id) REFERENCES job_circulars(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT,
  actor_name VARCHAR(120),
  actor_role VARCHAR(50),
  action VARCHAR(80) NOT NULL,
  module VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80),
  entity_id INT,
  description TEXT,
  metadata_json JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_type VARCHAR(80) NOT NULL DEFAULT 'Other',
  document_name VARCHAR(180) NOT NULL,
  file_name VARCHAR(180),
  original_name VARCHAR(255),
  file_path VARCHAR(255) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
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
  (id, company_id, employee_code, name, email, password, role, phone, department, designation, hire_date, salary, avatar)
VALUES
  (1, 1, 'NX-ADM-001', 'Admin / CEO', 'admin@nexoratech.com', '$2a$10$7IAQrKRQwkIHv2eZSIRDj.S1O0ove29.KjCkCXD3369iJk9dTKngi', 'admin', '+8801712345601', 'Executive Office', 'Chief Executive Officer', '2024-01-01', 120000.00, 'CEO'),
  (2, 1, 'NX-HR-001', 'HR Manager 01', 'hr.manager01@nexoratech.com', '$2a$10$cteqOigYNxjG6l8d.G7tNOSlBprtlBiCUvj03ljajfV.0CMwhd.Uq', 'hr_manager', '+8801712345602', 'Human Resources', 'Lead HR Manager', '2024-02-01', 96000.00, 'HM'),
  (3, 1, 'NX-EMP-001', 'Employee 01', 'employee01@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801712345603', 'Information Technology', 'Software Engineer', '2024-03-01', 75000.00, 'E0'),
  (4, 1, 'NX-EMP-002', 'Employee 02', 'employee02@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801712345604', 'Finance', 'Accounts Officer', '2024-04-15', 68000.00, 'E0'),
  (5, 1, 'NX-EMP-003', 'Employee 03', 'employee03@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801712345605', 'Marketing', 'Marketing Executive', '2024-05-10', 62000.00, 'E0'),
  (6, 1, 'NX-HR-002', 'HR Manager 02', 'hr.manager02@nexoratech.com', '$2a$10$cteqOigYNxjG6l8d.G7tNOSlBprtlBiCUvj03ljajfV.0CMwhd.Uq', 'hr_manager', '+8801712345606', 'Human Resources', 'HR Manager', '2024-02-02', 92000.00, 'HM'),
  (7, 1, 'NX-EMP-004', 'Employee 04', 'employee04@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345004', 'Sales', 'Sales Executive', '2024-04-04', 53000.00, 'E0'),
  (8, 1, 'NX-EMP-005', 'Employee 05', 'employee05@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345005', 'Operations', 'Operations Executive', '2024-05-05', 53750.00, 'E0'),
  (9, 1, 'NX-EMP-006', 'Employee 06', 'employee06@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345006', 'Customer Support', 'Customer Support Executive', '2024-06-06', 54500.00, 'E0'),
  (10, 1, 'NX-EMP-007', 'Employee 07', 'employee07@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345007', 'Training & Development', 'Training & Development Executive', '2024-07-07', 55250.00, 'E0'),
  (11, 1, 'NX-EMP-008', 'Employee 08', 'employee08@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345008', 'Administration', 'Administration Executive', '2024-08-08', 56000.00, 'E0');

INSERT INTO roles (id, code, name, description)
VALUES
  (1, 'admin', 'Admin / CEO', 'CEO-level authority with full access to every HRSpace module and action.'),
  (2, 'hr_manager', 'HR Manager', 'HR operations access for employees, attendance, leave, onboarding, training, and reports.'),
  (3, 'project_manager', 'Project Manager', 'Project, WBS, task delivery, history, and reporting management.'),
  (4, 'employee', 'Employee', 'Self-service access for personal HR tasks.');

INSERT INTO permissions (code, module, action, description)
VALUES
  ('dashboard.admin.view', 'dashboard', 'admin_view', 'View administrator dashboard and system-wide summaries.'),
  ('dashboard.hr.view', 'dashboard', 'hr_view', 'View HR manager dashboard and team summaries.'),
  ('dashboard.employee.view', 'dashboard', 'employee_view', 'View employee self-service dashboard.'),
  ('dashboard.project.view', 'dashboard', 'project_view', 'View project manager dashboard.'),

  ('projects.overview', 'projects', 'overview', 'View read-only project overview metrics.'),
  ('projects.read', 'projects', 'read', 'View projects and project details.'),
  ('projects.create', 'projects', 'create', 'Create projects.'),
  ('projects.update', 'projects', 'update', 'Update projects.'),
  ('projects.delete', 'projects', 'delete', 'Delete projects.'),
  ('wbs.read', 'wbs', 'read', 'View work breakdown structures.'),
  ('wbs.create', 'wbs', 'create', 'Create work breakdown structures.'),
  ('wbs.update', 'wbs', 'update', 'Update work breakdown structures.'),
  ('wbs.delete', 'wbs', 'delete', 'Delete work breakdown structures.'),
  ('project_history.read', 'project_history', 'read', 'View project history.'),
  ('project_reports.read', 'project_reports', 'read', 'View project reports.'),
  ('project_tasks.assign', 'project_tasks', 'assign', 'Assign project tasks.'),
  ('project_tasks.update', 'project_tasks', 'update', 'Update project tasks.'),

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
JOIN permissions p ON p.code NOT IN (
  'dashboard.project.view',
  'projects.read', 'projects.create', 'projects.update', 'projects.delete',
  'wbs.read', 'wbs.create', 'wbs.update', 'wbs.delete',
  'project_history.read', 'project_reports.read',
  'project_tasks.assign', 'project_tasks.update'
)
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
  'dashboard.project.view',
  'projects.read', 'projects.create', 'projects.update', 'projects.delete',
  'wbs.read', 'wbs.create', 'wbs.update', 'wbs.delete',
  'project_history.read', 'project_reports.read',
  'project_tasks.assign', 'project_tasks.update',
  'employees.view_all', 'forum.view', 'forum.post'
)
WHERE r.code = 'project_manager';

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
  (7, CURDATE(), NULL, NULL, 'absent', 'No attendance recorded'),
  (8, CURDATE(), NULL, NULL, 'leave', 'Approved leave'),
  (9, CURDATE(), CONCAT(CURDATE(), ' 09:03:00'), CONCAT(CURDATE(), ' 18:02:00'), 'present', 'Regular shift'),
  (10, CURDATE(), CONCAT(CURDATE(), ' 09:14:00'), CONCAT(CURDATE(), ' 18:05:00'), 'late', 'Late arrival'),
  (11, CURDATE(), CONCAT(CURDATE(), ' 08:59:00'), CONCAT(CURDATE(), ' 17:58:00'), 'present', 'Regular shift'),
  (3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:00:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:00:00'), 'present', NULL),
  (4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, NULL, 'leave', 'Approved leave'),
  (5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:22:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:10:00'), 'late', 'Late arrival'),
  (7, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:58:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:45:00'), 'present', 'Regular shift'),
  (8, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:07:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:01:00'), 'present', 'Regular shift'),
  (3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 09:04:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 18:03:00'), 'present', 'Regular shift'),
  (4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 09:00:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 17:52:00'), 'present', 'Regular shift'),
  (5, DATE_SUB(CURDATE(), INTERVAL 2 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 08:50:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 17:55:00'), 'present', 'Regular shift'),
  (7, DATE_SUB(CURDATE(), INTERVAL 2 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 09:30:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 2 DAY), ' 18:15:00'), 'late', 'Late arrival'),
  (8, DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, NULL, 'absent', 'Absent'),
  (3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 09:01:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 18:05:00'), 'present', 'Regular shift'),
  (4, DATE_SUB(CURDATE(), INTERVAL 3 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 09:10:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 18:00:00'), 'present', 'Regular shift'),
  (5, DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, NULL, 'leave', 'Approved leave'),
  (7, DATE_SUB(CURDATE(), INTERVAL 3 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 08:57:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 17:50:00'), 'present', 'Regular shift'),
  (8, DATE_SUB(CURDATE(), INTERVAL 3 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 09:19:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 3 DAY), ' 18:00:00'), 'late', 'Late arrival');

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
  (id, company_id, title, description, trainer, starts_at, ends_at)
VALUES
  (1, 1, 'Workplace Safety', 'Quarterly workplace safety training.', 'HR Team', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR),
  (2, 1, 'Leadership Basics', 'Managerial communication and feedback skills.', 'People Ops', DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 3 HOUR);

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


INSERT INTO lifecycle_steps (company_id, type, step_order, title, description)
VALUES
  (1, 'onboarding', 1, 'Document Verification', 'Verify and upload all required documents'),
  (1, 'onboarding', 2, 'IT Setup', 'Email, laptop, and system access setup'),
  (1, 'onboarding', 3, 'Orientation', 'Complete company orientation program'),
  (1, 'onboarding', 4, 'Training', 'Complete role-specific training modules'),
  (1, 'onboarding', 5, 'Team Introduction', 'Meet team members and manager'),
  (1, 'offboarding', 1, 'Resignation/Termination Confirmation', 'Confirm exit request and final working date'),
  (1, 'offboarding', 2, 'Knowledge Transfer', 'Complete handover of responsibilities and documents'),
  (1, 'offboarding', 3, 'Asset Return', 'Return laptop, access card, and company assets'),
  (1, 'offboarding', 4, 'Account Deactivation', 'Disable email, HRSpace, and internal system access'),
  (1, 'offboarding', 5, 'Final Settlement', 'Complete payroll, benefits, and final clearance');

  -- Sample Project Manager user for local XAMPP/testing
  INSERT INTO users
    (id, company_id, employee_code, name, email, password, role, phone, department, designation, hire_date, salary, avatar, status)
  VALUES
    (18, 1, 'NX-PM-001', 'Project Manager 01', 'pm01@nexoratech.com', '$2a$10$SKnkZVhCR5vH6phZVFL/3O5wF31zxgK7WZlxoz2gttFAj4x9ONdKS', 'project_manager', '+8801712345699', 'Project Management', 'Project Manager', '2025-09-01', 98000.00, 'PM', 'active');

  -- Assign Project Manager to existing project and set as owner
  UPDATE projects SET owner_id = 18 WHERE name = 'Website Redesign';
  INSERT INTO project_members (project_id, user_id, role)
  SELECT p.id, 18, 'Project Manager'
  FROM projects p
  WHERE p.name = 'Website Redesign'
  ON DUPLICATE KEY UPDATE role = 'Project Manager';

INSERT INTO performance_reviews
  (user_id, reviewer_id, review_period, score, goals, feedback, status)
VALUES
  (3, 2, 'Q2 2026', 4.40, 'Improve delivery predictability and mentor junior staff.', 'Strong technical contribution.', 'submitted'),
  (4, 2, 'Q2 2026', 4.10, 'Automate monthly expense reconciliation.', 'Reliable ownership of finance operations.', 'approved');

INSERT INTO peer_reviews
  (reviewee_id, reviewer_id, project, duration, review_text, communication_rating, technical_rating, teamwork_rating, leadership_rating, strengths, improvements, review_date)
VALUES
  (3, 2, 'HR Portal Enhancement', '3 months', 'Excellent collaboration throughout the project. The code reviews were thorough, practical, and easy for the team to act on.', 4, 5, 5, 4, JSON_ARRAY('Strong technical skills', 'Great team player', 'Helpful code reviews'), JSON_ARRAY('Share knowledge more in team meetings'), '2026-05-15'),
  (3, 4, 'Customer Portal V2', '4 months', 'Good work on frontend components with strong attention to detail. Communication could be a little more proactive, but the contribution was solid.', 3, 4, 4, 3, JSON_ARRAY('Detail-oriented', 'Clean code', 'Good problem solver'), JSON_ARRAY('More proactive communication'), '2026-05-10'),
  (4, 3, 'Data Pipeline Migration', '3 months', 'Outstanding work identifying issues early and documenting the migration clearly. The handoff was smooth and reliable.', 5, 5, 5, 5, JSON_ARRAY('Proactive problem-solving', 'Excellent documentation', 'Mentorship'), JSON_ARRAY(), '2026-04-28'),
  (5, 4, 'Marketing Campaign Analytics', '2 months', 'Useful insights and a positive attitude throughout. The next step is deeper analysis and sharper prioritization.', 4, 3, 4, 2, JSON_ARRAY('Good team player', 'Quick learner', 'Positive attitude'), JSON_ARRAY('Deeper analysis', 'More initiative'), '2026-05-05');

INSERT INTO cv_candidates
  (name, email, phone, position, score, skills, experience, education, match_percentage, status, key_strengths, concerns, upload_date)
VALUES
  ('Mahmudul Karim', 'mahmudul.karim@nexoratech.com', '+8801711122233', 'Software Engineer', 94, JSON_ARRAY('React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'PostgreSQL'), 7, 'M.S. Computer Science - BUET', 94, 'shortlisted', JSON_ARRAY('Matched react', 'Matched node.js', 'Matched typescript'), JSON_ARRAY(), '2026-05-28'),
  ('Jannatul Ferdous', 'jannatul.ferdous@nexoratech.com', '+8801811122233', 'Software Engineer', 73, JSON_ARRAY('React', 'Python', 'Django', 'MySQL', 'Redis', 'Git'), 6, 'B.S. Software Engineering - University of Dhaka', 73, 'pending', JSON_ARRAY('Matched react'), JSON_ARRAY('Missing preferred skills: node.js, typescript, aws'), '2026-05-27'),
  ('Rafi Ahmed', 'rafi.ahmed@nexoratech.com', '+8801911122233', 'Software Engineer', 68, JSON_ARRAY('Vue.js', 'Node.js', 'MongoDB', 'Express', 'GraphQL'), 5, 'B.S. Computer Science - North South University', 68, 'rejected', JSON_ARRAY('Matched node.js'), JSON_ARRAY('Missing preferred skills: react, typescript, aws'), '2026-05-26');

INSERT INTO expenses
  (user_id, category, amount, expense_date, description, status, reviewed_by)
VALUES
  (3, 'Travel', 2500.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Client visit transport', 'pending', NULL),
  (4, 'Office Supplies', 1800.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Stationery purchase', 'approved', 2),
  (5, 'Internet', 1200.00, DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'Hybrid work internet allowance', 'paid', 2);

INSERT INTO expense_payments
  (expense_id, amount, payment_date, method, reference, paid_by)
VALUES
  (3, 1200.00, CURDATE(), 'Bank Transfer', 'PAY-EXP-0003', 2);

INSERT INTO project_tasks
  (title, description, status, priority, assignee, assignee_avatar, deadline, project, tags, estimated_hours, comments, attachments)
VALUES
  ('Design Homepage Mockup', 'Create high-fidelity mockups for the new homepage design', 'in-progress', 'high', 'Emily Rodriguez', 'ER', '2026-06-05', 'Website Redesign', '["Design","UI/UX"]', NULL, 3, 2),
  ('Implement Authentication API', 'Build JWT-based authentication endpoints with refresh token support', 'in-progress', 'urgent', 'Michael Chen', 'MC', '2026-06-03', 'User Portal', '["Backend","Security"]', NULL, 5, 1),
  ('Create Component Library', 'Build reusable React components following design system', 'todo', 'medium', 'Sarah Johnson', 'SJ', '2026-06-10', 'Website Redesign', '["Frontend","React"]', NULL, 1, 0),
  ('Database Schema Migration', 'Update database schema for new user role permissions', 'in-review', 'high', 'David Kim', 'DK', '2026-06-02', 'User Portal', '["Database","Backend"]', NULL, 2, 1),
  ('E2E Testing Suite', 'Set up end-to-end testing with Cypress for critical user flows', 'todo', 'medium', 'Jessica Martinez', 'JM', '2026-06-12', 'User Portal', '["Testing","QA"]', NULL, 0, 0),
  ('Landing Page Optimization', 'Improve performance and SEO for landing page', 'completed', 'low', 'Sarah Johnson', 'SJ', '2026-05-30', 'Website Redesign', '["Frontend","Performance"]', NULL, 4, 3),
  ('Mobile Responsive Design', 'Ensure all pages are mobile-friendly and responsive', 'in-progress', 'high', 'Emily Rodriguez', 'ER', '2026-06-07', 'Website Redesign', '["Design","Mobile"]', NULL, 2, 1),
  ('API Documentation', 'Write comprehensive API documentation with examples', 'todo', 'low', 'Michael Chen', 'MC', '2026-06-15', 'User Portal', '["Documentation","Backend"]', NULL, 0, 0);

INSERT INTO projects
  (name, description, owner_id, status)
VALUES
  ('Website Redesign', 'Website Redesign delivery workspace', NULL, 'active'),
  ('User Portal', 'User Portal delivery workspace', NULL, 'active');

INSERT INTO forum_posts
  (user_id, title, body, category, is_anonymous, anonymous_alias, anonymous_color, tags, sentiment, views)
VALUES
  (2, 'Welcome to HRSpace', 'Use this forum for HR questions, announcements, and team discussions.', 'Announcement', FALSE, 'Owl', '#7C5FB5', JSON_ARRAY('announcement', 'hr'), 'positive', 124),
  (3, 'Office equipment request', 'What is the process for requesting an extra monitor at the Dhaka office?', 'General', TRUE, 'Panda', '#9A77CF', JSON_ARRAY('equipment', 'office-support'), 'neutral', 57);

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


INSERT INTO user_profile_settings
  (user_id, display_name, nationality, city, country, language, timezone)
SELECT id, name, 'Bangladeshi', 'Dhaka', 'Bangladesh', 'English', 'Asia/Dhaka'
FROM users
WHERE company_id = 1
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

INSERT INTO notifications (company_id, user_id, type, title, body, link)
VALUES
  (1, 1, 'leave', 'New leave request from Employee 03', 'Employee 03 submitted a casual leave request.', '/dashboard/leave'),
  (1, 1, 'payroll', 'Payroll processing completed', 'Monthly payroll has been processed for NexoraTech Ltd.', '/dashboard/payroll'),
  (1, 1, 'attendance', '3 employees on leave today', 'Review today’s team attendance summary.', '/dashboard/attendance'),
  (1, 2, 'leave', 'New leave request from Employee 03', 'Employee 03 submitted a casual leave request.', '/dashboard/leave'),
  (1, 2, 'payroll', 'Payroll processing completed', 'Monthly payroll has been processed for NexoraTech Ltd.', '/dashboard/payroll'),
  (1, 2, 'attendance', '3 employees on leave today', 'Review today’s team attendance summary.', '/dashboard/attendance'),
  (1, 3, 'training', 'Training session starts soon', 'Workplace Safety starts next week.', '/dashboard/training'),
  (1, 3, 'payroll', 'Payslip available', 'Your latest payslip is ready to view.', '/dashboard/payslips'),
  (1, 3, 'leave', 'Leave balance updated', 'Your annual leave balance has been refreshed.', '/dashboard/leave');

INSERT INTO tasks
  (company_id, title, description, category, priority, status, assigned_to, assigned_by, due_date)
VALUES
  (1, 'Complete Safety Compliance training', 'Review and complete safety policies.', 'training', 'medium', 'todo', 3, 1, DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
  (1, 'Submit Q1 performance feedback', 'Submit peer reviews for IT team members.', 'performance', 'high', 'in_progress', 3, 2, DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
  (1, 'Refactor dashboard charts', 'Update charts to support interactive legends.', 'custom', 'low', 'todo', 3, 3, DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
  (1, 'Review recruitment pipeline', 'Review CV filter candidates for backend engineers.', 'general', 'urgent', 'in_progress', 2, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
  (1, 'Approve pending leave queue', 'Review employee leave requests before payroll cutoff.', 'leave', 'high', 'todo', 2, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
  (1, 'Verify attendance correction requests', 'Audit late and absent records for this week.', 'attendance', 'medium', 'todo', 2, 1, DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO users
  (id, company_id, employee_code, name, email, password, role, phone, department, designation, hire_date, salary, avatar, status)
VALUES
  (12, 1, 'NX-EMP-009', 'Ayesha Rahman', 'ayesha.rahman@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345009', 'Information Technology', 'Frontend Developer', '2025-01-12', 64000.00, 'AR', 'active'),
  (13, 1, 'NX-EMP-010', 'Tanvir Hasan', 'tanvir.hasan@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345010', 'Information Technology', 'Backend Developer', '2025-02-05', 70000.00, 'TH', 'active'),
  (14, 1, 'NX-EMP-011', 'Nabila Islam', 'nabila.islam@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345011', 'Human Resources', 'HR Executive', '2025-03-10', 52000.00, 'NI', 'active'),
  (15, 1, 'NX-EMP-012', 'Sakib Chowdhury', 'sakib.chowdhury@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345012', 'Finance', 'Payroll Analyst', '2025-04-18', 58000.00, 'SC', 'active'),
  (16, 1, 'NX-EMP-013', 'Maliha Zaman', 'maliha.zaman@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345013', 'Marketing', 'Content Specialist', '2025-05-22', 50000.00, 'MZ', 'active'),
  (17, 1, 'NX-EMP-014', 'Raihan Kabir', 'raihan.kabir@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345014', 'Operations', 'Operations Coordinator', '2025-06-02', 49000.00, 'RK', 'pending');

INSERT INTO user_profile_settings
  (user_id, display_name, date_of_birth, gender, nationality, marital_status, city, country, bio, emergency_contact_name, emergency_contact_phone, blood_group, linkedin_url, language, timezone, theme_preference)
VALUES
  (12, 'Ayesha Rahman', '1997-08-14', 'Female', 'Bangladeshi', 'Single', 'Dhaka', 'Bangladesh', 'Frontend developer focused on accessible HR tools.', 'Farhana Rahman', '+8801711110009', 'B+', 'https://linkedin.com/in/ayesha-rahman', 'English', 'Asia/Dhaka', 'system'),
  (13, 'Tanvir Hasan', '1995-11-03', 'Male', 'Bangladeshi', 'Married', 'Dhaka', 'Bangladesh', 'Backend developer working on HR workflow APIs.', 'Nusrat Hasan', '+8801711110010', 'O+', 'https://linkedin.com/in/tanvir-hasan', 'English', 'Asia/Dhaka', 'dark'),
  (14, 'Nabila Islam', '1998-01-21', 'Female', 'Bangladeshi', 'Single', 'Dhaka', 'Bangladesh', 'HR executive supporting onboarding and employee engagement.', 'Karim Islam', '+8801711110011', 'A+', 'https://linkedin.com/in/nabila-islam', 'English', 'Asia/Dhaka', 'light'),
  (15, 'Sakib Chowdhury', '1994-07-09', 'Male', 'Bangladeshi', 'Married', 'Dhaka', 'Bangladesh', 'Payroll analyst handling monthly payroll checks.', 'Nadia Chowdhury', '+8801711110012', 'AB+', 'https://linkedin.com/in/sakib-chowdhury', 'English', 'Asia/Dhaka', 'system');

INSERT INTO notifications (company_id, user_id, type, title, body, link, is_read)
VALUES
  (1, 12, 'attendance', 'Attendance correction approved', 'Your attendance correction for this week was approved.', '/dashboard/attendance', 0),
  (1, 12, 'training', 'New React training assigned', 'You have been enrolled in Advanced React Patterns.', '/dashboard/training', 0),
  (1, 13, 'task', 'New backend task assigned', 'API audit task has been assigned to you.', '/dashboard/my-tasks', 0),
  (1, 14, 'onboarding', 'New onboarding case created', 'Please prepare onboarding tasks for Raihan Kabir.', '/dashboard/onboarding', 0),
  (1, 15, 'payroll', 'Payroll review required', 'Review payroll exceptions before month close.', '/dashboard/payroll', 1),
  (1, 1, 'system', 'CEO review pack ready', 'Reports and analytics snapshot is ready for review.', '/dashboard/reports', 0);

INSERT INTO tasks
  (company_id, title, description, category, priority, status, assigned_to, assigned_by, due_date, completed_at)
VALUES
  (1, 'Prepare onboarding kit for Raihan', 'Collect email access, welcome document, and laptop checklist.', 'onboarding', 'high', 'in_progress', 14, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), NULL),
  (1, 'Review payroll variance', 'Check overtime and deduction variance for current month.', 'expense', 'urgent', 'todo', 15, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL),
  (1, 'Update employee handbook FAQ', 'Add updated leave and attendance questions.', 'general', 'medium', 'completed', 14, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), NOW()),
  (1, 'Complete backend API audit', 'Review role-based access for payroll and CV routes.', 'custom', 'high', 'todo', 13, 1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), NULL),
  (1, 'Submit content calendar', 'Upload next month recruitment content calendar.', 'custom', 'medium', 'todo', 16, 2, DATE_ADD(CURDATE(), INTERVAL 6 DAY), NULL);

INSERT INTO access_requests
  (user_id, permission_id, reason, status, reviewed_by, reviewed_at)
VALUES
  (14, (SELECT id FROM permissions WHERE code = 'employees.view_all'), 'Need directory access for onboarding coordination.', 'approved', 1, NOW()),
  (15, (SELECT id FROM permissions WHERE code = 'payroll.view_all'), 'Need payroll data for monthly variance review.', 'pending', NULL, NULL),
  (13, (SELECT id FROM permissions WHERE code = 'reports.view'), 'Need analytics access for API dashboard work.', 'rejected', 1, NOW());

INSERT INTO attendance
  (user_id, work_date, clock_in, clock_out, status, notes)
VALUES
  (12, CURDATE(), CONCAT(CURDATE(), ' 09:01:00'), CONCAT(CURDATE(), ' 18:00:00'), 'present', 'Regular shift'),
  (13, CURDATE(), CONCAT(CURDATE(), ' 09:18:00'), CONCAT(CURDATE(), ' 18:20:00'), 'late', 'Code deployment support'),
  (14, CURDATE(), CONCAT(CURDATE(), ' 08:56:00'), CONCAT(CURDATE(), ' 17:50:00'), 'present', 'Regular shift'),
  (15, CURDATE(), NULL, NULL, 'leave', 'Payroll workshop leave'),
  (16, CURDATE(), NULL, NULL, 'absent', 'No attendance recorded'),
  (12, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:04:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:58:00'), 'present', NULL),
  (13, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:59:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:10:00'), 'present', NULL),
  (14, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:27:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:00:00'), 'late', 'Traffic delay'),
  (15, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:02:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 17:55:00'), 'present', NULL),
  (16, DATE_SUB(CURDATE(), INTERVAL 1 DAY), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:08:00'), CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:02:00'), 'present', NULL);

INSERT INTO leave_requests
  (user_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at)
VALUES
  (12, 'Casual Leave', DATE_ADD(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'Personal appointment', 'pending', NULL, NULL),
  (13, 'Annual Leave', DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'Family travel', 'approved', 2, NOW()),
  (16, 'Sick Leave', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Medical rest', 'rejected', 2, NOW());

INSERT INTO payroll
  (user_id, pay_period, basic_salary, allowances, deductions, net_pay, status)
VALUES
  (12, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 64000.00, 4000.00, 1200.00, 66800.00, 'processed'),
  (13, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 70000.00, 4500.00, 1500.00, 73000.00, 'paid'),
  (14, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 52000.00, 2500.00, 800.00, 53700.00, 'draft'),
  (15, DATE_FORMAT(CURDATE(), '%Y-%m-01'), 58000.00, 3000.00, 1000.00, 60000.00, 'processed');

INSERT INTO training_sessions
  (id, company_id, title, description, trainer, starts_at, ends_at)
VALUES
  (3, 1, 'Advanced React Patterns', 'Hands-on training for component architecture and reusable hooks.', 'Engineering Guild', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 3 HOUR),
  (4, 1, 'Payroll Compliance', 'Monthly payroll controls, compliance, and exception handling.', 'Finance Ops', DATE_ADD(NOW(), INTERVAL 9 DAY), DATE_ADD(NOW(), INTERVAL 9 DAY) + INTERVAL 2 HOUR),
  (5, 1, 'Inclusive Interviewing', 'Structured hiring and fair evaluation practices.', 'People Ops', DATE_ADD(NOW(), INTERVAL 12 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY) + INTERVAL 2 HOUR);

INSERT INTO training_enrollments
  (training_id, user_id, status, progress)
VALUES
  (3, 12, 'enrolled', 40),
  (3, 13, 'enrolled', 15),
  (4, 15, 'enrolled', 60),
  (5, 14, 'completed', 100),
  (5, 2, 'completed', 100);

INSERT INTO training_certificates
  (enrollment_id, certificate_code, issued_by)
SELECT id, CONCAT('CERT-DEMO-', LPAD(id, 4, '0')), 2
FROM training_enrollments
WHERE status = 'completed'
  AND id NOT IN (SELECT enrollment_id FROM training_certificates);

INSERT INTO lifecycle_cases
  (company_id, user_id, type, status, start_date, target_date, completed_at, created_by)
VALUES
  (1, 17, 'onboarding', 'in_progress', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, 2),
  (1, 16, 'offboarding', 'not_started', DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), NULL, 1);

INSERT INTO lifecycle_tasks
  (company_id, case_id, step_id, title, status, due_date, completed_by, completed_at)
SELECT 1, lc.id, ls.id, CONCAT(ls.title, ' - ', u.name),
  CASE WHEN ls.step_order = 1 THEN 'completed' WHEN ls.step_order = 2 THEN 'in_progress' ELSE 'pending' END,
  DATE_ADD(CURDATE(), INTERVAL ls.step_order DAY),
  CASE WHEN ls.step_order = 1 THEN 14 ELSE NULL END,
  CASE WHEN ls.step_order = 1 THEN NOW() ELSE NULL END
FROM lifecycle_cases lc
JOIN users u ON u.id = lc.user_id
JOIN lifecycle_steps ls ON ls.company_id = lc.company_id AND ls.type = lc.type
WHERE lc.user_id IN (16, 17);

INSERT INTO performance_reviews
  (user_id, reviewer_id, review_period, score, goals, feedback, status)
VALUES
  (12, 2, 'Q2 2026', 4.20, 'Improve frontend accessibility and mentor junior developers.', 'Strong UI ownership and reliable sprint delivery.', 'submitted'),
  (13, 1, 'Q2 2026', 4.60, 'Strengthen API observability and reduce production incidents.', 'Excellent backend design and incident response.', 'approved'),
  (14, 2, 'Q2 2026', 3.90, 'Improve onboarding documentation turnaround.', 'Good stakeholder coordination.', 'draft');

INSERT INTO peer_reviews
  (reviewee_id, reviewer_id, project, duration, review_text, communication_rating, technical_rating, teamwork_rating, leadership_rating, strengths, improvements, is_anonymous, status, review_date)
VALUES
  (12, 13, 'Employee Dashboard Refresh', '2 months', 'Ayesha improved dashboard usability and kept feedback loops short.', 4, 5, 5, 3, JSON_ARRAY('Accessible UI', 'Fast iteration', 'Good ownership'), JSON_ARRAY('Share more implementation notes'), FALSE, 'approved', DATE_SUB(CURDATE(), INTERVAL 9 DAY)),
  (13, 12, 'API Stabilization', '3 months', 'Tanvir handled API fixes carefully and documented edge cases well.', 4, 5, 4, 4, JSON_ARRAY('API design', 'Incident handling'), JSON_ARRAY('Earlier stakeholder updates'), TRUE, 'submitted', DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
  (14, 15, 'Onboarding SOP', '1 month', 'Nabila helped standardize onboarding tasks and reminders.', 5, 3, 5, 4, JSON_ARRAY('Communication', 'Process clarity'), JSON_ARRAY('Use more automation'), FALSE, 'submitted', DATE_SUB(CURDATE(), INTERVAL 4 DAY));

INSERT INTO cv_candidates
  (company_id, name, email, phone, position, score, skills, experience, education, match_percentage, status, key_strengths, concerns, cv_file_path, uploaded_by, upload_date)
VALUES
  (1, 'Sadia Akter', 'sadia.akter@example.com', '+8801711200001', 'Frontend Developer', 91, JSON_ARRAY('React', 'TypeScript', 'Tailwind', 'Accessibility'), 5.0, 'B.Sc. CSE - AIUB', 91, 'shortlisted', JSON_ARRAY('Strong React portfolio', 'Accessibility experience'), JSON_ARRAY(), NULL, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
  (1, 'Imran Hossain', 'imran.hossain@example.com', '+8801711200002', 'Backend Developer', 87, JSON_ARRAY('Node.js', 'MySQL', 'Redis', 'Docker'), 6.0, 'B.Sc. CSE - NSU', 87, 'pending', JSON_ARRAY('Backend API experience', 'Database optimization'), JSON_ARRAY('Limited cloud experience'), NULL, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
  (1, 'Farzana Noor', 'farzana.noor@example.com', '+8801711200003', 'HR Executive', 76, JSON_ARRAY('Recruitment', 'Onboarding', 'Excel', 'Communication'), 4.0, 'BBA HRM - University of Dhaka', 76, 'pending', JSON_ARRAY('Strong onboarding knowledge'), JSON_ARRAY('Less HRIS exposure'), NULL, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
  (1, 'Nayeem Ahmed', 'nayeem.ahmed@example.com', '+8801711200004', 'Accounts Officer', 65, JSON_ARRAY('Excel', 'Accounting'), 2.0, 'BBA Accounting - BRAC University', 65, 'rejected', JSON_ARRAY('Accounting fundamentals'), JSON_ARRAY('Below preferred experience', 'Missing payroll skills'), NULL, 2, CURDATE());

INSERT INTO expenses
  (user_id, category, amount, expense_date, description, receipt_path, status, reviewed_by)
VALUES
  (12, 'Software', 3200.00, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Design tool subscription for frontend work', NULL, 'pending', NULL),
  (13, 'Travel', 1800.00, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'Client-side deployment visit transport', NULL, 'approved', 2),
  (14, 'Office Supplies', 950.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Onboarding stationery pack', NULL, 'paid', 2),
  (15, 'Training', 4500.00, DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'Payroll compliance seminar registration', NULL, 'rejected', 1);

INSERT INTO expense_payments
  (expense_id, amount, payment_date, method, reference, paid_by)
SELECT id, amount, CURDATE(), 'Bank Transfer', CONCAT('PAY-EXP-', LPAD(id, 4, '0')), 2
FROM expenses
WHERE status = 'paid'
  AND id NOT IN (SELECT expense_id FROM expense_payments);

INSERT INTO project_tasks
  (title, description, status, priority, assignee, assignee_avatar, deadline, project, tags, estimated_hours, comments, attachments)
VALUES
  ('Role Audit Report', 'Prepare permission audit report for Admin and HR access.', 'todo', 'high', 'Tanvir Hasan', 'TH', DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'User Portal', '["Security","Roles"]', 12.00, 1, 0),
  ('Training Course UI Polish', 'Improve training material and class time display.', 'in-review', 'medium', 'Ayesha Rahman', 'AR', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Website Redesign', '["Frontend","Training"]', 8.00, 2, 1),
  ('Payroll Exception Dashboard', 'Create payroll exception summary cards.', 'todo', 'high', 'Sakib Chowdhury', 'SC', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'User Portal', '["Payroll","Analytics"]', 10.00, 0, 0);

INSERT INTO projects
  (id, name, description, owner_id, status, start_date, end_date)
VALUES
  (3, 'HR Automation', 'Automations for onboarding, access requests, and reminders.', 2, 'active', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 45 DAY)),
  (4, 'Payroll Controls', 'Payroll review and compliance improvement project.', 1, 'planning', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY));

INSERT INTO project_members
  (project_id, user_id, role)
VALUES
  (3, 2, 'Project Owner'),
  (3, 12, 'Frontend Developer'),
  (3, 13, 'Backend Developer'),
  (3, 14, 'HR Coordinator'),
  (4, 1, 'Executive Sponsor'),
  (4, 15, 'Payroll Analyst');

INSERT INTO project_milestones
  (project_id, title, due_date, status)
VALUES
  (3, 'Workflow Mapping Complete', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'in-progress'),
  (3, 'Automation Pilot Launch', DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'pending'),
  (4, 'Payroll Risk Checklist', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'pending');

INSERT INTO project_comments
  (task_id, user_id, body)
SELECT id, 13, 'Initial scope reviewed. Waiting for permission matrix confirmation.'
FROM project_tasks
WHERE title = 'Role Audit Report'
LIMIT 1;

INSERT INTO forum_posts
  (user_id, title, body, category, is_anonymous, anonymous_alias, anonymous_color, tags, sentiment, is_poll, poll_data, views, status, moderation_note)
VALUES
  (14, 'Onboarding checklist improvements', 'Please share ideas to improve the new employee onboarding checklist.', 'HR', FALSE, NULL, NULL, JSON_ARRAY('onboarding', 'process'), 'positive', FALSE, NULL, 38, 'published', NULL),
  (12, 'Preferred frontend documentation format', 'Which format helps you understand frontend handoffs faster?', 'Engineering', FALSE, NULL, NULL, JSON_ARRAY('docs', 'frontend'), 'neutral', TRUE, JSON_OBJECT('question', 'Preferred format?', 'options', JSON_ARRAY('Markdown', 'Short video', 'Checklist')), 64, 'published', NULL),
  (NULL, 'Anonymous workplace concern', 'Can we improve meeting schedules during payroll week?', 'General', TRUE, 'River', '#7C5FB5', JSON_ARRAY('meetings', 'workload'), 'concerned', FALSE, NULL, 22, 'flagged', 'Needs HR review');

INSERT INTO forum_replies
  (post_id, parent_reply_id, user_id, body, is_anonymous, anonymous_alias, anonymous_color, status)
VALUES
  (3, NULL, 2, 'Good idea. We can add IT setup ownership and deadline reminders.', FALSE, NULL, NULL, 'published'),
  (4, NULL, 13, 'Markdown plus a short checklist works best for engineering handoffs.', FALSE, NULL, NULL, 'published'),
  (5, NULL, 14, 'Thanks for raising this. HR will review payroll-week meeting load.', FALSE, NULL, NULL, 'published');

INSERT INTO forum_reactions
  (target_type, target_id, user_id, reaction)
VALUES
  ('post', 3, 12, 'helpful'),
  ('post', 3, 13, 'like'),
  ('post', 4, 14, 'heart'),
  ('reply', 2, 12, 'like');

INSERT INTO forum_reports
  (target_type, target_id, reporter_id, reason, notes, status, action_taken, reviewed_by, reviewed_at)
VALUES
  ('post', 5, 15, 'Workload concern needs HR review', 'Anonymous post should be reviewed by HR.', 'pending', NULL, NULL, NULL),
  ('reply', 3, 1, 'Reviewed HR reply', 'Reply is constructive and can remain visible.', 'reviewed', 'No action needed', 1, NOW());
