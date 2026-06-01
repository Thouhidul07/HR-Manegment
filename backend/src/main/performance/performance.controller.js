const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function parseGoals(goals) {
  if (!goals) {
    return [];
  }

  try {
    const parsed = JSON.parse(goals);
    return Array.isArray(parsed) ? parsed : [String(goals)];
  } catch {
    return String(goals)
      .split("\n")
      .map((goal) => goal.trim())
      .filter(Boolean);
  }
}

function mapReview(row) {
  return {
    id: row.id,
    userId: row.user_id,
    employee: row.employee_name,
    reviewerId: row.reviewer_id,
    reviewer: row.reviewer_name,
    reviewPeriod: row.review_period,
    score: row.score === null ? null : Number(row.score),
    goals: parseGoals(row.goals),
    feedback: row.feedback || "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const listReviews = asyncHandler(async (req, res) => {
  const where = req.user.role === "employee" ? "WHERE pr.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [rows] = await query(
    `SELECT pr.*, employee.name AS employee_name, reviewer.name AS reviewer_name
     FROM performance_reviews pr
     JOIN users employee ON employee.id = pr.user_id
     LEFT JOIN users reviewer ON reviewer.id = pr.reviewer_id
     ${where}
     ORDER BY pr.updated_at DESC`,
    params
  );

  res.json({ reviews: rows.map(mapReview) });
});

const startReviewCycle = asyncHandler(async (req, res) => {
  const reviewPeriod = req.body.reviewPeriod || `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;
  const [employees] = await query("SELECT id FROM users WHERE role IN ('employee', 'hr_manager')");

  for (const employee of employees) {
    await query(
      `INSERT INTO performance_reviews (user_id, reviewer_id, review_period, status)
       SELECT ?, ?, ?, 'draft'
       WHERE NOT EXISTS (
         SELECT 1 FROM performance_reviews
         WHERE user_id = ? AND review_period = ?
       )`,
      [employee.id, req.user.id, reviewPeriod, employee.id, reviewPeriod]
    );
  }

  res.status(201).json({
    message: "Review cycle started",
    reviewPeriod,
    employeesQueued: employees.length,
  });
});

const updateReview = asyncHandler(async (req, res) => {
  const [existingRows] = await query("SELECT * FROM performance_reviews WHERE id = ?", [req.params.id]);

  if (!existingRows.length) {
    return res.status(404).json({ message: "Performance review not found" });
  }

  const review = existingRows[0];
  const isOwner = review.user_id === req.user.id;
  const isManager = ["admin", "hr_manager"].includes(req.user.role);

  if (!isOwner && !isManager) {
    return res.status(403).json({ message: "Not authorized to update this review" });
  }

  const fields = [];
  const params = [];

  if (req.body.score !== undefined && isManager) {
    fields.push("score = ?");
    params.push(req.body.score);
  }

  if (req.body.goals !== undefined) {
    fields.push("goals = ?");
    params.push(Array.isArray(req.body.goals) ? JSON.stringify(req.body.goals) : req.body.goals);
  }

  if (req.body.feedback !== undefined) {
    fields.push("feedback = ?");
    params.push(req.body.feedback || null);
  }

  if (req.body.status !== undefined) {
    const nextStatus = req.body.status;
    if (nextStatus === "approved" && !isManager) {
      return res.status(403).json({ message: "Only managers can approve reviews" });
    }

    fields.push("status = ?");
    params.push(nextStatus);
  }

  if (isManager) {
    fields.push("reviewer_id = ?");
    params.push(req.user.id);
  }

  if (!fields.length) {
    return res.status(400).json({ message: "No review updates provided" });
  }

  params.push(req.params.id);
  await query(`UPDATE performance_reviews SET ${fields.join(", ")} WHERE id = ?`, params);

  const [rows] = await query(
    `SELECT pr.*, employee.name AS employee_name, reviewer.name AS reviewer_name
     FROM performance_reviews pr
     JOIN users employee ON employee.id = pr.user_id
     LEFT JOIN users reviewer ON reviewer.id = pr.reviewer_id
     WHERE pr.id = ?`,
    [req.params.id]
  );

  res.json({ review: mapReview(rows[0]) });
});

const createReview = asyncHandler(async (req, res) => {
  const goals = Array.isArray(req.body.goals) ? JSON.stringify(req.body.goals) : req.body.goals || null;
  const [result] = await query(
    `INSERT INTO performance_reviews (user_id, reviewer_id, review_period, score, goals, feedback, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.userId,
      req.user.id,
      req.body.reviewPeriod,
      req.body.score || null,
      goals,
      req.body.feedback || null,
      req.body.status || "draft",
    ]
  );

  const [rows] = await query(
    `SELECT pr.*, employee.name AS employee_name, reviewer.name AS reviewer_name
     FROM performance_reviews pr
     JOIN users employee ON employee.id = pr.user_id
     LEFT JOIN users reviewer ON reviewer.id = pr.reviewer_id
     WHERE pr.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ review: mapReview(rows[0]) });
});

module.exports = { listReviews, startReviewCycle, createReview, updateReview };
