import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/Table";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

type AttendanceRecord = {
  id: number | string;
  name?: string;
  avatar?: string;
  date?: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: string;
  break: string;
  hoursMinutes?: number | null;
};

const attendanceData: AttendanceRecord[] = [
  {
    id: 1,
    name: "Tanvir Hasan",
    avatar: "TH",
    checkIn: "09:05 AM",
    checkOut: "06:15 PM",
    hours: "9h 10m",
    status: "Present",
    break: "45m",
  },
  {
    id: 2,
    name: "Nusrat Jahan",
    avatar: "NJ",
    checkIn: "08:55 AM",
    checkOut: "05:50 PM",
    hours: "8h 55m",
    status: "Present",
    break: "40m",
  },
  {
    id: 3,
    name: "Rakibul Islam",
    avatar: "RI",
    checkIn: "09:25 AM",
    checkOut: "06:30 PM",
    hours: "9h 5m",
    status: "Late",
    break: "50m",
  },
  {
    id: 4,
    name: "Farhana Akter",
    avatar: "FA",
    checkIn: "-",
    checkOut: "-",
    hours: "-",
    status: "On Leave",
    break: "-",
  },
  {
    id: 5,
    name: "Mehedi Hasan",
    avatar: "MH",
    checkIn: "09:02 AM",
    checkOut: "06:05 PM",
    hours: "9h 3m",
    status: "Present",
    break: "48m",
  },
  {
    id: 6,
    name: "Sadia Rahman",
    avatar: "SR",
    checkIn: "-",
    checkOut: "-",
    hours: "-",
    status: "Absent",
    break: "-",
  },
  {
    id: 7,
    name: "Arif Hossain",
    avatar: "AH",
    checkIn: "08:50 AM",
    checkOut: "05:45 PM",
    hours: "8h 55m",
    status: "Present",
    break: "42m",
  },
  {
    id: 8,
    name: "Sharmin Sultana",
    avatar: "SS",
    checkIn: "09:15 AM",
    checkOut: "06:20 PM",
    hours: "9h 5m",
    status: "Late",
    break: "47m",
  },
];

const weeklyAttendance = [
  { day: "Mon", present: 8, late: 1, absent: 1, leave: 1 },
  { day: "Tue", present: 9, late: 0, absent: 1, leave: 1 },
  { day: "Wed", present: 8, late: 2, absent: 0, leave: 1 },
  { day: "Thu", present: 9, late: 1, absent: 0, leave: 1 },
  { day: "Fri", present: 7, late: 2, absent: 1, leave: 1 },
];

const myAttendanceData: AttendanceRecord[] = [
  {
    id: 1,
    date: "Today",
    checkIn: "09:08 AM",
    checkOut: "06:05 PM",
    hours: "8h 57m",
    status: "Present",
    break: "42m",
  },
  {
    id: 2,
    date: "Yesterday",
    checkIn: "09:18 AM",
    checkOut: "06:12 PM",
    hours: "8h 54m",
    status: "Late",
    break: "45m",
  },
  {
    id: 3,
    date: "May 28, 2026",
    checkIn: "09:00 AM",
    checkOut: "06:02 PM",
    hours: "9h 2m",
    status: "Present",
    break: "40m",
  },
  {
    id: 4,
    date: "May 27, 2026",
    checkIn: "-",
    checkOut: "-",
    hours: "-",
    status: "On Leave",
    break: "-",
  },
  {
    id: 5,
    date: "May 26, 2026",
    checkIn: "08:55 AM",
    checkOut: "05:58 PM",
    hours: "9h 3m",
    status: "Present",
    break: "38m",
  },
];

const statusVariant = (status: string) => {
  if (status === "Present") return "success";
  if (status === "Late") return "warning";
  if (status === "On Leave") return "info";
  return "error";
};

