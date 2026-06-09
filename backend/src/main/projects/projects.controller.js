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
      assigned_to INT,
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
  // Migrate: add assigned_to column if it doesn't exist yet
  try {
    await query(`ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS assigned_to INT`);
  } catch (_) {}
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

  // Look up real users so we never store fake names
  const [users] = await query(
    "SELECT id, name, role FROM users WHERE role IN ('employee','hr_manager') ORDER BY id ASC LIMIT 10"
  );

  function pickUser(index) {
    if (!users.length) return { id: null, name: 'Unassigned', avatar: 'UN' };
    const u = users[index % users.length];
    const av = u.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    return { id: u.id, name: u.name, avatar: av };
  }

  const u0 = pickUser(0); // Employee 01
  const u1 = pickUser(1); // Employee 02
  const u2 = pickUser(2); // Employee 03
  const u3 = pickUser(3); // Employee 04
  const u4 = pickUser(4); // Employee 05

  const seedTasks = [
    ["Design Work Assignment Dashboard",   "Create high-fidelity mockups for the work assignment dashboard",     "in-progress", "high",   u0.name, u0.avatar, u0.id, "HR Portal Upgrade",    ["Design",      "UI/UX"],         null, 3, 2],
    ["Implement Leave Request API",         "Build leave request endpoints with notification support",             "in-progress", "urgent", u1.name, u1.avatar, u1.id, "HR Portal Upgrade",    ["Backend",     "HR Module"],     null, 5, 1],
    ["Employee Onboarding Module",          "Build employee onboarding workflow and checklist",                    "todo",        "medium", u2.name, u2.avatar, u2.id, "HR Portal Upgrade",    ["Frontend",    "Onboarding"],    null, 1, 0],
    ["Payroll Integration",                 "Connect payroll system with attendance and leave data",               "in-review",   "high",   u3.name, u3.avatar, u3.id, "Finance Operations",   ["Finance",     "Integration"],   null, 2, 1],
    ["Performance Review Workflow",         "Set up quarterly performance review workflow for all employees",      "todo",        "medium", u4.name, u4.avatar, u4.id, "Finance Operations",   ["HR",          "Performance"],   null, 0, 0],
    ["Attendance Report Automation",        "Automate monthly attendance reports and email delivery",              "completed",   "low",    u0.name, u0.avatar, u0.id, "Finance Operations",   ["Automation",  "Reporting"],     null, 4, 3],
    ["Training Schedule Coordination",      "Coordinate and publish Q3 training schedule for all departments",    "in-progress", "high",   u1.name, u1.avatar, u1.id, "HR Portal Upgrade",    ["Training",    "Coordination"],  null, 2, 1],
    ["Expense Claim Digitisation",          "Move expense claim process from paper to digital platform",           "todo",        "low",    u2.name, u2.avatar, u2.id, "Finance Operations",   ["Finance",     "Digitisation"],  null, 0, 0],
  ];

  for (const task of seedTasks) {
    await query(
      `INSERT INTO project_tasks
        (title, description, status, priority, assignee, assignee_avatar, assigned_to, deadline, project, tags, estimated_hours, comments, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?, ?, ?, ?)`,
      [
        task[0], task[1], task[2], task[3], task[4], task[5], task[6],
        // deadline offset in days based on index
        seedTasks.indexOf(task) * 3 - 5,
        task[8], JSON.stringify(task[9]), task[10], task[11], task[12]
      ]
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
    assignee: row.assignee_name || row.assignee,
    assigneeAvatar: row.assignee_avatar || initials(row.assignee_name || row.assignee || 'UN'),
    assignedTo: row.assigned_to || null,
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

  res.status(201).json({ project: mapProject(rows[0]) });
});

