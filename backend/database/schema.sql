CREATE DATABASE IF NOT EXISTS hrspace;
USE hrspace;

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  domain VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS attendance (
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

CREATE TABLE IF NOT EXISTS leave_requests (
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

CREATE TABLE IF NOT EXISTS payroll (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pay_period DATE NOT NULL,
  basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  allowances DECIMAL(12, 2) NOT NULL DEFAULT 0,
  deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
  net_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_sessions (
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

CREATE TABLE IF NOT EXISTS training_enrollments (
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

CREATE TABLE IF NOT EXISTS training_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT NOT NULL,
  certificate_code VARCHAR(80) NOT NULL UNIQUE,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  issued_by INT,
  UNIQUE KEY unique_enrollment_certificate (enrollment_id),
  FOREIGN KEY (enrollment_id) REFERENCES training_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lifecycle_cases (
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

CREATE TABLE IF NOT EXISTS lifecycle_steps (
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

CREATE TABLE IF NOT EXISTS lifecycle_tasks (
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

CREATE TABLE IF NOT EXISTS performance_reviews (
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

CREATE TABLE IF NOT EXISTS peer_reviews (
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

CREATE TABLE IF NOT EXISTS cv_candidates (
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

CREATE TABLE IF NOT EXISTS forum_posts (
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

CREATE TABLE IF NOT EXISTS forum_replies (
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

CREATE TABLE IF NOT EXISTS forum_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('post', 'reply') NOT NULL,
  target_id INT NOT NULL,
  user_id INT NOT NULL,
  reaction ENUM('like', 'heart', 'helpful') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_forum_reaction (target_type, target_id, user_id, reaction),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_reports (
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

CREATE TABLE IF NOT EXISTS user_profile_settings (
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

CREATE TABLE IF NOT EXISTS notifications (
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

CREATE TABLE IF NOT EXISTS tasks (
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

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  is_system TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(80) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
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

CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(80) NOT NULL DEFAULT 'Member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_project_member (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending', 'in-progress', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('todo', 'in-progress', 'in-review', 'completed') NOT NULL DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  assigned_to INT,
  assignee VARCHAR(120) NOT NULL,
  assignee_avatar VARCHAR(8),
  deadline DATE NOT NULL,
  project VARCHAR(120) NOT NULL,
  tags TEXT,
  estimated_hours DECIMAL(6, 2),
  comments INT NOT NULL DEFAULT 0,
  attachments INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS work_breakdown_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  nodes_json JSON NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS job_circulars (
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

CREATE TABLE IF NOT EXISTS job_applications (
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

CREATE TABLE IF NOT EXISTS audit_logs (
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

CREATE TABLE IF NOT EXISTS user_documents (
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
