const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureDemoCompanyData, initials } = require("../../utils/companyScope");

const SUPPORTED_ROLES = [
  {
    code: "admin",
    name: "System Admin",
    description: "Company authority and system control",
    level: 1,
  },
  {
    code: "hr_manager",
    name: "HR Manager",
    description: "Manage employee records, leave, onboarding, training, and payroll",
    level: 2,
  },
  {
    code: "employee",
    name: "Employee",
    description: "Self-service access for assigned employee flows",
    level: 3,
  },
];

function getCompanyId(req) {
  return req.user.company_id || 1;
}

function roleName(code) {
  return SUPPORTED_ROLES.find((role) => role.code === code)?.name || code;
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
  const roles = SUPPORTED_ROLES.map((role) => ({
    ...role,
    userCount: countsByRole[role.code] || 0,
    users: countsByRole[role.code] || 0,
    status: "active",
  }));

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
    customRoles: 0,
    pendingRequests: Number(pendingRows[0]?.pending || 0),
    activeSessions: 1,
    roles,
  });
});

const getRoleUsers = asyncHandler(async (req, res) => {
  await ensureDemoCompanyData();
  const companyId = getCompanyId(req);
  const roleCode = req.params.roleCode;

  if (!SUPPORTED_ROLES.some((role) => role.code === roleCode)) {
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
    role: SUPPORTED_ROLES.find((role) => role.code === roleCode),
    users: users.map(mapUser),
  });
});

const getPermissions = asyncHandler(async (req, res) => {
  const roleCode = req.query.role || "admin";

  if (!SUPPORTED_ROLES.some((role) => role.code === roleCode)) {
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

module.exports = { getSummary, getRoleUsers, getPermissions };
