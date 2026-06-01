const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function formatStatus(status) {
  if (status === "leave") {
    return "On Leave";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function mapAttendance(row) {
  return {
    id: row.id,
    name: row.employee_name,
    avatar: row.employee_name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    date: row.work_date,
    checkIn: row.clock_in,
    checkOut: row.clock_out,
    status: formatStatus(row.status),
  };
}

const listAttendance = asyncHandler(async (req, res) => {
  const userFilter = req.user.role === "employee" ? "WHERE a.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [records] = await query(
    `SELECT a.*, u.name AS employee_name FROM attendance a JOIN users u ON u.id = a.user_id ${userFilter} ORDER BY a.work_date DESC`,
    params
  );

  res.json({ records: records.map(mapAttendance) });
});

const clockIn = asyncHandler(async (req, res) => {
  const [result] = await query(
    "INSERT INTO attendance (user_id, work_date, clock_in, status) VALUES (?, CURDATE(), NOW(), 'present')",
    [req.user.id]
  );

  res.status(201).json({ message: "Clock-in saved", attendanceId: result.insertId });
});

const logAttendance = asyncHandler(async (req, res) => {
  const { workDate, clockIn, clockOut, status = "present" } = req.body;

  await query(
    `INSERT INTO attendance (user_id, work_date, clock_in, clock_out, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       clock_in = VALUES(clock_in),
       clock_out = VALUES(clock_out),
       status = VALUES(status)`,
    [
      req.user.id,
      workDate,
      `${workDate} ${clockIn}:00`,
      `${workDate} ${clockOut}:00`,
      status,
    ]
  );

  const [rows] = await query(
    `SELECT a.*, u.name AS employee_name
     FROM attendance a
     JOIN users u ON u.id = a.user_id
     WHERE a.user_id = ? AND a.work_date = ?`,
    [req.user.id, workDate]
  );

  res.status(201).json({ record: mapAttendance(rows[0]) });
});

module.exports = { listAttendance, clockIn, logAttendance };
