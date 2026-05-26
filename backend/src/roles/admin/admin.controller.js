const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const [[employeeStats], [attendanceStats], [leaveStats], [payrollStats]] = await Promise.all([
    query("SELECT COUNT(*) AS totalEmployees FROM users"),
    query("SELECT COUNT(*) AS presentToday FROM attendance WHERE work_date = CURDATE() AND status = 'present'"),
    query("SELECT COUNT(*) AS pendingLeave FROM leave_requests WHERE status = 'pending'"),
    query("SELECT COALESCE(SUM(net_pay), 0) AS monthlyPayroll FROM payroll WHERE DATE_FORMAT(pay_period, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')"),
  ]);

  res.json({
    dashboard: {
      totalEmployees: employeeStats[0].totalEmployees,
      presentToday: attendanceStats[0].presentToday,
      pendingLeave: leaveStats[0].pendingLeave,
      monthlyPayroll: payrollStats[0].monthlyPayroll,
    },
  });
});

const attendance = asyncHandler(async (req, res) => {
  const [records] = await query(
    "SELECT a.*, u.name AS employee_name FROM attendance a JOIN users u ON u.id = a.user_id ORDER BY a.work_date DESC LIMIT 100"
  );

  res.json({ records });
});

module.exports = { dashboard, attendance };
