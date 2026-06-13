const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { logAudit } = require("../../utils/auditLogger");

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

async function ensureJobsTables() {
  await query(
    "CREATE TABLE IF NOT EXISTS job_circulars (" +
      "id INT AUTO_INCREMENT PRIMARY KEY, " +
      "company_id INT NOT NULL DEFAULT 1, " +
      "title VARCHAR(180) NOT NULL, " +
      "department VARCHAR(100) NOT NULL, " +
      "location VARCHAR(160) NOT NULL, " +
      "salary_range VARCHAR(100), " +
      "description TEXT, " +
      "requirements JSON, " +
      "responsibilities JSON, " +
      "benefits JSON, " +
      "deadline DATE, " +
      "status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft', " +
      "created_by INT, " +
      "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
      "FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE, " +
      "FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL" +
    ")"
  );

  await addColumnIfMissing("job_circulars", "job_type", "VARCHAR(50) NOT NULL DEFAULT 'Full-time'");

  await query(
    "CREATE TABLE IF NOT EXISTS job_applications (" +
      "id INT AUTO_INCREMENT PRIMARY KEY, " +
      "company_id INT NOT NULL DEFAULT 1, " +
      "circular_id INT NOT NULL, " +
      "applicant_name VARCHAR(140) NOT NULL, " +
      "email VARCHAR(160) NOT NULL, " +
      "phone VARCHAR(60) NOT NULL, " +
      "cover_letter TEXT, " +
      "skills JSON, " +
      "experience_years DECIMAL(4, 1) NOT NULL DEFAULT 0, " +
      "status ENUM('submitted', 'reviewing', 'shortlisted', 'rejected', 'hired') NOT NULL DEFAULT 'submitted', " +
      "score INT NOT NULL DEFAULT 0, " +
      "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
      "FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE, " +
      "FOREIGN KEY (circular_id) REFERENCES job_circulars(id) ON DELETE CASCADE" +
    ")"
  );

  await addColumnIfMissing("job_applications", "resume_path", "VARCHAR(255)");
  await addColumnIfMissing("job_applications", "notes", "TEXT");
  await addColumnIfMissing("job_applications", "applied_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
}

function safeJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {}
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function calculateScore({ skills, experienceYears }) {
  const skillScore = Math.min(parseList(skills).length * 12, 70);
  const experienceScore = Math.min(Number(experienceYears || 0) * 6, 30);
  return Math.max(0, Math.min(100, Math.round(skillScore + experienceScore)));
}

function mapCircular(row) {
  return {
    id: Number(row.id),
    companyId: Number(row.company_id),
    title: row.title,
    department: row.department,
    jobType: row.job_type || row.employment_type || "Full-time",
    employmentType: row.job_type || row.employment_type || "Full-time",
    location: row.location,
    salaryRange: row.salary_range,
    description: row.description || "",
    requirements: safeJson(row.requirements),
    responsibilities: safeJson(row.responsibilities),
    benefits: safeJson(row.benefits),
    deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApplication(row, req) {
  const resume = row.resume_path || row.cv_file;
  return {
    id: Number(row.id),
    companyId: Number(row.company_id),
    circularId: Number(row.circular_id),
    circularTitle: row.circular_title || "",
    applicantName: row.applicant_name,
    email: row.email,
    phone: row.phone,
    coverLetter: row.cover_letter || "",
    cvFile: resume ? req.protocol + "://" + req.get("host") + "/" + resume.replace(/\\/g, "/") : null,
    cvUrl: resume ? req.protocol + "://" + req.get("host") + "/" + resume.replace(/\\/g, "/") : null,
    resumePath: resume || "",
    skills: safeJson(row.skills),
    experienceYears: Number(row.experience_years),
    status: row.status,
    score: Number(row.score),
    notes: row.notes || "",
    appliedAt: row.applied_at || row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function audit(req, action, entityType, entityId, description, metadata) {
  await logAudit({
    actorId: req.user?.id,
    actorName: req.user?.name,
    actorRole: req.user?.role,
    action,
    module: "Recruitment",
    entityType,
    entityId,
    description,
    metadata,
    ipAddress: req.ip,
  });
}

const listPublicJobs = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [rows] = await query(
    "SELECT * FROM job_circulars WHERE status = 'published' AND (deadline IS NULL OR deadline >= CURDATE()) ORDER BY deadline ASC, created_at DESC"
  );
  res.json({ circulars: rows.map(mapCircular) });
});

const getPublicJob = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [rows] = await query("SELECT * FROM job_circulars WHERE id = ? AND status = 'published'", [req.params.id]);
  if (!rows.length) {
    return res.status(404).json({ message: "Job circular not found or closed" });
  }
  res.json({ circular: mapCircular(rows[0]) });
});

const submitApplication = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [circRows] = await query("SELECT * FROM job_circulars WHERE id = ? AND status = 'published'", [req.params.id]);
  if (!circRows.length) {
    return res.status(404).json({ message: "Job circular not found or closed" });
  }

  const circular = circRows[0];
  const skills = parseList(req.body.skills);
  const experienceYears = Number(req.body.experience_years || req.body.experienceYears || 0);
  const score = calculateScore({ skills, experienceYears });
  const cvFile = req.file ? "uploads/" + req.file.filename : null;

  const [result] = await query(
    "INSERT INTO job_applications (company_id, circular_id, applicant_name, email, phone, cover_letter, cv_file, skills, experience_years, status, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)",
    [
      circular.company_id,
      circular.id,
      req.body.name || req.body.applicant_name,
      req.body.email,
      req.body.phone,
      req.body.cover_letter || req.body.coverLetter || null,
      cvFile,
      JSON.stringify(skills),
      experienceYears,
      score,
    ]
  );

  res.status(201).json({ message: "Application submitted successfully", applicationId: result.insertId, score });
});