const formatTime = (timeValue: string) =>
  new Date(`2026-01-01T${timeValue}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

const getWorkHours = (
  checkIn: string,
  checkOut: string,
  breakMinutes: string,
) => {
  const start = new Date(`2026-01-01T${checkIn}`).getTime();
  const end = new Date(`2026-01-01T${checkOut}`).getTime();
  const minutes = Math.max(
    0,
    Math.round((end - start) / 60000) - Number(breakMinutes || 0),
  );
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const getDisplayDate = (dateValue: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const normalizedDate = String(dateValue).slice(0, 10);

  if (normalizedDate === today) {
    return "Today";
  }

  return new Date(`${normalizedDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function Attendance() {
  const { user } = useAuth();
  const location = useLocation();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [showLoggedMessage, setShowLoggedMessage] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [clockAction, setClockAction] = useState<"in" | "out" | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [attendanceForm, setAttendanceForm] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    checkIn: "09:00",
    checkOut: "18:00",
    breakMinutes: "45",
    status: "present",
  });
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const pageTitle =
    isEmployee && !isAdmin ? "My Attendance" : "Attendance & Time";
  const pageSubtitle =
    isEmployee && !isAdmin
      ? "Track your attendance and working hours"
      : "Track employee attendance and working hours";
  const currentUserInitials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EU";

  const mapApiAttendanceRecord = useCallback((record: any): AttendanceRecord => {
    const checkInDate = record.checkIn ? new Date(record.checkIn) : null;
    const checkOutDate = record.checkOut ? new Date(record.checkOut) : null;
    const checkInValue = checkInDate
      ? checkInDate.toTimeString().slice(0, 5)
      : "09:00";
    const checkOutValue = checkOutDate
      ? checkOutDate.toTimeString().slice(0, 5)
      : "18:00";

    return {
      id: record.id,
      name: record.name,
      avatar: record.avatar,
      date: getDisplayDate(record.date),
      checkIn: checkInDate
        ? checkInDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "-",
      checkOut: checkOutDate
        ? checkOutDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "-",
      hours:
        typeof record.hoursMinutes === "number"
          ? `${Math.floor(record.hoursMinutes / 60)}h ${record.hoursMinutes % 60}m`
          : checkInDate && checkOutDate
          ? getWorkHours(checkInValue, checkOutValue, "0")
          : "-",
      status: record.status,
      break: "0m",
      hoursMinutes: record.hoursMinutes,
    };
  }, []);

  const loadAttendance = useCallback(async () => {
    setAttendanceLoading(true);

    try {
      const response = await api.get("/attendance");
      setAttendanceRecords(
        response.data.records?.length
          ? response.data.records.map(mapApiAttendanceRecord)
          : [],
      );
    } catch {
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  }, [mapApiAttendanceRecord]);

  useEffect(() => {
    if (isEmployee && location.state?.openLogAttendance) {
      setIsLogModalOpen(true);
    }
  }, [isEmployee, location.state]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const visibleRecords = attendanceRecords.length
    ? attendanceRecords
    : isEmployee
      ? myAttendanceData
      : attendanceData;
  const todayRecord = useMemo(
    () =>
      isEmployee
        ? attendanceRecords.find((record) => record.date === "Today")
        : undefined,
    [attendanceRecords, isEmployee],
  );
  const hasClockedInToday =
    Boolean(todayRecord) && todayRecord?.checkIn !== "-";
  const hasClockedOutToday =
    Boolean(todayRecord) && todayRecord?.checkOut !== "-";
  const presentCount = visibleRecords.filter(
    (record) => record.status === "Present",
  ).length;
  const lateCount = visibleRecords.filter(
    (record) => record.status === "Late",
  ).length;
  const absentCount = visibleRecords.filter(
    (record) => record.status === "Absent",
  ).length;
  const leaveCount = visibleRecords.filter(
    (record) => record.status === "On Leave",
  ).length;

  const showAttendanceFeedback = (message: string, isError = false) => {
    if (isError) {
      setAttendanceError(message);
      setAttendanceMessage("");
    } else {
      setAttendanceMessage(message);
      setAttendanceError("");
    }

    window.setTimeout(() => {
      setAttendanceMessage("");
      setAttendanceError("");
    }, 3000);
  };

  const getApiErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback;

  const handleClockIn = async () => {
    if (!isEmployee) return;

    setClockAction("in");
    try {
      const response = await api.post("/attendance/clock-in");
      await loadAttendance();
      showAttendanceFeedback(response.data.message || "Clock-in saved.");
    } catch (error) {
      showAttendanceFeedback(
        getApiErrorMessage(error, "Unable to clock in right now."),
        true,
      );
    } finally {
      setClockAction(null);
    }
  };

  const handleClockOut = async () => {
    if (!isEmployee) return;

    setClockAction("out");
    try {
      const response = await api.post("/attendance/clock-out");
      await loadAttendance();
      showAttendanceFeedback(response.data.message || "Clock-out saved.");
    } catch (error) {
      showAttendanceFeedback(
        getApiErrorMessage(error, "Unable to clock out right now."),
        true,
      );
    } finally {
      setClockAction(null);
    }
  };

  const handleLogAttendance = async () => {
    if (!isEmployee) return;

    setAttendanceLoading(true);
    try {
      const response = await api.post("/attendance/log", {
        workDate: attendanceForm.workDate,
        clockIn: attendanceForm.checkIn,
        clockOut: attendanceForm.checkOut,
        status: attendanceForm.status,
      });
      const mappedRecord = mapApiAttendanceRecord(response.data.record);

      setAttendanceRecords((records) => [
        {
          ...mappedRecord,
          name: user?.name,
          avatar: currentUserInitials,
          break: `${attendanceForm.breakMinutes}m`,
        },
        ...records.filter((record) => record.date !== mappedRecord.date),
      ]);
      setIsLogModalOpen(false);
      setShowLoggedMessage(true);
      showAttendanceFeedback("Attendance logged successfully.");
      window.setTimeout(() => setShowLoggedMessage(false), 2500);
    } catch (error) {
      showAttendanceFeedback(
        getApiErrorMessage(error, "Unable to log attendance right now."),
        true,
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageSubtitle}</p>
        </div>
        <div className="flex gap-3">
          {isEmployee && !isAdmin && (
            <>
              {!hasClockedInToday && (
                <Button
                  variant="primary"
                  className="gap-2"
                  onClick={handleClockIn}
                  disabled={clockAction === "in"}
                >
                  <Clock className="w-4 h-4" />
                  {clockAction === "in" ? "Clocking In..." : "Clock In"}
                </Button>
              )}
              {hasClockedInToday && !hasClockedOutToday && (
                <Button
                  variant="primary"
                  className="gap-2"
                  onClick={handleClockOut}
                  disabled={clockAction === "out"}
                >
                  <Clock className="w-4 h-4" />
                  {clockAction === "out" ? "Clocking Out..." : "Clock Out"}
                </Button>
              )}
              {hasClockedOutToday && (
                <Button variant="outline" className="gap-2" disabled>
                  <CheckCircle2 className="w-4 h-4" />
                  Clocked Out
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsLogModalOpen(true)}
              >
                <Clock className="w-4 h-4" />
                Log Attendance
              </Button>
            </>
          )}
          <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            <option>Today - Jun 1, 2026</option>
            <option>Yesterday</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {(showLoggedMessage || attendanceMessage) && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          <CheckCircle2 className="w-4 h-4" />
          {attendanceMessage || "Attendance logged successfully."}
        </div>
      )}

      {attendanceError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {attendanceError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--success)]/20">
              <Users className="w-5 h-5 text-[var(--success)]" />
            </div>
            <p className="text-sm text-muted-foreground">Present</p>
          </div>
          <p className="text-2xl text-foreground">
            {isEmployee ? presentCount : (attendanceRecords.length ? presentCount : 8)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee ? "Your records" : `${Math.round(((isEmployee ? presentCount : (attendanceRecords.length ? presentCount : 8)) / 11) * 100)}% of total`}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--warning)]/20">
              <Clock className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <p className="text-sm text-muted-foreground">Late Arrivals</p>
          </div>
          <p className="text-2xl text-foreground">
            {isEmployee ? lateCount : (attendanceRecords.length ? lateCount : 1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee ? "Your records" : `${Math.round(((isEmployee ? lateCount : (attendanceRecords.length ? lateCount : 1)) / 11) * 100)}% of total`}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-destructive/20">
              <Users className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">Absent</p>
          </div>
          <p className="text-2xl text-foreground">
            {isEmployee ? absentCount : (attendanceRecords.length ? absentCount : 1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee ? "Your records" : `${Math.round(((isEmployee ? absentCount : (attendanceRecords.length ? absentCount : 1)) / 11) * 100)}% of total`}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--info)]/20">
              <CalendarIcon className="w-5 h-5 text-[var(--info)]" />
            </div>
            <p className="text-sm text-muted-foreground">On Leave</p>
          </div>
          <p className="text-2xl text-foreground">
            {isEmployee ? leaveCount : (attendanceRecords.length ? leaveCount : 1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee ? "Your records" : `${Math.round(((isEmployee ? leaveCount : (attendanceRecords.length ? leaveCount : 1)) / 11) * 100)}% of total`}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyAttendance.map((day) => (
              <div key={day.day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground w-12">
                    {day.day}
                  </span>
                  <div className="flex-1 flex gap-1 h-8">
                    <div
                      className="bg-[var(--success)] rounded flex items-center justify-center text-xs text-white"
                      style={{ width: `${(day.present / 11) * 100}%` }}
                      title={`Present: ${day.present}`}
                    >
                      {day.present}
                    </div>
                    <div
                      className="bg-[var(--warning)] rounded flex items-center justify-center text-xs text-white"
                      style={{ width: `${(day.late / 11) * 100}%` }}
                      title={`Late: ${day.late}`}
                    >
                      {day.late}
                    </div>
                    <div
                      className="bg-destructive rounded flex items-center justify-center text-xs text-white"
                      style={{ width: `${(day.absent / 11) * 100}%` }}
                      title={`Absent: ${day.absent}`}
                    >
                      {day.absent}
                    </div>
                    <div
                      className="bg-[var(--info)] rounded flex items-center justify-center text-xs text-white"
                      style={{ width: `${(day.leave / 11) * 100}%` }}
                      title={`Leave: ${day.leave}`}
                    >
                      {day.leave}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--success)]"></div>
              <span className="text-xs text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--warning)]"></div>
              <span className="text-xs text-muted-foreground">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-destructive"></div>
              <span className="text-xs text-muted-foreground">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[var(--info)]"></div>
              <span className="text-xs text-muted-foreground">On Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEmployee ? "My Attendance" : "Today's Attendance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isEmployee ? "Date" : "Employee"}</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Break Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {isEmployee ? (
                      <span className="text-sm text-foreground">
                        {record.date}
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                          {record.avatar}
                        </div>
                        <span className="text-sm text-foreground">
                          {record.name}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{record.checkIn}</TableCell>
                  <TableCell className="text-sm">{record.checkOut}</TableCell>
                  <TableCell className="text-sm">{record.hours}</TableCell>
                  <TableCell className="text-sm">{record.break}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={isEmployee && isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Attendance"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleLogAttendance}
              disabled={attendanceLoading}
            >
              {attendanceLoading ? "Saving..." : "Save Attendance"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Work Date"
            type="date"
            value={attendanceForm.workDate}
            onChange={(event) =>
              setAttendanceForm((form) => ({
                ...form,
                workDate: event.target.value,
              }))
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Check In"
              type="time"
              value={attendanceForm.checkIn}
              onChange={(event) =>
                setAttendanceForm((form) => ({
                  ...form,
                  checkIn: event.target.value,
                }))
              }
            />
            <Input
              label="Check Out"
              type="time"
              value={attendanceForm.checkOut}
              onChange={(event) =>
                setAttendanceForm((form) => ({
                  ...form,
                  checkOut: event.target.value,
                }))
              }
            />
          </div>
          <Input
            label="Break Minutes"
            type="number"
            min="0"
            value={attendanceForm.breakMinutes}
            onChange={(event) =>
              setAttendanceForm((form) => ({
                ...form,
                breakMinutes: event.target.value,
              }))
            }
          />
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Status
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={attendanceForm.status}
              onChange={(event) =>
                setAttendanceForm((form) => ({
                  ...form,
                  status: event.target.value,
                }))
              }
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Preview: {formatTime(attendanceForm.checkIn)} to{" "}
            {formatTime(attendanceForm.checkOut)},{" "}
            {getWorkHours(
              attendanceForm.checkIn,
              attendanceForm.checkOut,
              attendanceForm.breakMinutes,
            )}
          </p>
        </div>
      </Modal>
    </div>
  );
}
