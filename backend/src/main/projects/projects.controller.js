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

function parseAuditMetadata(value) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
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
    )
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
    )
  `);

  const requiredColumns = [
    ["parent_id", "INT NULL"],
    ["assigned_to", "INT NULL"],
    ["status", "ENUM('todo', 'in-progress', 'in-review', 'completed') NOT NULL DEFAULT 'todo'"],
    ["priority", "ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium'"],
    ["start_date", "DATE NULL"],
    ["due_date", "DATE NULL"],
    ["progress", "TINYINT UNSIGNED NOT NULL DEFAULT 0"],
  ];

  for (const [column, definition] of requiredColumns) {
    const [rows] = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_breakdown_structures' AND COLUMN_NAME = ?`,
      [column]
    );
    if (!rows.length) {
      await query(`ALTER TABLE work_breakdown_structures ADD COLUMN ${column} ${definition}`);
    }
  }

  const [nodesJsonRows] = await query(
    `SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_breakdown_structures' AND COLUMN_NAME = 'nodes_json'`
  );
  if (nodesJsonRows.length && nodesJsonRows[0].IS_NULLABLE === "NO") {
    await query("ALTER TABLE work_breakdown_structures MODIFY nodes_json JSON NULL");
  }
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
  const [[countRow]] = await query("SELECT COUNT(*) AS total FROM project_tasks");

  if (Number(countRow.total) > 0) {
    return;
  }

  const seedTasks = [
    ["Design Homepage Mockup", "Create high-fidelity mockups for the new homepage design", "in-progress", "high", "Emily Rodriguez", "ER", "2026-06-05", "Website Redesign", ["Design", "UI/UX"], null, 3, 2],
    ["Implement Authentication API", "Build JWT-based authentication endpoints with refresh token support", "in-progress", "urgent", "Michael Chen", "MC", "2026-06-03", "User Portal", ["Backend", "Security"], null, 5, 1],
    ["Create Component Library", "Build reusable React components following design system", "todo", "medium", "Sarah Johnson", "SJ", "2026-06-10", "Website Redesign", ["Frontend", "React"], null, 1, 0],
    ["Database Schema Migration", "Update database schema for new user role permissions", "in-review", "high", "David Kim", "DK", "2026-06-02", "User Portal", ["Database", "Backend"], null, 2, 1],
    ["E2E Testing Suite", "Set up end-to-end testing with Cypress for critical user flows", "todo", "medium", "Jessica Martinez", "JM", "2026-06-12", "User Portal", ["Testing", "QA"], null, 0, 0],
    ["Landing Page Optimization", "Improve performance and SEO for landing page", "completed", "low", "Sarah Johnson", "SJ", "2026-05-30", "Website Redesign", ["Frontend", "Performance"], null, 4, 3],
    ["Mobile Responsive Design", "Ensure all pages are mobile-friendly and responsive", "in-progress", "high", "Emily Rodriguez", "ER", "2026-06-07", "Website Redesign", ["Design", "Mobile"], null, 2, 1],
    ["API Documentation", "Write comprehensive API documentation with examples", "todo", "low", "Michael Chen", "MC", "2026-06-15", "User Portal", ["Documentation", "Backend"], null, 0, 0],
  ];

  for (const task of seedTasks) {
    await query(
      `INSERT INTO project_tasks
        (title, description, status, priority, assignee, assignee_avatar, deadline, project, tags, estimated_hours, comments, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [task[0], task[1], task[2], task[3], task[4], task[5], task[6], task[7], JSON.stringify(task[8]), task[9], task[10], task[11]]
    );
  }
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
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    assigneeAvatar: row.assignee_avatar || initials(row.assignee),
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

function rowsToObject(rows, key) {
  return rows.reduce((stats, row) => {
    stats[row[key]] = Number(row.total || 0);
    return stats;
  }, {});
}

function buildReportFilters(queryParams) {
  const conditions = [];
  const params = [];
  const projectConditions = [];
  const projectParams = [];
  const { project, status, assignee, startDate, endDate } = queryParams;

  if (project) {
    conditions.push("p.name = ?");
    params.push(project);
    projectConditions.push("p.name = ?");
    projectParams.push(project);
  }
  if (status) {
    conditions.push("pt.status = ?");
    params.push(status);
  }
  if (assignee) {
    conditions.push("pt.assignee = ?");
    params.push(assignee);
  }
  if (startDate) {
    conditions.push("pt.updated_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("pt.updated_at <= ?");
    params.push(String(endDate).length <= 10 ? String(endDate) + " 23:59:59" : endDate);
  }

  return {
    conditions,
    params,
    projectWhere: projectConditions.length ? "WHERE " + projectConditions.join(" AND ") : "",
    projectParams,
  };
}

async function getProjectReportFilterOptions() {
  const [[projects], [assignees], [statuses]] = await Promise.all([
    query("SELECT name FROM projects ORDER BY name"),
    query("SELECT DISTINCT assignee FROM project_tasks WHERE assignee IS NOT NULL AND assignee <> '' ORDER BY assignee"),
    query("SELECT DISTINCT status FROM project_tasks ORDER BY status"),
  ]);

  return {
    projects: projects.map((row) => row.name),
    assignees: assignees.map((row) => row.assignee),
    statuses: statuses.map((row) => row.status),
  };
}

const listProjects = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await seedProjectTasksIfEmpty();
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
  const [existingProjects] = await query("SELECT * FROM projects WHERE id = ? LIMIT 1", [req.params.id]);
  if (!existingProjects.length) return res.status(404).json({ message: "Project not found" });
  const existingProject = existingProjects[0];
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
  const action = req.body.status !== undefined && req.body.status !== existingProject.status ? "project_status_changed" : "project_updated";
  await auditFromRequest(req, action, "project", req.params.id, "Updated project " + rows[0].name, {
    fields: Object.keys(req.body),
    previousStatus: existingProject.status,
    status: rows[0].status,
  });
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
  await seedProjectTasksIfEmpty();
  const [tasks] = await query("SELECT * FROM project_tasks ORDER BY created_at DESC");
  res.json({ tasks: tasks.map(mapTask) });
});

const getProjectStatsLegacy = asyncHandler(async (req, res) => {
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

const getProjectStats = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await ensureProjectManagementTables();
  await seedProjectTasksIfEmpty();
  await seedProjectsFromTasks();

  const filters = buildReportFilters(req.query);
  const filteredWhere = filters.conditions.length ? "WHERE " + filters.conditions.join(" AND ") : "";

  const [[projectCounts], [taskCounts], [statusRows], [priorityRows], [assigneeRows], [projectRows], [trendRows], [wbsRows], [activityRows]] = await Promise.all([
    query(`SELECT COUNT(*) AS total_projects,
              SUM(status = 'active') AS active_projects,
              SUM(status = 'completed') AS completed_projects,
              SUM(end_date < CURDATE() AND status <> 'completed') AS overdue_projects
       FROM projects`),
    query(`SELECT COUNT(*) AS total_tasks,
              SUM(pt.status = 'completed') AS completed_tasks,
              SUM(pt.status = 'in-progress') AS in_progress_tasks,
              SUM(pt.deadline < CURDATE() AND pt.status <> 'completed') AS overdue_tasks,
              AVG(CASE WHEN pt.status = 'completed' THEN DATEDIFF(DATE(pt.updated_at), DATE(pt.created_at)) END) AS average_completion_days
       FROM project_tasks pt
       LEFT JOIN projects p ON p.name = pt.project
       ${filteredWhere}`, filters.params),
    query(`SELECT pt.status, COUNT(*) AS total FROM project_tasks pt LEFT JOIN projects p ON p.name = pt.project ${filteredWhere} GROUP BY pt.status`, filters.params),
    query(`SELECT pt.priority, COUNT(*) AS total FROM project_tasks pt LEFT JOIN projects p ON p.name = pt.project ${filteredWhere} GROUP BY pt.priority`, filters.params),
    query(`SELECT pt.assignee, COUNT(*) AS total, SUM(pt.status = 'completed') AS completed, SUM(pt.status <> 'completed') AS pending
       FROM project_tasks pt LEFT JOIN projects p ON p.name = pt.project ${filteredWhere}
       GROUP BY pt.assignee ORDER BY completed DESC, total DESC`, filters.params),
    query(`SELECT p.id, p.name, p.status, COUNT(pt.id) AS total, SUM(pt.status = 'completed') AS completed,
              SUM(pt.status = 'in-progress') AS in_progress, SUM(pt.deadline < CURDATE() AND pt.status <> 'completed') AS overdue
       FROM projects p LEFT JOIN project_tasks pt ON pt.project = p.name
       ${filters.projectWhere}
       GROUP BY p.id, p.name, p.status ORDER BY p.name`, filters.projectParams),
    query(`SELECT DATE(pt.updated_at) AS date, SUM(pt.status = 'completed') AS completed,
              SUM(pt.status = 'in-progress') AS in_progress, SUM(pt.status = 'todo') AS todo
       FROM project_tasks pt LEFT JOIN projects p ON p.name = pt.project
       ${filteredWhere}
       GROUP BY DATE(pt.updated_at) ORDER BY DATE(pt.updated_at)`, filters.params),
    query(`SELECT COUNT(*) AS total_wbs_items, SUM(status = 'completed') AS completed_wbs_items,
              SUM(due_date < CURDATE() AND status <> 'completed') AS overdue_wbs_items
       FROM work_breakdown_structures`),
    query(`SELECT action, COUNT(*) AS total FROM audit_logs WHERE module = 'Project Management' GROUP BY action ORDER BY total DESC LIMIT 10`),
  ]);

  const byStatus = rowsToObject(statusRows, "status");
  const totalTasks = Number(taskCounts[0]?.total_tasks || 0);
  const completedTasks = Number(taskCounts[0]?.completed_tasks || 0);
  const averageCompletionDays = Number(taskCounts[0]?.average_completion_days || 0);

  res.json({
    summary: {
      totalProjects: Number(projectCounts[0]?.total_projects || 0),
      activeProjects: Number(projectCounts[0]?.active_projects || 0),
      completedProjects: Number(projectCounts[0]?.completed_projects || 0),
      overdueProjects: Number(projectCounts[0]?.overdue_projects || 0),
      totalTasks,
      completedTasks,
      inProgressTasks: Number(taskCounts[0]?.in_progress_tasks || 0),
      overdueTasks: Number(taskCounts[0]?.overdue_tasks || 0),
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      teamVelocity: trendRows.length ? Number((completedTasks / trendRows.length).toFixed(1)) : 0,
      averageCompletionDays: Number(averageCompletionDays.toFixed(1)),
      totalWbsItems: Number(wbsRows[0]?.total_wbs_items || 0),
      completedWbsItems: Number(wbsRows[0]?.completed_wbs_items || 0),
      overdueWbsItems: Number(wbsRows[0]?.overdue_wbs_items || 0),
    },
    byStatus,
    byPriority: rowsToObject(priorityRows, "priority"),
    projects: projectRows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      total: Number(row.total || 0),
      completed: Number(row.completed || 0),
      inProgress: Number(row.in_progress || 0),
      overdue: Number(row.overdue || 0),
      completionRate: Number(row.total || 0) ? Math.round((Number(row.completed || 0) / Number(row.total || 0)) * 100) : 0,
    })),
    assignees: assigneeRows.map((row) => ({
      name: row.assignee || "Unassigned",
      total: Number(row.total || 0),
      completed: Number(row.completed || 0),
      pending: Number(row.pending || 0),
      efficiency: Number(row.total || 0) ? Math.round((Number(row.completed || 0) / Number(row.total || 0)) * 100) : 0,
    })),
    trend: trendRows.map((row) => ({ date: row.date, completed: Number(row.completed || 0), inProgress: Number(row.in_progress || 0), todo: Number(row.todo || 0) })),
    activity: activityRows.map((row) => ({ action: row.action, total: Number(row.total || 0) })),
    filters: await getProjectReportFilterOptions(),
  });
});

const getProjectReports = asyncHandler(async (req, res) => getProjectStats(req, res));

const getAdminOverview = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await seedProjectTasksIfEmpty();
  await seedProjectsFromTasks();
  await ensureProjectManagementTables();

  const [[projectCounts], [taskOverdueRows], [historyRows], [wbsRows], [activityRows], [managerRows]] = await Promise.all([
    query(`SELECT COUNT(*) AS total,
                  SUM(status = 'active') AS active,
                  SUM(status = 'completed') AS completed
           FROM projects`),
    query("SELECT COUNT(*) AS overdue FROM project_tasks WHERE deadline < CURDATE() AND status <> 'completed'"),
    query(`SELECT
                  SUM(status = 'completed') AS completed_tasks,
                  SUM(status = 'completed' AND deadline >= DATE(updated_at)) AS completed_on_time_tasks,
                  SUM(status = 'completed' AND deadline < DATE(updated_at)) AS completed_late_tasks
           FROM project_tasks`),
    query(`SELECT
                  SUM(status IN ('todo', 'in-progress', 'in-review')) AS active_wbs_items,
                  SUM(due_date < CURDATE() AND status <> 'completed') AS overdue_wbs_items,
                  SUM(status = 'completed') AS completed_wbs_items
           FROM work_breakdown_structures`),
    query(`SELECT id, title, project, status, updated_at
           FROM project_tasks ORDER BY updated_at DESC LIMIT 6`),
    query(`SELECT u.id, u.name, u.email,
                  COUNT(DISTINCT p.id) AS projects,
                  COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) AS active_projects,
                  COUNT(DISTINCT w.id) AS wbs_items,
                  COUNT(DISTINCT CASE WHEN w.status = 'completed' THEN w.id END) AS completed_wbs_items
           FROM users u
           LEFT JOIN projects p ON p.owner_id = u.id
           LEFT JOIN work_breakdown_structures w ON w.created_by = u.id
           WHERE u.role = 'project_manager' AND u.status = 'active'
           GROUP BY u.id, u.name, u.email ORDER BY u.name`),
  ]);

  res.json({
    totalProjects: Number(projectCounts[0]?.total || 0),
    activeProjects: Number(projectCounts[0]?.active || 0),
    completedProjects: Number(projectCounts[0]?.completed || 0),
    overdueTasks: Number(taskOverdueRows[0]?.overdue || 0),
    completedHistoryTasks: Number(historyRows[0]?.completed_tasks || 0),
    completedOnTimeTasks: Number(historyRows[0]?.completed_on_time_tasks || 0),
    completedLateTasks: Number(historyRows[0]?.completed_late_tasks || 0),
    activeWbsItems: Number(wbsRows[0]?.active_wbs_items || 0),
    overdueWbsItems: Number(wbsRows[0]?.overdue_wbs_items || 0),
    completedWbsItems: Number(wbsRows[0]?.completed_wbs_items || 0),
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
      wbsItems: Number(row.wbs_items || 0),
      completedWbsItems: Number(row.completed_wbs_items || 0),
    })),
  });
});

const getProjectHistoryLegacy = asyncHandler(async (req, res) => {
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

const getProjectHistory = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await ensureProjectManagementTables();
  await seedProjectsFromTasks();

  const projectConditions = [];
  const projectParams = [];
  const taskConditions = [];
  const taskParams = [];

  if (req.params.id) {
    projectConditions.push("p.id = ?");
    projectParams.push(req.params.id);
    taskConditions.push("p.id = ?");
    taskParams.push(req.params.id);
  }

  const { project, assignee, status, priority, startDate, endDate } = req.query;

  if (project) {
    projectConditions.push("p.name = ?");
    projectParams.push(project);
    taskConditions.push("p.name = ?");
    taskParams.push(project);
  }
  if (assignee) {
    taskConditions.push("pt.assignee = ?");
    taskParams.push(assignee);
  }
  if (status) {
    taskConditions.push("pt.status = ?");
    taskParams.push(status);
  }
  if (priority) {
    taskConditions.push("pt.priority = ?");
    taskParams.push(priority);
  }
  if (startDate) {
    taskConditions.push("pt.updated_at >= ?");
    taskParams.push(startDate);
  }
  if (endDate) {
    taskConditions.push("pt.updated_at <= ?");
    taskParams.push(String(endDate).length <= 10 ? String(endDate) + " 23:59:59" : endDate);
  }
  if (req.user.role === "employee") {
    taskConditions.push("pt.status = 'completed'");
    taskConditions.push("pt.assignee = ?");
    taskParams.push(req.user.name);
  }

  const projectWhere = projectConditions.length ? "WHERE " + projectConditions.join(" AND ") : "";
  const taskWhere = taskConditions.length ? "WHERE " + taskConditions.join(" AND ") : "";

  const [projects] = await query(
    `SELECT p.*, owner.name AS owner_name,
            COUNT(pt.id) AS task_count,
            SUM(pt.status = 'completed') AS completed_tasks,
            SUM(pt.deadline < CURDATE() AND pt.status <> 'completed') AS overdue_tasks,
            MAX(CASE WHEN pt.status = 'completed' THEN pt.updated_at END) AS completion_date,
            GREATEST(p.updated_at, COALESCE(MAX(pt.updated_at), p.updated_at)) AS last_activity
     FROM projects p
     LEFT JOIN users owner ON owner.id = p.owner_id
     LEFT JOIN project_tasks pt ON pt.project = p.name
     ${projectWhere}
     GROUP BY p.id
     ORDER BY last_activity DESC`,
    projectParams
  );

  const [tasks] = await query(
    `SELECT pt.*, p.id AS project_id, p.name AS project_name
     FROM project_tasks pt
     LEFT JOIN projects p ON p.name = pt.project
     ${taskWhere}
     ORDER BY pt.updated_at DESC, pt.id DESC`,
    taskParams
  );

  const projectIds = projects.map((row) => Number(row.id));
  const [wbsRows] = projectIds.length
    ? await query(
        `SELECT w.*, p.name AS project_name, assignee.name AS assigned_to_name, creator.name AS created_by_name
         FROM work_breakdown_structures w
         JOIN projects p ON p.id = w.project_id
         LEFT JOIN users assignee ON assignee.id = w.assigned_to
         LEFT JOIN users creator ON creator.id = w.created_by
         WHERE w.project_id IN (${projectIds.map(() => "?").join(",")})
         ORDER BY w.updated_at DESC`,
        projectIds
      )
    : [[]];

  const [activityRows] = await query(
    `SELECT id, actor_id, actor_name, actor_role, action, entity_type, entity_id, description, metadata_json, created_at
     FROM audit_logs
     WHERE module = 'Project Management'
     ORDER BY created_at DESC, id DESC
     LIMIT 100`
  );

  const mappedProjects = projects.map((row) => {
    const projectTasks = tasks.filter((task) => task.project_name === row.name);
    const completedTasks = projectTasks.filter((task) => task.status === "completed");
    const projectWbs = wbsRows.filter((item) => Number(item.project_id) === Number(row.id)).map(mapWbsItem);
    const activities = activityRows.filter((activity) => {
      if (activity.entity_type === "project" && Number(activity.entity_id) === Number(row.id)) return true;
      const metadata = parseAuditMetadata(activity.metadata_json);
      return Number(metadata?.projectId) === Number(row.id) || metadata?.project === row.name;
    });

    return {
      ...mapProject({ ...row, members: 0, milestones: 0, tasks: row.task_count }),
      overdueTasks: Number(row.overdue_tasks || 0),
      lastActivity: row.last_activity,
      completionDate: row.status === "completed" ? row.updated_at : row.completion_date,
      tasks: projectTasks.map(mapTask),
      completedTasksList: completedTasks.map(mapTask),
      wbsItems: projectWbs,
      activities,
    };
  });

  res.json({
    projects: mappedProjects,
    tasks: tasks.map(mapTask),
    completedTasks: tasks.filter((task) => task.status === "completed").map(mapTask),
    filters: {
      projects: [...new Set(projects.map((row) => row.name).filter(Boolean))],
      assignees: [...new Set(tasks.map((task) => task.assignee).filter(Boolean))],
      statuses: [...new Set(tasks.map((task) => task.status).filter(Boolean))],
      priorities: [...new Set(tasks.map((task) => task.priority).filter(Boolean))],
    },
  });
});

const getProjectHistoryById = asyncHandler(async (req, res) => getProjectHistory(req, res));

function normalizeWbsStatus(status) {
  if (status === "not-started") return "todo";
  return status || "todo";
}

function mapWbsItem(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    parentId: row.parent_id,
    title: row.title,
    taskName: row.title,
    description: row.description || "",
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name || null,
    status: row.status,
    priority: row.priority,
    startDate: row.start_date,
    dueDate: row.due_date,
    progress: Number(row.progress || 0),
    createdBy: row.created_by,
    createdByName: row.created_by_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildWbsTree(items) {
  const byId = new Map(items.map((item) => [Number(item.id), { ...item, children: [] }]));
  const roots = [];

  for (const item of byId.values()) {
    if (item.parentId && byId.has(Number(item.parentId))) {
      byId.get(Number(item.parentId)).children.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}

function groupWbsByProject(items) {
  const byProject = new Map();
  for (const item of items) {
    if (!byProject.has(item.projectId)) {
      byProject.set(item.projectId, {
        id: item.projectId,
        projectId: item.projectId,
        projectName: item.projectName,
        title: item.projectName + " WBS",
        description: "",
        items: [],
      });
    }
    byProject.get(item.projectId).items.push(item);
  }

  return Array.from(byProject.values()).map((project) => ({
    ...project,
    nodes: buildWbsTree(project.items),
  }));
}

async function getWbsItems({ projectId, user }) {
  const conditions = [];
  const params = [];
  if (projectId) {
    conditions.push("w.project_id = ?");
    params.push(projectId);
  }
  if (user.role === "employee") {
    conditions.push("w.assigned_to = ?");
    params.push(user.id);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const [rows] = await query(
    `SELECT w.*, p.name AS project_name, assignee.name AS assigned_to_name, creator.name AS created_by_name
     FROM work_breakdown_structures w
     JOIN projects p ON p.id = w.project_id
     LEFT JOIN users assignee ON assignee.id = w.assigned_to
     LEFT JOIN users creator ON creator.id = w.created_by
     ${where}
     ORDER BY p.name, COALESCE(w.parent_id, 0), w.created_at, w.id`,
    params
  );
  return rows.map(mapWbsItem);
}

const listWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const items = await getWbsItems({ user: req.user });
  res.json({ wbsItems: items, workBreakdownStructures: groupWbsByProject(items) });
});

const listProjectWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const items = await getWbsItems({ projectId: req.params.id, user: req.user });
  res.json({ wbsItems: items, nodes: buildWbsTree(items) });
});

const createWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [projectRows] = await query("SELECT id FROM projects WHERE id = ? LIMIT 1", [req.params.id]);
  if (!projectRows.length) return res.status(404).json({ message: "Project not found" });

  if (req.body.parentId) {
    const [parentRows] = await query("SELECT id FROM work_breakdown_structures WHERE id = ? AND project_id = ? LIMIT 1", [req.body.parentId, req.params.id]);
    if (!parentRows.length) return res.status(400).json({ message: "Parent WBS item does not belong to this project" });
  }

  const [result] = await query(
    `INSERT INTO work_breakdown_structures
      (project_id, parent_id, title, description, assigned_to, status, priority, start_date, due_date, progress, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.params.id,
      req.body.parentId || null,
      req.body.title,
      req.body.description || null,
      req.body.assignedTo || null,
      normalizeWbsStatus(req.body.status),
      req.body.priority || "medium",
      req.body.startDate || null,
      req.body.dueDate || null,
      Number(req.body.progress || 0),
      req.user.id,
    ]
  );

  await auditFromRequest(req, "wbs_created", "wbs", result.insertId, "Created WBS item " + req.body.title, { projectId: Number(req.params.id) });
  const items = await getWbsItems({ projectId: req.params.id, user: req.user });
  const item = items.find((entry) => Number(entry.id) === Number(result.insertId));
  res.status(201).json({ wbsItem: item });
});

const updateWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [existingRows] = await query("SELECT * FROM work_breakdown_structures WHERE id = ? LIMIT 1", [req.params.id]);
  if (!existingRows.length) return res.status(404).json({ message: "WBS item not found" });
  const existing = existingRows[0];

  const projectId = req.body.projectId || existing.project_id;
  if (req.body.parentId) {
    if (Number(req.body.parentId) === Number(req.params.id)) {
      return res.status(400).json({ message: "A WBS item cannot be its own parent" });
    }
    const [parentRows] = await query("SELECT id FROM work_breakdown_structures WHERE id = ? AND project_id = ? LIMIT 1", [req.body.parentId, projectId]);
    if (!parentRows.length) return res.status(400).json({ message: "Parent WBS item does not belong to this project" });
  }

  const nextStatus = normalizeWbsStatus(req.body.status || existing.status);
  const [result] = await query(
    `UPDATE work_breakdown_structures
     SET project_id = ?, parent_id = ?, title = ?, description = ?, assigned_to = ?, status = ?, priority = ?,
         start_date = ?, due_date = ?, progress = ?
     WHERE id = ?`,
    [
      projectId,
      req.body.parentId === undefined ? existing.parent_id : req.body.parentId || null,
      req.body.title || existing.title,
      req.body.description === undefined ? existing.description : req.body.description || null,
      req.body.assignedTo === undefined ? existing.assigned_to : req.body.assignedTo || null,
      nextStatus,
      req.body.priority || existing.priority,
      req.body.startDate === undefined ? existing.start_date : req.body.startDate || null,
      req.body.dueDate === undefined ? existing.due_date : req.body.dueDate || null,
      req.body.progress === undefined ? existing.progress : Number(req.body.progress || 0),
      req.params.id,
    ]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "WBS item not found" });

  const action = existing.status !== nextStatus ? "wbs_status_changed" : "wbs_updated";
  await auditFromRequest(req, action, "wbs", req.params.id, "Updated WBS item " + (req.body.title || existing.title), {
    projectId: Number(projectId),
    previousStatus: existing.status,
    status: nextStatus,
    fields: Object.keys(req.body),
  });

  const items = await getWbsItems({ projectId, user: req.user });
  const item = items.find((entry) => Number(entry.id) === Number(req.params.id));
  res.json({ wbsItem: item });
});

