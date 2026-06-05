const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function formatDate(value) {
  if (!value) {
    return value;
  }

  return new Date(value).toISOString().slice(0, 10);
}

function mapLeaveRequest(row) {
  const start = new Date(row.start_date);
  const end = new Date(row.end_date);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

  return {
    id: row.id,
    employee: row.employee_name,
    avatar: row.employee_name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    type: row.leave_type,
    from: formatDate(row.start_date),
    to: formatDate(row.end_date),
    days,
    status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
    reason: row.reason || "",
  };
}

const listLeaveRequests = asyncHandler(async (req, res) => {
  const userFilter = req.user.role === "employee" ? "WHERE l.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [requests] = await query(
    `SELECT l.*, u.name AS employee_name FROM leave_requests l JOIN users u ON u.id = l.user_id ${userFilter} ORDER BY l.created_at DESC`,
    params
  );

  res.json({ requests: requests.map(mapLeaveRequest) });
});

const createLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const [result] = await query(
    "INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, leaveType, startDate, endDate, reason]
  );

  const [rows] = await query(
    `SELECT l.*, u.name AS employee_name
     FROM leave_requests l
     JOIN users u ON u.id = l.user_id
     WHERE l.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ request: mapLeaveRequest(rows[0]) });
});

const updateLeaveStatus = asyncHandler(async (req, res) => {
  const [result] = await query(
    `UPDATE leave_requests
     SET status = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [req.body.status, req.user.id, req.params.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Leave request not found" });
  }

  const [rows] = await query(
    `SELECT l.*, u.name AS employee_name
     FROM leave_requests l
     JOIN users u ON u.id = l.user_id
     WHERE l.id = ?`,
    [req.params.id]
  );

  res.json({ request: mapLeaveRequest(rows[0]) });
});

module.exports = { listLeaveRequests, createLeaveRequest, updateLeaveStatus };
