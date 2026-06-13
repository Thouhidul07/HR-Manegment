const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthAttendance(rows) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rowMap = new Map(
    rows.map((row) => [dateKey(new Date(row.work_date)), row.status])
  );

  let daysPresent = 0;
  let daysLate = 0;
  let daysAbsent = 0;
  let daysLeave = 0;
  let workdaysInMonth = 0;
  let workdaysToDate = 0;

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const key = dateKey(date);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFuture = date > today;
    const status = rowMap.get(key) || "none";

    if (!isWeekend) {
      workdaysInMonth += 1;
      if (!isFuture) workdaysToDate += 1;
    }

    if (status === "present") daysPresent += 1;
    if (status === "late") daysLate += 1;
    if (status === "absent") daysAbsent += 1;
    if (status === "leave") daysLeave += 1;

    return {
      date: key,
      day: index + 1,
      status,
      isToday: key === dateKey(today),
      isWeekend,
      isFuture,
    };
  });

  return {
    year,
    month: month + 1,
    daysPresent,
    daysLate,
    daysAbsent,
    daysLeave,
    attendedDays: daysPresent + daysLate,
    workdaysInMonth,
    workdaysToDate,
    days,
  };
}

const dashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = dateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  const [[attendance], [attendanceRows], [leaveRequests], [payroll]] = await Promise.all([
    query("SELECT COUNT(*) AS daysPresent FROM attendance WHERE user_id = ? AND status = 'present' AND work_date BETWEEN ? AND ?", [req.user.id, monthStart, monthEnd]),
    query("SELECT work_date, status FROM attendance WHERE user_id = ? AND work_date BETWEEN ? AND ? ORDER BY work_date ASC", [req.user.id, monthStart, monthEnd]),
    query("SELECT COUNT(*) AS pendingLeave FROM leave_requests WHERE user_id = ? AND status = 'pending'", [req.user.id]),
    query("SELECT net_pay, pay_period FROM payroll WHERE user_id = ? ORDER BY pay_period DESC LIMIT 1", [req.user.id]),
  ]);
  const monthAttendance = buildMonthAttendance(attendanceRows);

  res.json({
    dashboard: {
      daysPresent: attendance[0].daysPresent,
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
