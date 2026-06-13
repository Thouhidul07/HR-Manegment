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
  workDate?: string;
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

type WeeklyOverviewFilter = "all" | "present" | "late" | "absent" | "leave";
type WeeklyOverviewDay = {
  day: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
};

type PersonalWeekDay = {
  day: string;
  dateLabel: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  hours?: string;
};

const statusToWeeklyKey = (status: string): Exclude<WeeklyOverviewFilter, "all"> => {
  const normalized = status.toLowerCase();
  if (normalized === "on leave" || normalized === "leave") return "leave";
  if (normalized === "late") return "late";
  if (normalized === "absent") return "absent";
  return "present";
};

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getRecordDateKey = (record: AttendanceRecord) => {
  if (record.workDate) return record.workDate;

  if (record.date === "Today") return getDateKey(new Date());

  if (record.date === "Yesterday") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getDateKey(yesterday);
  }

  if (record.date) {
    const parsed = new Date(record.date);
    if (!Number.isNaN(parsed.getTime())) return getDateKey(parsed);
  }

  return "";
};

const isSameWeek = (dateKey: string, baseDate: Date) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const weekStart = new Date(baseDate);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return date >= weekStart && date <= weekEnd;
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
  const [hasLoadedAttendance, setHasLoadedAttendance] = useState(false);
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

  // Interactive Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOverviewDay[]>([]);
  const [summaryData, setSummaryData] = useState<any>({ present: 0, late: 0, absent: 0, leave: 0 });
  const [weeklyOverviewFilter, setWeeklyOverviewFilter] = useState<WeeklyOverviewFilter>("all");
  const [periodFilter, setPeriodFilter] = useState("month");
  const attendanceStatusRequiresTime = attendanceForm.status === "present" || attendanceForm.status === "late";

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
      workDate: record.workDate || (record.date ? String(record.date).slice(0, 10) : ""),
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
      const params: any = {};
      if (selectedStatus !== "All") {
        const apiStatusMap: Record<string, string> = {
          "Present": "present",
          "Late": "late",
          "Absent": "absent",
          "On Leave": "leave"
        };
        params.status = apiStatusMap[selectedStatus] || selectedStatus;
      }
      const response = await api.get("/attendance", { params });
      setAttendanceRecords(
        response.data.records?.length
          ? response.data.records.map(mapApiAttendanceRecord)
          : [],
      );

      // load summary and weekly overview
      const [summaryRes, weeklyRes] = await Promise.all([
        api.get("/attendance/summary"),
        api.get("/attendance/weekly-overview")
      ]);
      if (summaryRes.data) {
        setSummaryData(summaryRes.data);
      }
      if (weeklyRes.data?.overview) {
        setWeeklyOverview(weeklyRes.data.overview);
      }
    } catch {
      setAttendanceRecords([]);
    } finally {
      setHasLoadedAttendance(true);
      setAttendanceLoading(false);
    }
  }, [selectedStatus, mapApiAttendanceRecord]);

  useEffect(() => {
    if (isEmployee && location.state?.openLogAttendance) {
      if (location.state?.workDate) {
        setAttendanceForm((form) => ({
          ...form,
          workDate: location.state.workDate,
        }));
      }
      setIsLogModalOpen(true);
    }
  }, [isEmployee, location.state]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const rawRecords = attendanceRecords.length
    ? attendanceRecords
    : hasLoadedAttendance
      ? []
    : isEmployee
      ? myAttendanceData
      : attendanceData;

  const visibleRecords = useMemo(() => {
    if (selectedStatus === "All") return rawRecords;
    return rawRecords.filter((record) => {
      const recStatus = record.status.toLowerCase() === "leave" ? "on leave" : record.status.toLowerCase();
      const selStatus = selectedStatus.toLowerCase() === "leave" ? "on leave" : selectedStatus.toLowerCase();
      return recStatus === selStatus;
    });
  }, [rawRecords, selectedStatus]);

  const filteredRecords = useMemo(() => {
    const today = new Date();
    const todayKey = getDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);
    const currentMonth = todayKey.slice(0, 7);

    return visibleRecords.filter((record) => {
      const dateKey = getRecordDateKey(record);

      if (!dateKey) return periodFilter === "all";
      if (periodFilter === "today") return dateKey === todayKey;
      if (periodFilter === "yesterday") return dateKey === yesterdayKey;
      if (periodFilter === "week") return isSameWeek(dateKey, today);
      if (periodFilter === "month") return dateKey.startsWith(currentMonth);
      return true;
    });
  }, [periodFilter, visibleRecords]);

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

  const personalWeeklyOverview = useMemo<PersonalWeekDay[]>(() => {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateKey = getDateKey(date);
      const record = rawRecords.find((item) => getRecordDateKey(item) === dateKey);

      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        status: record?.status,
        checkIn: record?.checkIn,
        checkOut: record?.checkOut,
        hours: record?.hours,
      };
    });
  }, [rawRecords]);

  // Use values from backend summary where available, otherwise count filtered records
  const presentCount = attendanceRecords.length ? summaryData.present : filteredRecords.filter((record) => record.status === "Present").length;
  const lateCount = attendanceRecords.length ? summaryData.late : filteredRecords.filter((record) => record.status === "Late").length;
  const absentCount = attendanceRecords.length ? summaryData.absent : filteredRecords.filter((record) => record.status === "Absent").length;
  const leaveCount = attendanceRecords.length ? summaryData.leave : filteredRecords.filter((record) => record.status === "On Leave").length;

  const handleToggleFilter = (status: string) => {
    if (selectedStatus === status) {
      setSelectedStatus("All");
    } else {
      setSelectedStatus(status);
    }
  };

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
      const payload = attendanceStatusRequiresTime
        ? {
            workDate: attendanceForm.workDate,
            clockIn: attendanceForm.checkIn,
            clockOut: attendanceForm.checkOut,
            status: attendanceForm.status,
          }
        : {
            workDate: attendanceForm.workDate,
            status: attendanceForm.status,
          };
      const response = await api.post("/attendance/log", payload);
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
          <select
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Records</option>
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
        <Card 
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${selectedStatus === "Present" ? "border-primary bg-primary/5" : "border-transparent"}`}
          onClick={() => handleToggleFilter("Present")}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[var(--success)]/20">
                <Users className="w-5 h-5 text-[var(--success)]" />
              </div>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            {selectedStatus === "Present" && (
              <Badge variant="success" size="sm">Filtered</Badge>
            )}
          </div>
          <p className="text-2xl text-foreground font-bold">
            {presentCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee ? "Your records" : `${Math.round((presentCount / 11) * 100)}% of total`}
          </p>
        </Card>

        <Card 
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${selectedStatus === "Late" ? "border-primary bg-primary/5" : "border-transparent"}`}
          onClick={() => handleToggleFilter("Late")}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[var(--warning)]/20">
                <Clock className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <p className="text-sm text-muted-foreground">Late Arrivals</p>
            </div>
            {selectedStatus === "Late" && (
              <Badge variant="warning" size="sm">Filtered</Badge>
            )}
          </div>
          <p className="text-2xl text-foreground font-bold">
            {lateCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee ? "Your records" : `${Math.round((lateCount / 11) * 100)}% of total`}
          </p>
        </Card>

        <Card 
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${selectedStatus === "Absent" ? "border-primary bg-primary/5" : "border-transparent"}`}
          onClick={() => handleToggleFilter("Absent")}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/20">
                <Users className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            {selectedStatus === "Absent" && (
              <Badge variant="error" size="sm">Filtered</Badge>
            )}
          </div>
          <p className="text-2xl text-foreground font-bold">
            {absentCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee ? "Your records" : `${Math.round((absentCount / 11) * 100)}% of total`}
          </p>
        </Card>

        <Card 
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${selectedStatus === "On Leave" ? "border-primary bg-primary/5" : "border-transparent"}`}
          onClick={() => handleToggleFilter("On Leave")}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[var(--info)]/20">
                <CalendarIcon className="w-5 h-5 text-[var(--info)]" />
              </div>
              <p className="text-sm text-muted-foreground">On Leave</p>
            </div>
            {selectedStatus === "On Leave" && (
              <Badge variant="info" size="sm">Filtered</Badge>
            )}
          </div>
          <p className="text-2xl text-foreground font-bold">
            {leaveCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee ? "Your records" : `${Math.round((leaveCount / 11) * 100)}% of total`}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEmployee ? "My Week" : "Weekly Overview"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isEmployee ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {personalWeeklyOverview.map((day) => {
                const isFiltered =
                  selectedStatus === "All" ||
                  (day.status && statusToWeeklyKey(day.status) === statusToWeeklyKey(selectedStatus));

                return (
                  <button
                    key={`${day.day}-${day.dateLabel}`}
                    type="button"
                    onClick={() => day.status && handleToggleFilter(day.status)}
                    disabled={!day.status}
                    className={`min-h-[132px] rounded-lg border p-4 text-left transition-all ${
                      day.status
                        ? "cursor-pointer hover:border-primary/50 hover:bg-accent/30"
                        : "cursor-default bg-accent/10"
                    } ${isFiltered ? "opacity-100" : "opacity-40"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{day.day}</p>
                        <p className="text-xs text-muted-foreground">{day.dateLabel}</p>
                      </div>
                      {day.status ? (
                        <Badge variant={statusVariant(day.status)} size="sm">
                          {day.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">
                          No Record
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <p>In: {day.checkIn || "-"}</p>
                      <p>Out: {day.checkOut || "-"}</p>
                      <p>Hours: {day.hours || "-"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {(weeklyOverview.length ? weeklyOverview : weeklyAttendance).map((day) => (
                <div key={day.day} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground w-12">
                      {day.day}
                    </span>
                    <div className="flex-1 flex gap-1 h-8">
                      <div
                        className="bg-[var(--success)] rounded flex items-center justify-center text-xs text-white transition-all duration-200"
                        style={{ 
                          width: `${(day.present / 11) * 100}%`,
                          opacity: selectedStatus === "All" || selectedStatus === "Present" ? 1 : 0.15
                        }}
                        title={`Present: ${day.present}`}
                      >
                        {day.present > 0 && day.present}
                      </div>
                      <div
                        className="bg-[var(--warning)] rounded flex items-center justify-center text-xs text-white transition-all duration-200"
                        style={{ 
                          width: `${(day.late / 11) * 100}%`,
                          opacity: selectedStatus === "All" || selectedStatus === "Late" ? 1 : 0.15
                        }}
                        title={`Late: ${day.late}`}
                      >
                        {day.late > 0 && day.late}
                      </div>
                      <div
                        className="bg-destructive rounded flex items-center justify-center text-xs text-white transition-all duration-200"
                        style={{ 
                          width: `${(day.absent / 11) * 100}%`,
                          opacity: selectedStatus === "All" || selectedStatus === "Absent" ? 1 : 0.15
                        }}
                        title={`Absent: ${day.absent}`}
                      >
                        {day.absent > 0 && day.absent}
                      </div>
                      <div
                        className="bg-[var(--info)] rounded flex items-center justify-center text-xs text-white transition-all duration-200"
                        style={{ 
                          width: `${(day.leave / 11) * 100}%`,
                          opacity: selectedStatus === "All" || selectedStatus === "On Leave" ? 1 : 0.15
                        }}
                        title={`Leave: ${day.leave}`}
                      >
                        {day.leave > 0 && day.leave}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
            <div 
              onClick={() => setSelectedStatus("All")}
              className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all ${selectedStatus === "All" ? "bg-primary text-primary-foreground border-primary font-medium" : "border-border hover:bg-accent/40 text-muted-foreground bg-accent/10"}`}
            >
              <span className="text-xs">All Records</span>
            </div>
            <div 
              onClick={() => handleToggleFilter("Present")}
              className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all ${selectedStatus === "Present" ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 font-medium" : "border-border hover:bg-accent/40 text-muted-foreground bg-accent/10"}`}
            >
              <div className="w-3 h-3 rounded bg-[var(--success)]"></div>
              <span className="text-xs">Present</span>
            </div>
            <div 
              onClick={() => handleToggleFilter("Late")}
              className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all ${selectedStatus === "Late" ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30 font-medium" : "border-border hover:bg-accent/40 text-muted-foreground bg-accent/10"}`}
            >
              <div className="w-3 h-3 rounded bg-[var(--warning)]"></div>
              <span className="text-xs">Late</span>
            </div>
            <div 
              onClick={() => handleToggleFilter("Absent")}
              className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all ${selectedStatus === "Absent" ? "bg-destructive/10 text-destructive border-destructive/30 font-medium" : "border-border hover:bg-accent/40 text-muted-foreground bg-accent/10"}`}
            >
              <div className="w-3 h-3 rounded bg-destructive"></div>
              <span className="text-xs">Absent</span>
            </div>
            <div 
              onClick={() => handleToggleFilter("On Leave")}
              className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all ${selectedStatus === "On Leave" ? "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/30 font-medium" : "border-border hover:bg-accent/40 text-muted-foreground bg-accent/10"}`}
            >
              <div className="w-3 h-3 rounded bg-[var(--info)]"></div>
              <span className="text-xs">On Leave</span>
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
              {filteredRecords.map((record) => (
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
              {!filteredRecords.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No attendance records found for this filter.
                  </TableCell>
                </TableRow>
              )}
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
              disabled={!attendanceStatusRequiresTime}
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
              disabled={!attendanceStatusRequiresTime}
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
            disabled={!attendanceStatusRequiresTime}
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
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
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
            {attendanceStatusRequiresTime ? (
              <>
                Preview: {formatTime(attendanceForm.checkIn)} to{" "}
                {formatTime(attendanceForm.checkOut)},{" "}
                {getWorkHours(
                  attendanceForm.checkIn,
                  attendanceForm.checkOut,
                  attendanceForm.breakMinutes,
                )}
              </>
            ) : (
              "Preview: no clock-in, clock-out, or work hours will be saved for this status."
            )}
          </p>
        </div>
      </Modal>
    </div>
  );
}