const listJobs = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [rows] = await query("SELECT * FROM job_circulars WHERE company_id = ? ORDER BY created_at DESC", [req.user.company_id]);
  res.json({ circulars: rows.map(mapCircular) });
});

const createJob = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const requirements = parseList(req.body.requirements);
  const responsibilities = parseList(req.body.responsibilities);
  const benefits = parseList(req.body.benefits);

  const [result] = await query(
    "INSERT INTO job_circulars (company_id, title, department, employment_type, location, salary_range, description, requirements, responsibilities, benefits, deadline, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      req.user.company_id,
      req.body.title,
      req.body.department,
      req.body.employmentType || req.body.employment_type || "Full-time",
      req.body.location,
      req.body.salaryRange || req.body.salary_range || null,
      req.body.description || null,
      JSON.stringify(requirements),
      JSON.stringify(responsibilities),
      JSON.stringify(benefits),
      req.body.deadline || null,
      req.body.status || "draft",
      req.user.id,
    ]
  );

  const [rows] = await query("SELECT * FROM job_circulars WHERE id = ? AND company_id = ?", [result.insertId, req.user.company_id]);
  await audit(req, "job_circular_created", "job_circular", result.insertId, "Created job circular " + req.body.title, {
    title: req.body.title,
    status: req.body.status || "draft",
  });
  res.status(201).json({ circular: mapCircular(rows[0]) });
});

