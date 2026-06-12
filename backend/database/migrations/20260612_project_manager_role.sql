USE hrspace;

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'hr_manager', 'project_manager', 'employee')
  NOT NULL DEFAULT 'employee';

INSERT INTO users
  (id, company_id, employee_code, name, email, password, role, phone, department, designation, hire_date, salary, avatar, status)
VALUES
  (18, 1, 'NX-PM-001', 'Project Manager 01', 'pm01@nexoratech.com', '$2a$10$SKnkZVhCR5vH6phZVFL/3O5wF31zxgK7WZlxoz2gttFAj4x9ONdKS', 'project_manager', '+8801712345699', 'Project Management', 'Project Manager', '2025-09-01', 98000.00, 'PM', 'active')
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role = VALUES(role),
  department = VALUES(department),
  designation = VALUES(designation),
  status = 'active';

UPDATE users
SET role = 'project_manager',
    password = '$2a$10$SKnkZVhCR5vH6phZVFL/3O5wF31zxgK7WZlxoz2gttFAj4x9ONdKS',
    employee_code = 'NX-PM-001',
    department = 'Project Management',
    designation = 'Project Manager'
WHERE email IN ('pm01@nexoratech.com', 'project.manager@nexoratech.com');

INSERT INTO roles (code, name, description, is_system)
VALUES
  ('project_manager', 'Project Manager', 'Project, WBS, task delivery, history, and reporting management.', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_system = 1;

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
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  description = VALUES(description);

DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code IN ('admin', 'hr_manager')
  AND p.code IN (
    'projects.read', 'projects.create', 'projects.update', 'projects.delete',
    'wbs.read', 'wbs.create', 'wbs.update', 'wbs.delete',
    'project_history.read', 'project_reports.read',
    'project_tasks.assign', 'project_tasks.update'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'projects.overview'
WHERE r.code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'dashboard.project.view',
  'projects.read', 'projects.create', 'projects.update', 'projects.delete',
  'wbs.read', 'wbs.create', 'wbs.update', 'wbs.delete',
  'project_history.read', 'project_reports.read',
  'project_tasks.assign', 'project_tasks.update'
)
WHERE r.code = 'project_manager';

CREATE TABLE IF NOT EXISTS work_breakdown_structures (
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
  document_type VARCHAR(80) NOT NULL,
  document_name VARCHAR(180) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
