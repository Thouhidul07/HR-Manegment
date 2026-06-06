USE hrspace;

INSERT INTO users (name, email, password, role, department, designation, hire_date)
VALUES
  ('System Admin', 'admin@hrms.com', '$2a$10$7IAQrKRQwkIHv2eZSIRDj.S1O0ove29.KjCkCXD3369iJk9dTKngi', 'admin', 'System Administration', 'Administrator', '2024-01-01'),
  ('Farhana Akter', 'hr@hrms.com', '$2a$10$cteqOigYNxjG6l8d.G7tNOSlBprtlBiCUvj03ljajfV.0CMwhd.Uq', 'hr_manager', 'Human Resources', 'HR Manager', '2024-02-01'),
  ('Tanvir Hasan', 'employee@hrms.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', 'Information Technology', 'Software Engineer', '2024-03-01')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO training_sessions (title, description, starts_at)
VALUES ('Workplace Safety', 'Quarterly safety training', DATE_ADD(NOW(), INTERVAL 7 DAY));

INSERT INTO peer_reviews
  (reviewee_id, reviewer_id, project, duration, review_text, communication_rating, technical_rating, teamwork_rating, leadership_rating, strengths, improvements, review_date)
VALUES
  (3, 2, 'HR Portal Enhancement', '3 months', 'Excellent collaboration throughout the project. The code reviews were thorough and constructive.', 4, 5, 5, 4, JSON_ARRAY('Strong technical skills', 'Great team player'), JSON_ARRAY('Share knowledge more in team meetings'), '2026-05-15');

INSERT INTO cv_candidates
  (name, email, phone, position, score, skills, experience, education, match_percentage, status, key_strengths, concerns, upload_date)
VALUES
  ('Mahmudul Karim', 'mahmudul.karim@hrspace.local', '+8801711122233', 'Software Engineer', 94, JSON_ARRAY('React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'PostgreSQL'), 7, 'M.S. Computer Science - BUET', 94, 'shortlisted', JSON_ARRAY('Matched react', 'Matched node.js', 'Matched typescript'), JSON_ARRAY(), '2026-05-28');

INSERT INTO forum_posts
  (user_id, title, body, category, is_anonymous, anonymous_alias, anonymous_color, tags, sentiment, views)
VALUES
  (2, 'Welcome to HRSpace', 'Use this forum for HR questions, announcements, and team discussions.', 'Announcement', FALSE, 'Owl', '#7C5FB5', JSON_ARRAY('announcement', 'hr'), 'positive', 124),
  (3, 'Office equipment request', 'What is the process for requesting an extra monitor at the Dhaka office?', 'General', TRUE, 'Panda', '#9A77CF', JSON_ARRAY('equipment', 'dhaka-office'), 'neutral', 57);

INSERT INTO forum_replies
  (post_id, user_id, body, is_anonymous, anonymous_alias, anonymous_color)
VALUES
  (2, 2, 'Please submit an expense request with the quotation attached.', FALSE, 'Owl', '#7C5FB5');