const deleteWBS = asyncHandler(async (req, res) => {
  await ensureProjectManagementTables();
  const [rows] = await query("SELECT project_id, title FROM work_breakdown_structures WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "WBS item not found" });
  const [result] = await query("DELETE FROM work_breakdown_structures WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "WBS item not found" });
  await auditFromRequest(req, "wbs_deleted", "wbs", req.params.id, "Deleted WBS item " + rows[0].title, { projectId: rows[0].project_id });
  res.json({ message: "WBS item deleted" });
});

const createTask = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  const assigneeAvatar = req.body.assigneeAvatar || initials(req.body.assignee);
  const [result] = await query(
    `INSERT INTO project_tasks
      (title, description, status, priority, assignee, assignee_avatar, deadline, project, tags, estimated_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.title,
      req.body.description,
      req.body.status,
      req.body.priority,
      req.body.assignee,
      assigneeAvatar,
      req.body.deadline,
      req.body.project,
      JSON.stringify(req.body.tags || []),
      req.body.estimatedHours || null,
    ]
  );

  const [rows] = await query("SELECT * FROM project_tasks WHERE id = ?", [result.insertId]);
  await auditFromRequest(req, "project_task_created", "project_task", result.insertId, "Created project task " + req.body.title, { project: req.body.project });
  res.status(201).json({ task: mapTask(rows[0]) });
});

const updateTask = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  const [existingRows] = await query("SELECT * FROM project_tasks WHERE id = ? LIMIT 1", [req.params.id]);
  if (!existingRows.length) {
    return res.status(404).json({ message: "Task not found" });
  }
  const existingTask = existingRows[0];
  const fields = [];
  const params = [];
  const allowed = {
    title: "title",
    description: "description",
    status: "status",
    priority: "priority",
    assignee: "assignee",
    assigneeAvatar: "assignee_avatar",
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

  const [rows] = await query("SELECT * FROM project_tasks WHERE id = ?", [req.params.id]);
  const statusChanged = req.body.status !== undefined && req.body.status !== existingTask.status;
  const action = statusChanged ? "project_task_status_changed" : "project_task_updated";
  await auditFromRequest(req, action, "project_task", req.params.id, "Updated project task " + rows[0].title, {
    fields: Object.keys(req.body),
    project: rows[0].project,
    previousStatus: existingTask.status,
    status: rows[0].status,
    completedAt: rows[0].status === "completed" ? rows[0].updated_at : null,
  });
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
  getProjectReports,
  getProjectHistory,
  getProjectHistoryById,
  createTask,
  updateTask,
  deleteTask,
  listWBS,
  listProjectWBS,
  createWBS,
  updateWBS,
  deleteWBS,
};
