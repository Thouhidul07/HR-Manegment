const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const listAttendance = asyncHandler(async (req, res) => {
  const userFilter = req.user.role === "employee" ? "WHERE a.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [records] = await query(
    `SELECT a.*, u.name AS employee_name FROM attendance a JOIN users u ON u.id = a.user_id ${userFilter} ORDER BY a.work_date DESC`,
    params
  );

  res.json({ records });
});

const clockIn = asyncHandler(async (req, res) => {
  const [result] = await query(
    "INSERT INTO attendance (user_id, work_date, clock_in, status) VALUES (?, CURDATE(), NOW(), 'present')",
    [req.user.id]
  );

  res.status(201).json({ message: "Clock-in saved", attendanceId: result.insertId });
});

module.exports = { listAttendance, clockIn };
