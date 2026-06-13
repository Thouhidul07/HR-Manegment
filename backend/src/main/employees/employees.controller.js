const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const bcrypt = require("bcryptjs");
const { ensureUserStatusWorkflow } = require("../../utils/userStatus");
const { ensureCompanyColumns, DEMO_COMPANY } = require("../../utils/companyScope");
const { logAudit } = require("../../utils/auditLogger");

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
  await ensureUserStatusWorkflow();
  await ensureCompanyColumns();
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
    company_id: row.company_id,
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
    employee_code: row.employee_code || "",
  };
}

function auditEmployee(req, action, employee, description, metadata = {}) {
  return logAudit({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action,
    module: "Employee Management",
    entityType: "user",
    entityId: employee?.id || Number(req.params.id),
    description,
    metadata,
    ipAddress: req.ip,
  });
}

async function getEmployeeById(id, companyId = DEMO_COMPANY.id) {
  await ensureEmployeeColumns();
  const [employees] = await query(
    `SELECT id, company_id, name, email, role, phone, department, designation, hire_date, salary, status, avatar, employee_code
     FROM users
     WHERE id = ? AND company_id = ?`,
    [id, companyId]
  );
  return employees[0] ? mapEmployee(employees[0]) : null;
}

const listEmployees = asyncHandler(async (req, res) => {
  await ensureEmployeeColumns();
  const roleFilter = ["hr_manager", "project_manager"].includes(req.user.role)
    ? "WHERE company_id = ? AND role IN ('employee', 'hr_manager') AND status IN ('active', 'inactive')"
    : "WHERE company_id = ? AND role IN ('employee', 'hr_manager', 'project_manager', 'admin') AND status IN ('active', 'inactive')";
  const [employees] = await query(
    `SELECT id, company_id, name, email, role, phone, department, designation, hire_date, salary, status, avatar, employee_code
     FROM users
     ${roleFilter}
     ORDER BY status = 'inactive', role = 'admin' DESC, role = 'hr_manager' DESC, name`,
    [req.user.company_id]
  );
  res.json({ employees: employees.map(mapEmployee) });
});

const getEmployee = asyncHandler(async (req, res) => {
  const employee = await getEmployeeById(req.params.id, req.user.company_id);
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({ employee });
});

const createEmployee = asyncHandler(async (req, res) => {
  await ensureEmployeeColumns();
  const { name, email, phone, department, designation, hireDate, salary, status } = req.body;
  const passwordHash = await bcrypt.hash(DEFAULT_EMPLOYEE_PASSWORD, 10);

  let employeeCode = req.body.employeeCode || req.body.employee_code;
  if (!employeeCode) {
    const [rows] = await query(
      "SELECT employee_code FROM users WHERE company_id = ? AND employee_code LIKE 'NX-EMP-%' ORDER BY id DESC LIMIT 1",
      [req.user.company_id]
    );
    let nextNum = 9;
    if (rows.length > 0) {
      const match = rows[0].employee_code.match(/NX-EMP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    employeeCode = `NX-EMP-${String(nextNum).padStart(3, "0")}`;
  }

  const [result] = await query(
    `INSERT INTO users
      (company_id, employee_code, name, email, password, role, phone, department, designation, hire_date, salary, status)
     VALUES (?, ?, ?, ?, ?, 'employee', ?, ?, ?, ?, ?, ?)`,
    [
      req.user.company_id,
      employeeCode,
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

  const employee = await getEmployeeById(result.insertId, req.user.company_id);
  await auditEmployee(req, "user_created", employee, "Created employee " + employee.name, { email: employee.email });
  res.status(201).json({
    employee,
    message: `Employee created. Default password: ${DEFAULT_EMPLOYEE_PASSWORD}`,
  });
});

const updateEmployee = asyncHandler(async (req, res) => {
  await ensureEmployeeColumns();
  const existing = await getEmployeeById(req.params.id, req.user.company_id);

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
    employeeCode: "employee_code",
    employee_code: "employee_code",
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

  params.push(req.params.id, req.user.company_id);
  await query(`UPDATE users SET ${fields.join(", ")} WHERE id = ? AND company_id = ?`, params);

  const employee = await getEmployeeById(req.params.id, req.user.company_id);
  await auditEmployee(req, "user_updated", employee, "Updated user " + employee.name, { fields: Object.keys(req.body) });
  res.json({ employee });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  await ensureEmployeeColumns();
  const existing = await getEmployeeById(req.params.id, req.user.company_id);

  if (!existing) {
    return res.status(404).json({ message: "Employee not found" });
  }

  if (existing.role === "admin" && Number(existing.id) === Number(req.user.id)) {
    return res.status(400).json({ message: "You cannot deactivate your own admin account" });
  }

  await query("UPDATE users SET status = 'inactive' WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
  await auditEmployee(req, "user_deleted", existing, "Deactivated user " + existing.name, { previousStatus: existing.status });
  res.json({ message: "Employee deactivated" });
});

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
