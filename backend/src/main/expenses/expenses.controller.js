const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

async function ensureExpensePaymentsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS expense_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      expense_id INT NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      payment_date DATE NOT NULL,
      method VARCHAR(80) NOT NULL DEFAULT 'Bank Transfer',
      reference VARCHAR(120),
      paid_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_expense_payment (expense_id),
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
      FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

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
    payment: row.payment_id
      ? {
          id: row.payment_id,
          amount: Number(row.payment_amount),
          paymentDate: row.payment_date,
          method: row.payment_method,
          reference: row.payment_reference || "",
          paidBy: row.paid_by_name || null,
        }
      : null,
  };
}

const listExpenses = asyncHandler(async (req, res) => {
  await ensureExpensePaymentsTable();
  const where = req.user.role === "employee" 
    ? "WHERE e.user_id = ? AND u.company_id = ?" 
    : "WHERE u.company_id = ?";
  const params = req.user.role === "employee" 
    ? [req.user.id, req.user.company_id] 
    : [req.user.company_id];
  const [rows] = await query(
    `SELECT e.*, u.name AS employee_name, reviewer.name AS reviewer_name,
       ep.id AS payment_id, ep.amount AS payment_amount, ep.payment_date,
       ep.method AS payment_method, ep.reference AS payment_reference,
       paid_by.name AS paid_by_name
     FROM expenses e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = e.reviewed_by
     LEFT JOIN expense_payments ep ON ep.expense_id = e.id
     LEFT JOIN users paid_by ON paid_by.id = ep.paid_by
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
    `SELECT e.*, u.name AS employee_name, reviewer.name AS reviewer_name,
       NULL AS payment_id, NULL AS payment_amount, NULL AS payment_date,
       NULL AS payment_method, NULL AS payment_reference, NULL AS paid_by_name
     FROM expenses e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = e.reviewed_by
     WHERE e.id = ? AND u.company_id = ?`,
    [result.insertId, req.user.company_id]
  );

  res.status(201).json({ expense: mapExpense(rows[0]) });
});

const updateExpense = asyncHandler(async (req, res) => {
  await ensureExpensePaymentsTable();
  const [existingRows] = await query(
    "SELECT e.* FROM expenses e JOIN users u ON u.id = e.user_id WHERE e.id = ? AND u.company_id = ?",
    [req.params.id, req.user.company_id]
  );

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
    `SELECT e.*, u.name AS employee_name, reviewer.name AS reviewer_name,
       ep.id AS payment_id, ep.amount AS payment_amount, ep.payment_date,
       ep.method AS payment_method, ep.reference AS payment_reference,
       paid_by.name AS paid_by_name
     FROM expenses e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = e.reviewed_by
     LEFT JOIN expense_payments ep ON ep.expense_id = e.id
     LEFT JOIN users paid_by ON paid_by.id = ep.paid_by
     WHERE e.id = ? AND u.company_id = ?`,
    [req.params.id, req.user.company_id]
  );

  res.json({ expense: mapExpense(rows[0]) });
});

const updateExpenseStatus = asyncHandler(async (req, res) => {
  const { status, paymentDate, paymentMethod, paymentReference } = req.body;
  await ensureExpensePaymentsTable();

  const [expenseRows] = await query(
    "SELECT e.* FROM expenses e JOIN users u ON u.id = e.user_id WHERE e.id = ? AND u.company_id = ?",
    [req.params.id, req.user.company_id]
  );

  if (!expenseRows.length) {
    return res.status(404).json({ message: "Expense not found" });
  }

  const expense = expenseRows[0];
  const [result] = await query(
    `UPDATE expenses e
     JOIN users u ON u.id = e.user_id
     SET e.status = ?, e.reviewed_by = ?
     WHERE e.id = ? AND u.company_id = ?`,
    [status, req.user.id, req.params.id, req.user.company_id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Expense not found" });
  }

  if (status === "paid") {
    await query(
      `INSERT INTO expense_payments (expense_id, amount, payment_date, method, reference, paid_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         amount = VALUES(amount),
         payment_date = VALUES(payment_date),
         method = VALUES(method),
         reference = VALUES(reference),
         paid_by = VALUES(paid_by)`,
      [
        req.params.id,
        expense.amount,
        paymentDate || new Date().toISOString().slice(0, 10),
        paymentMethod || "Bank Transfer",
        paymentReference || null,
        req.user.id,
      ]
    );
  }

  const [rows] = await query(
    `SELECT e.*, u.name AS employee_name, reviewer.name AS reviewer_name,
       ep.id AS payment_id, ep.amount AS payment_amount, ep.payment_date,
       ep.method AS payment_method, ep.reference AS payment_reference,
       paid_by.name AS paid_by_name
     FROM expenses e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = e.reviewed_by
     LEFT JOIN expense_payments ep ON ep.expense_id = e.id
     LEFT JOIN users paid_by ON paid_by.id = ep.paid_by
     WHERE e.id = ? AND u.company_id = ?`,
    [req.params.id, req.user.company_id]
  );

  res.json({ expense: mapExpense(rows[0]) });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const [rows] = await query(
    "SELECT e.* FROM expenses e JOIN users u ON u.id = e.user_id WHERE e.id = ? AND u.company_id = ?",
    [req.params.id, req.user.company_id]
  );

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

  await query(
    `DELETE e FROM expenses e
     JOIN users u ON u.id = e.user_id
     WHERE e.id = ? AND u.company_id = ?`,
     [req.params.id, req.user.company_id]
  );
  res.json({ message: "Expense deleted" });
});

module.exports = { listExpenses, createExpense, updateExpense, updateExpenseStatus, deleteExpense };
