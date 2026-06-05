const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function buildMonthAttendance(records, todayKey) {
  const today = new Date(`${todayKey}T00:00:00`);
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const recordByDate = new Map(records.map((record) => [record.work_date, record.status]));

  let daysPresent = 0;
  let daysLate = 0;
  let daysAbsent = 0;
  let daysLeave = 0;
  let workdaysInMonth = 0;
  let workdaysToDate = 0;

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dateKey = toDateKey(date);
    const weekend = isWeekend(date);
    const future = dateKey > todayKey;
    const recordedStatus = recordByDate.get(dateKey);
    let status = recordedStatus || "none";

    if (!weekend) {
      workdaysInMonth += 1;
      if (!future) {
        workdaysToDate += 1;
      }
    }

    if (recordedStatus === "present") {
      daysPresent += 1;
    } else if (recordedStatus === "late") {
      daysLate += 1;
    } else if (recordedStatus === "leave") {
      daysLeave += 1;
    } else if (recordedStatus === "absent" || (!recordedStatus && !weekend && !future)) {
      daysAbsent += 1;
      status = "absent";
    }

    return {
      date: dateKey,
      day: index + 1,
      status,
      isToday: dateKey === todayKey,
      isWeekend: weekend,
      isFuture: future,
    };
  });

  return {
    year,
    month: month + 1,
    days,
    daysPresent,
    daysLate,
    daysAbsent,
    daysLeave,
    attendedDays: daysPresent + daysLate,
    workdaysInMonth,
    workdaysToDate,
  };
}

const dashboard = asyncHandler(async (req, res) => {
  const [[todayRows], [attendanceRecords], [leaveRequests], [payroll]] = await Promise.all([
    query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today"),
    query(
      `SELECT DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date, status
       FROM attendance
       WHERE user_id = ?
         AND YEAR(work_date) = YEAR(CURDATE())
         AND MONTH(work_date) = MONTH(CURDATE())`,
      [req.user.id]
    ),
    query("SELECT COUNT(*) AS pendingLeave FROM leave_requests WHERE user_id = ? AND status = 'pending'", [req.user.id]),
    query("SELECT net_pay, pay_period FROM payroll WHERE user_id = ? ORDER BY pay_period DESC LIMIT 1", [req.user.id]),
  ]);
  const monthAttendance = buildMonthAttendance(attendanceRecords, todayRows[0].today);

  res.json({
    dashboard: {
      daysPresent: monthAttendance.daysPresent,
      daysLate: monthAttendance.daysLate,
      daysAbsent: monthAttendance.daysAbsent,
      daysLeave: monthAttendance.daysLeave,
      attendedDays: monthAttendance.attendedDays,
      workdaysInMonth: monthAttendance.workdaysInMonth,
      workdaysToDate: monthAttendance.workdaysToDate,
      monthAttendance,
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