const updateJob = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const requirements = parseList(req.body.requirements);
  const responsibilities = parseList(req.body.responsibilities);
  const benefits = parseList(req.body.benefits);

  const [result] = await query(
    "UPDATE job_circulars SET title = ?, department = ?, employment_type = ?, location = ?, salary_range = ?, description = ?, requirements = ?, responsibilities = ?, benefits = ?, deadline = ?, status = ? WHERE id = ? AND company_id = ?",
    [
      req.body.title,
      req.body.department,
      req.body.employmentType || req.body.employment_type || "Full-time",
      req.body.location,
      req.body.salaryRange || req.body.salary_range || null,
      req.body.description || null,
      JSON.stringify(requirements),
      JSON.stringify(responsibilities),
      JSON.stringify(benefits),
      req.body.deadline || null,
      req.body.status || "draft",
      req.params.id,
      req.user.company_id,
    ]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Job circular not found" });
  }

  const [rows] = await query("SELECT * FROM job_circulars WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
  await audit(req, "job_circular_updated", "job_circular", req.params.id, "Updated job circular " + rows[0].title, {
    title: rows[0].title,
    status: rows[0].status,
  });
  res.json({ circular: mapCircular(rows[0]) });
});

const deleteJob = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [rows] = await query("SELECT title FROM job_circulars WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
  const [result] = await query("DELETE FROM job_circulars WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Job circular not found" });
  }

  await audit(req, "job_circular_deleted", "job_circular", req.params.id, "Deleted job circular " + (rows[0]?.title || req.params.id));
  res.json({ message: "Job circular deleted successfully" });
});

const updateJobStatus = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [result] = await query("UPDATE job_circulars SET status = ? WHERE id = ? AND company_id = ?", [
    req.body.status,
    req.params.id,
    req.user.company_id,
  ]);
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Job circular not found" });
  }

  const [rows] = await query("SELECT * FROM job_circulars WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
  await audit(req, "job_circular_status_updated", "job_circular", req.params.id, "Updated job circular status to " + req.body.status, {
    title: rows[0].title,
    status: req.body.status,
  });
  res.json({ circular: mapCircular(rows[0]) });
});

const listApplications = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [rows] = await query(
    "SELECT ja.*, jc.title AS circular_title FROM job_applications ja JOIN job_circulars jc ON ja.circular_id = jc.id WHERE ja.circular_id = ? AND ja.company_id = ? ORDER BY ja.score DESC, ja.created_at DESC",
    [req.params.id, req.user.company_id]
  );
  res.json({ applications: rows.map((row) => mapApplication(row, req)) });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [result] = await query("UPDATE job_applications SET status = ? WHERE id = ? AND company_id = ?", [
    req.body.status,
    req.params.applicationId,
    req.user.company_id,
  ]);
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Application not found" });
  }

  const [rows] = await query(
    "SELECT ja.*, jc.title AS circular_title FROM job_applications ja JOIN job_circulars jc ON ja.circular_id = jc.id WHERE ja.id = ? AND ja.company_id = ?",
    [req.params.applicationId, req.user.company_id]
  );
  await audit(req, "job_application_status_updated", "job_application", req.params.applicationId, "Updated application status to " + req.body.status, {
    applicantName: rows[0]?.applicant_name,
    circularTitle: rows[0]?.circular_title,
    status: req.body.status,
  });
  res.json({ application: mapApplication(rows[0], req) });
});

const updateApplicationScore = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [result] = await query("UPDATE job_applications SET score = ? WHERE id = ? AND company_id = ?", [
    req.body.score,
    req.params.applicationId,
    req.user.company_id,
  ]);
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Application not found" });
  }

  const [rows] = await query(
    "SELECT ja.*, jc.title AS circular_title FROM job_applications ja JOIN job_circulars jc ON ja.circular_id = jc.id WHERE ja.id = ? AND ja.company_id = ?",
    [req.params.applicationId, req.user.company_id]
  );
  await audit(req, "job_application_score_updated", "job_application", req.params.applicationId, "Updated application score to " + req.body.score, {
    applicantName: rows[0]?.applicant_name,
    circularTitle: rows[0]?.circular_title,
    score: req.body.score,
  });
  res.json({ application: mapApplication(rows[0], req) });
});

module.exports = {
  ensureJobsTables,
  listPublicJobs,
  getPublicJob,
  submitApplication,
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  listApplications,
  updateApplicationStatus,
  updateApplicationScore,
};
