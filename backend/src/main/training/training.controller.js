const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function mapSession(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    trainer: row.trainer || "HR Team",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    enrolled: Number(row.enrolled || 0),
    completed: Number(row.completed || 0),
  };
}

function mapEnrollment(row) {
  return {
    id: row.id,
    trainingId: row.training_id,
    userId: row.user_id,
    employee: row.employee_name,
    course: row.title,
    progress: Number(row.progress),
    status: row.status === "completed" ? "Completed" : row.status === "cancelled" ? "Cancelled" : "In Progress",
    dueDate: row.ends_at || row.starts_at,
  };
}

const listTraining = asyncHandler(async (req, res) => {
  const [sessions] = await query(
    `SELECT ts.*,
      COUNT(te.id) AS enrolled,
      SUM(CASE WHEN te.status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM training_sessions ts
     LEFT JOIN training_enrollments te ON te.training_id = ts.id
     GROUP BY ts.id
     ORDER BY ts.starts_at DESC`
  );

  const [enrollments] = await query(
    `SELECT te.*, ts.title, ts.starts_at, ts.ends_at, u.name AS employee_name
     FROM training_enrollments te
     JOIN training_sessions ts ON ts.id = te.training_id
     JOIN users u ON u.id = te.user_id
     WHERE te.user_id = ?
     ORDER BY te.created_at DESC`,
    [req.user.id]
  );

  res.json({
    sessions: sessions.map(mapSession),
    enrollments: enrollments.map(mapEnrollment),
  });
});

const createTraining = asyncHandler(async (req, res) => {
  const { title, description, trainer, startsAt, endsAt } = req.body;
  const startsAtValue = startsAt.replace("T", " ");
  const endsAtValue = endsAt ? endsAt.replace("T", " ") : null;
  const [result] = await query(
    `INSERT INTO training_sessions (title, description, trainer, starts_at, ends_at)
     VALUES (?, ?, ?, ?, ?)`,
    [title, description || null, trainer || null, startsAtValue, endsAtValue]
  );

  const [rows] = await query(
    `SELECT ts.*, 0 AS enrolled, 0 AS completed FROM training_sessions ts WHERE ts.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ session: mapSession(rows[0]) });
});

const updateTraining = asyncHandler(async (req, res) => {
  const fields = [];
  const params = [];
  const allowed = {
    title: "title",
    description: "description",
    trainer: "trainer",
    startsAt: "starts_at",
    endsAt: "ends_at",
  };

  for (const [bodyKey, column] of Object.entries(allowed)) {
    if (req.body[bodyKey] !== undefined) {
      fields.push(`${column} = ?`);
      const value = bodyKey.endsWith("At") && req.body[bodyKey]
        ? req.body[bodyKey].replace("T", " ")
        : req.body[bodyKey] || null;
      params.push(value);
    }
  }

  if (!fields.length) {
    return res.status(400).json({ message: "No training updates provided" });
  }

  params.push(req.params.id);
  const [result] = await query(`UPDATE training_sessions SET ${fields.join(", ")} WHERE id = ?`, params);

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Training session not found" });
  }

  const [rows] = await query(
    `SELECT ts.*,
      COUNT(te.id) AS enrolled,
      SUM(CASE WHEN te.status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM training_sessions ts
     LEFT JOIN training_enrollments te ON te.training_id = ts.id
     WHERE ts.id = ?
     GROUP BY ts.id`,
    [req.params.id]
  );

  res.json({ session: mapSession(rows[0]) });
});

const deleteTraining = asyncHandler(async (req, res) => {
  const [result] = await query("DELETE FROM training_sessions WHERE id = ?", [req.params.id]);

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Training session not found" });
  }

  res.json({ message: "Training session deleted" });
});

const assignTraining = asyncHandler(async (req, res) => {
  const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];

  if (!userIds.length) {
    return res.status(400).json({ message: "At least one user is required" });
  }

  for (const userId of userIds) {
    await query(
      `INSERT INTO training_enrollments (training_id, user_id, progress)
       VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE status = 'enrolled'`,
      [req.params.id, userId]
    );
  }

  res.status(201).json({ message: "Training assigned", assigned: userIds.length });
});

const enrollTraining = asyncHandler(async (req, res) => {
  await query(
    `INSERT INTO training_enrollments (training_id, user_id, progress)
     VALUES (?, ?, 5)
     ON DUPLICATE KEY UPDATE status = 'enrolled', progress = GREATEST(progress, 5)`,
    [req.params.id, req.user.id]
  );

  const [rows] = await query(
    `SELECT te.*, ts.title, ts.starts_at, ts.ends_at, u.name AS employee_name
     FROM training_enrollments te
     JOIN training_sessions ts ON ts.id = te.training_id
     JOIN users u ON u.id = te.user_id
     WHERE te.training_id = ? AND te.user_id = ?`,
    [req.params.id, req.user.id]
  );

  res.status(201).json({ enrollment: mapEnrollment(rows[0]) });
});

const updateTrainingProgress = asyncHandler(async (req, res) => {
  const progress = Number(req.body.progress);
  const status = progress >= 100 ? "completed" : "enrolled";
  const [result] = await query(
    `UPDATE training_enrollments
     SET progress = ?, status = ?
     WHERE id = ? AND user_id = ?`,
    [progress, status, req.params.id, req.user.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Enrollment not found" });
  }

  const [rows] = await query(
    `SELECT te.*, ts.title, ts.starts_at, ts.ends_at, u.name AS employee_name
     FROM training_enrollments te
     JOIN training_sessions ts ON ts.id = te.training_id
     JOIN users u ON u.id = te.user_id
     WHERE te.id = ?`,
    [req.params.id]
  );

  res.json({ enrollment: mapEnrollment(rows[0]) });
});

module.exports = {
  listTraining,
  createTraining,
  updateTraining,
  deleteTraining,
  assignTraining,
  enrollTraining,
  updateTrainingProgress,
};
