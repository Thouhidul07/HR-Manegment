const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

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

const listTasks = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await seedProjectTasksIfEmpty();
  const [tasks] = await query("SELECT * FROM project_tasks ORDER BY created_at DESC");
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
  res.json({ task: mapTask(rows[0]) });
});

const deleteTask = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  const [result] = await query("DELETE FROM project_tasks WHERE id = ?", [req.params.id]);

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json({ message: "Task deleted" });
});

module.exports = { listTasks, getProjectStats, createTask, updateTask, deleteTask };
