import { Check, X, Clock, User, Shield, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

const accessRequests = [
  {
    id: 1,
    user: { name: "David Thompson", email: "david.t@company.com", avatar: "DT" },
    requestedRole: "HR Manager",
    currentRole: "Recruiter",
    reason: "Need access to employee records for new recruitment analytics project",
    requestedDate: "May 15, 2026",
    status: "pending",
    priority: "high"
  },
  {
    id: 2,
    user: { name: "Lisa Anderson", email: "lisa.a@company.com", avatar: "LA" },
    requestedRole: "Finance Officer",
    currentRole: "Employee Manager",
    reason: "Temporary access required for Q2 budget planning",
    requestedDate: "May 16, 2026",
    status: "pending",
    priority: "medium"
  },
  {
    id: 3,
    user: { name: "James Wilson", email: "james.w@company.com", avatar: "JW" },
    requestedRole: "Super Admin",
    currentRole: "HR Manager",
    reason: "System migration and configuration updates needed",
    requestedDate: "May 14, 2026",
    status: "pending",
    priority: "high"
  },
  {
    id: 4,
    user: { name: "Maria Garcia", email: "maria.g@company.com", avatar: "MG" },
    requestedRole: "Employee Manager",
    currentRole: "Recruiter",
    reason: "Promotion to team lead position",
    requestedDate: "May 17, 2026",
    status: "pending",
    priority: "low"
  },
];

const recentDecisions = [
  {
    id: 1,
    user: "Alexandra Lee",
    role: "Finance Officer",
    status: "approved",
    decidedBy: "Sarah Johnson",
    decidedDate: "May 16, 2026"
  },
  {
    id: 2,
    user: "Christopher Brown",
    role: "Employee Manager",
    status: "rejected",
    decidedBy: "Michael Chen",
    decidedDate: "May 15, 2026"
  },
];

export function AccessRequestApproval() {
  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Access Requests</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Review and approve role change requests</p>
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <option>All Priorities</option>
                <option>High Priority</option>
                <option>Medium Priority</option>
                <option>Low Priority</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accessRequests.map((request) => (
              <div
                key={request.id}
                className="p-5 rounded-xl border border-border hover:border-[var(--primary)]/50 transition-all hover:shadow-md bg-card hover:bg-accent/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--info)] text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      {request.user.avatar}
                    </div>

                    {/* Request Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-foreground mb-1">{request.user.name}</h4>
                          <p className="text-sm text-muted-foreground">{request.user.email}</p>
                        </div>
                        <Badge
                          variant={request.priority === 'high' ? 'destructive' : request.priority === 'medium' ? 'warning' : 'secondary'}
                          className="ml-2"
                        >
                          {request.priority} priority
                        </Badge>
                      </div>

                      {/* Role Change */}
                      <div className="flex items-center gap-3 my-3 p-3 rounded-lg bg-background border border-border">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{request.currentRole}</span>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-[var(--primary)]" />
                          <span className="text-sm text-foreground">{request.requestedRole}</span>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="flex gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Requested {request.requestedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-2 bg-[var(--success)] hover:bg-[var(--success)]/90"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Decisions</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Previously approved and rejected requests</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDecisions.map((decision) => (
              <div
                key={decision.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-[var(--accent)]/30"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    decision.status === 'approved'
                      ? 'bg-[var(--success)]/20'
                      : 'bg-destructive/20'
                  }`}>
                    {decision.status === 'approved' ? (
                      <Check className="w-5 h-5 text-[var(--success)]" />
                    ) : (
                      <X className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-foreground mb-1">
                      <span className="font-medium">{decision.user}</span> → {decision.role}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {decision.status === 'approved' ? 'Approved' : 'Rejected'} by {decision.decidedBy} on {decision.decidedDate}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={decision.status === 'approved' ? 'success' : 'destructive'}
                  className="capitalize"
                >
                  {decision.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
