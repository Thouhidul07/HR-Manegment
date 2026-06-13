const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function formatStatus(status) {
  if (status === "leave") {
    return "On Leave";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function mapAttendance(row) {
  const hoursMinutes =
    row.clock_in && row.clock_out
      ? Math.max(
          0,
          Math.round(
            (new Date(row.clock_out).getTime() - new Date(row.clock_in).getTime()) /
              60000
          )
        )
      : null;

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
    hoursMinutes,
    status: formatStatus(row.status),
  };
}

async function getTodayAttendance(userId) {
  const [rows] = await query(
    `SELECT a.*, u.name AS employee_name
     FROM attendance a
     JOIN users u ON u.id = a.user_id
     WHERE a.user_id = ? AND a.work_date = CURDATE()
     LIMIT 1`,
    [userId]
  );

  return rows[0];
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
  const existingRecord = await getTodayAttendance(req.user.id);

  if (existingRecord?.clock_in) {
    return res.status(400).json({ message: "You have already clocked in today" });
  }

  if (existingRecord) {
    return res.status(400).json({ message: "Attendance is already recorded for today" });
  }

  const [result] = await query(
    "INSERT INTO attendance (user_id, work_date, clock_in, status) VALUES (?, CURDATE(), NOW(), 'present')",
    [req.user.id]
  );

  const record = await getTodayAttendance(req.user.id);

  res.status(201).json({
    message: "Clock-in saved",
    attendanceId: result.insertId,
    record: mapAttendance(record),
  });
});

const clockOut = asyncHandler(async (req, res) => {
  const existingRecord = await getTodayAttendance(req.user.id);

  if (!existingRecord?.clock_in) {
    return res.status(400).json({ message: "You need to clock in before clocking out" });
  }

  if (existingRecord.clock_out) {
    return res.status(400).json({ message: "You have already clocked out today" });
  }

  await query(
    "UPDATE attendance SET clock_out = NOW() WHERE id = ? AND user_id = ?",
    [existingRecord.id, req.user.id]
  );

  const record = await getTodayAttendance(req.user.id);

  res.json({ message: "Clock-out saved", record: mapAttendance(record) });
});

const logAttendance = asyncHandler(async (req, res) => {
  const { workDate, clockIn, clockOut, status = "present" } = req.body;
  const requiresTime = status === "present" || status === "late";

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
      requiresTime ? `${workDate} ${clockIn}:00` : null,
      requiresTime ? `${workDate} ${clockOut}:00` : null,
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

module.exports = { listAttendance, clockIn, clockOut, logAttendance };
