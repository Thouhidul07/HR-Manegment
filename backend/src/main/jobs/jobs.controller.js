const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { calculateFit, ensureCvTables } = require("../cvFilter/cvFilter.controller");

async function ensureJobsTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS job_circulars (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL DEFAULT 1,
      title VARCHAR(180) NOT NULL,
      department VARCHAR(100) NOT NULL,
      employment_type ENUM('Full-time', 'Part-time', 'Contract') NOT NULL DEFAULT 'Full-time',
      location VARCHAR(160) NOT NULL,
      salary_range VARCHAR(100),
      description TEXT,
      requirements JSON,
      responsibilities JSON,
      benefits JSON,
      deadline DATE,
      status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL DEFAULT 1,
      circular_id INT NOT NULL,
      applicant_name VARCHAR(140) NOT NULL,
      email VARCHAR(160) NOT NULL,
      phone VARCHAR(60) NOT NULL,
      cover_letter TEXT,
      cv_file VARCHAR(255),
      skills JSON,
      experience_years DECIMAL(4, 1) NOT NULL DEFAULT 0,
      status ENUM('submitted', 'reviewing', 'shortlisted', 'rejected', 'hired') NOT NULL DEFAULT 'submitted',
      score INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (circular_id) REFERENCES job_circulars(id) ON DELETE CASCADE
    )
  `);
}

async function seedJobsIfEmpty() {
  await ensureJobsTables();
  const [[countRow]] = await query("SELECT COUNT(*) AS total FROM job_circulars");
  if (Number(countRow.total) > 0) {
    return;
  }

  const seedCirculars = [
    {
      title: "Operations Executive",
      department: "Operations",
      employment_type: "Full-time",
      location: "Gulshan, Dhaka",
      salary_range: "৳120,000 - ৳150,000",
      description: "We're looking for an experienced Operations Executive to improve day-to-day HR service delivery and office operations.",
      requirements: JSON.stringify([
        "Bachelor's degree in Computer Science, Business, or related field",
        "5+ years of operations or HR operations experience",
        "Strong analytical and problem-solving skills",
        "Experience coordinating cross-functional business workflows",
        "Excellent communication and leadership skills"
      ]),
      responsibilities: JSON.stringify([
        "Coordinate office operations and HR service workflows",
        "Work closely with HR, finance, and administration teams",
        "Monitor process quality and operational performance",
        "Maintain vendor, asset, and employee service records",
        "Prepare weekly operations reports"
      ]),
      benefits: JSON.stringify([
        "Competitive salary and festival bonus",
        "Health insurance",
        "Provident fund",
        "Flexible work arrangements",
        "Professional development budget"
      ]),
      deadline: "2026-07-15",
      status: "published"
    },
    {
      title: "Software Engineer",
      department: "Information Technology",
      employment_type: "Full-time",
      location: "Banani, Dhaka",
      salary_range: "৳90,000 - ৳120,000",
      description: "Join our technology team to build reliable HR and employee self-service features.",
      requirements: JSON.stringify([
        "3+ years of software engineering experience",
        "Strong React and Node.js fundamentals",
        "Experience with REST APIs and relational databases",
        "Understanding of secure application development",
        "Strong debugging and communication skills"
      ]),
      responsibilities: JSON.stringify([
        "Build and maintain web application features",
        "Integrate frontend components with backend APIs",
        "Write clean, maintainable application code",
        "Collaborate with HR and operations stakeholders",
        "Support production issue investigation"
      ]),
      benefits: JSON.stringify([
        "Competitive compensation package",
        "Health and wellness benefits",
        "Hybrid work flexibility",
        "Learning and development opportunities",
        "Modern design tools and equipment"
      ]),
      deadline: "2026-07-20",
      status: "published"
    },
    {
      title: "Accounts Officer",
      department: "Finance",
      employment_type: "Full-time",
      location: "Dhanmondi, Dhaka",
      salary_range: "৳110,000 - ৳140,000",
      description: "We're seeking an Accounts Officer to support payroll, reimbursements, and monthly finance reporting.",
      requirements: JSON.stringify([
        "Bachelor's or Master's degree in Accounting, Finance, or related field",
        "4+ years of finance or accounts experience",
        "Strong skills in Excel and accounting workflows",
        "Experience with payroll or reimbursement processing",
        "Excellent documentation and communication skills"
      ]),
      responsibilities: JSON.stringify([
        "Prepare monthly payroll and expense summaries",
        "Verify reimbursement and vendor payment records",
        "Collaborate with HR and administration teams",
        "Prepare financial reports for management",
        "Maintain accurate finance documentation"
      ]),
      benefits: JSON.stringify([
        "Competitive salary and festival bonuses",
        "Hybrid work option",
        "Comprehensive health benefits",
        "Provident fund",
        "Conference and training budget"
      ]),
      deadline: "2026-07-25",
      status: "published"
    }
  ];

  for (const job of seedCirculars) {
    await query(
      `INSERT INTO job_circulars 
        (company_id, title, department, employment_type, location, salary_range, description, requirements, responsibilities, benefits, deadline, status, created_by)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        job.title,
        job.department,
        job.employment_type,
        job.location,
        job.salary_range,
        job.description,
        job.requirements,
        job.responsibilities,
        job.benefits,
        job.deadline,
        job.status
      ]
    );
  }
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
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
  } catch {}
  return String(value).split(",").map(item => item.trim()).filter(Boolean);
}

