const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureCompanyColumns, ensureDemoCompanyData, initials } = require("../../utils/companyScope");

const DEFAULT_STEPS = {
  onboarding: [
    [1, "Document Verification", "Verify and upload all required documents"],
    [2, "IT Setup", "Email, laptop, and system access setup"],
    [3, "Orientation", "Complete company orientation program"],
    [4, "Training", "Complete role-specific training modules"],
    [5, "Team Introduction", "Meet team members and manager"],
  ],
  offboarding: [
    [1, "Resignation/Termination Confirmation", "Confirm exit request and final working date"],
    [2, "Knowledge Transfer", "Complete handover of responsibilities and documents"],
    [3, "Asset Return", "Return laptop, access card, and company assets"],
    [4, "Account Deactivation", "Disable email, HRSpace, and internal system access"],
    [5, "Final Settlement", "Complete payroll, benefits, and final clearance"],
  ],
};

function companyId(req) {
  return req.user.company_id || 1;
}

async function ensureLifecycleTables(cid = 1) {
  await ensureCompanyColumns();

  await query(`
    CREATE TABLE IF NOT EXISTS lifecycle_cases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      user_id INT NOT NULL,
      type ENUM('onboarding','offboarding') NOT NULL,
      status ENUM('not_started','in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
      start_date DATE,
      target_date DATE,
      completed_at DATETIME,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS lifecycle_steps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      type ENUM('onboarding','offboarding') NOT NULL,
      step_order INT NOT NULL,
      title VARCHAR(160) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_lifecycle_step (company_id, type, step_order)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS lifecycle_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      case_id INT NOT NULL,
      step_id INT NOT NULL,
      title VARCHAR(180) NOT NULL,
      status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
      due_date DATE,
      completed_by INT,
      completed_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES lifecycle_cases(id) ON DELETE CASCADE,
      FOREIGN KEY (step_id) REFERENCES lifecycle_steps(id) ON DELETE CASCADE,
      FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  for (const [type, steps] of Object.entries(DEFAULT_STEPS)) {
    for (const [order, title, description] of steps) {
      await query(
        `INSERT INTO lifecycle_steps (company_id, type, step_order, title, description)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`,
        [cid, type, order, title, description]
      );
    }
  }

  await seedLifecycleDemoDataIfEmpty(cid);
}

async function seedLifecycleDemoDataIfEmpty(cid) {
  const [[countRow]] = await query("SELECT COUNT(*) AS total FROM lifecycle_cases WHERE company_id = ?", [cid]);
  if (Number(countRow.total) > 0) {
    return;
  }

  const [users] = await query(
    "SELECT id, email FROM users WHERE email IN ('employee06@nexoratech.com', 'employee07@nexoratech.com', 'employee08@nexoratech.com') AND company_id = ?",
    [cid]
  );

  const userMap = {};
  for (const u of users) {
    userMap[u.email] = u.id;
  }

  const emp06Id = userMap['employee06@nexoratech.com'];
  const emp07Id = userMap['employee07@nexoratech.com'];
  const emp08Id = userMap['employee08@nexoratech.com'];

  if (emp07Id) {
    const [res07] = await query(
      `INSERT INTO lifecycle_cases (company_id, user_id, type, status, start_date, target_date, created_by)
       VALUES (?, ?, 'onboarding', 'in_progress', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1)`,
      [cid, emp07Id]
    );
    const [steps] = await query(
      "SELECT id, title FROM lifecycle_steps WHERE company_id = ? AND type = 'onboarding' ORDER BY step_order",
      [cid]
    );
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let status = "pending";
      let completedBy = null;
      let completedAt = null;
      if (i < 2) {
        status = "completed";
        completedBy = 1;
        completedAt = new Date();
      } else if (i === 2) {
        status = "in_progress";
      }
      await query(
        `INSERT INTO lifecycle_tasks (company_id, case_id, step_id, title, status, completed_by, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cid, res07.insertId, step.id, step.title, status, completedBy, completedAt]
      );
    }
  }

  if (emp08Id) {
    const [res08] = await query(
      `INSERT INTO lifecycle_cases (company_id, user_id, type, status, start_date, target_date, created_by)
       VALUES (?, ?, 'onboarding', 'in_progress', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1)`,
      [cid, emp08Id]
    );
    const [steps] = await query(
      "SELECT id, title FROM lifecycle_steps WHERE company_id = ? AND type = 'onboarding' ORDER BY step_order",
      [cid]
    );
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await query(
        `INSERT INTO lifecycle_tasks (company_id, case_id, step_id, title, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [cid, res08.insertId, step.id, step.title]
      );
    }
  }

  if (emp06Id) {
    const [res06] = await query(
      `INSERT INTO lifecycle_cases (company_id, user_id, type, status, start_date, target_date, created_by)
       VALUES (?, ?, 'offboarding', 'in_progress', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1)`,
      [cid, emp06Id]
    );
    const [steps] = await query(
      "SELECT id, title FROM lifecycle_steps WHERE company_id = ? AND type = 'offboarding' ORDER BY step_order",
      [cid]
    );
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let status = "pending";
      let completedBy = null;
      let completedAt = null;
      if (i === 0) {
        status = "completed";
        completedBy = 1;
        completedAt = new Date();
      } else if (i === 1) {
        status = "in_progress";
      }
      await query(
        `INSERT INTO lifecycle_tasks (company_id, case_id, step_id, title, status, completed_by, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cid, res06.insertId, step.id, step.title, status, completedBy, completedAt]
      );
    }
  }
}

