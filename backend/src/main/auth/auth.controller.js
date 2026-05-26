const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "development_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = "employee" } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email.toLowerCase(), hashedPassword, role]
  );

  res.status(201).json({
    message: "User registered",
    user: { id: result.insertId, name, email: email.toLowerCase(), role },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const [users] = await query(
    "SELECT id, name, email, password, role, avatar FROM users WHERE email = ? LIMIT 1",
    [email.toLowerCase()]
  );

  if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const { password: _password, ...user } = users[0];
  res.json({ user, token: signToken(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, me };
