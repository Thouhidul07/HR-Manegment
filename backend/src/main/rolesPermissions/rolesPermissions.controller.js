const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureDemoCompanyData, initials } = require("../../utils/companyScope");

const SUPPORTED_ROLES = [
  {
    code: "admin",
    name: "Admin / CEO",
    description: "CEO-level authority with full access to every module and action",
    level: 1,
  },
  {
    code: "hr_manager",
    name: "HR Manager",
    description: "Manage employee records, leave, onboarding, training, and payroll",
    level: 2,
  },
  {
    code: "project_manager",
    name: "Project Manager",
    description: "Manage project work, task delivery, team visibility, and project reporting",
    level: 3,
  },
  {
    code: "employee",
    name: "Employee",
    description: "Self-service access for assigned employee flows",
    level: 4,
  },
];

function getCompanyId(req) {
  return req.user.company_id || 1;
}

function roleName(code) {
  return SUPPORTED_ROLES.find((role) => role.code === code)?.name || code;
}

function slugifyRoleName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    roleName: roleName(row.role),
    department: row.department || "",
    designation: row.designation || "",
    status: row.status || "active",
    avatar: row.avatar || initials(row.name),
    initials: row.avatar || initials(row.name),
  };
}

const getSummary = asyncHandler(async (req, res) => {
  await ensureDemoCompanyData();
  const companyId = getCompanyId(req);

  const [counts] = await query(
    `SELECT role, COUNT(*) AS total
     FROM users
     WHERE company_id = ? AND status IN ('active', 'inactive')
     GROUP BY role`,
    [companyId]
  );

  const countsByRole = Object.fromEntries(counts.map((row) => [row.role, Number(row.total || 0)]));
  const systemRoles = SUPPORTED_ROLES.map((role) => ({
    ...role,
    userCount: countsByRole[role.code] || 0,
    users: countsByRole[role.code] || 0,
    status: "active",
  }));

  const [customRows] = await query(
    `SELECT code, name, description
     FROM roles
     WHERE is_system = 0
     ORDER BY name`
  );

  const customRoles = customRows.map((role, index) => ({
    code: role.code,
    name: role.name,
    description: role.description || "Custom company role",
    level: SUPPORTED_ROLES.length + index + 1,
    userCount: countsByRole[role.code] || 0,
    users: countsByRole[role.code] || 0,
    status: "active",
  }));

  const roles = [...systemRoles, ...customRoles];

  const [pendingRows] = await query(
    `SELECT COUNT(ar.id) AS pending
     FROM access_requests ar
     JOIN users u ON u.id = ar.user_id
     WHERE u.company_id = ? AND ar.status = 'pending'`,
    [companyId]
  );

  res.json({
    company: { id: companyId, name: "NexoraTech Ltd", domain: "nexoratech.com" },
    totalRoles: roles.length,
    totalUsers: roles.reduce((sum, role) => sum + role.userCount, 0),
    customRoles: customRoles.length,
    pendingRequests: Number(pendingRows[0]?.pending || 0),
    activeSessions: 1,
    roles,
  });
});

const getRoleUsers = asyncHandler(async (req, res) => {
  await ensureDemoCompanyData();
  const companyId = getCompanyId(req);
  const roleCode = req.params.roleCode;

  const [roleRows] = await query("SELECT code, name, description FROM roles WHERE code = ? LIMIT 1", [roleCode]);
  if (!SUPPORTED_ROLES.some((role) => role.code === roleCode) && !roleRows.length) {
    return res.status(400).json({ message: "Unsupported role" });
  }

  const [users] = await query(
    `SELECT id, name, email, role, department, designation, status, avatar
     FROM users
     WHERE company_id = ? AND role = ? AND status IN ('active', 'inactive')
     ORDER BY status = 'inactive', name`,
    [companyId, roleCode]
  );

  res.json({
    role: SUPPORTED_ROLES.find((role) => role.code === roleCode) || roleRows[0],
    users: users.map(mapUser),
  });
});

const getPermissions = asyncHandler(async (req, res) => {
  const roleCode = req.query.role || "admin";

  const [roleRows] = await query("SELECT id FROM roles WHERE code = ? LIMIT 1", [roleCode]);
  if (!SUPPORTED_ROLES.some((role) => role.code === roleCode) && !roleRows.length) {
    return res.status(400).json({ message: "Unsupported role" });
  }

  const [permissions] = await query(
    `SELECT p.code, p.module, p.action, p.description
     FROM roles r
     JOIN role_permissions rp ON rp.role_id = r.id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE r.code = ?
     ORDER BY p.module, p.action`,
    [roleCode]
  );

  res.json({ role: roleCode, permissions });
});

const createRole = asyncHandler(async (req, res) => {
  await ensureDemoCompanyData();

  const { name, description = "", modules = [] } = req.body;
  const code = slugifyRoleName(name);

  if (!code) {
    return res.status(400).json({ message: "Role name is required" });
  }

  const reservedCodes = SUPPORTED_ROLES.map((role) => role.code);
  if (reservedCodes.includes(code)) {
    return res.status(409).json({ message: "A system role already uses this name" });
  }

  const [existing] = await query("SELECT id FROM roles WHERE code = ? LIMIT 1", [code]);
  if (existing.length) {
    return res.status(409).json({ message: "A role with this name already exists" });
  }

  const [result] = await query(
    `INSERT INTO roles (code, name, description, is_system)
     VALUES (?, ?, ?, 0)`,
    [code, name.trim(), description.trim() || null]
  );

  const moduleMap = {
    Dashboard: ["dashboard"],
    "Employee Management": ["employees"],
    Recruitment: ["cv", "employees"],
    Attendance: ["attendance"],
    "Leave Management": ["leave"],
    Payroll: ["payroll"],
    Performance: ["performance"],
    Training: ["training"],
    "Expense Management": ["expenses"],
    "Reports & Analytics": ["reports"],
  };
  const dbModules = [...new Set(modules.flatMap((module) => moduleMap[module] || []))];

  if (dbModules.length) {
    const [permissions] = await query(
      `SELECT id FROM permissions WHERE module IN (${dbModules.map(() => "?").join(",")})`,
      dbModules
    );
    for (const permission of permissions) {
      await query(
        "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
        [result.insertId, permission.id]
      );
    }
  }

  res.status(201).json({
    role: {
      id: result.insertId,
      code,
      name: name.trim(),
      description: description.trim(),
      level: SUPPORTED_ROLES.length + 1,
      userCount: 0,
      users: 0,
      status: "active",
    },
  });
});

module.exports = { getSummary, getRoleUsers, getPermissions, createRole };
