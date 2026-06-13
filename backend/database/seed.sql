USE hrspace;

INSERT INTO companies (id, name, domain)
VALUES (1, 'NexoraTech Ltd', 'nexoratech.com')
ON DUPLICATE KEY UPDATE name = VALUES(name), domain = VALUES(domain);

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
  (11, 1, 'NX-EMP-008', 'Employee 08', 'employee08@nexoratech.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', '+8801812345008', 'Administration', 'Administration Executive', '2024-08-08', 56000.00, 'E0'),
  (18, 1, 'NX-PM-001', 'Project Manager 01', 'pm01@nexoratech.com', '$2a$10$54BhZ7nwTM/WLbehFgF4YeyXqWXfGfiIk0WABBG97o701vHXS5xhi', 'project_manager', '+8801712345699', 'Project Management', 'Project Manager', '2025-09-01', 98000.00, 'PM')
ON DUPLICATE KEY UPDATE
  company_id = VALUES(company_id),
  employee_code = VALUES(employee_code),
  name = VALUES(name),
  email = VALUES(email),
  password = VALUES(password),
  role = VALUES(role),
  department = VALUES(department),
  designation = VALUES(designation),
  hire_date = VALUES(hire_date),
  salary = VALUES(salary),
  avatar = VALUES(avatar),
  status = 'active';

INSERT INTO roles (code, name, description, is_system)
VALUES
  ('admin', 'Admin / CEO', 'System administration and read-only organizational oversight.', 1),
  ('hr_manager', 'HR Manager', 'Employee, recruitment, attendance, payroll, and training management.', 1),
  ('project_manager', 'Project Manager', 'Project, WBS, project task, history, and reporting management.', 1),
  ('employee', 'Employee', 'Employee self-service and assigned task access.', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), is_system = 1;

INSERT INTO permissions (code, module, action, description)
VALUES
  ('dashboard.project.view', 'dashboard', 'project_view', 'View the project manager dashboard.'),
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
  ('project_tasks.update', 'project_tasks', 'update', 'Update project tasks.')
ON DUPLICATE KEY UPDATE module = VALUES(module), action = VALUES(action), description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'projects.overview'
WHERE r.code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'dashboard.project.view', 'projects.read', 'projects.create', 'projects.update', 'projects.delete',
  'wbs.read', 'wbs.create', 'wbs.update', 'wbs.delete', 'project_history.read',
  'project_reports.read', 'project_tasks.assign', 'project_tasks.update'
)
WHERE r.code = 'project_manager';

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
  (1, 'offboarding', 5, 'Final Settlement', 'Complete payroll, benefits, and final clearance')
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

INSERT INTO training_sessions (company_id, title, description, trainer, starts_at, ends_at)
VALUES (1, 'Workplace Safety', 'Quarterly safety training', 'HR Team', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO peer_reviews
  (reviewee_id, reviewer_id, project, duration, review_text, communication_rating, technical_rating, teamwork_rating, leadership_rating, strengths, improvements, review_date)
VALUES
  (3, 2, 'HR Portal Enhancement', '3 months', 'Excellent collaboration throughout the project. The code reviews were thorough and constructive.', 4, 5, 5, 4, JSON_ARRAY('Strong technical skills', 'Great team player'), JSON_ARRAY('Share knowledge more in team meetings'), '2026-05-15');

INSERT INTO cv_candidates
  (name, email, phone, position, score, skills, experience, education, match_percentage, status, key_strengths, concerns, upload_date)
VALUES
  ('Mahmudul Karim', 'mahmudul.karim@nexoratech.com', '+8801711122233', 'Software Engineer', 94, JSON_ARRAY('React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'PostgreSQL'), 7, 'M.S. Computer Science - BUET', 94, 'shortlisted', JSON_ARRAY('Matched react', 'Matched node.js', 'Matched typescript'), JSON_ARRAY(), '2026-05-28');

INSERT INTO forum_posts
  (user_id, title, body, category, is_anonymous, anonymous_alias, anonymous_color, tags, sentiment, views)
VALUES
  (2, 'Welcome to HRSpace', 'Use this forum for HR questions, announcements, and team discussions.', 'Announcement', FALSE, 'Owl', '#7C5FB5', JSON_ARRAY('announcement', 'hr'), 'positive', 124),
  (3, 'Office equipment request', 'What is the process for requesting an extra monitor at the Dhaka office?', 'General', TRUE, 'Panda', '#9A77CF', JSON_ARRAY('equipment', 'dhaka-office'), 'neutral', 57);

INSERT INTO forum_replies
  (post_id, user_id, body, is_anonymous, anonymous_alias, anonymous_color)
VALUES
  (2, 2, 'Please submit an expense request with the quotation attached.', FALSE, 'Owl', '#7C5FB5');

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

INSERT INTO tasks (company_id, title, description, category, priority, status, assigned_to, assigned_by, due_date)
VALUES 
  (1, 'Complete Safety Compliance training', 'Review and complete safety policies.', 'training', 'medium', 'todo', 3, 1, DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
  (1, 'Submit Q1 performance feedback', 'Submit peer reviews for IT team members.', 'performance', 'high', 'in_progress', 3, 2, DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
  (1, 'Refactor dashboard charts', 'Update charts to support interactive legends.', 'custom', 'low', 'todo', 3, 3, DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
  (1, 'Review recruitment pipeline', 'Review CV filter candidates for backend engineers.', 'general', 'urgent', 'in_progress', 2, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY));
