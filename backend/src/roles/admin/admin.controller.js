const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const [[employeeStats], [attendanceStats], [leaveStats], [payrollStats]] = await Promise.all([
    query("SELECT COUNT(*) AS totalEmployees FROM users WHERE company_id = ?", [req.user.company_id]),
    query(
      "SELECT COUNT(*) AS presentToday FROM attendance a JOIN users u ON u.id = a.user_id WHERE a.work_date = CURDATE() AND a.status = 'present' AND u.company_id = ?",
      [req.user.company_id]
    ),
    query(
      "SELECT COUNT(*) AS pendingLeave FROM leave_requests lr JOIN users u ON u.id = lr.user_id WHERE lr.status = 'pending' AND u.company_id = ?",
      [req.user.company_id]
    ),
    query(
      "SELECT COALESCE(SUM(p.net_pay), 0) AS monthlyPayroll FROM payroll p JOIN users u ON u.id = p.user_id WHERE DATE_FORMAT(p.pay_period, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m') AND u.company_id = ?",
      [req.user.company_id]
    ),
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
    "SELECT a.*, u.name AS employee_name FROM attendance a JOIN users u ON u.id = a.user_id WHERE u.company_id = ? ORDER BY a.work_date DESC LIMIT 100",
    [req.user.company_id]
  );

  res.json({ records });
});

module.exports = { dashboard, attendance };