function mapTask(row) {
  return {
    id: row.id,
    stepId: row.step_id,
    stepOrder: Number(row.step_order || 0),
    title: row.title,
    description: row.description || "",
    status: row.status,
    dueDate: row.due_date,
    completedAt: row.completed_at,
  };
}

function caseFromRows(rows) {
  if (!rows.length) return null;
  const first = rows[0];
  const tasks = rows.filter((row) => row.task_id).map((row) => mapTask({
    id: row.task_id,
    step_id: row.step_id,
    step_order: row.step_order,
    title: row.task_title,
    description: row.step_description,
    status: row.task_status,
    due_date: row.due_date,
    completed_at: row.completed_at,
  }));
  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const currentTask = tasks.find((task) => task.status !== "completed") || tasks[tasks.length - 1] || null;

  return {
    id: first.id,
    type: first.type,
    status: first.status,
    startDate: first.start_date,
    targetDate: first.target_date,
    completedAt: first.completed_at,
    progress,
    currentStep: currentTask?.stepOrder || 0,
    employee: {
      id: first.user_id,
      name: first.employee_name,
      email: first.email,
      role: first.role,
      department: first.department || "",
      designation: first.designation || "",
      avatar: first.avatar || initials(first.employee_name),
    },
    tasks,
  };
}

async function fetchCases(companyId, type) {
  const params = [companyId];
  let typeFilter = "";
  if (type) {
    typeFilter = " AND lc.type = ?";
    params.push(type);
  }

  const [rows] = await query(
    `SELECT lc.*, u.name AS employee_name, u.email, u.role, u.department, u.designation, u.avatar,
       lt.id AS task_id, lt.step_id, lt.title AS task_title, lt.status AS task_status, lt.due_date, lt.completed_at,
       ls.step_order, ls.description AS step_description
     FROM lifecycle_cases lc
     JOIN users u ON u.id = lc.user_id
     LEFT JOIN lifecycle_tasks lt ON lt.case_id = lc.id
     LEFT JOIN lifecycle_steps ls ON ls.id = lt.step_id
     WHERE lc.company_id = ?${typeFilter}
     ORDER BY lc.status = 'completed', lc.created_at DESC, ls.step_order`,
    params
  );

  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.id)) grouped.set(row.id, []);
    grouped.get(row.id).push(row);
  }

  return Array.from(grouped.values()).map(caseFromRows).filter(Boolean);
}

