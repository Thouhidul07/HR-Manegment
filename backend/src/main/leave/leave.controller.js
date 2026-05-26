const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const listLeaveRequests = asyncHandler(async (req, res) => {
  const userFilter = req.user.role === "employee" ? "WHERE l.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [requests] = await query(
    `SELECT l.*, u.name AS employee_name FROM leave_requests l JOIN users u ON u.id = l.user_id ${userFilter} ORDER BY l.created_at DESC`,
    params
  );

  res.json({ requests });
});

const createLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const [result] = await query(
    "INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, leaveType, startDate, endDate, reason]
  );

  res.status(201).json({ message: "Leave request submitted", leaveRequestId: result.insertId });
});

module.exports = { listLeaveRequests, createLeaveRequest };
