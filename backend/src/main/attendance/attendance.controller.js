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

async function getTodayAttendance(userId, companyId) {
  const [rows] = await query(
    `SELECT a.*, u.name AS employee_name
     FROM attendance a
     JOIN users u ON u.id = a.user_id
     WHERE a.user_id = ? AND a.work_date = CURDATE() AND u.company_id = ?
     LIMIT 1`,
    [userId, companyId]
  );

  return rows[0];
}

const listAttendance = asyncHandler(async (req, res) => {
  const { status, userId, startDate, endDate } = req.query;

  let whereClauses = ["u.company_id = ?"];
  let params = [req.user.company_id];

  if (req.user.role === "employee") {
    whereClauses.push("a.user_id = ?");
    params.push(req.user.id);
  } else if (userId) {
    whereClauses.push("a.user_id = ?");
    params.push(userId);
  }

  if (status) {
    let statusDb = status.toLowerCase();
    if (statusDb === "on leave" || statusDb === "leave") {
      statusDb = "leave";
    }
    whereClauses.push("a.status = ?");
    params.push(statusDb);
  }

  if (startDate) {
    whereClauses.push("a.work_date >= ?");
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push("a.work_date <= ?");
    params.push(endDate);
  }

  const whereStr = "WHERE " + whereClauses.join(" AND ");

  const [records] = await query(
    `SELECT a.*, u.name AS employee_name FROM attendance a JOIN users u ON u.id = a.user_id ${whereStr} ORDER BY a.work_date DESC`,
    params
  );

  res.json({ records: records.map(mapAttendance) });
});

const clockIn = asyncHandler(async (req, res) => {
  const existingRecord = await getTodayAttendance(req.user.id, req.user.company_id);

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

  const record = await getTodayAttendance(req.user.id, req.user.company_id);

  res.status(201).json({
    message: "Clock-in saved",
    attendanceId: result.insertId,
    record: mapAttendance(record),
  });
});

const clockOut = asyncHandler(async (req, res) => {
  const existingRecord = await getTodayAttendance(req.user.id, req.user.company_id);

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

  const record = await getTodayAttendance(req.user.id, req.user.company_id);

  res.json({ message: "Clock-out saved", record: mapAttendance(record) });
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
     WHERE a.user_id = ? AND a.work_date = ? AND u.company_id = ?`,
    [req.user.id, workDate, req.user.company_id]
  );

  res.status(201).json({ record: mapAttendance(rows[0]) });
});

const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  let whereClauses = ["u.company_id = ?"];
  let params = [req.user.company_id];

  if (req.user.role === "employee") {
    whereClauses.push("a.user_id = ?");
    params.push(req.user.id);
  } else if (userId) {
    whereClauses.push("a.user_id = ?");
    params.push(userId);
  }

  if (startDate) {
    whereClauses.push("a.work_date >= ?");
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push("a.work_date <= ?");
    params.push(endDate);
  }

  const whereStr = "WHERE " + whereClauses.join(" AND ");

  const [counts] = await query(
    `SELECT a.status, COUNT(*) as count
     FROM attendance a
     JOIN users u ON u.id = a.user_id
     ${whereStr}
     GROUP BY a.status`,
    params
  );

  let summary = {
    present: 0,
    late: 0,
    absent: 0,
    leave: 0
  };

  counts.forEach(c => {
    const statusKey = c.status === "leave" ? "leave" : c.status;
    if (summary[statusKey] !== undefined) {
      summary[statusKey] = c.count;
    }
  });

  res.json(summary);
});

const getWeeklyOverview = asyncHandler(async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  let start = startDate;
  let end = endDate;

  if (!start || !end) {
    const today = new Date();
    const currentDay = today.getDay(); 
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    start = monday.toISOString().slice(0, 10);
    end = friday.toISOString().slice(0, 10);
  }

  let whereClauses = ["u.company_id = ?", "a.work_date >= ?", "a.work_date <= ?"];
  let params = [req.user.company_id, start, end];

  if (req.user.role === "employee") {
    whereClauses.push("a.user_id = ?");
    params.push(req.user.id);
  } else if (userId) {
    whereClauses.push("a.user_id = ?");
    params.push(userId);
  }

  const [rows] = await query(
    `SELECT a.work_date, a.status, COUNT(*) as count, DAYNAME(a.work_date) as day_name
     FROM attendance a
     JOIN users u ON u.id = a.user_id
     WHERE ${whereClauses.join(" AND ")}
     GROUP BY a.work_date, a.status`,
    params
  );

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayAbbr = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun"
  };

  const overviewMap = {};
  daysOfWeek.forEach(day => {
    overviewMap[day] = { day: dayAbbr[day], present: 0, late: 0, absent: 0, leave: 0 };
  });

  rows.forEach(row => {
    const day = row.day_name;
    if (overviewMap[day]) {
      const statusKey = row.status === "leave" ? "leave" : row.status; 
      overviewMap[day][statusKey] = row.count;
    }
  });

  const overview = daysOfWeek.map(day => overviewMap[day]);
  res.json({ overview });
});

module.exports = {
  listAttendance,
  clockIn,
  clockOut,
  logAttendance,
  getAttendanceSummary,
  getWeeklyOverview
};
