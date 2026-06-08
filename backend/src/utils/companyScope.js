const { query } = require("../config/database");

const DEMO_COMPANY = {
  id: 1,
  name: "NexoraTech Ltd",
  domain: "nexoratech.com",
};

const PASSWORD_HASHES = {
  admin: "$2a$10$7IAQrKRQwkIHv2eZSIRDj.S1O0ove29.KjCkCXD3369iJk9dTKngi",
  hr_manager: "$2a$10$cteqOigYNxjG6l8d.G7tNOSlBprtlBiCUvj03ljajfV.0CMwhd.Uq",
  employee: "$2a$10$01IGc2QXmHlUFUvG1m/7keb7uYwZosrCQnr5SXNLazmXI0jPQj3Wy",
};

const departments = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
  "Customer Support",
  "Training & Development",
];

function normalizeRole(role) {
  if (role === "System Admin") return "admin";
  if (role === "HR Manager") return "hr_manager";
  if (role === "Employee") return "employee";
  return role;
}

async function tableExists(table) {
  const [rows] = await query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

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
  if (await tableExists(table)) {
    if (!(await columnExists(table, column))) {
      await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}

async function ensureCompaniesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(140) NOT NULL,
      domain VARCHAR(160) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await query(
    `INSERT INTO companies (id, name, domain)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), domain = VALUES(domain)`,
    [DEMO_COMPANY.id, DEMO_COMPANY.name, DEMO_COMPANY.domain]
  );
}

async function ensureCompanyColumns() {
  await ensureCompaniesTable();
  await addColumnIfMissing("users", "company_id", "INT NULL AFTER id");
  await query("UPDATE users SET company_id = ? WHERE company_id IS NULL", [DEMO_COMPANY.id]);

  await addColumnIfMissing("users", "employee_code", "VARCHAR(50) NULL UNIQUE AFTER company_id");

  await addColumnIfMissing("training_sessions", "company_id", "INT NULL AFTER id");
  await query("UPDATE training_sessions SET company_id = ? WHERE company_id IS NULL", [DEMO_COMPANY.id]);

  await addColumnIfMissing("lifecycle_cases", "company_id", "INT NULL AFTER id");
  await addColumnIfMissing("lifecycle_steps", "company_id", "INT NULL AFTER id");
  await addColumnIfMissing("lifecycle_tasks", "company_id", "INT NULL AFTER id");
}

function initials(name = "") {
  return String(name)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function demoUserRows() {
  return [
    {
      employeeCode: "NX-ADM-001",
      name: "System Admin",
      email: "admin@nexoratech.com",
      role: "admin",
      department: "System Administration",
      designation: "Administrator",
      hireDate: "2024-01-01",
      salary: 120000,
      password: PASSWORD_HASHES.admin,
      phone: "+8801712345601",
    },
    {
      employeeCode: "NX-HR-001",
      name: "HR Manager 01",
      email: "hr.manager01@nexoratech.com",
      role: "hr_manager",
      department: "Human Resources",
      designation: "Lead HR Manager",
      hireDate: "2024-02-01",
      salary: 96000,
      password: PASSWORD_HASHES.hr_manager,
      phone: "+8801712345602",
    },
    {
      employeeCode: "NX-EMP-001",
      name: "Employee 01",
      email: "employee01@nexoratech.com",
      role: "employee",
      department: "Information Technology",
      designation: "Software Engineer",
      hireDate: "2024-03-01",
      salary: 75000,
      password: PASSWORD_HASHES.employee,
      phone: "+8801712345603",
    },
    {
      employeeCode: "NX-EMP-002",
      name: "Employee 02",
      email: "employee02@nexoratech.com",
      role: "employee",
      department: "Finance",
      designation: "Accounts Officer",
      hireDate: "2024-04-15",
      salary: 68000,
      password: PASSWORD_HASHES.employee,
      phone: "+8801712345604",
    },
    {
      employeeCode: "NX-EMP-003",
      name: "Employee 03",
      email: "employee03@nexoratech.com",
      role: "employee",
      department: "Marketing",
      designation: "Marketing Executive",
      hireDate: "2024-05-10",
      salary: 62000,
      password: PASSWORD_HASHES.employee,
      phone: "+8801712345605",
    },
    {
      employeeCode: "NX-HR-002",
      name: "HR Manager 02",
      email: "hr.manager02@nexoratech.com",
      role: "hr_manager",
      department: "Human Resources",
      designation: "HR Manager",
      hireDate: "2024-02-02",
      salary: 92000,
      password: PASSWORD_HASHES.hr_manager,
      phone: "+8801712345606",
    },
    {
      employeeCode: "NX-EMP-004",
      name: "Employee 04",
      email: "employee04@nexoratech.com",
      role: "employee",
      department: "Sales",
      designation: "Sales Executive",
      hireDate: "2024-04-04",
      salary: 53000,
      password: PASSWORD_HASHES.employee,
      phone: "+8801812345004",
    },
    {
      employeeCode: "NX-EMP-005",
      name: "Employee 05",
      email: "employee05@nexoratech.com",
      role: "employee",
      department: "Operations",
      designation: "Operations Executive",
      hireDate: "2024-05-05",
      salary: 53750,
      password: PASSWORD_HASHES.employee,
      phone: "+8801812345005",
    },
    {
      employeeCode: "NX-EMP-006",
      name: "Employee 06",
      email: "employee06@nexoratech.com",
      role: "employee",
      department: "Customer Support",
      designation: "Customer Support Executive",
      hireDate: "2024-06-06",
      salary: 54500,
      password: PASSWORD_HASHES.employee,
      phone: "+8801812345006",
    },
    {
      employeeCode: "NX-EMP-007",
      name: "Employee 07",
      email: "employee07@nexoratech.com",
      role: "employee",
      department: "Training & Development",
      designation: "Training & Development Executive",
      hireDate: "2024-07-07",
      salary: 55250,
      password: PASSWORD_HASHES.employee,
      phone: "+8801812345007",
    },
    {
      employeeCode: "NX-EMP-008",
      name: "Employee 08",
      email: "employee08@nexoratech.com",
      role: "employee",
      department: "Administration",
      designation: "Administration Executive",
      hireDate: "2024-08-08",
      salary: 56000,
      password: PASSWORD_HASHES.employee,
      phone: "+8801812345008",
    },
  ];
}

let hasSeeded = false;

async function ensureDemoCompanyData() {
  if (hasSeeded) return;
  hasSeeded = true;

  await ensureCompanyColumns();

  await query(
    "UPDATE users SET email = 'admin@nexoratech.com', company_id = ?, name = 'System Admin' WHERE email IN ('admin@hrms.com', 'admin@nexoratech.com')",
    [DEMO_COMPANY.id]
  );
  await query(
    "UPDATE users SET email = 'hr.manager01@nexoratech.com', company_id = ?, name = 'HR Manager 01' WHERE email IN ('hr@hrms.com', 'hr.manager01@nexoratech.com')",
    [DEMO_COMPANY.id]
  );
  await query(
    "UPDATE users SET email = 'employee01@nexoratech.com', company_id = ?, name = 'Employee 01' WHERE email IN ('employee@hrms.com', 'employee01@nexoratech.com')",
    [DEMO_COMPANY.id]
  );
  await query("UPDATE users SET email = REPLACE(email, '@hrspace.local', '@nexoratech.com') WHERE email LIKE '%@hrspace.local'");
  await query(
    `UPDATE users SET email = 'employee02@nexoratech.com', company_id = ?, name = 'Employee 02', role = 'employee', department = 'Finance', designation = 'Accounts Officer'
     WHERE email IN ('nusrat.jahan@nexoratech.com', 'nusrat.jahan@hrspace.local')`,
    [DEMO_COMPANY.id]
  );
  await query(
    `UPDATE users SET email = 'employee03@nexoratech.com', company_id = ?, name = 'Employee 03', role = 'employee', department = 'Marketing', designation = 'Marketing Executive'
     WHERE email IN ('rakibul.islam@nexoratech.com', 'rakibul.islam@hrspace.local')`,
    [DEMO_COMPANY.id]
  );

  for (const user of demoUserRows()) {
    await query(
      `INSERT INTO users
        (company_id, employee_code, name, email, password, role, phone, department, designation, hire_date, salary, avatar, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE
        company_id = VALUES(company_id),
        employee_code = VALUES(employee_code),
        name = VALUES(name),
        role = VALUES(role),
        department = VALUES(department),
        designation = VALUES(designation),
        hire_date = VALUES(hire_date),
        salary = VALUES(salary),
        avatar = VALUES(avatar),
        status = 'active'`,
      [
        DEMO_COMPANY.id,
        user.employeeCode,
        user.name,
        user.email,
        user.password,
        normalizeRole(user.role),
        user.phone,
        user.department,
        user.designation,
        user.hireDate,
        user.salary,
        initials(user.name),
      ]
    );
  }

  const demoEmails = demoUserRows().map((u) => u.email);
  await query(
    "DELETE FROM users WHERE email NOT IN (" + demoEmails.map(() => "?").join(",") + ")",
    demoEmails
  );
}

async function companyIdFromEmail(email) {
  await ensureCompaniesTable();
  const domain = String(email || "").split("@")[1]?.toLowerCase();
  if (!domain) return DEMO_COMPANY.id;

  const [companies] = await query("SELECT id FROM companies WHERE domain = ? LIMIT 1", [domain]);
  return companies[0]?.id || DEMO_COMPANY.id;
}

module.exports = {
  DEMO_COMPANY,
  PASSWORD_HASHES,
  ensureCompanyColumns,
  ensureCompaniesTable,
  ensureDemoCompanyData,
  companyIdFromEmail,
  addColumnIfMissing,
  columnExists,
  tableExists,
  initials,
};