const getStats = asyncHandler(async (req, res) => {
  await ensureDemoCompanyData();
  const cid = companyId(req);
  await ensureLifecycleTables(cid);
  const type = req.query.type === "offboarding" ? "offboarding" : "onboarding";

  const [activeRows] = await query(
    "SELECT COUNT(*) AS total FROM lifecycle_cases WHERE company_id = ? AND type = ? AND status IN ('not_started','in_progress')",
    [cid, type]
  );
  const [completedRows] = await query(
    `SELECT COUNT(*) AS total FROM lifecycle_cases
     WHERE company_id = ? AND type = ? AND status = 'completed'
       AND completed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    [cid, type]
  );
  const [pendingTaskRows] = await query(
    `SELECT COUNT(lt.id) AS total
     FROM lifecycle_tasks lt
     JOIN lifecycle_cases lc ON lc.id = lt.case_id
     WHERE lc.company_id = ? AND lc.type = ? AND lt.status <> 'completed' AND lc.status <> 'cancelled'`,
    [cid, type]
  );
  const [avgRows] = await query(
    `SELECT AVG(DATEDIFF(COALESCE(completed_at, NOW()), start_date)) AS avg_days
     FROM lifecycle_cases
     WHERE company_id = ? AND type = ? AND start_date IS NOT NULL`,
    [cid, type]
  );

  res.json({
    activeOnboarding: Number(activeRows[0]?.total || 0),
    completedThisMonth: Number(completedRows[0]?.total || 0),
    pendingTasks: Number(pendingTaskRows[0]?.total || 0),
    averageTimeDays: Number(Number(avgRows[0]?.avg_days || 0).toFixed(1)),
  });
});

const listCases = asyncHandler(async (req, res) => {
  await ensureDemoCompanyData();
  const cid = companyId(req);
  await ensureLifecycleTables(cid);
  const type = ["onboarding", "offboarding"].includes(req.query.type) ? req.query.type : undefined;
  const cases = await fetchCases(cid, type);
  res.json({ cases });
});

const createCase = asyncHandler(async (req, res) => {
  await ensureDemoCompanyData();
  const cid = companyId(req);
  await ensureLifecycleTables(cid);
  const { userId, type, startDate, targetDate } = req.body;

  const [users] = await query(
    "SELECT id FROM users WHERE id = ? AND company_id = ? AND status IN ('active', 'inactive') LIMIT 1",
    [userId, cid]
  );
  if (!users.length) return res.status(404).json({ message: "Eligible user not found" });

  const [existing] = await query(
    `SELECT id FROM lifecycle_cases
     WHERE company_id = ? AND user_id = ? AND type = ? AND status IN ('not_started','in_progress')
     LIMIT 1`,
    [cid, userId, type]
  );
  if (existing.length) return res.status(409).json({ message: "User already has an active lifecycle case of this type" });

  const [result] = await query(
    `INSERT INTO lifecycle_cases (company_id, user_id, type, status, start_date, target_date, created_by)
     VALUES (?, ?, ?, 'in_progress', ?, ?, ?)`,
    [cid, userId, type, startDate || null, targetDate || null, req.user.id]
  );

  const [steps] = await query(
    "SELECT id, title FROM lifecycle_steps WHERE company_id = ? AND type = ? ORDER BY step_order",
    [cid, type]
  );
  for (const step of steps) {
    await query(
      `INSERT INTO lifecycle_tasks (company_id, case_id, step_id, title, status, due_date)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [cid, result.insertId, step.id, step.title, targetDate || null]
    );
  }

  const cases = await fetchCases(cid, type);
  const created = cases.find((item) => Number(item.id) === Number(result.insertId));
  res.status(201).json({ case: created });
});

const updateCase = asyncHandler(async (req, res) => {
  const cid = companyId(req);
  await ensureLifecycleTables(cid);
  const fields = [];
  const params = [];
  const allowed = {
    status: "status",
    targetDate: "target_date",
    startDate: "start_date",
  };

  for (const [bodyKey, column] of Object.entries(allowed)) {
    if (req.body[bodyKey] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(req.body[bodyKey] || null);
    }
  }

  if (req.body.status === "completed") {
    fields.push("completed_at = COALESCE(completed_at, NOW())");
  }

  if (!fields.length) return res.status(400).json({ message: "No case updates provided" });

  params.push(req.params.id, cid);
  const [result] = await query(`UPDATE lifecycle_cases SET ${fields.join(", ")} WHERE id = ? AND company_id = ?`, params);
  if (!result.affectedRows) return res.status(404).json({ message: "Lifecycle case not found" });

  const cases = await fetchCases(cid);
  res.json({ case: cases.find((item) => Number(item.id) === Number(req.params.id)) });
});

