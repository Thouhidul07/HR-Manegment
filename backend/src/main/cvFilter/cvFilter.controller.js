const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const jobProfiles = {
  "Senior Full Stack Developer": {
    skills: ["react", "node.js", "typescript", "aws", "docker", "postgresql"],
    minExperience: 5,
  },
  "Product Manager": {
    skills: ["roadmap", "analytics", "stakeholder", "agile", "research"],
    minExperience: 4,
  },
  "UI/UX Designer": {
    skills: ["figma", "user research", "prototype", "design system", "accessibility"],
    minExperience: 3,
  },
  "Data Scientist": {
    skills: ["python", "machine learning", "sql", "statistics", "visualization"],
    minExperience: 4,
  },
  "DevOps Engineer": {
    skills: ["aws", "docker", "kubernetes", "ci/cd", "terraform"],
    minExperience: 4,
  },
};

async function ensureCvTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS cv_candidates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(140) NOT NULL,
      email VARCHAR(160) NOT NULL,
      phone VARCHAR(60),
      position VARCHAR(160) NOT NULL,
      score INT NOT NULL DEFAULT 0,
      skills JSON,
      experience DECIMAL(4, 1) NOT NULL DEFAULT 0,
      education VARCHAR(255),
      match_percentage INT NOT NULL DEFAULT 0,
      status ENUM('pending', 'shortlisted', 'rejected') NOT NULL DEFAULT 'pending',
      key_strengths JSON,
      concerns JSON,
      cv_file_path VARCHAR(255),
      uploaded_by INT,
      upload_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

function parseList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fall through to comma parsing.
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function calculateFit({ position, skills, experience }) {
  const profile = jobProfiles[position] || { skills: [], minExperience: 1 };
  const normalizedSkills = skills.map((skill) => skill.toLowerCase());
  const matched = profile.skills.filter((skill) => normalizedSkills.includes(skill));
  const skillScore = profile.skills.length
    ? Math.round((matched.length / profile.skills.length) * 70)
    : 45;
  const experienceScore = Math.min(30, Math.round((Number(experience || 0) / profile.minExperience) * 30));
  const score = Math.max(45, Math.min(98, skillScore + experienceScore));

  const strengths = matched.length
    ? matched.map((skill) => `Matched ${skill}`)
    : ["Profile submitted for recruiter review"];
  const concerns = [];

  if (Number(experience || 0) < profile.minExperience) {
    concerns.push("Below preferred experience level");
  }

  const missing = profile.skills.filter((skill) => !normalizedSkills.includes(skill));
  if (missing.length) {
    concerns.push(`Missing preferred skills: ${missing.slice(0, 3).join(", ")}`);
  }

  return {
    score,
    matchPercentage: score,
    keyStrengths: strengths,
    concerns,
    status: score >= 88 ? "shortlisted" : score < 70 ? "rejected" : "pending",
  };
}

function safeJson(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function formatDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function mapCandidate(row, req) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    position: row.position,
    score: Number(row.score),
    skills: safeJson(row.skills),
    experience: Number(row.experience || 0),
    education: row.education || "",
    matchPercentage: Number(row.match_percentage),
    status: row.status,
    uploadDate: formatDate(row.upload_date),
    keyStrengths: safeJson(row.key_strengths),
    concerns: safeJson(row.concerns),
    cvUrl: row.cv_file_path ? `${req.protocol}://${req.get("host")}/${row.cv_file_path.replace(/\\/g, "/")}` : null,
  };
}

