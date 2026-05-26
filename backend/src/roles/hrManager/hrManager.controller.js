const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const [[employees], [leaveRequests], [training]] = await Promise.all([
    query("SELECT COUNT(*) AS activeEmployees FROM users WHERE role IN ('employee', 'hr_manager')"),
    query("SELECT COUNT(*) AS pendingLeave FROM leave_requests WHERE status = 'pending'"),
    query("SELECT COUNT(*) AS trainingItems FROM training_sessions WHERE starts_at >= NOW()"),
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
    "SELECT a.*, u.name AS employee_name FROM attendance a JOIN users u ON u.id = a.user_id ORDER BY a.work_date DESC LIMIT 100"
  );

  res.json({ records });
});

module.exports = { dashboard, attendance };
