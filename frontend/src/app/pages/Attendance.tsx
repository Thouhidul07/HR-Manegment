import { Calendar as CalendarIcon, CheckCircle2, Clock, Users, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { useAuth } from "../contexts/AuthContext";

const attendanceData = [
  { id: 1, name: "John Doe", avatar: "JD", checkIn: "09:05 AM", checkOut: "06:15 PM", hours: "9h 10m", status: "Present", break: "45m" },
  { id: 2, name: "Sarah Smith", avatar: "SS", checkIn: "08:55 AM", checkOut: "05:50 PM", hours: "8h 55m", status: "Present", break: "40m" },
  { id: 3, name: "Mike Johnson", avatar: "MJ", checkIn: "09:25 AM", checkOut: "06:30 PM", hours: "9h 5m", status: "Late", break: "50m" },
  { id: 4, name: "Emily Brown", avatar: "EB", checkIn: "-", checkOut: "-", hours: "-", status: "On Leave", break: "-" },
  { id: 5, name: "David Wilson", avatar: "DW", checkIn: "09:02 AM", checkOut: "06:05 PM", hours: "9h 3m", status: "Present", break: "48m" },
  { id: 6, name: "Lisa Anderson", avatar: "LA", checkIn: "-", checkOut: "-", hours: "-", status: "Absent", break: "-" },
  { id: 7, name: "James Taylor", avatar: "JT", checkIn: "08:50 AM", checkOut: "05:45 PM", hours: "8h 55m", status: "Present", break: "42m" },
  { id: 8, name: "Emma Martinez", avatar: "EM", checkIn: "09:15 AM", checkOut: "06:20 PM", hours: "9h 5m", status: "Late", break: "47m" },
];

const weeklyAttendance = [
  { day: "Mon", present: 1156, late: 45, absent: 12, leave: 21 },
  { day: "Tue", present: 1180, late: 32, absent: 8, leave: 14 },
  { day: "Wed", present: 1165, late: 38, absent: 15, leave: 16 },
  { day: "Thu", present: 1175, late: 28, absent: 10, leave: 21 },
  { day: "Fri", present: 1142, late: 52, absent: 18, leave: 22 },
];

const myAttendanceData = [
  { id: 1, date: "Today", checkIn: "09:08 AM", checkOut: "06:05 PM", hours: "8h 57m", status: "Present", break: "42m" },
  { id: 2, date: "Yesterday", checkIn: "09:18 AM", checkOut: "06:12 PM", hours: "8h 54m", status: "Late", break: "45m" },
  { id: 3, date: "May 28, 2026", checkIn: "09:00 AM", checkOut: "06:02 PM", hours: "9h 2m", status: "Present", break: "40m" },
  { id: 4, date: "May 27, 2026", checkIn: "-", checkOut: "-", hours: "-", status: "On Leave", break: "-" },
  { id: 5, date: "May 26, 2026", checkIn: "08:55 AM", checkOut: "05:58 PM", hours: "9h 3m", status: "Present", break: "38m" },
];

const myWeeklyAttendance = [
  { day: "Mon", status: "Present", hours: "9h 3m" },
  { day: "Tue", status: "On Leave", hours: "-" },
  { day: "Wed", status: "Present", hours: "9h 2m" },
  { day: "Thu", status: "Late", hours: "8h 54m" },
  { day: "Fri", status: "Present", hours: "8h 57m" },
];

const statusVariant = (status: string) => {
  if (status === "Present") return "success";
  if (status === "Late") return "warning";
  if (status === "On Leave") return "info";
  return "error";
};

export function Attendance() {
  const { user } = useAuth();
  const location = useLocation();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [showLoggedMessage, setShowLoggedMessage] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState(myAttendanceData);
  const [attendanceForm, setAttendanceForm] = useState({
    checkIn: "09:00",
    checkOut: "18:00",
    breakMinutes: "45",
  });
  const isEmployee = user?.role === "employee";
  const currentUserInitials = user?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EU";

  useEffect(() => {
    if (location.state?.openLogAttendance) {
      setIsLogModalOpen(true);
    }
  }, [location.state]);

  const formatTime = (timeValue: string) =>
    new Date(`2026-01-01T${timeValue}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const getWorkHours = (checkIn: string, checkOut: string, breakMinutes: string) => {
    const start = new Date(`2026-01-01T${checkIn}`).getTime();
    const end = new Date(`2026-01-01T${checkOut}`).getTime();
    const minutes = Math.max(0, Math.round((end - start) / 60000) - Number(breakMinutes || 0));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleLogAttendance = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttendanceRecords((records) => [
      {
        id: Date.now(),
        date: "Today",
        checkIn: formatTime(attendanceForm.checkIn),
        checkOut: formatTime(attendanceForm.checkOut),
        hours: getWorkHours(attendanceForm.checkIn, attendanceForm.checkOut, attendanceForm.breakMinutes),
        status: "Present",
        break: `${attendanceForm.breakMinutes}m`,
      },
      ...records.filter((record) => record.date !== "Today"),
    ]);
    setIsLogModalOpen(false);
    setShowLoggedMessage(true);
    window.setTimeout(() => setShowLoggedMessage(false), 2200);
  };

  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-foreground mb-2">My Attendance</h1>
            <p className="text-muted-foreground">Track your own attendance and working hours</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" className="gap-2" onClick={() => setIsLogModalOpen(true)}>
              <Clock className="w-4 h-4" />
              Log Attendance
            </Button>
            <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option>This Week</option>
              <option>Today</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[var(--success)]/20">
                <Clock className="w-5 h-5 text-[var(--success)]" />
              </div>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
            <p className="text-2xl text-foreground">Present</p>
            <p className="text-xs text-muted-foreground mt-1">Checked in at 09:08 AM</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[var(--info)]/20">
                <TrendingUp className="w-5 h-5 text-[var(--info)]" />
              </div>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
            <p className="text-2xl text-foreground">35h 56m</p>
            <p className="text-xs text-muted-foreground mt-1">4 working days logged</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[var(--warning)]/20">
                <Clock className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <p className="text-sm text-muted-foreground">Late Days</p>
            </div>
            <p className="text-2xl text-foreground">1</p>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[var(--info)]/20">
                <CalendarIcon className="w-5 h-5 text-[var(--info)]" />
              </div>
              <p className="text-sm text-muted-foreground">Leave</p>
            </div>
            <p className="text-2xl text-foreground">1</p>
            <p className="text-xs text-muted-foreground mt-1">Approved day this week</p>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {myWeeklyAttendance.map((day) => (
                <div key={day.day} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">{day.day}</span>
                    <Badge variant={statusVariant(day.status)}>{day.status}</Badge>
                  </div>
                  <p className="text-xl text-foreground">{day.hours}</p>
                  <p className="text-xs text-muted-foreground mt-1">Work hours</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Attendance History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Break Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                          {currentUserInitials}
                        </div>
                        <span className="text-sm text-foreground">{record.date}</span>
                      </div>
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

        {showLoggedMessage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div className="relative overflow-hidden rounded-2xl bg-card border border-[#543884]/20 px-8 py-6 shadow-2xl text-center">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#543884] via-[#EC4176] to-[#FFA45E]" />
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-500">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="text-lg font-semibold text-foreground">Attendance logged</p>
              <p className="mt-1 text-sm text-muted-foreground">Your attendance record has been updated.</p>
            </div>
          </div>
        )}

        <Modal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          title="Log Attendance"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="log-attendance-form" variant="primary">
                Save Attendance
              </Button>
            </>
          }
        >
          <form id="log-attendance-form" onSubmit={handleLogAttendance} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Check In"
                type="time"
                required
                value={attendanceForm.checkIn}
                onChange={(event) => setAttendanceForm((form) => ({ ...form, checkIn: event.target.value }))}
              />
              <Input
                label="Check Out"
                type="time"
                required
                value={attendanceForm.checkOut}
                onChange={(event) => setAttendanceForm((form) => ({ ...form, checkOut: event.target.value }))}
              />
            </div>
            <Input
              label="Break Time"
              type="number"
              min="0"
              required
              value={attendanceForm.breakMinutes}
              onChange={(event) => setAttendanceForm((form) => ({ ...form, breakMinutes: event.target.value }))}
              placeholder="45"
            />
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Attendance & Time Tracking</h1>
          <p className="text-muted-foreground">Track employee attendance and working hours</p>
        </div>
        <div className="flex gap-3">
          <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            <option>Today - Apr 3, 2026</option>
            <option>Yesterday</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--success)]/20">
              <Users className="w-5 h-5 text-[var(--success)]" />
            </div>
            <p className="text-sm text-muted-foreground">Present</p>
          </div>
          <p className="text-2xl text-foreground">1,156</p>
          <p className="text-xs text-muted-foreground mt-1">93.7% of total</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--warning)]/20">
              <Clock className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <p className="text-sm text-muted-foreground">Late Arrivals</p>
          </div>
          <p className="text-2xl text-foreground">32</p>
          <p className="text-xs text-muted-foreground mt-1">2.6% of total</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-destructive/20">
              <Users className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">Absent</p>
          </div>
          <p className="text-2xl text-foreground">8</p>
          <p className="text-xs text-muted-foreground mt-1">0.6% of total</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--info)]/20">
              <CalendarIcon className="w-5 h-5 text-[var(--info)]" />
            </div>
            <p className="text-sm text-muted-foreground">On Leave</p>
          </div>
          <p className="text-2xl text-foreground">38</p>
          <p className="text-xs text-muted-foreground mt-1">3.1% of total</p>
        </Card>
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyAttendance.map((day) => (
              <div key={day.day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground w-12">{day.day}</span>
                  <div className="flex-1 flex gap-1 h-8">
                    <div
                      className="bg-[var(--success)] rounded flex items-center justify-center text-xs text-white"
                      style={{ width: `${(day.present / 1234) * 100}%` }}
                      title={`Present: ${day.present}`}
                    >
                      {day.present}
                    </div>
                    <div
                      className="bg-[var(--warning)] rounded flex items-center justify-center text-xs text-white"
                      style={{ width: `${(day.late / 1234) * 100}%` }}
                      title={`Late: ${day.late}`}
                    >
                      {day.late}
                    </div>
                    <div
                      className="bg-destructive rounded flex items-center justify-center text-xs text-white"
                      style={{ width: `${(day.absent / 1234) * 100}%` }}
                      title={`Absent: ${day.absent}`}
                    >
                      {day.absent}
                    </div>
                    <div
                      className="bg-[var(--info)] rounded flex items-center justify-center text-xs text-white"
                      style={{ width: `${(day.leave / 1234) * 100}%` }}
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

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Break Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        {record.avatar}
                      </div>
                      <span className="text-sm text-foreground">{record.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{record.checkIn}</TableCell>
                  <TableCell className="text-sm">{record.checkOut}</TableCell>
                  <TableCell className="text-sm">{record.hours}</TableCell>
                  <TableCell className="text-sm">{record.break}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant(record.status)}
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
