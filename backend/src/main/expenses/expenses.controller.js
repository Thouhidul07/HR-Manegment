const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function mapExpense(row) {
  return {
    id: row.id,
    employee: row.employee_name,
    avatar: row.employee_name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    type: row.category,
    amount: Number(row.amount),
    date: row.expense_date,
    status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
    description: row.description || "",
    receiptUrl: row.receipt_path ? `/uploads/${row.receipt_path}` : null,
    reviewedBy: row.reviewer_name || null,
  };
}

const listExpenses = asyncHandler(async (req, res) => {
  const where = req.user.role === "employee" ? "WHERE e.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [rows] = await query(
    `SELECT e.*, u.name AS employee_name, reviewer.name AS reviewer_name
     FROM expenses e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = e.reviewed_by
     ${where}
     ORDER BY e.created_at DESC`,
    params
  );

  res.json({ expenses: rows.map(mapExpense) });
});

const createExpense = asyncHandler(async (req, res) => {
  const { category, amount, expenseDate, description } = req.body;
  const receiptPath = req.file ? req.file.filename : null;
  const [result] = await query(
    `INSERT INTO expenses (user_id, category, amount, expense_date, description, receipt_path)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, category, amount, expenseDate, description || null, receiptPath]
  );

  const [rows] = await query(
    `SELECT e.*, u.name AS employee_name, reviewer.name AS reviewer_name
     FROM expenses e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = e.reviewed_by
     WHERE e.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ expense: mapExpense(rows[0]) });
});

const updateExpense = asyncHandler(async (req, res) => {
  const [existingRows] = await query("SELECT * FROM expenses WHERE id = ?", [req.params.id]);

  if (!existingRows.length) {
    return res.status(404).json({ message: "Expense not found" });
  }

  const existing = existingRows[0];
  const isOwner = existing.user_id === req.user.id;
  const isManager = ["admin", "hr_manager"].includes(req.user.role);

  if (!isOwner && !isManager) {
    return res.status(403).json({ message: "Not authorized to update this expense" });
  }

  if (isOwner && existing.status !== "pending") {
    return res.status(400).json({ message: "Only pending expenses can be edited" });
  }

  const fields = [];
  const params = [];
  const allowed = {
    category: "category",
    amount: "amount",
    expenseDate: "expense_date",
    description: "description",
  };

  for (const [bodyKey, column] of Object.entries(allowed)) {
    if (req.body[bodyKey] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(req.body[bodyKey] || null);
    }
  }

  if (req.file) {
    fields.push("receipt_path = ?");
    params.push(req.file.filename);
  }

  if (!fields.length) {
    return res.status(400).json({ message: "No expense updates provided" });
  }

  params.push(req.params.id);
  await query(`UPDATE expenses SET ${fields.join(", ")} WHERE id = ?`, params);

  const [rows] = await query(
    `SELECT e.*, u.name AS employee_name, reviewer.name AS reviewer_name
     FROM expenses e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = e.reviewed_by
     WHERE e.id = ?`,
    [req.params.id]
  );

  res.json({ expense: mapExpense(rows[0]) });
});

const updateExpenseStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const [result] = await query(
    "UPDATE expenses SET status = ?, reviewed_by = ? WHERE id = ?",
    [status, req.user.id, req.params.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Expense not found" });
  }

  const [rows] = await query(
    `SELECT e.*, u.name AS employee_name, reviewer.name AS reviewer_name
     FROM expenses e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = e.reviewed_by
     WHERE e.id = ?`,
    [req.params.id]
  );

  res.json({ expense: mapExpense(rows[0]) });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const [rows] = await query("SELECT * FROM expenses WHERE id = ?", [req.params.id]);

  if (!rows.length) {
    return res.status(404).json({ message: "Expense not found" });
  }

  const expense = rows[0];
  const isOwner = expense.user_id === req.user.id;
  const isManager = ["admin", "hr_manager"].includes(req.user.role);

  if (!isOwner && !isManager) {
    return res.status(403).json({ message: "Not authorized to delete this expense" });
  }

  if (isOwner && expense.status !== "pending") {
    return res.status(400).json({ message: "Only pending expenses can be deleted" });
  }

  await query("DELETE FROM expenses WHERE id = ?", [req.params.id]);
  res.json({ message: "Expense deleted" });
});

module.exports = { listExpenses, createExpense, updateExpense, updateExpenseStatus, deleteExpense };