function mapCircular(row) {
  return {
    id: Number(row.id),
    companyId: Number(row.company_id),
    title: row.title,
    department: row.department,
    employmentType: row.employment_type,
    location: row.location,
    salaryRange: row.salary_range,
    description: row.description || "",
    requirements: safeJson(row.requirements),
    responsibilities: safeJson(row.responsibilities),
    benefits: safeJson(row.benefits),
    deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapApplication(row, req) {
  return {
    id: Number(row.id),
    companyId: Number(row.company_id),
    circularId: Number(row.circular_id),
    circularTitle: row.circular_title || "",
    applicantName: row.applicant_name,
    email: row.email,
    phone: row.phone,
    coverLetter: row.cover_letter || "",
    cvFile: row.cv_file ? `${req.protocol}://${req.get("host")}/${row.cv_file.replace(/\\/g, "/")}` : null,
    skills: safeJson(row.skills),
    experienceYears: Number(row.experience_years),
    status: row.status,
    score: Number(row.score),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ── Public Endpoints ────────────────────────────────────────────────────────

const listPublicJobs = asyncHandler(async (req, res) => {
  await seedJobsIfEmpty();
  const [rows] = await query(
    "SELECT * FROM job_circulars WHERE status = 'published' AND (deadline IS NULL OR deadline >= CURDATE()) ORDER BY deadline ASC, created_at DESC"
  );
  res.json({ circulars: rows.map(mapCircular) });
});

const getPublicJob = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [rows] = await query(
    "SELECT * FROM job_circulars WHERE id = ? AND status = 'published'",
    [req.params.id]
  );
  if (!rows || rows.length === 0) {
    return res.status(404).json({ message: "Job circular not found or closed" });
  }
  res.json({ circular: mapCircular(rows[0]) });
});

const submitApplication = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  await ensureCvTables();

  const [circRows] = await query("SELECT * FROM job_circulars WHERE id = ?", [req.params.id]);
  if (!circRows || circRows.length === 0) {
    return res.status(404).json({ message: "Job circular not found" });
  }
  const circular = circRows[0];

  const skills = parseList(req.body.skills);
  const experienceYears = Number(req.body.experience_years || 0);

  // Calculate score/fit using cvFilter helper
  const fit = calculateFit({
    position: circular.title,
    skills,
    experience: experienceYears
  });

  const cvFile = req.file ? `uploads/${req.file.filename}` : null;

  // Insert application
  const [appResult] = await query(
    `INSERT INTO job_applications
      (company_id, circular_id, applicant_name, email, phone, cover_letter, cv_file, skills, experience_years, status, score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`,
    [
      circular.company_id,
      circular.id,
      req.body.name || req.body.applicant_name,
      req.body.email,
      req.body.phone,
      req.body.cover_letter || null,
      cvFile,
      JSON.stringify(skills),
      experienceYears,
      fit.score
    ]
  );

  // Sync / create record in cv_candidates
  const candidateStatus = fit.status; // 'pending', 'shortlisted', 'rejected'
  await query(
    `INSERT INTO cv_candidates
      (company_id, name, email, phone, position, score, skills, experience, education, match_percentage, status, key_strengths, concerns, cv_file_path, upload_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [
      circular.company_id,
      req.body.name || req.body.applicant_name,
      req.body.email,
      req.body.phone || null,
      circular.title,
      fit.score,
      JSON.stringify(skills),
      experienceYears,
      req.body.education || "N/A",
      fit.matchPercentage,
      candidateStatus,
      JSON.stringify(fit.keyStrengths),
      JSON.stringify(fit.concerns),
      cvFile
    ]
  );

  res.status(201).json({
    message: "Application submitted successfully",
    applicationId: appResult.insertId,
    score: fit.score
  });
});

// ── Protected Endpoints ─────────────────────────────────────────────────────

const listJobs = asyncHandler(async (req, res) => {
  await seedJobsIfEmpty();
  const [rows] = await query(
    "SELECT * FROM job_circulars WHERE company_id = ? ORDER BY created_at DESC",
    [req.user.company_id]
  );
  res.json({ circulars: rows.map(mapCircular) });
});

const createJob = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const requirements = parseList(req.body.requirements);
  const responsibilities = parseList(req.body.responsibilities);
  const benefits = parseList(req.body.benefits);

  const [result] = await query(
    `INSERT INTO job_circulars
      (company_id, title, department, employment_type, location, salary_range, description, requirements, responsibilities, benefits, deadline, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      req.user.id
    ]
  );

  const [rows] = await query("SELECT * FROM job_circulars WHERE id = ?", [result.insertId]);
  res.status(201).json({ circular: mapCircular(rows[0]) });
});