const listTasks = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await seedProjectTasksIfEmpty();
  // Join users to get real names for assigned_to
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
  const { dateRange, project } = req.query;

  // Build the WHERE clause based on filters
  let whereClauses = [];
  let params = [];

  if (project && project !== 'all') {
    whereClauses.push('project = ?');
    params.push(project);
  }

  // Parse dateRange and filter by created_at
  if (dateRange) {
    const now = new Date();
    let startDate;
    if (dateRange === 'last-7-days') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (dateRange === 'last-30-days') {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (dateRange === 'last-90-days') {
      startDate = new Date(now.setDate(now.getDate() - 90));
    } else if (dateRange === 'this-month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'last-month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      whereClauses.push('created_at <= ?');
      params.push(endDate);
    } else if (dateRange === 'this-quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
    }

    if (startDate) {
      whereClauses.push('created_at >= ?');
      params.push(startDate);
    }
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 1. Fetch filtered tasks joined with users for real names
  const [tasks] = await query(
    `SELECT pt.*, u.name AS assignee_name
     FROM project_tasks pt
     LEFT JOIN users u ON u.id = pt.assigned_to
     ${whereSql}
     ORDER BY pt.created_at ASC`,
    params
  );


  // 2. Fetch all unique project names to populate filter
  const [projectNames] = await query('SELECT DISTINCT project FROM project_tasks');
  const projectList = ['all', ...projectNames.map(p => p.project)];

  // Compute key stats
  const totalTasks = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const overdue = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed').length;

  // Avg completion time
  // Calculate average DATEDIFF between updated_at and created_at for completed tasks
  const completedTasks = tasks.filter(t => t.status === 'completed');
  let avgCompletionDays = 0;
  if (completedTasks.length > 0) {
    const totalDiff = completedTasks.reduce((sum, t) => {
      const created = new Date(t.created_at);
      const updated = new Date(t.updated_at);
      const diffTime = Math.abs(updated - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    avgCompletionDays = (totalDiff / completedTasks.length).toFixed(1);
  } else {
    avgCompletionDays = 0;
  }

  // Velocity (tasks completed per developer)
  const developers = new Set(tasks.map(t => t.assignee)).size || 1;
  const velocity = totalTasks > 0 ? (completed / developers).toFixed(1) : 0;

  // Task distribution by project
  const distributionMap = {};
  tasks.forEach(t => {
    distributionMap[t.project] = (distributionMap[t.project] || 0) + 1;
  });
  const colors = ['#543884', '#9A77CF', '#EC4176', '#FFA45E', '#00C853', '#2196F3'];
  const projectDistribution = Object.entries(distributionMap).map(([name, val], index) => ({
    name,
    value: val,
    color: colors[index % colors.length]
  }));

  // Priority breakdown
  const priorityMap = { urgent: 0, high: 0, medium: 0, low: 0 };
  tasks.forEach(t => {
    if (priorityMap[t.priority] !== undefined) {
      priorityMap[t.priority]++;
    }
  });
  const priorityColors = {
    urgent: '#EC4176',
    high: '#FFA45E',
    medium: '#9A77CF',
    low: '#543884'
  };
  const priorityBreakdown = Object.entries(priorityMap).map(([priority, count]) => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    count,
    color: priorityColors[priority]
  }));

  // Team performance – join users so we get real names via assigned_to
  const teamMap = {};
  tasks.forEach(t => {
    const displayName = t.assignee_name || t.assignee || 'Unassigned';
    if (!teamMap[displayName]) {
      teamMap[displayName] = { name: displayName, completed: 0, pending: 0 };
    }
    if (t.status === 'completed') {
      teamMap[displayName].completed++;
    } else {
      teamMap[displayName].pending++;
    }
  });

  const teamPerformance = Object.values(teamMap).map((m) => {
    const total = m.completed + m.pending;
    const efficiency = total > 0 ? Math.round((m.completed / total) * 100) : 85;
    return {
      name: m.name,
      completed: m.completed,
      pending: m.pending,
      efficiency: efficiency || 85
    };
  });

  // Sprint Velocity
  const velocityData = [
    { week: 'Week 1', planned: Math.max(1, Math.round(totalTasks * 0.4)), completed: Math.max(0, Math.round(completed * 0.3)) },
    { week: 'Week 2', planned: Math.max(2, Math.round(totalTasks * 0.6)), completed: Math.max(0, Math.round(completed * 0.5)) },
    { week: 'Week 3', planned: Math.max(3, Math.round(totalTasks * 0.8)), completed: Math.max(1, Math.round(completed * 0.8)) },
    { week: 'Week 4', planned: totalTasks, completed: completed }
  ];

  // Task Completion Trend over the range
  const taskCompletionData = [];
  const intervals = 5;
  const rangeDays = dateRange === 'last-7-days' ? 7 : (dateRange === 'last-90-days' ? 90 : 30);
  const step = Math.round(rangeDays / (intervals - 1));

  for (let i = 0; i < intervals; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (rangeDays - i * step));
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const ratio = (i + 1) / intervals;
    const itemCompleted = Math.round(completed * ratio);
    const itemInProgress = Math.round(inProgress * ratio);
    const itemTodo = Math.round((totalTasks - completed - inProgress) * ratio);

    taskCompletionData.push({
      date: dateStr,
      completed: itemCompleted,
      inProgress: itemInProgress,
      todo: itemTodo
    });
  }

  // Generate Insights dynamically
  const insights = [];
  if (completed > 0) {
    insights.push({
      type: 'productivity',
      title: 'Team Productivity Stable',
      desc: `Your team completed ${completed} task(s) during this period. Keep up the momentum!`,
      icon: 'TrendingUp',
      color: 'green'
    });
  }
  if (totalTasks > 0) {
    const rate = Math.round((completed / totalTasks) * 100);
    insights.push({
      type: 'sprint',
      title: `${rate}% Task Completion Rate`,
      desc: `Current metrics show a task completion rate of ${rate}% across all current tasks.`,
      icon: 'Target',
      color: 'blue'
    });
  }
  if (overdue > 0) {
    insights.push({
      type: 'overdue',
      title: `${overdue} Task(s) Overdue`,
      desc: 'Consider reviewing task assignments and deadlines to prevent project delays.',
      icon: 'AlertCircle',
      color: 'orange'
    });
  }
  if (teamPerformance.length > 0) {
    const top = teamPerformance.reduce((prev, current) => (prev.completed > current.completed) ? prev : current, teamPerformance[0]);
    if (top && top.completed > 0) {
      insights.push({
        type: 'performer',
        title: `${top.name} - Top Performer`,
        desc: `Completed ${top.completed} task(s) with an efficiency rating of ${top.efficiency}%.`,
        icon: 'Users',
        color: 'purple'
      });
    }
  }

  res.json({
    projects: projectList,
    stats: {
      totalTasks,
      completed,
      inProgress,
      overdue,
      teamVelocity: velocity,
      avgCompletionTime: `${avgCompletionDays} days`
    },
    taskCompletionData,
    projectDistribution,
    teamPerformance,
    velocityData,
    priorityBreakdown,
    insights
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

const getProjectHistory = asyncHandler(async (req, res) => {
  await ensureProjectTasksTable();
  await ensureProjectManagementTables();

  const { status, project, dateRange, assignee, priority } = req.query;

  // Query completed projects
  let [projects] = await query(`
    SELECT p.*, owner.name AS owner_name
    FROM projects p
    LEFT JOIN users owner ON owner.id = p.owner_id
    WHERE p.status = 'completed'
    ORDER BY p.updated_at DESC
  `);

  // Query completed tasks
  let [tasks] = await query(`
    SELECT *
    FROM project_tasks
    WHERE status = 'completed'
    ORDER BY updated_at DESC
  `);

  // Map to historical items
  let projectItems = projects.map(p => ({
    id: p.id,
    type: 'project',
    title: p.name,
    status: p.status,
    priority: 'medium',
    assigneeName: p.owner_name || 'System',
    startDate: p.start_date || p.created_at,
    completedDate: p.end_date || p.updated_at,
    updatedAt: p.updated_at,
    projectName: p.name,
    description: p.description || 'No description provided.'
  }));

  let taskItems = tasks.map(t => ({
    id: t.id,
    type: 'task',
    title: t.title,
    status: t.status,
    priority: t.priority,
    assigneeName: t.assignee,
    startDate: t.created_at,
    completedDate: t.deadline || t.updated_at,
    updatedAt: t.updated_at,
    projectName: t.project,
    description: t.description || 'No description provided.'
  }));

  let allItems = [...projectItems, ...taskItems];

  // Apply filters in JavaScript
  if (project && project !== 'all') {
    allItems = allItems.filter(item => {
      if (item.type === 'project') {
        return item.title.toLowerCase().includes(project.toLowerCase());
      } else {
        return item.projectName && item.projectName.toLowerCase() === project.toLowerCase();
      }
    });
  }

  if (assignee && assignee !== 'all') {
    allItems = allItems.filter(item => 
      item.assigneeName.toLowerCase().includes(assignee.toLowerCase())
    );
  }

  if (priority && priority !== 'all') {
    allItems = allItems.filter(item => {
      if (item.type === 'task') {
        return item.priority === priority;
      }
      return false;
    });
  }

  if (status && status !== 'all') {
    allItems = allItems.filter(item => item.status === status);
  }

  if (dateRange) {
    const now = new Date();
    let startDate;
    if (dateRange === 'last-7-days') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (dateRange === 'last-30-days') {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (dateRange === 'last-90-days') {
      startDate = new Date(now.setDate(now.getDate() - 90));
    } else if (dateRange === 'this-month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'last-month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      allItems = allItems.filter(item => {
        const compDate = new Date(item.completedDate);
        return compDate >= startDate && compDate <= endDate;
      });
    } else if (dateRange === 'this-quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
    }

    if (startDate && dateRange !== 'last-month') {
      allItems = allItems.filter(item => {
        const compDate = new Date(item.completedDate);
        return compDate >= startDate;
      });
    }
  }

  // Sort latest completed items first
  allItems.sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());

  // Calculate summary statistics
  const totalHistoryItems = allItems.length;
  const completedProjects = allItems.filter(i => i.type === 'project').length;
  const completedTasks = allItems.filter(i => i.type === 'task').length;
  const archivedItems = 0;

  res.json({
    success: true,
    data: {
      summary: {
        totalHistoryItems,
        completedProjects,
        completedTasks,
        archivedItems
      },
      items: allItems
    }
  });
});

async function ensureWbsTable() {
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

const listWBS = asyncHandler(async (req, res) => {
  await ensureWbsTable();
  const [rows] = await query(`
    SELECT w.*, p.name AS project_name, u.name AS creator_name
    FROM work_breakdown_structures w
    LEFT JOIN projects p ON p.id = w.project_id
    LEFT JOIN users u ON u.id = w.created_by
    ORDER BY w.created_at DESC
  `);

  const items = rows.map(row => ({
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name || 'Unknown Project',
    title: row.title,
    description: row.description || '',
    nodes: typeof row.nodes_json === 'string' ? JSON.parse(row.nodes_json) : row.nodes_json,
    createdBy: row.creator_name || 'System',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));

  res.json({ success: true, data: items });
});

const getWBSById = asyncHandler(async (req, res) => {
  await ensureWbsTable();
  const [rows] = await query(`
    SELECT w.*, p.name AS project_name, u.name AS creator_name
    FROM work_breakdown_structures w
    LEFT JOIN projects p ON p.id = w.project_id
    LEFT JOIN users u ON u.id = w.created_by
    WHERE w.id = ?
  `, [req.params.id]);

  if (!rows.length) {
    return res.status(404).json({ success: false, message: "WBS not found" });
  }

  const row = rows[0];
  const item = {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name || 'Unknown Project',
    title: row.title,
    description: row.description || '',
    nodes: typeof row.nodes_json === 'string' ? JSON.parse(row.nodes_json) : row.nodes_json,
    createdBy: row.creator_name || 'System',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  res.json({ success: true, data: item });
});

const createWBS = asyncHandler(async (req, res) => {
  await ensureWbsTable();
  const { projectId, title, description, nodes } = req.body;

  if (!title || !projectId || !nodes) {
    return res.status(400).json({ success: false, message: "Title, projectId, and nodes are required" });
  }

  const nodesStr = typeof nodes === 'string' ? nodes : JSON.stringify(nodes);

  const [result] = await query(`
    INSERT INTO work_breakdown_structures (project_id, title, description, nodes_json, created_by)
    VALUES (?, ?, ?, ?, ?)
  `, [projectId, title, description || null, nodesStr, req.user.id]);

  const [rows] = await query(`
    SELECT w.*, p.name AS project_name, u.name AS creator_name
    FROM work_breakdown_structures w
    LEFT JOIN projects p ON p.id = w.project_id
    LEFT JOIN users u ON u.id = w.created_by
    WHERE w.id = ?
  `, [result.insertId]);

  const row = rows[0];
  const item = {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name || 'Unknown Project',
    title: row.title,
    description: row.description || '',
    nodes: typeof row.nodes_json === 'string' ? JSON.parse(row.nodes_json) : row.nodes_json,
    createdBy: row.creator_name || 'System',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  res.status(201).json({ success: true, data: item });
});

const updateWBS = asyncHandler(async (req, res) => {
  await ensureWbsTable();
  const { title, description, nodes, projectId } = req.body;

  const fields = [];
  const params = [];

  if (title !== undefined) {
    fields.push("title = ?");
    params.push(title);
  }
  if (description !== undefined) {
    fields.push("description = ?");
    params.push(description || null);
  }
  if (nodes !== undefined) {
    fields.push("nodes_json = ?");
    params.push(typeof nodes === 'string' ? nodes : JSON.stringify(nodes));
  }
  if (projectId !== undefined) {
    fields.push("project_id = ?");
    params.push(projectId);
  }

  if (!fields.length) {
    return res.status(400).json({ success: false, message: "No WBS update fields provided" });
  }

  params.push(req.params.id);
  const [result] = await query(`UPDATE work_breakdown_structures SET ${fields.join(", ")} WHERE id = ?`, params);

  if (!result.affectedRows) {
    return res.status(404).json({ success: false, message: "WBS not found" });
  }

  const [rows] = await query(`
    SELECT w.*, p.name AS project_name, u.name AS creator_name
    FROM work_breakdown_structures w
    LEFT JOIN projects p ON p.id = w.project_id
    LEFT JOIN users u ON u.id = w.created_by
    WHERE w.id = ?
  `, [req.params.id]);

  const row = rows[0];
  const item = {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name || 'Unknown Project',
    title: row.title,
    description: row.description || '',
    nodes: typeof row.nodes_json === 'string' ? JSON.parse(row.nodes_json) : row.nodes_json,
    createdBy: row.creator_name || 'System',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  res.json({ success: true, data: item });
});

const deleteWBS = asyncHandler(async (req, res) => {
  await ensureWbsTable();
  const [result] = await query("DELETE FROM work_breakdown_structures WHERE id = ?", [req.params.id]);

  if (!result.affectedRows) {
    return res.status(404).json({ success: false, message: "WBS not found" });
  }

  res.json({ success: true, message: "WBS deleted" });
});

module.exports = {
  listProjects,
  createProject,
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
  deleteWBS
};
