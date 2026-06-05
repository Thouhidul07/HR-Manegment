const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureUserStatusWorkflow } = require("../../utils/userStatus");

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "development_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

const register = asyncHandler(async (req, res) => {
  await ensureUserStatusWorkflow();

  const { name, email, password, department, phone } = req.body;
  const normalizedEmail = email.toLowerCase();

  const [existingUsers] = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
  if (existingUsers.length) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await query(
    `INSERT INTO users (name, email, password, role, phone, department, status)
     VALUES (?, ?, ?, 'employee', ?, ?, 'pending')`,
    [name, normalizedEmail, hashedPassword, phone || null, department || null]
  );

  res.status(201).json({
    message: "Account created. Awaiting admin approval.",
    user: { id: result.insertId, name, email: normalizedEmail, role: "employee", status: "pending" },
  });
});

const login = asyncHandler(async (req, res) => {
  await ensureUserStatusWorkflow();

  const { email, password } = req.body;
  const [users] = await query(
    "SELECT id, name, email, password, role, avatar, status FROM users WHERE email = ? LIMIT 1",
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

  const { password: _password, ...user } = users[0];
  res.json({ user, token: signToken(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, me };