const updateJob = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const requirements = parseList(req.body.requirements);
  const responsibilities = parseList(req.body.responsibilities);
  const benefits = parseList(req.body.benefits);

  const [result] = await query(
    `UPDATE job_circulars 
     SET title = ?, department = ?, employment_type = ?, location = ?, salary_range = ?, 
         description = ?, requirements = ?, responsibilities = ?, benefits = ?, deadline = ?, status = ?
     WHERE id = ? AND company_id = ?`,
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
      req.user.company_id
    ]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Job circular not found" });
  }

  const [rows] = await query("SELECT * FROM job_circulars WHERE id = ?", [req.params.id]);
  res.json({ circular: mapCircular(rows[0]) });
});

const deleteJob = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [result] = await query(
    "DELETE FROM job_circulars WHERE id = ? AND company_id = ?",
    [req.params.id, req.user.company_id]
  );
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Job circular not found" });
  }
  res.json({ message: "Job circular deleted successfully" });
});

const updateJobStatus = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [result] = await query(
    "UPDATE job_circulars SET status = ? WHERE id = ? AND company_id = ?",
    [req.body.status, req.params.id, req.user.company_id]
  );
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Job circular not found" });
  }
  const [rows] = await query("SELECT * FROM job_circulars WHERE id = ?", [req.params.id]);
  res.json({ circular: mapCircular(rows[0]) });
});

const listApplications = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  const [rows] = await query(
    `SELECT ja.*, jc.title AS circular_title 
     FROM job_applications ja
     JOIN job_circulars jc ON ja.circular_id = jc.id
     WHERE ja.circular_id = ? AND ja.company_id = ?
     ORDER BY ja.score DESC, ja.created_at DESC`,
    [req.params.id, req.user.company_id]
  );
  res.json({ applications: rows.map(row => mapApplication(row, req)) });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  await ensureCvTables();

  const [result] = await query(
    "UPDATE job_applications SET status = ? WHERE id = ? AND company_id = ?",
    [req.body.status, req.params.applicationId, req.user.company_id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Application not found" });
  }

  // Fetch application info to sync to cv_candidates
  const [appRows] = await query(
    `SELECT ja.*, jc.title AS position 
     FROM job_applications ja
     JOIN job_circulars jc ON ja.circular_id = jc.id
     WHERE ja.id = ?`,
    [req.params.applicationId]
  );

  if (appRows && appRows.length > 0) {
    const app = appRows[0];
    // status mapping: reviewing -> pending, shortlisted -> shortlisted, rejected -> rejected, hired -> shortlisted, submitted -> pending
    let candStatus = "pending";
    if (app.status === "shortlisted" || app.status === "hired") {
      candStatus = "shortlisted";
    } else if (app.status === "rejected") {
      candStatus = "rejected";
    }

    try {
      await query(
        `UPDATE cv_candidates 
         SET status = ? 
         WHERE email = ? AND position = ? AND company_id = ?`,
        [candStatus, app.email, app.position, req.user.company_id]
      );
    } catch (err) {
      console.error("Failed to sync status to cv_candidates:", err);
    }
  }

  const [rows] = await query(
    `SELECT ja.*, jc.title AS circular_title 
     FROM job_applications ja
     JOIN job_circulars jc ON ja.circular_id = jc.id
     WHERE ja.id = ?`,
    [req.params.applicationId]
  );
  res.json({ application: mapApplication(rows[0], req) });
});

const updateApplicationScore = asyncHandler(async (req, res) => {
  await ensureJobsTables();
  await ensureCvTables();

  const [result] = await query(
    "UPDATE job_applications SET score = ? WHERE id = ? AND company_id = ?",
    [req.body.score, req.params.applicationId, req.user.company_id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Application not found" });
  }

  // Fetch application info to sync to cv_candidates
  const [appRows] = await query(
    `SELECT ja.*, jc.title AS position 
     FROM job_applications ja
     JOIN job_circulars jc ON ja.circular_id = jc.id
     WHERE ja.id = ?`,
    [req.params.applicationId]
  );

  if (appRows && appRows.length > 0) {
    const app = appRows[0];
    try {
      await query(
        `UPDATE cv_candidates 
         SET score = ?, match_percentage = ? 
         WHERE email = ? AND position = ? AND company_id = ?`,
        [app.score, app.score, app.email, app.position, req.user.company_id]
      );
    } catch (err) {
      console.error("Failed to sync score to cv_candidates:", err);
    }
  }

  const [rows] = await query(
    `SELECT ja.*, jc.title AS circular_title 
     FROM job_applications ja
     JOIN job_circulars jc ON ja.circular_id = jc.id
     WHERE ja.id = ?`,
    [req.params.applicationId]
  );
  res.json({ application: mapApplication(rows[0], req) });
});

module.exports = {
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
  updateApplicationScore
};
