CREATE DATABASE IF NOT EXISTS hrspace;
USE hrspace;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'hr_manager', 'employee') NOT NULL DEFAULT 'employee',
  phone VARCHAR(40),
  department VARCHAR(100),
  designation VARCHAR(100),
  hire_date DATE,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  title VARCHAR(160) NOT NULL,
  description TEXT,
  starts_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
