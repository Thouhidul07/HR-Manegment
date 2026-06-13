const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function sanitizeFileName(value) {
  return String(value || "payslip").replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

function payrollBaseQuery(whereClause = "") {
  return `
    SELECT p.*, u.name AS employee_name, u.email, u.department, u.designation
    FROM payroll p
    JOIN users u ON u.id = p.user_id
    ${whereClause}
    ORDER BY p.pay_period DESC, p.id DESC
  `;
}

function buildPayslipText(record) {
  const grossPay = Number(record.basic_salary || 0) + Number(record.allowances || 0);

  return [
    "HRSpace Payslip",
    "================",
    "",
    `Employee: ${record.employee_name}`,
    `Email: ${record.email}`,
    `Department: ${record.department || "N/A"}`,
    `Designation: ${record.designation || "N/A"}`,
    `Pay Period: ${formatDate(record.pay_period)}`,
    `Status: ${record.status}`,
    "",
    "Earnings",
    `Basic Salary: BDT ${formatMoney(record.basic_salary)}`,
    `Allowances: BDT ${formatMoney(record.allowances)}`,
    `Gross Pay: BDT ${formatMoney(grossPay)}`,
    "",
    "Deductions",
    `Total Deductions: BDT ${formatMoney(record.deductions)}`,
    "",
    `Net Pay: BDT ${formatMoney(record.net_pay)}`,
    "",
    `Generated At: ${new Date().toISOString()}`,
  ].join("\n");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

const listPayroll = asyncHandler(async (req, res) => {
  const userFilter = req.user.role === "employee" ? "WHERE p.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [payroll] = await query(payrollBaseQuery(userFilter), params);

  res.json({ payroll });
});

const downloadPayslip = asyncHandler(async (req, res) => {
  const params = [req.params.id];
  const ownerFilter = req.user.role === "employee" ? " AND p.user_id = ?" : "";

  if (req.user.role === "employee") {
    params.push(req.user.id);
  }

  const [records] = await query(
    payrollBaseQuery(`WHERE p.id = ?${ownerFilter}`),
    params
  );

  if (!records.length) {
    return res.status(404).json({ message: "Payslip not found" });
  }

  const record = records[0];
  const fileName = `${sanitizeFileName(record.employee_name)}-${formatDate(record.pay_period)}-payslip.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(buildPayslipText(record));
});

const exportPayroll = asyncHandler(async (req, res) => {
  const userFilter = req.user.role === "employee" ? "WHERE p.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [payroll] = await query(payrollBaseQuery(userFilter), params);
  const headers = [
    "Payroll ID",
    "Employee",
    "Email",
    "Department",
    "Designation",
    "Pay Period",
    "Basic Salary",
    "Allowances",
    "Deductions",
    "Net Pay",
    "Status",
  ];
  const rows = payroll.map((record) => [
    record.id,
    record.employee_name,
    record.email,
    record.department || "",
    record.designation || "",
    formatDate(record.pay_period),
    formatMoney(record.basic_salary),
    formatMoney(record.allowances),
    formatMoney(record.deductions),
    formatMoney(record.net_pay),
    record.status,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=\"payroll-export.csv\"");
  res.send(csv);
});

const processPayroll = asyncHandler(async (req, res) => {
  const payPeriod = req.body.payPeriod || new Date().toISOString().slice(0, 7) + "-01";
  const [existing] = await query(
    "SELECT user_id FROM payroll WHERE pay_period = ?",
    [payPeriod]
  );
  const existingUserIds = new Set(existing.map((row) => Number(row.user_id)));
  const [employees] = await query(
    "SELECT id, salary FROM users WHERE status = 'active' AND role = 'employee'"
  );
  let created = 0;

  for (const employee of employees) {
    if (existingUserIds.has(Number(employee.id))) {
      continue;
    }

    const basicSalary = Number(employee.salary || 0);
    const allowances = Number((basicSalary * 0.05).toFixed(2));
    const deductions = Number((basicSalary * 0.03).toFixed(2));
    const netPay = Number((basicSalary + allowances - deductions).toFixed(2));

    await query(
      `INSERT INTO payroll
        (user_id, pay_period, basic_salary, allowances, deductions, net_pay, status)
       VALUES (?, ?, ?, ?, ?, ?, 'processed')`,
      [employee.id, payPeriod, basicSalary, allowances, deductions, netPay]
    );
    created += 1;
  }

  res.status(201).json({
    message: created ? "Payroll processed" : "Payroll already processed for this period",
    payPeriod,
    created,
  });
});

module.exports = { listPayroll, downloadPayslip, exportPayroll, processPayroll };
