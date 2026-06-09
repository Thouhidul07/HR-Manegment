const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

const listTasks = asyncHandler(async (req, res) => {
  const { status, priority, category, assignedTo, search, overdue } = req.query;
  let where = ["t.company_id = ?"];
  let params = [req.user.company_id];

  if (req.user.role === 'employee') {
    where.push("(t.assigned_to = ? OR t.assigned_by = ?)");
    params.push(req.user.id, req.user.id);
  } else if (assignedTo) {
    where.push("t.assigned_to = ?");
    params.push(assignedTo);
  }

  if (status) {
    where.push("t.status = ?");
    params.push(status);
  }
  if (priority) {
    where.push("t.priority = ?");
    params.push(priority);
  }
  if (category) {
    where.push("t.category = ?");
    params.push(category);
  }
  if (search) {
    where.push("(t.title LIKE ? OR t.description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  // Filter overdue: past due date and not completed
  if (overdue === "true") {
    where.push("t.due_date < CURDATE()");
    where.push("t.status != 'completed'");
  }

  const sql = `
    SELECT t.*, 
           u_to.name AS assignee_name, u_to.email AS assignee_email, 
           u_by.name AS assigner_name, u_by.email AS assigner_email
    FROM tasks t
    LEFT JOIN users u_to ON u_to.id = t.assigned_to
    LEFT JOIN users u_by ON u_by.id = t.assigned_by
    WHERE ${where.join(" AND ")}
    ORDER BY t.created_at DESC
  `;

  const [rows] = await query(sql, params);
  res.json({
    tasks: rows.map(r => ({
      ...r,
      due_date: formatDate(r.due_date),
      completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : null,
      created_at: new Date(r.created_at).toISOString(),
      updated_at: new Date(r.updated_at).toISOString()
    }))
  });
});

const getTasksSummary = asyncHandler(async (req, res) => {
  let where = ["company_id = ?"];
  let params = [req.user.company_id];

  if (req.user.role === 'employee') {
    where.push("(assigned_to = ? OR assigned_by = ?)");
    params.push(req.user.id, req.user.id);
  }

  const sql = `
    SELECT 
      COUNT(*) as totalTasks,
      SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN priority = 'urgent' AND status != 'completed' THEN 1 ELSE 0 END) as urgent,
      SUM(CASE WHEN due_date < CURDATE() AND status != 'completed' THEN 1 ELSE 0 END) as overdue
    FROM tasks
    WHERE ${where.join(" AND ")}
  `;
  const [rows] = await query(sql, params);
  const summary = rows[0] || {};
  res.json({
    totalTasks: Number(summary.totalTasks || 0),
    todo: Number(summary.todo || 0),
    inProgress: Number(summary.inProgress || 0),
    completed: Number(summary.completed || 0),
    cancelled: Number(summary.cancelled || 0),
    urgent: Number(summary.urgent || 0),
    overdue: Number(summary.overdue || 0),
  });
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, category, priority, status, assignedTo, dueDate } = req.body;
  let targetAssignedTo = assignedTo;

  if (req.user.role === 'employee') {
    targetAssignedTo = req.user.id;
  } else {
    if (!targetAssignedTo) {
      targetAssignedTo = req.user.id;
    } else {
      const [userCheck] = await query("SELECT company_id FROM users WHERE id = ? LIMIT 1", [targetAssignedTo]);
      if (!userCheck.length || userCheck[0].company_id !== req.user.company_id) {
        return res.status(400).json({ message: "Cannot assign task to a user from another company or user does not exist" });
      }
    }
  }

  const [result] = await query(
    `INSERT INTO tasks (company_id, title, description, category, priority, status, assigned_to, assigned_by, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.company_id,
      title,
      description || null,
      category || 'general',
      priority || 'medium',
      status || 'todo',
      targetAssignedTo,
      req.user.id,
      dueDate ? new Date(dueDate).toISOString().slice(0, 10) : null
    ]
  );

  const [newRow] = await query(`
    SELECT t.*, 
           u_to.name AS assignee_name, u_to.email AS assignee_email, 
           u_by.name AS assigner_name, u_by.email AS assigner_email
    FROM tasks t
    LEFT JOIN users u_to ON u_to.id = t.assigned_to
    LEFT JOIN users u_by ON u_by.id = t.assigned_by
    WHERE t.id = ? LIMIT 1
  `, [result.insertId]);

  res.status(201).json({
    task: {
      ...newRow[0],
      due_date: formatDate(newRow[0].due_date),
      completed_at: newRow[0].completed_at ? new Date(newRow[0].completed_at).toISOString() : null,
      created_at: new Date(newRow[0].created_at).toISOString(),
      updated_at: new Date(newRow[0].updated_at).toISOString()
    }
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority, status, assignedTo, dueDate } = req.body;

  const [existing] = await query("SELECT * FROM tasks WHERE id = ? AND company_id = ? LIMIT 1", [id, req.user.company_id]);
  if (!existing.length) {
    return res.status(404).json({ message: "Task not found" });
  }

  const task = existing[0];
  let targetAssignedTo = task.assigned_to;

  if (req.user.role === 'employee') {
    if (task.assigned_to !== req.user.id && task.assigned_by !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to update this task" });
    }
  } else {
    if (assignedTo && assignedTo !== task.assigned_to) {
      const [userCheck] = await query("SELECT company_id FROM users WHERE id = ? LIMIT 1", [assignedTo]);
      if (!userCheck.length || userCheck[0].company_id !== req.user.company_id) {
        return res.status(400).json({ message: "Cannot assign task to a user from another company or user does not exist" });
      }
      targetAssignedTo = assignedTo;
    }
  }

  let completedAt = task.completed_at;
  if (status === 'completed' && task.status !== 'completed') {
    completedAt = new Date();
  } else if (status && status !== 'completed') {
    completedAt = null;
  }

  await query(
    `UPDATE tasks 
     SET title = ?, description = ?, category = ?, priority = ?, status = ?, assigned_to = ?, due_date = ?, completed_at = ?
     WHERE id = ?`,
    [
      title !== undefined ? title : task.title,
      description !== undefined ? description : task.description,
      category !== undefined ? category : task.category,
      priority !== undefined ? priority : task.priority,
      status !== undefined ? status : task.status,
      targetAssignedTo,
      dueDate !== undefined ? (dueDate ? new Date(dueDate).toISOString().slice(0, 10) : null) : task.due_date,
      completedAt,
      id
    ]
  );

  const [updatedRow] = await query(`
    SELECT t.*, 
           u_to.name AS assignee_name, u_to.email AS assignee_email, 
           u_by.name AS assigner_name, u_by.email AS assigner_email
    FROM tasks t
    LEFT JOIN users u_to ON u_to.id = t.assigned_to
    LEFT JOIN users u_by ON u_by.id = t.assigned_by
    WHERE t.id = ? LIMIT 1
  `, [id]);

  res.json({
    task: {
      ...updatedRow[0],
      due_date: formatDate(updatedRow[0].due_date),
      completed_at: updatedRow[0].completed_at ? new Date(updatedRow[0].completed_at).toISOString() : null,
      created_at: new Date(updatedRow[0].created_at).toISOString(),
      updated_at: new Date(updatedRow[0].updated_at).toISOString()
    }
  });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  const [existing] = await query("SELECT * FROM tasks WHERE id = ? AND company_id = ? LIMIT 1", [id, req.user.company_id]);
  if (!existing.length) {
    return res.status(404).json({ message: "Task not found" });
  }

  const task = existing[0];
  if (req.user.role === 'employee') {
    if (task.assigned_to !== req.user.id && task.assigned_by !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to update this task status" });
    }
  }

  let completedAt = task.completed_at;
  if (status === 'completed' && task.status !== 'completed') {
    completedAt = new Date();
  } else if (status !== 'completed') {
    completedAt = null;
  }

  await query(
    "UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?",
    [status, completedAt, id]
  );

  const [updatedRow] = await query(`
    SELECT t.*, 
           u_to.name AS assignee_name, u_to.email AS assignee_email, 
           u_by.name AS assigner_name, u_by.email AS assigner_email
    FROM tasks t
    LEFT JOIN users u_to ON u_to.id = t.assigned_to
    LEFT JOIN users u_by ON u_by.id = t.assigned_by
    WHERE t.id = ? LIMIT 1
  `, [id]);

  res.json({
    task: {
      ...updatedRow[0],
      due_date: formatDate(updatedRow[0].due_date),
      completed_at: updatedRow[0].completed_at ? new Date(updatedRow[0].completed_at).toISOString() : null,
      created_at: new Date(updatedRow[0].created_at).toISOString(),
      updated_at: new Date(updatedRow[0].updated_at).toISOString()
    }
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await query("SELECT * FROM tasks WHERE id = ? AND company_id = ? LIMIT 1", [id, req.user.company_id]);
  if (!existing.length) {
    return res.status(404).json({ message: "Task not found" });
  }

  const task = existing[0];
  if (req.user.role === 'employee') {
    if (task.assigned_by !== req.user.id) {
      return res.status(403).json({ message: "You can only delete self-created tasks" });
    }
  }

  await query("DELETE FROM tasks WHERE id = ?", [id]);
  res.json({ message: "Task deleted successfully" });
});

module.exports = {
  listTasks,
  getTasksSummary,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
};
