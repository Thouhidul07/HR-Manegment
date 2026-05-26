import { Calendar as CalendarIcon, Clock, Users, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";

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

export function Attendance() {
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
                      variant={
                        record.status === "Present"
                          ? "success"
                          : record.status === "Late"
                          ? "warning"
                          : record.status === "On Leave"
                          ? "info"
                          : "error"
                      }
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
