import { Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";

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

export function LeaveManagement() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Leave Management</h1>
          <p className="text-muted-foreground">Manage employee leave requests and balances</p>
        </div>
        <Button variant="primary" className="gap-2">
          <Plus className="w-4 h-4" />
          Request Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Requests</p>
          <p className="text-2xl text-foreground mt-1">8</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Approved This Month</p>
          <p className="text-2xl text-foreground mt-1">42</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">On Leave Today</p>
          <p className="text-2xl text-foreground mt-1">38</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Upcoming Leaves</p>
          <p className="text-2xl text-foreground mt-1">24</p>
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
            <CardTitle>Upcoming Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingLeaves.map((leave, index) => (
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
            <CardTitle>Leave Requests</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All</Button>
              <Button variant="ghost" size="sm">Pending</Button>
              <Button variant="ghost" size="sm">Approved</Button>
              <Button variant="ghost" size="sm">Rejected</Button>
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
              {leaveRequests.map((request) => (
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
                    {request.status === "Pending" && (
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
        </CardContent>
      </Card>
    </div>
  );
}
