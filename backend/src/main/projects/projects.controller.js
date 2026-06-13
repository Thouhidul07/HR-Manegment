const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { logAudit } = require("../../utils/auditLogger");

function auditFromRequest(req, action, entityType, entityId, description, metadata = {}) {
  return logAudit({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action,
    module: "Project Management",
    entityType,
    entityId,
    description,
    metadata,
    ipAddress: req.ip,
  });
}

async function columnExists(table, column) {
  const [rows] = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function ensureProjectTasksTable() {
  await query(`
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
    )
  `);
  await addColumnIfMissing("project_tasks", "assigned_to", "INT NULL");
  await query(`
    UPDATE project_tasks pt
    JOIN users u ON u.name = pt.assignee
    SET pt.assigned_to = u.id
    WHERE pt.assigned_to IS NULL
  `);
}

async function ensureProjectManagementTables() {
  await query(`
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
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS project_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      user_id INT NOT NULL,
      role VARCHAR(80) NOT NULL DEFAULT 'Member',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_project_member (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS project_milestones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      title VARCHAR(160) NOT NULL,
      due_date DATE NOT NULL,
      status ENUM('pending', 'in-progress', 'completed') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS project_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      user_id INT,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await query(`
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
    )
  `);
}

async function seedProjectsFromTasks() {
  await ensureProjectManagementTables();
  const [projectNames] = await query("SELECT DISTINCT project FROM project_tasks");

  for (const row of projectNames) {
    await query(
      `INSERT INTO projects (name, description, owner_id, status)
       VALUES (?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE name = name`,
      [row.project, `${row.project} delivery workspace`, null]
    );
  }
}

async function seedProjectTasksIfEmpty() {
  return;
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapTask(row) {
  const assignee = row.assignee_name || row.assignee || "Unassigned";
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to || null,
    assignee,
    assigneeAvatar: row.assignee_avatar || (assignee === "Unassigned" ? "" : initials(assignee)),
    deadline: row.deadline,
    createdDate: row.created_at,
    tags: row.tags ? JSON.parse(row.tags) : [],
    comments: Number(row.comments || 0),
    attachments: Number(row.attachments || 0),
    project: row.project,
    estimatedHours: row.estimated_hours ? String(row.estimated_hours) : "",
  };
}

function mapProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    owner: row.owner_name || null,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    members: Number(row.members || 0),
    milestones: Number(row.milestones || 0),
    tasks: Number(row.tasks || 0),
    completedTasks: Number(row.completed_tasks || 0),
  };
}

const listProjects = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await seedProjectsFromTasks();

  const [projects] = await query(
    `SELECT p.*, owner.name AS owner_name,
      COUNT(DISTINCT pm.id) AS members,
      COUNT(DISTINCT ms.id) AS milestones,
      COUNT(DISTINCT pt.id) AS tasks,
      COUNT(DISTINCT CASE WHEN pt.status = 'completed' THEN pt.id END) AS completed_tasks
     FROM projects p
     LEFT JOIN users owner ON owner.id = p.owner_id
     LEFT JOIN project_members pm ON pm.project_id = p.id
     LEFT JOIN project_milestones ms ON ms.project_id = p.id
     LEFT JOIN project_tasks pt ON pt.project = p.name
     GROUP BY p.id
     ORDER BY p.created_at DESC`
  );

  res.json({ projects: projects.map(mapProject) });
});

const createProject = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await ensureProjectManagementTables();
  const [result] = await query(
    `INSERT INTO projects (name, description, owner_id, status, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.body.name,
      req.body.description || null,
      req.body.ownerId || req.user.id,
      req.body.status || "active",
      req.body.startDate || null,
      req.body.endDate || null,
    ]
  );

  const [rows] = await query(
    `SELECT p.*, owner.name AS owner_name, 0 AS members, 0 AS milestones, 0 AS tasks, 0 AS completed_tasks
     FROM projects p
     LEFT JOIN users owner ON owner.id = p.owner_id
     WHERE p.id = ?`,
    [result.insertId]
  );

  await auditFromRequest(req, "project_created", "project", result.insertId, "Created project " + req.body.name);
  res.status(201).json({ project: mapProject(rows[0]) });
});

