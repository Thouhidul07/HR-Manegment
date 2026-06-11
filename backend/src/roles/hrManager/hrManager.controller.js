const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const [[employees], [leaveRequests], [training]] = await Promise.all([
    query("SELECT COUNT(*) AS activeEmployees FROM users WHERE company_id = ?", [req.user.company_id]),
    query(
      "SELECT COUNT(*) AS pendingLeave FROM leave_requests lr JOIN users u ON u.id = lr.user_id WHERE lr.status = 'pending' AND u.company_id = ?",
      [req.user.company_id]
    ),
    query("SELECT COUNT(*) AS trainingItems FROM training_sessions WHERE starts_at >= NOW() AND company_id = ?", [req.user.company_id]),
  ]);

  res.json({
    dashboard: {
      activeEmployees: employees[0].activeEmployees,
      pendingLeave: leaveRequests[0].pendingLeave,
      upcomingTraining: training[0].trainingItems,
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
