USE hrspace;

INSERT INTO users (name, email, password, role, department, designation, hire_date)
VALUES
  ('Admin User', 'admin@hrms.com', '$2a$10$7IAQrKRQwkIHv2eZSIRDj.S1O0ove29.KjCkCXD3369iJk9dTKngi', 'admin', 'Operations', 'System Admin', '2024-01-01'),
  ('HR Manager', 'hr@hrms.com', '$2a$10$cteqOigYNxjG6l8d.G7tNOSlBprtlBiCUvj03ljajfV.0CMwhd.Uq', 'hr_manager', 'Human Resources', 'HR Manager', '2024-02-01'),
  ('Employee User', 'employee@hrms.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', 'Engineering', 'Software Engineer', '2024-03-01')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO training_sessions (title, description, starts_at)
VALUES ('Workplace Safety', 'Quarterly safety training', DATE_ADD(NOW(), INTERVAL 7 DAY));

INSERT INTO forum_posts
  (user_id, title, body, category, is_anonymous, anonymous_alias, anonymous_color, tags, sentiment, views)
VALUES
  (2, 'Welcome to HRSpace', 'Use this forum for HR questions, announcements, and team discussions.', 'Announcement', FALSE, 'Owl', '#7C5FB5', JSON_ARRAY('announcement', 'hr'), 'positive', 124),
  (3, 'Remote work equipment request', 'What is the process for requesting an extra monitor?', 'General', TRUE, 'Panda', '#9A77CF', JSON_ARRAY('equipment', 'remote-work'), 'neutral', 57);

INSERT INTO forum_replies
  (post_id, user_id, body, is_anonymous, anonymous_alias, anonymous_color)
VALUES
  (2, 2, 'Please submit an expense request with the quotation attached.', FALSE, 'Owl', '#7C5FB5');
