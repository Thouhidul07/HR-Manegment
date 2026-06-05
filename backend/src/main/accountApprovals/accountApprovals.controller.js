const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureUserStatusWorkflow } = require("../../utils/userStatus");

function mapAccount(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone || "",
    department: row.department || "",
    status: row.status,
    registeredAt: row.created_at,
  };
}

const listPendingAccounts = asyncHandler(async (req, res) => {
  await ensureUserStatusWorkflow();

  const [accounts] = await query(
    `SELECT id, name, email, role, phone, department, status, created_at
     FROM users
     WHERE status IN ('pending', 'rejected')
     ORDER BY status = 'rejected', created_at DESC`
  );

  res.json({ accounts: accounts.map(mapAccount) });
});

const approveAccount = asyncHandler(async (req, res) => {
  await ensureUserStatusWorkflow();

  const [accounts] = await query("SELECT id, role, status FROM users WHERE id = ? LIMIT 1", [req.params.id]);
  if (!accounts.length) {
    return res.status(404).json({ message: "Account request not found" });
  }

  if (accounts[0].role !== "employee") {
    return res.status(403).json({ message: "Only employee self-registrations can be approved here" });
  }

  if (accounts[0].status !== "pending") {
    return res.status(400).json({ message: "Only pending accounts can be approved" });
  }

  await query("UPDATE users SET status = 'active' WHERE id = ?", [req.params.id]);
  const [rows] = await query(
    "SELECT id, name, email, role, phone, department, status, created_at FROM users WHERE id = ?",
    [req.params.id]
  );

  res.json({ message: "Account approved", account: mapAccount(rows[0]) });
});

const rejectAccount = asyncHandler(async (req, res) => {
  await ensureUserStatusWorkflow();

  const [accounts] = await query("SELECT id, role, status FROM users WHERE id = ? LIMIT 1", [req.params.id]);
  if (!accounts.length) {
    return res.status(404).json({ message: "Account request not found" });
  }

  if (accounts[0].role !== "employee") {
    return res.status(403).json({ message: "Only employee self-registrations can be rejected here" });
  }

  if (accounts[0].status !== "pending") {
    return res.status(400).json({ message: "Only pending accounts can be rejected" });
  }

  await query("UPDATE users SET status = 'rejected' WHERE id = ?", [req.params.id]);
  const [rows] = await query(
    "SELECT id, name, email, role, phone, department, status, created_at FROM users WHERE id = ?",
    [req.params.id]
  );

  res.json({ message: "Account rejected", account: mapAccount(rows[0]) });
});

module.exports = { listPendingAccounts, approveAccount, rejectAccount };
