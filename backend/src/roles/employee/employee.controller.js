const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const [[attendance], [leaveRequests], [payroll]] = await Promise.all([
    query("SELECT COUNT(*) AS daysPresent FROM attendance WHERE user_id = ? AND MONTH(work_date) = MONTH(CURDATE())", [req.user.id]),
    query("SELECT COUNT(*) AS pendingLeave FROM leave_requests WHERE user_id = ? AND status = 'pending'", [req.user.id]),
    query("SELECT net_pay, pay_period FROM payroll WHERE user_id = ? ORDER BY pay_period DESC LIMIT 1", [req.user.id]),
  ]);

  res.json({
    dashboard: {
      daysPresent: attendance[0].daysPresent,
      pendingLeave: leaveRequests[0].pendingLeave,
      latestPayroll: payroll[0] || null,
    },
  });
});

const attendance = asyncHandler(async (req, res) => {
  const [records] = await query(
    "SELECT * FROM attendance WHERE user_id = ? ORDER BY work_date DESC LIMIT 60",
    [req.user.id]
  );

  res.json({ records });
});

module.exports = { dashboard, attendance };
