const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

async function ensurePeerReviewTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS peer_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reviewee_id INT NOT NULL,
      reviewer_id INT,
      project VARCHAR(160) NOT NULL,
      duration VARCHAR(80) NOT NULL,
      review_text TEXT NOT NULL,
      communication_rating TINYINT NOT NULL,
      technical_rating TINYINT NOT NULL,
      teamwork_rating TINYINT NOT NULL,
      leadership_rating TINYINT NOT NULL,
      strengths TEXT,
      improvements TEXT,
      is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
      status ENUM('submitted', 'approved', 'archived') NOT NULL DEFAULT 'submitted',
      review_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function parseList(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function averageRating(row) {
  return Math.round(
    (
      Number(row.communication_rating) +
      Number(row.technical_rating) +
      Number(row.teamwork_rating) +
      Number(row.leadership_rating)
    ) / 4
  );
}

function formatDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

function mapReview(row) {
  return {
    id: String(row.id),
    employeeAvatar: initials(row.employee_name),
    employeeName: row.employee_name,
    employeeRole: row.employee_role || "Employee",
    employeeDepartment: row.employee_department || "General",
    project: row.project,
    duration: row.duration,
    rating: averageRating(row),
    review: row.review_text,
    reviewDate: formatDate(row.review_date),
    reviewCount: Number(row.review_count || 1),
    strengths: parseList(row.strengths),
    improvements: parseList(row.improvements),
    categories: {
      communication: Number(row.communication_rating),
      technical: Number(row.technical_rating),
      teamwork: Number(row.teamwork_rating),
      leadership: Number(row.leadership_rating),
    },
  };
}

async function seedPeerReviewsIfEmpty() {
  await ensurePeerReviewTables();
  const [[countRow]] = await query("SELECT COUNT(*) AS total FROM peer_reviews");

  if (Number(countRow.total) > 0) {
    return;
  }

  const [employees] = await query(
    "SELECT id FROM users WHERE role = 'employee' ORDER BY id LIMIT 5"
  );

  if (employees.length < 2) {
    return;
  }

  const seedReviews = [
    [employees[0].id, employees[1].id, "HR Portal Enhancement", "3 months", "Excellent collaboration throughout the project. The code reviews were thorough, practical, and easy for the team to act on.", 4, 5, 5, 4, ["Strong technical skills", "Great team player", "Helpful code reviews"], ["Share knowledge more in team meetings"], "2026-05-15"],
    [employees[0].id, employees[2]?.id || employees[1].id, "Customer Portal V2", "4 months", "Good work on frontend components with strong attention to detail. Communication could be a little more proactive, but the contribution was solid.", 3, 4, 4, 3, ["Detail-oriented", "Clean code", "Good problem solver"], ["More proactive communication"], "2026-05-10"],
    [employees[1].id, employees[0].id, "Data Pipeline Migration", "3 months", "Outstanding work identifying issues early and documenting the migration clearly. The handoff was smooth and reliable.", 5, 5, 5, 5, ["Proactive problem-solving", "Excellent documentation", "Mentorship"], [], "2026-04-28"],
    [employees[2]?.id || employees[0].id, employees[1].id, "Marketing Campaign Analytics", "2 months", "Useful insights and a positive attitude throughout. The next step is deeper analysis and sharper prioritization.", 4, 3, 4, 2, ["Good team player", "Quick learner", "Positive attitude"], ["Deeper analysis", "More initiative"], "2026-05-05"],
  ];

  for (const review of seedReviews) {
    await query(
      `INSERT INTO peer_reviews
        (reviewee_id, reviewer_id, project, duration, review_text, communication_rating, technical_rating,
         teamwork_rating, leadership_rating, strengths, improvements, review_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        review[0],
        review[1],
        review[2],
        review[3],
        review[4],
        review[5],
        review[6],
        review[7],
        review[8],
        JSON.stringify(review[9]),
        JSON.stringify(review[10]),
        review[11],
      ]
    );
  }
}

async function reviewRows(where = "", params = []) {
  await seedPeerReviewsIfEmpty();
  const [rows] = await query(
    `SELECT pr.*,
      u.name AS employee_name,
      u.designation AS employee_role,
      u.department AS employee_department,
      (
        SELECT COUNT(*)
        FROM peer_reviews pr2
        WHERE pr2.reviewee_id = pr.reviewee_id
      ) AS review_count
     FROM peer_reviews pr
     JOIN users u ON u.id = pr.reviewee_id
     ${where}
     ORDER BY pr.review_date DESC, pr.created_at DESC`,
    params
  );

  return rows;
}

const listAnalytics = asyncHandler(async (req, res) => {
  const rows = await reviewRows();
  const reviews = rows.map(mapReview);
  const departments = [...new Set(reviews.map((review) => review.employeeDepartment))];

  res.json({
    reviews,
    stats: {
      averageRating: reviews.length
        ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
        : 0,
      employeesReviewed: new Set(reviews.map((review) => review.employeeName)).size,
      totalReviews: reviews.length,
      fiveStarReviews: reviews.filter((review) => review.rating === 5).length,
      departments,
    },
  });
});

const listMine = asyncHandler(async (req, res) => {
  const rows = await reviewRows("WHERE pr.reviewee_id = ?", [req.user.id]);
  const [[givenRow]] = await query(
    "SELECT COUNT(*) AS total FROM peer_reviews WHERE reviewer_id = ?",
    [req.user.id]
  );

  res.json({
    reviews: rows.map(mapReview),
    givenCount: Number(givenRow.total || 0),
  });
});

const listTeammates = asyncHandler(async (req, res) => {
  await ensurePeerReviewTables();
  const [rows] = await query(
    `SELECT id, name, designation, department
     FROM users
     WHERE id <> ? AND role IN ('employee', 'hr_manager')
     ORDER BY name`,
    [req.user.id]
  );

  res.json({
    teammates: rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      avatar: initials(row.name),
      role: row.designation || "Employee",
      department: row.department || "General",
    })),
  });
});

const createReview = asyncHandler(async (req, res) => {
  await ensurePeerReviewTables();
  if (Number(req.body.revieweeId) === Number(req.user.id)) {
    return res.status(400).json({ message: "You cannot submit a peer review for yourself" });
  }

  const [reviewees] = await query(
    "SELECT id FROM users WHERE id = ? AND role IN ('employee', 'hr_manager') LIMIT 1",
    [req.body.revieweeId]
  );

  if (!reviewees.length) {
    return res.status(404).json({ message: "Reviewee not found" });
  }

  const strengths = normalizeList(req.body.strengths);
  const improvements = normalizeList(req.body.improvements);

  const [result] = await query(
    `INSERT INTO peer_reviews
      (reviewee_id, reviewer_id, project, duration, review_text, communication_rating, technical_rating,
       teamwork_rating, leadership_rating, strengths, improvements, is_anonymous, review_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, CURDATE())`,
    [
      req.body.revieweeId,
      req.user.id,
      req.body.project,
      req.body.duration,
      req.body.review,
      req.body.communication,
      req.body.technical,
      req.body.teamwork,
      req.body.leadership,
      JSON.stringify(strengths),
      JSON.stringify(improvements),
    ]
  );

  const rows = await reviewRows("WHERE pr.id = ?", [result.insertId]);
  res.status(201).json({ review: mapReview(rows[0]) });
});

module.exports = {
  listAnalytics,
  listMine,
  listTeammates,
  createReview,
};