const updateTask = asyncHandler(async (req, res) => {
  const cid = companyId(req);
  await ensureLifecycleTables(cid);
  const status = req.body.status;

  const [result] = await query(
    `UPDATE lifecycle_tasks lt
     JOIN lifecycle_cases lc ON lc.id = lt.case_id
     SET lt.status = ?,
         lt.completed_by = CASE WHEN ? = 'completed' THEN ? ELSE NULL END,
         lt.completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END
     WHERE lt.id = ? AND lt.company_id = ? AND lc.company_id = ?`,
    [status, status, req.user.id, status, req.params.id, cid, cid]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Lifecycle task not found" });

  const [caseRows] = await query("SELECT case_id FROM lifecycle_tasks WHERE id = ? AND company_id = ?", [req.params.id, cid]);
  const caseId = caseRows[0].case_id;
  const [remaining] = await query(
    "SELECT COUNT(*) AS total FROM lifecycle_tasks WHERE case_id = ? AND company_id = ? AND status <> 'completed'",
    [caseId, cid]
  );

  if (Number(remaining[0].total || 0) === 0) {
    await query(
      "UPDATE lifecycle_cases SET status = 'completed', completed_at = COALESCE(completed_at, NOW()) WHERE id = ? AND company_id = ?",
      [caseId, cid]
    );
  } else {
    await query(
      "UPDATE lifecycle_cases SET status = 'in_progress', completed_at = NULL WHERE id = ? AND company_id = ? AND status = 'completed'",
      [caseId, cid]
    );
  }

  const cases = await fetchCases(cid);
  res.json({ case: cases.find((item) => Number(item.id) === Number(caseId)) });
});

const eligibleUsers = asyncHandler(async (req, res) => {
  await ensureDemoCompanyData();
  const cid = companyId(req);
  await ensureLifecycleTables(cid);
  const type = req.query.type === "offboarding" ? "offboarding" : "onboarding";

  const [users] = await query(
    `SELECT u.id, u.name, u.email, u.role, u.department, u.designation, u.status, u.avatar
     FROM users u
     WHERE u.company_id = ?
       AND u.role IN ('employee', 'hr_manager')
       AND u.status IN ('active', 'inactive')
       AND NOT EXISTS (
         SELECT 1 FROM lifecycle_cases lc
         WHERE lc.user_id = u.id AND lc.company_id = u.company_id AND lc.type = ? AND lc.status IN ('not_started','in_progress')
       )
     ORDER BY u.role = 'hr_manager' DESC, u.name`,
    [cid, type]
  );

  res.json({ users: users.map((user) => ({ ...user, avatar: user.avatar || initials(user.name) })) });
});

const cancelCase = asyncHandler(async (req, res) => {
  const cid = companyId(req);
  await ensureLifecycleTables(cid);

  const [result] = await query(
    "UPDATE lifecycle_cases SET status = 'cancelled', completed_at = NULL WHERE id = ? AND company_id = ?",
    [req.params.id, cid]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Lifecycle case not found" });

  const cases = await fetchCases(cid);
  res.json({ case: cases.find((item) => Number(item.id) === Number(req.params.id)) });
});

const reopenCase = asyncHandler(async (req, res) => {
  const cid = companyId(req);
  await ensureLifecycleTables(cid);

  const [result] = await query(
    "UPDATE lifecycle_cases SET status = 'in_progress', completed_at = NULL WHERE id = ? AND company_id = ?",
    [req.params.id, cid]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Lifecycle case not found" });

  const [tasks] = await query(
    "SELECT id, status FROM lifecycle_tasks WHERE case_id = ? AND company_id = ? ORDER BY step_id DESC",
    [req.params.id, cid]
  );
  const allCompleted = tasks.every((t) => t.status === "completed");
  if (allCompleted && tasks.length) {
    await query(
      "UPDATE lifecycle_tasks SET status = 'in_progress', completed_by = NULL, completed_at = NULL WHERE id = ? AND company_id = ?",
      [tasks[0].id, cid]
    );
  }

  const cases = await fetchCases(cid);
  res.json({ case: cases.find((item) => Number(item.id) === Number(req.params.id)) });
});

const completeAllTasks = asyncHandler(async (req, res) => {
  const cid = companyId(req);
  await ensureLifecycleTables(cid);

  await query(
    `UPDATE lifecycle_tasks lt
     JOIN lifecycle_cases lc ON lc.id = lt.case_id
     SET lt.status = 'completed',
         lt.completed_by = ?,
         lt.completed_at = NOW()
     WHERE lt.case_id = ? AND lt.company_id = ? AND lc.company_id = ?`,
    [req.user.id, req.params.id, cid, cid]
  );

  const [result] = await query(
    "UPDATE lifecycle_cases SET status = 'completed', completed_at = NOW() WHERE id = ? AND company_id = ?",
    [req.params.id, cid]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Lifecycle case not found" });

  const cases = await fetchCases(cid);
  res.json({ case: cases.find((item) => Number(item.id) === Number(req.params.id)) });
});

module.exports = {
  getStats,
  listCases,
  createCase,
  updateCase,
  updateTask,
  eligibleUsers,
  cancelCase,
  reopenCase,
  completeAllTasks,
};
