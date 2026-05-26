USE hrspace;

INSERT INTO users (name, email, password, role, department, designation, hire_date)
VALUES
  ('Admin User', 'admin@hrms.com', '$2a$10$7IAQrKRQwkIHv2eZSIRDj.S1O0ove29.KjCkCXD3369iJk9dTKngi', 'admin', 'Operations', 'System Admin', '2024-01-01'),
  ('HR Manager', 'hr@hrms.com', '$2a$10$cteqOigYNxjG6l8d.G7tNOSlBprtlBiCUvj03ljajfV.0CMwhd.Uq', 'hr_manager', 'Human Resources', 'HR Manager', '2024-02-01'),
  ('Employee User', 'employee@hrms.com', '$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy', 'employee', 'Engineering', 'Software Engineer', '2024-03-01')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO training_sessions (title, description, starts_at)
VALUES ('Workplace Safety', 'Quarterly safety training', DATE_ADD(NOW(), INTERVAL 7 DAY));