const updateProject = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const fields = [];
  const params = [];
  const allowed = {
    name: "name",
    description: "description",
    ownerId: "owner_id",
    status: "status",
    startDate: "start_date",
    endDate: "end_date",
  };

  for (const [key, column] of Object.entries(allowed)) {
    if (req.body[key] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(req.body[key] || null);
    }
  }

  if (!fields.length) return res.status(400).json({ message: "No project updates provided" });

  params.push(req.params.id);
  const [result] = await query(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`, params);
  if (!result.affectedRows) return res.status(404).json({ message: "Project not found" });

  const [rows] = await query(
    `SELECT p.*, owner.name AS owner_name, 0 AS members, 0 AS milestones,
            (SELECT COUNT(*) FROM project_tasks pt WHERE pt.project = p.name) AS tasks,
            (SELECT COUNT(*) FROM project_tasks pt WHERE pt.project = p.name AND pt.status = 'completed') AS completed_tasks
     FROM projects p LEFT JOIN users owner ON owner.id = p.owner_id WHERE p.id = ?`,
    [req.params.id]
  );
  await auditFromRequest(req, "project_updated", "project", req.params.id, "Updated project " + rows[0].name, { fields: Object.keys(req.body) });
  res.json({ project: mapProject(rows[0]) });
});

const deleteProject = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [projects] = await query("SELECT name FROM projects WHERE id = ?", [req.params.id]);
  if (!projects.length) return res.status(404).json({ message: "Project not found" });

  await query("DELETE FROM project_tasks WHERE project = ?", [projects[0].name]);
  await query("DELETE FROM projects WHERE id = ?", [req.params.id]);
  await auditFromRequest(req, "project_deleted", "project", req.params.id, "Deleted project " + projects[0].name);
  res.json({ message: "Project deleted" });
});

const listTasks = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  const [tasks] = await query(`
    SELECT pt.*, u.name AS assignee_name
    FROM project_tasks pt
    LEFT JOIN users u ON u.id = pt.assigned_to
    ORDER BY pt.created_at DESC
  `);
  res.json({ tasks: tasks.map(mapTask) });
});

const getProjectStats = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  const [statusRows] = await query(
    `SELECT status, COUNT(*) AS total
     FROM project_tasks
     GROUP BY status`
  );
  const [projectRows] = await query(
    `SELECT project,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN deadline < CURDATE() AND status <> 'completed' THEN 1 ELSE 0 END) AS overdue
     FROM project_tasks
     GROUP BY project
     ORDER BY project`
  );

  res.json({
    byStatus: statusRows.reduce((stats, row) => {
      stats[row.status] = Number(row.total);
      return stats;
    }, {}),
    projects: projectRows.map((row) => ({
      name: row.project,
      total: Number(row.total),
      completed: Number(row.completed || 0),
      overdue: Number(row.overdue || 0),
    })),
  });
});

const getAdminOverview = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await seedProjectsFromTasks();

  const [[projectCounts], [overdueRows], [activityRows], [managerRows]] = await Promise.all([
    query(`SELECT COUNT(*) AS total,
                  SUM(status = 'active') AS active,
                  SUM(status = 'completed') AS completed
           FROM projects`),
    query("SELECT COUNT(*) AS overdue FROM project_tasks WHERE deadline < CURDATE() AND status <> 'completed'"),
    query(`SELECT id, title, project, status, updated_at
           FROM project_tasks ORDER BY updated_at DESC LIMIT 6`),
    query(`SELECT u.id, u.name, u.email,
                  COUNT(DISTINCT p.id) AS projects,
                  COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) AS active_projects
           FROM users u
           LEFT JOIN projects p ON p.owner_id = u.id
           WHERE u.role = 'project_manager' AND u.status = 'active'
           GROUP BY u.id, u.name, u.email ORDER BY u.name`),
  ]);

  res.json({
    totalProjects: Number(projectCounts[0]?.total || 0),
    activeProjects: Number(projectCounts[0]?.active || 0),
    completedProjects: Number(projectCounts[0]?.completed || 0),
    overdueTasks: Number(overdueRows[0]?.overdue || 0),
    recentActivity: activityRows.map((row) => ({
      id: row.id,
      title: row.title,
      project: row.project,
      status: row.status,
      updatedAt: row.updated_at,
    })),
    projectManagers: managerRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      projects: Number(row.projects || 0),
      activeProjects: Number(row.active_projects || 0),
    })),
  });
});

const getProjectHistory = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await seedProjectsFromTasks();
  const [projects] = await query(
    `SELECT p.*, owner.name AS owner_name,
            COUNT(pt.id) AS tasks,
            SUM(pt.status = 'completed') AS completed_tasks,
            SUM(pt.deadline < CURDATE() AND pt.status <> 'completed') AS overdue_tasks,
            GREATEST(p.updated_at, COALESCE(MAX(pt.updated_at), p.updated_at)) AS last_activity
     FROM projects p
     LEFT JOIN users owner ON owner.id = p.owner_id
     LEFT JOIN project_tasks pt ON pt.project = p.name
     GROUP BY p.id
     ORDER BY last_activity DESC`
  );
  res.json({ projects: projects.map((row) => ({
    ...mapProject({ ...row, members: 0, milestones: 0 }),
    overdueTasks: Number(row.overdue_tasks || 0),
    lastActivity: row.last_activity,
  })) });
});

function mapWbs(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    title: row.title,
    description: row.description || "",
    nodes: typeof row.nodes_json === "string" ? JSON.parse(row.nodes_json) : row.nodes_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const listWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [rows] = await query(
    `SELECT w.*, p.name AS project_name FROM work_breakdown_structures w
     JOIN projects p ON p.id = w.project_id ORDER BY w.updated_at DESC`
  );
  res.json({ workBreakdownStructures: rows.map(mapWbs) });
});

const getWBSById = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [rows] = await query(
    `SELECT w.*, p.name AS project_name FROM work_breakdown_structures w
     JOIN projects p ON p.id = w.project_id WHERE w.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: "WBS not found" });
  res.json({ workBreakdownStructure: mapWbs(rows[0]) });
});

const createWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [result] = await query(
    `INSERT INTO work_breakdown_structures (project_id, title, description, nodes_json, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [req.body.projectId, req.body.title, req.body.description || null, JSON.stringify(req.body.nodes), req.user.id]
  );
  await auditFromRequest(req, "wbs_created", "wbs", result.insertId, "Created WBS " + req.body.title, { projectId: req.body.projectId });
  req.params.id = result.insertId;
  return getWBSById(req, res);
});

const updateWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [result] = await query(
    `UPDATE work_breakdown_structures
     SET project_id = ?, title = ?, description = ?, nodes_json = ? WHERE id = ?`,
    [req.body.projectId, req.body.title, req.body.description || null, JSON.stringify(req.body.nodes), req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "WBS not found" });
  await auditFromRequest(req, "wbs_updated", "wbs", req.params.id, "Updated WBS " + req.body.title, { projectId: req.body.projectId });
  return getWBSById(req, res);
});

const deleteWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [result] = await query("DELETE FROM work_breakdown_structures WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "WBS not found" });
  await auditFromRequest(req, "wbs_deleted", "wbs", req.params.id, "Deleted WBS");
  res.json({ message: "WBS deleted" });
});

const createTask = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  const assignedTo = req.body.assignedTo || req.body.assigned_to;
  if (!assignedTo) {
    return res.status(400).json({ message: "A real assignee user is required" });
  }

  const [users] = await query("SELECT id, name FROM users WHERE id = ? AND status IN ('active', 'inactive')", [assignedTo]);
  if (!users.length) {
    return res.status(400).json({ message: "Assigned user not found" });
  }

  const assignee = users[0].name;
  const assigneeAvatar = initials(assignee);
  const [result] = await query(
    `INSERT INTO project_tasks
      (title, description, status, priority, assigned_to, assignee, assignee_avatar, deadline, project, tags, estimated_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.title,
      req.body.description,
      req.body.status,
      req.body.priority,
      assignedTo,
      assignee,
      assigneeAvatar,
      req.body.deadline,
      req.body.project,
      JSON.stringify(req.body.tags || []),
      req.body.estimatedHours || null,
    ]
  );

  const [rows] = await query(`
    SELECT pt.*, u.name AS assignee_name
    FROM project_tasks pt
    LEFT JOIN users u ON u.id = pt.assigned_to
    WHERE pt.id = ?
  `, [result.insertId]);
  await auditFromRequest(req, "project_task_created", "project_task", result.insertId, "Created project task " + req.body.title, { project: req.body.project });
  res.status(201).json({ task: mapTask(rows[0]) });
});

const updateTask = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  const fields = [];
  const params = [];
  const allowed = {
    title: "title",
    description: "description",
    status: "status",
    priority: "priority",
    deadline: "deadline",
    project: "project",
    estimatedHours: "estimated_hours",
  };

  for (const [bodyKey, column] of Object.entries(allowed)) {
    if (req.body[bodyKey] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(req.body[bodyKey] || null);
    }
  }

  const assignedTo = req.body.assignedTo || req.body.assigned_to;
  if (assignedTo !== undefined) {
    const [users] = await query("SELECT id, name FROM users WHERE id = ? AND status IN ('active', 'inactive')", [assignedTo]);
    if (!users.length) {
      return res.status(400).json({ message: "Assigned user not found" });
    }
    fields.push("assigned_to = ?", "assignee = ?", "assignee_avatar = ?");
    params.push(users[0].id, users[0].name, initials(users[0].name));
  }

  if (req.body.tags !== undefined) {
    fields.push("tags = ?");
    params.push(JSON.stringify(req.body.tags || []));
  }

  if (!fields.length) {
    return res.status(400).json({ message: "No task updates provided" });
  }

  params.push(req.params.id);
  const [result] = await query(`UPDATE project_tasks SET ${fields.join(", ")} WHERE id = ?`, params);

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Task not found" });
  }

  const [rows] = await query(`
    SELECT pt.*, u.name AS assignee_name
    FROM project_tasks pt
    LEFT JOIN users u ON u.id = pt.assigned_to
    WHERE pt.id = ?
  `, [req.params.id]);
  await auditFromRequest(req, "project_task_updated", "project_task", req.params.id, "Updated project task " + rows[0].title, { fields: Object.keys(req.body) });
  res.json({ task: mapTask(rows[0]) });
});

const deleteTask = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  const [result] = await query("DELETE FROM project_tasks WHERE id = ?", [req.params.id]);

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Task not found" });
  }

  await auditFromRequest(req, "project_task_deleted", "project_task", req.params.id, "Deleted project task");
  res.json({ message: "Task deleted" });
});

module.exports = {
  getAdminOverview,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  listTasks,
  getProjectStats,
  getProjectHistory,
  createTask,
  updateTask,
  deleteTask,
  listWBS,
  getWBSById,
  createWBS,
  updateWBS,
  deleteWBS,
};
