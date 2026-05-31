import { Plus, Calendar as CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";

const leaveRequests = [
  { id: 1, employee: "John Doe", avatar: "JD", type: "Sick Leave", from: "Apr 5, 2026", to: "Apr 6, 2026", days: 2, status: "Pending", reason: "Medical checkup" },
  { id: 2, employee: "Sarah Smith", avatar: "SS", type: "Vacation", from: "Apr 10, 2026", to: "Apr 15, 2026", days: 5, status: "Approved", reason: "Family vacation" },
  { id: 3, employee: "Mike Johnson", avatar: "MJ", type: "Personal", from: "Apr 8, 2026", to: "Apr 8, 2026", days: 1, status: "Pending", reason: "Personal matters" },
  { id: 4, employee: "Emily Brown", avatar: "EB", type: "Sick Leave", from: "Apr 3, 2026", to: "Apr 4, 2026", days: 2, status: "Approved", reason: "Flu" },
  { id: 5, employee: "David Wilson", avatar: "DW", type: "Vacation", from: "Apr 20, 2026", to: "Apr 25, 2026", days: 5, status: "Rejected", reason: "Holiday trip" },
];

const leaveBalances = [
  { type: "Sick Leave", total: 12, used: 4, remaining: 8, color: "var(--chart-3)" },
  { type: "Vacation", total: 20, used: 8, remaining: 12, color: "var(--chart-1)" },
  { type: "Personal", total: 5, used: 2, remaining: 3, color: "var(--chart-2)" },
  { type: "Unpaid", total: 0, used: 1, remaining: -1, color: "var(--chart-4)" },
];

const upcomingLeaves = [
  { date: "Apr 5-6", employee: "John Doe", type: "Sick Leave", avatar: "JD" },
  { date: "Apr 8", employee: "Mike Johnson", type: "Personal", avatar: "MJ" },
  { date: "Apr 10-15", employee: "Sarah Smith", type: "Vacation", avatar: "SS" },
  { date: "Apr 12-13", employee: "Lisa Anderson", type: "Sick Leave", avatar: "LA" },
];

type LeaveFilter = "All" | "Pending" | "Approved" | "Rejected";
const leaveFilters: LeaveFilter[] = ["All", "Pending", "Approved", "Rejected"];

export function LeaveManagement() {
  const { user } = useAuth();
  const location = useLocation();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestList, setRequestList] = useState(leaveRequests);
  const [upcomingLeaveList, setUpcomingLeaveList] = useState(upcomingLeaves);
  const [leaveForm, setLeaveForm] = useState({
    type: "Sick Leave",
    from: "",
    to: "",
    reason: "",
  });
  const [showSubmittedMessage, setShowSubmittedMessage] = useState(false);
  const [activeLeaveFilter, setActiveLeaveFilter] = useState<LeaveFilter>("All");
  const [slideDirection, setSlideDirection] = useState(1);
  const isEmployee = user?.role === "employee";
  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EU";
  const visibleLeaveRequests = isEmployee
    ? requestList.map((request) => ({ ...request, employee: user?.name || "Employee User", avatar: initials }))
    : requestList;
  const visibleUpcomingLeaves = isEmployee
    ? upcomingLeaveList.filter((leave) => leave.employee === "John Doe" || leave.employee === (user?.name || "Employee User")).slice(0, 3).map((leave) => ({ ...leave, employee: user?.name || "Employee User", avatar: initials }))
    : upcomingLeaveList;
  const pendingCount = visibleLeaveRequests.filter((request) => request.status === "Pending").length;
  const approvedThisMonthCount = visibleLeaveRequests.filter((request) => request.status === "Approved").length;
  const filteredLeaveRequests = activeLeaveFilter === "All"
    ? visibleLeaveRequests
    : visibleLeaveRequests.filter((request) => request.status === activeLeaveFilter);

  const formatDisplayDate = (dateValue: string) =>
    new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatUpcomingDate = (from: string, to: string) => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    const month = start.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();
    return from === to ? `${month} ${startDay}` : `${month} ${startDay}-${endDay}`;
  };

  const getLeaveDays = (from: string, to: string) => {
    const start = new Date(`${from}T00:00:00`).getTime();
    const end = new Date(`${to}T00:00:00`).getTime();
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  };

  const resetLeaveForm = () => {
    setLeaveForm({ type: "Sick Leave", from: "", to: "", reason: "" });
  };

  const handleLeaveFilterChange = (filter: LeaveFilter) => {
    const currentIndex = leaveFilters.indexOf(activeLeaveFilter);
    const nextIndex = leaveFilters.indexOf(filter);
    setSlideDirection(nextIndex >= currentIndex ? 1 : -1);
    setActiveLeaveFilter(filter);
  };

  useEffect(() => {
    if (location.state?.openRequestLeave) {
      setIsRequestModalOpen(true);
    }
  }, [location.state]);

  const handleRequestLeave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newRequest = {
      id: Date.now(),
      employee: user?.name || "Employee User",
      avatar: initials,
      type: leaveForm.type,
      from: formatDisplayDate(leaveForm.from),
      to: formatDisplayDate(leaveForm.to),
      days: getLeaveDays(leaveForm.from, leaveForm.to),
      status: "Pending",
      reason: leaveForm.reason,
    };

    setRequestList((requests) => [newRequest, ...requests]);
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
    window.setTimeout(() => setShowSubmittedMessage(false), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">{isEmployee ? "My Leave" : "Leave Management"}</h1>
          <p className="text-muted-foreground">{isEmployee ? "Manage your leave requests and balances" : "Manage employee leave requests and balances"}</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsRequestModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Request Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Requests</p>
          <p className="text-2xl text-foreground mt-1">{isEmployee ? pendingCount : "8"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Approved This Month</p>
          <p className="text-2xl text-foreground mt-1">{isEmployee ? approvedThisMonthCount : "42"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">On Leave Today</p>
          <p className="text-2xl text-foreground mt-1">{isEmployee ? "No" : "38"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Upcoming Leaves</p>
          <p className="text-2xl text-foreground mt-1">{isEmployee ? visibleUpcomingLeaves.length : "24"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Balance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {leaveBalances.map((leave) => (
                <div key={leave.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{leave.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {leave.remaining} of {leave.total} remaining
                    </span>
                  </div>
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(leave.used / leave.total) * 100}%`,
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

        {/* Upcoming Leaves */}
        <Card>
          <CardHeader>
            <CardTitle>{isEmployee ? "My Upcoming Leaves" : "Upcoming Leaves"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visibleUpcomingLeaves.map((leave, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm flex-shrink-0">
                      {leave.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{leave.employee}</p>
                      <p className="text-xs text-muted-foreground">{leave.type}</p>
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

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEmployee ? "My Leave Requests" : "Leave Requests"}</CardTitle>
            <div className="flex gap-2">
              {leaveFilters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeLeaveFilter === filter ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => handleLeaveFilterChange(filter)}
                  className={activeLeaveFilter === filter ? "border-[#9A77CF] text-foreground" : ""}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={activeLeaveFilter}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection * 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection * -48 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
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
                          <span className="text-sm text-foreground">{request.employee}</span>
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
                        <Badge
                          variant={
                            request.status === "Approved"
                              ? "success"
                              : request.status === "Pending"
                              ? "warning"
                              : "error"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.status === "Pending" && !isEmployee && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-[var(--success)]">
                              Approve
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLeaveRequests.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No {activeLeaveFilter.toLowerCase()} leave requests found.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {showSubmittedMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="relative overflow-hidden rounded-2xl bg-card border border-[#543884]/20 px-8 py-6 shadow-2xl text-center">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#543884] via-[#EC4176] to-[#FFA45E]" />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-foreground">Request submitted</p>
            <p className="mt-1 text-sm text-muted-foreground">Your leave request is now pending review.</p>
          </div>
        </div>
      )}

      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Leave"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="request-leave-form" variant="primary">
              Submit Request
            </Button>
          </>
        }
      >
        <form id="request-leave-form" onSubmit={handleRequestLeave} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5 text-foreground">Leave Type</label>
            <select
              value={leaveForm.type}
              onChange={(event) => setLeaveForm((form) => ({ ...form, type: event.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Sick Leave</option>
              <option>Vacation</option>
              <option>Personal</option>
              <option>Unpaid</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="From"
              type="date"
              required
              value={leaveForm.from}
              onChange={(event) => setLeaveForm((form) => ({ ...form, from: event.target.value, to: form.to || event.target.value }))}
            />
            <Input
              label="To"
              type="date"
              required
              min={leaveForm.from}
              value={leaveForm.to}
              onChange={(event) => setLeaveForm((form) => ({ ...form, to: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-foreground">Reason</label>
            <Textarea
              required
              value={leaveForm.reason}
              onChange={(event) => setLeaveForm((form) => ({ ...form, reason: event.target.value }))}
              placeholder="Add a short reason for your leave request"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
