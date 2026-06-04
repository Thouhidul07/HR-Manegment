const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const bcrypt = require("bcryptjs");

const DEFAULT_EMPLOYEE_PASSWORD = "Emp@1234";

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

async function ensureEmployeeColumns() {
  await addColumnIfMissing("users", "salary", "DECIMAL(12, 2) DEFAULT 0");
  await addColumnIfMissing("users", "status", "ENUM('active', 'inactive') NOT NULL DEFAULT 'active'");
}

function initials(name = "") {
  return String(name)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone || "",
    department: row.department || "",
    designation: row.designation || "",
    hire_date: row.hire_date,
    salary: Number(row.salary || 0),
    status: row.status || "active",
    avatar: row.avatar || initials(row.name),
  };
}

async function getEmployeeById(id) {
  await ensureEmployeeColumns();
  const [employees] = await query(
    `SELECT id, name, email, role, phone, department, designation, hire_date, salary, status, avatar
     FROM users
     WHERE id = ?`,
    [id]
  );
  return employees[0] ? mapEmployee(employees[0]) : null;
}

const listEmployees = asyncHandler(async (req, res) => {
  await ensureEmployeeColumns();
  const roleFilter = req.user.role === "hr_manager"
    ? "WHERE role IN ('employee', 'hr_manager')"
    : "WHERE role IN ('employee', 'hr_manager', 'admin')";
  const [employees] = await query(
    `SELECT id, name, email, role, phone, department, designation, hire_date, salary, status, avatar
     FROM users
     ${roleFilter}
     ORDER BY status = 'inactive', name`
  );
  res.json({ employees: employees.map(mapEmployee) });
});

const getEmployee = asyncHandler(async (req, res) => {
  const employee = await getEmployeeById(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({ employee });
});

const createEmployee = asyncHandler(async (req, res) => {
  await ensureEmployeeColumns();
  const { name, email, phone, department, designation, hireDate, salary, status } = req.body;
  const passwordHash = await bcrypt.hash(DEFAULT_EMPLOYEE_PASSWORD, 10);

  const [result] = await query(
    `INSERT INTO users
      (name, email, password, role, phone, department, designation, hire_date, salary, status)
     VALUES (?, ?, ?, 'employee', ?, ?, ?, ?, ?, ?)`,
    [
      name,
      email,
      passwordHash,
      phone || null,
      department || null,
      designation || null,
      hireDate || null,
      Number(salary || 0),
      status || "active",
    ]
  );

  const employee = await getEmployeeById(result.insertId);
  res.status(201).json({
    employee,
    message: `Employee created. Default password: ${DEFAULT_EMPLOYEE_PASSWORD}`,
  });
});

const updateEmployee = asyncHandler(async (req, res) => {
  await ensureEmployeeColumns();
  const existing = await getEmployeeById(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: "Employee not found" });
  }

  if (req.user.role === "hr_manager" && existing.role === "admin") {
    return res.status(403).json({ message: "You do not have permission to manage admin accounts" });
  }

  const fields = [];
  const params = [];
  const allowedFields = {
    name: "name",
    email: "email",
    phone: "phone",
    department: "department",
    designation: "designation",
    hireDate: "hire_date",
    salary: "salary",
    status: "status",
  };

  for (const [bodyKey, column] of Object.entries(allowedFields)) {
    if (req.body[bodyKey] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(bodyKey === "salary" ? Number(req.body[bodyKey] || 0) : req.body[bodyKey] || null);
    }
  }

  if (!fields.length) {
    return res.status(400).json({ message: "No employee updates provided" });
  }

  params.push(req.params.id);
  await query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);

  const employee = await getEmployeeById(req.params.id);
  res.json({ employee });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  await ensureEmployeeColumns();
  const existing = await getEmployeeById(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: "Employee not found" });
  }

  if (existing.role === "admin" && Number(existing.id) === Number(req.user.id)) {
    return res.status(400).json({ message: "You cannot deactivate your own admin account" });
  }

  await query("UPDATE users SET status = 'inactive' WHERE id = ?", [req.params.id]);
  res.json({ message: "Employee deactivated" });
});

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