async function seedCandidatesIfEmpty() {
  await ensureCvTables();
  const [[countRow]] = await query("SELECT COUNT(*) AS total FROM cv_candidates");

  if (Number(countRow.total) > 0) {
    return;
  }

  const seedCandidates = [
    ["Sarah Johnson", "sarah.j@email.com", "+1 234 567 8901", "Senior Full Stack Developer", ["React", "Node.js", "TypeScript", "AWS", "Docker", "PostgreSQL"], 7, "M.S. Computer Science - Stanford University"],
    ["Michael Chen", "m.chen@email.com", "+1 234 567 8902", "Senior Full Stack Developer", ["React", "Python", "Django", "MySQL", "Redis", "Git"], 6, "B.S. Software Engineering - MIT"],
    ["Emily Rodriguez", "emily.r@email.com", "+1 234 567 8903", "Senior Full Stack Developer", ["Vue.js", "Node.js", "MongoDB", "Express", "GraphQL"], 5, "B.S. Computer Science - UC Berkeley"],
    ["David Kim", "d.kim@email.com", "+1 234 567 8904", "Senior Full Stack Developer", ["Angular", "Java", "Spring Boot", "Oracle", "Jenkins"], 8, "M.S. Information Systems - Carnegie Mellon"],
    ["Robert Lee", "r.lee@email.com", "+1 234 567 8906", "Senior Full Stack Developer", ["HTML", "CSS", "JavaScript", "WordPress", "Bootstrap"], 3, "B.A. Information Technology - State University"],
  ];

  for (const candidate of seedCandidates) {
    const skills = candidate[4];
    const fit = calculateFit({ position: candidate[3], skills, experience: candidate[5] });

    await query(
      `INSERT INTO cv_candidates
        (name, email, phone, position, score, skills, experience, education, match_percentage,
         status, key_strengths, concerns, upload_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate[0],
        candidate[1],
        candidate[2],
        candidate[3],
        fit.score,
        JSON.stringify(skills),
        candidate[5],
        candidate[6],
        fit.matchPercentage,
        fit.status,
        JSON.stringify(fit.keyStrengths),
        JSON.stringify(fit.concerns),
        "2026-05-28",
      ]
    );
  }
}

const listPositions = asyncHandler(async (req, res) => {
  await seedCandidatesIfEmpty();
  const [rows] = await query(
    "SELECT DISTINCT position FROM cv_candidates ORDER BY position"
  );
  const positions = [...new Set([...Object.keys(jobProfiles), ...rows.map((row) => row.position)])];

  res.json({ positions });
});

const listCandidates = asyncHandler(async (req, res) => {
  await seedCandidatesIfEmpty();
  const params = [];
  const filters = [];

  if (req.query.position) {
    filters.push("position = ?");
    params.push(req.query.position);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const [rows] = await query(
    `SELECT * FROM cv_candidates ${where} ORDER BY score DESC, upload_date DESC, created_at DESC`,
    params
  );

  res.json({ candidates: rows.map((row) => mapCandidate(row, req)) });
});

const createCandidate = asyncHandler(async (req, res) => {
  await ensureCvTables();
  const skills = parseList(req.body.skills);
  const fit = calculateFit({
    position: req.body.position,
    skills,
    experience: req.body.experience,
  });
  const filePath = req.file ? `uploads/${req.file.filename}` : null;

  const [result] = await query(
    `INSERT INTO cv_candidates
      (name, email, phone, position, score, skills, experience, education, match_percentage,
       status, key_strengths, concerns, cv_file_path, uploaded_by, upload_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
    [
      req.body.name,
      req.body.email,
      req.body.phone || null,
      req.body.position,
      fit.score,
      JSON.stringify(skills),
      req.body.experience || 0,
      req.body.education || null,
      fit.matchPercentage,
      fit.status,
      JSON.stringify(fit.keyStrengths),
      JSON.stringify(fit.concerns),
      filePath,
      req.user.id,
    ]
  );

  const [rows] = await query("SELECT * FROM cv_candidates WHERE id = ?", [result.insertId]);
  res.status(201).json({ candidate: mapCandidate(rows[0], req) });
});

const updateCandidateStatus = asyncHandler(async (req, res) => {
  await ensureCvTables();
  const [result] = await query(
    "UPDATE cv_candidates SET status = ? WHERE id = ?",
    [req.body.status, req.params.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Candidate not found" });
  }

  const [rows] = await query("SELECT * FROM cv_candidates WHERE id = ?", [req.params.id]);
  res.json({ candidate: mapCandidate(rows[0], req) });
});

module.exports = {
  listPositions,
  listCandidates,
  createCandidate,
  updateCandidateStatus,
};
