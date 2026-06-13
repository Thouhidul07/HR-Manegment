import { Plus, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

type LeaveStatus = "Pending" | "Approved" | "Rejected";
type LeaveFilter = "All" | LeaveStatus;

type LeaveRequest = {
  id: number | string;
  employee: string;
  avatar: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: LeaveStatus;
  reason: string;
};

const leaveRequests: LeaveRequest[] = [
  {
    id: 1,
    employee: "Tanvir Hasan",
    avatar: "TH",
    type: "Sick Leave",
    from: "Apr 5, 2026",
    to: "Apr 6, 2026",
    days: 2,
    status: "Pending",
    reason: "Medical checkup",
  },
  {
    id: 2,
    employee: "Nusrat Jahan",
    avatar: "NJ",
    type: "Annual Leave",
    from: "Apr 10, 2026",
    to: "Apr 15, 2026",
    days: 5,
    status: "Approved",
    reason: "Family visit to Khulna",
  },
  {
    id: 3,
    employee: "Rakibul Islam",
    avatar: "RI",
    type: "Personal",
    from: "Apr 8, 2026",
    to: "Apr 8, 2026",
    days: 1,
    status: "Pending",
    reason: "Personal matters",
  },
  {
    id: 4,
    employee: "Farhana Akter",
    avatar: "FA",
    type: "Sick Leave",
    from: "Apr 3, 2026",
    to: "Apr 4, 2026",
    days: 2,
    status: "Approved",
    reason: "Flu",
  },
  {
    id: 5,
    employee: "Mehedi Hasan",
    avatar: "MH",
    type: "Annual Leave",
    from: "Apr 20, 2026",
    to: "Apr 25, 2026",
    days: 5,
    status: "Rejected",
    reason: "Family trip to Sylhet",
  },
];

const leaveBalances = [
  {
    type: "Sick Leave",
    total: 12,
    used: 4,
    remaining: 8,
    color: "var(--chart-3)",
  },
  {
    type: "Vacation",
    total: 20,
    used: 8,
    remaining: 12,
    color: "var(--chart-1)",
  },
  {
    type: "Personal",
    total: 5,
    used: 2,
    remaining: 3,
    color: "var(--chart-2)",
  },
  { type: "Unpaid", total: 0, used: 1, remaining: -1, color: "var(--chart-4)" },
];

const upcomingLeaves = [
  {
    date: "Apr 5-6",
    employee: "Tanvir Hasan",
    type: "Sick Leave",
    avatar: "TH",
  },
  { date: "Apr 8", employee: "Rakibul Islam", type: "Personal", avatar: "RI" },
  {
    date: "Apr 10-15",
    employee: "Nusrat Jahan",
    type: "Annual Leave",
    avatar: "NJ",
  },
  {
    date: "Apr 12-13",
    employee: "Sadia Rahman",
    type: "Sick Leave",
    avatar: "SR",
  },
];

const leaveFilters: LeaveFilter[] = ["All", "Pending", "Approved", "Rejected"];

const formatDisplayDate = (dateValue: string) =>
  new Date(`${String(dateValue).slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

const formatUpcomingDate = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const month = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  return from === to
    ? `${month} ${startDay}`
    : `${month} ${startDay}-${endDay}`;
};

const getLeaveDays = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
};

const statusVariant = (status: string) => {
  if (status === "Approved") return "border-emerald-400/30 bg-emerald-400/15 text-emerald-300";
  if (status === "Pending") return "border-amber-400/30 bg-amber-400/15 text-amber-300";
  return "border-rose-400/30 bg-rose-400/15 text-rose-300";
};

const leaveStatusFilterStyles: Record<
  LeaveFilter,
  { text: string; dot: string; activeText: string }
> = {
  All: {
    text: "text-slate-300",
    dot: "bg-slate-400",
    activeText: "text-white",
  },
  Pending: {
    text: "text-amber-300",
    dot: "bg-amber-400",
    activeText: "text-amber-100",
  },
  Approved: {
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    activeText: "text-emerald-100",
  },
  Rejected: {
    text: "text-rose-300",
    dot: "bg-rose-400",
    activeText: "text-rose-100",
  },
};

export function LeaveManagement() {
  const { user } = useAuth();
  const location = useLocation();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestList, setRequestList] = useState<LeaveRequest[]>(leaveRequests);
  const [upcomingLeaveList, setUpcomingLeaveList] = useState(upcomingLeaves);
  const [activeLeaveFilter, setActiveLeaveFilter] =
    useState<LeaveFilter>("All");
  const [showSubmittedMessage, setShowSubmittedMessage] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "Sick Leave",
    from: "",
    to: "",
    reason: "",
  });
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const isHRManager = user?.role === "hr_manager";
  const canRequestLeave = isEmployee && !isAdmin;
  const canReviewLeave = isHRManager || isAdmin;
  const pageTitle = isEmployee && !isAdmin ? "My Leave" : "Leave Management";
  const pageSubtitle =
    isEmployee && !isAdmin
      ? "Request leave and track your balances"
      : "Manage employee leave requests and balances";
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EU";

  const mapApiLeaveRequest = (request: any): LeaveRequest => ({
    id: request.id,
    employee: request.employee || user?.name || "Employee User",
    avatar: request.avatar || initials,
    type: request.type,
    from: formatDisplayDate(request.from),
    to: formatDisplayDate(request.to),
    days: Number(request.days || getLeaveDays(request.from, request.to)),
    status: request.status,
    reason: request.reason || "",
  });

  const visibleLeaveRequests = isEmployee
    ? requestList.map((request) => ({
        ...request,
        employee: user?.name || "Employee User",
        avatar: initials,
      }))
    : requestList;
  const filteredLeaveRequests =
    activeLeaveFilter === "All"
      ? visibleLeaveRequests
      : visibleLeaveRequests.filter(
          (request) => request.status === activeLeaveFilter,
        );
  const activeFilterIndex = leaveFilters.indexOf(activeLeaveFilter);
  const pendingCount = visibleLeaveRequests.filter(
    (request) => request.status === "Pending",
  ).length;
  const approvedThisMonthCount = visibleLeaveRequests.filter(
    (request) => request.status === "Approved",
  ).length;
  const visibleUpcomingLeaves = isEmployee
    ? upcomingLeaveList
        .filter(
          (leave) =>
            leave.employee === "Tanvir Hasan" ||
            leave.employee === (user?.name || "Employee User"),
        )
        .slice(0, 3)
        .map((leave) => ({
          ...leave,
          employee: user?.name || "Employee User",
          avatar: initials,
        }))
    : upcomingLeaveList;

  useEffect(() => {
    if (canRequestLeave && location.state?.openRequestLeave) {
      setIsRequestModalOpen(true);
    }
  }, [canRequestLeave, location.state]);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/leave")
      .then((response) => {
        if (!isMounted || !response.data.requests?.length) return;
        setRequestList(response.data.requests.map(mapApiLeaveRequest));
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const resetLeaveForm = () => {
    setLeaveForm({ type: "Sick Leave", from: "", to: "", reason: "" });
  };

  const handleSubmitLeaveRequest = async () => {
    if (!canRequestLeave) return;
    const response = await api.post("/leave", {
      leaveType: leaveForm.type,
      startDate: leaveForm.from,
      endDate: leaveForm.to,
      reason: leaveForm.reason,
    });
    const createdRequest = mapApiLeaveRequest(response.data.request);

    setRequestList((requests) => [createdRequest, ...requests]);
    setUpcomingLeaveList((leaves) => [
      {
        date: formatUpcomingDate(leaveForm.from, leaveForm.to),
        employee: user?.name || "Employee User",
        type: leaveForm.type,
        avatar: initials,
      },
      ...leaves,
    ]);
    resetLeaveForm();
    setIsRequestModalOpen(false);
    setShowSubmittedMessage(true);
    window.setTimeout(() => setShowSubmittedMessage(false), 2500);
  };

  const handleUpdateStatus = async (
    requestId: number | string,
    status: "approved" | "rejected",
  ) => {
    const response = await api.patch(`/leave/${requestId}/status`, { status });
    const updatedRequest = mapApiLeaveRequest(response.data.request);
    setRequestList((requests) =>
      requests.map((request) =>
        request.id === requestId ? updatedRequest : request,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageSubtitle}</p>
        </div>
        {canRequestLeave && (
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => setIsRequestModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Request Leave
          </Button>
        )}
      </div>

      {showSubmittedMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          <CheckCircle2 className="w-4 h-4" />
          Leave request submitted successfully.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Requests</p>
          <p className="text-2xl text-foreground mt-1">{pendingCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Approved This Month</p>
          <p className="text-2xl text-foreground mt-1">
            {approvedThisMonthCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">On Leave Today</p>
          <p className="text-2xl text-foreground mt-1">38</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Upcoming Leaves</p>
          <p className="text-2xl text-foreground mt-1">
            {visibleUpcomingLeaves.length}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {isEmployee ? "Your Leave Balance" : "Leave Balances"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {leaveBalances.map((leave) => (
                <div key={leave.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">
                      {leave.type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {leave.remaining} of {leave.total} remaining
                    </span>
                  </div>
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${leave.total > 0 ? (leave.used / leave.total) * 100 : 100}%`,
                        backgroundColor: leave.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Used: {leave.used} days</span>
                    <span>Remaining: {leave.remaining} days</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visibleUpcomingLeaves.map((leave, index) => (
                <div
                  key={`${leave.employee}-${leave.date}-${index}`}
                  className="p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm flex-shrink-0">
                      {leave.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {leave.employee}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {leave.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarIcon className="w-3 h-3" />
                    {leave.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Requests</CardTitle>
            <div className="relative grid w-[420px] grid-cols-4 rounded-2xl border border-[#543884]/20 bg-[#120926]/50 p-1">
              <div
                className="absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc((100%-0.5rem)/4)] rounded-xl border border-[#9A77CF]/40 bg-[#543884]/35 shadow-sm transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${activeFilterIndex * 100}%)` }}
              />
              {leaveFilters.map((filter) => {
                const styles = leaveStatusFilterStyles[filter];
                const isActive = activeLeaveFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveLeaveFilter(filter)}
                    className={`relative z-10 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? styles.activeText : styles.text
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        {request.avatar}
                      </div>
                      <span className="text-sm text-foreground">
                        {request.employee}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{request.type}</TableCell>
                  <TableCell className="text-sm">{request.from}</TableCell>
                  <TableCell className="text-sm">{request.to}</TableCell>
                  <TableCell className="text-sm">{request.days}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {request.reason}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canReviewLeave && request.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--success)]"
                          onClick={() =>
                            handleUpdateStatus(request.id, "approved")
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() =>
                            handleUpdateStatus(request.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!filteredLeaveRequests.length && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No {activeLeaveFilter === "All" ? "" : activeLeaveFilter.toLowerCase()} leave requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={canRequestLeave && isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Leave"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitLeaveRequest}
              disabled={!leaveForm.from || !leaveForm.to}
            >
              Submit Request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Leave Type
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={leaveForm.type}
              onChange={(event) =>
                setLeaveForm((form) => ({ ...form, type: event.target.value }))
              }
            >
              <option>Sick Leave</option>
              <option>Vacation</option>
              <option>Personal</option>
              <option>Unpaid</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="From"
              type="date"
              value={leaveForm.from}
              onChange={(event) =>
                setLeaveForm((form) => ({ ...form, from: event.target.value }))
              }
            />
            <Input
              label="To"
              type="date"
              value={leaveForm.to}
              onChange={(event) =>
                setLeaveForm((form) => ({ ...form, to: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Reason
            </label>
            <Textarea
              value={leaveForm.reason}
              onChange={(event) =>
                setLeaveForm((form) => ({
                  ...form,
                  reason: event.target.value,
                }))
              }
              placeholder="Add a short reason for the request"
            />
          </div>
          {leaveForm.from && leaveForm.to && (
            <p className="text-xs text-muted-foreground">
              Total: {getLeaveDays(leaveForm.from, leaveForm.to)} day(s)
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
