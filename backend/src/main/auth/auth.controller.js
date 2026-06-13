const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureUserStatusWorkflow } = require("../../utils/userStatus");
const { ensureDemoCompanyData, companyIdFromEmail } = require("../../utils/companyScope");
const { logAudit } = require("../../utils/auditLogger");

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "development_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

const register = asyncHandler(async (req, res) => {
  await ensureUserStatusWorkflow();
  await ensureDemoCompanyData();

  const { name, email, password, department, phone } = req.body;
  const normalizedEmail = email.toLowerCase();

  const [existingUsers] = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
  if (existingUsers.length) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const companyId = await companyIdFromEmail(normalizedEmail);

  const [rows] = await query(
    "SELECT employee_code FROM users WHERE company_id = ? AND employee_code LIKE 'NX-EMP-%' ORDER BY id DESC LIMIT 1",
    [companyId]
  );
  let nextNum = 9;
  if (rows.length > 0) {
    const match = rows[0].employee_code.match(/NX-EMP-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  const employeeCode = `NX-EMP-${String(nextNum).padStart(3, "0")}`;

  const [result] = await query(
    `INSERT INTO users (company_id, employee_code, name, email, password, role, phone, department, status)
     VALUES (?, ?, ?, ?, ?, 'employee', ?, ?, 'pending')`,
    [companyId, employeeCode, name, normalizedEmail, hashedPassword, phone || null, department || null]
  );

  res.status(201).json({
    message: "Account created. Awaiting admin approval.",
    user: { id: result.insertId, name, email: normalizedEmail, role: "employee", employee_code: employeeCode, status: "pending" },
  });
});

const login = asyncHandler(async (req, res) => {
  await ensureUserStatusWorkflow();
  await ensureDemoCompanyData();

  const { email, password } = req.body;
  const [users] = await query(
    `SELECT u.id, u.company_id, u.name, u.email, u.password, u.role, u.avatar, u.status, u.employee_code,
            c.name AS company_name, c.domain AS company_domain
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.email = ? LIMIT 1`,
    [email.toLowerCase()]
  );

  if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (users[0].status === "pending") {
    return res.status(403).json({ message: "Account is awaiting admin approval." });
  }

  if (users[0].status === "rejected") {
    return res.status(403).json({ message: "Account registration was rejected." });
  }

  if (users[0].status !== "active") {
    return res.status(403).json({ message: "Account is not active. Please contact your administrator." });
  }

  const user = {
    id: users[0].id,
    company_id: users[0].company_id,
    name: users[0].name,
    email: users[0].email,
    role: users[0].role,
    avatar: users[0].avatar,
    status: users[0].status,
    employee_code: users[0].employee_code,
    company_name: users[0].company_name,
    company_domain: users[0].company_domain,
  };
  await logAudit({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "login",
    module: "Authentication",
    entityType: "user_session",
    entityId: user.id,
    description: user.name + " logged in",
    ipAddress: req.ip,
  });
  res.json({ user, token: signToken(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

const logout = asyncHandler(async (req, res) => {
  await logAudit({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: "logout",
    module: "Authentication",
    entityType: "user_session",
    entityId: req.user.id,
    description: req.user.name + " logged out",
    ipAddress: req.ip,
  });
  res.json({ message: "Logged out" });
});

module.exports = { register, login, logout, me };
