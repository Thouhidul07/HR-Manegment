import { Shield, UserPlus, Edit2, Trash2, Lock, Unlock, AlertTriangle, CheckCircle, Filter, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

const auditLogs = [
  {
    id: 1,
    action: "Role Created",
    description: "New role 'Department Head' created with 15 permissions",
    user: { name: "Farhana Akter", avatar: "FA" },
    timestamp: "2026-05-17 14:30:00",
    type: "create",
    target: "Department Head",
    icon: UserPlus,
    severity: "info"
  },
  {
    id: 2,
    action: "Permission Modified",
    description: "Updated permissions for 'HR Manager' role - Added Payroll access",
    user: { name: "Mahmudul Karim", avatar: "MK" },
    timestamp: "2026-05-17 13:15:00",
    type: "update",
    target: "HR Manager",
    icon: Edit2,
    severity: "warning"
  },
  {
    id: 3,
    action: "Role Assigned",
    description: "Assigned 'Finance Officer' role to Nusrat Jahan",
    user: { name: "Farhana Akter", avatar: "FA" },
    timestamp: "2026-05-17 11:45:00",
    type: "assign",
    target: "Nusrat Jahan",
    icon: Shield,
    severity: "success"
  },
  {
    id: 4,
    action: "Access Granted",
    description: "Temporary admin access granted to Mahmudul Karim for system migration",
    user: { name: "Super Admin", avatar: "SA" },
    timestamp: "2026-05-17 10:20:00",
    type: "grant",
    target: "Mahmudul Karim",
    icon: Unlock,
    severity: "warning"
  },
  {
    id: 5,
    action: "Permission Removed",
    description: "Removed Delete permission from 'Employee Manager' role",
    user: { name: "Farhana Akter", avatar: "FA" },
    timestamp: "2026-05-17 09:30:00",
    type: "remove",
    target: "Employee Manager",
    icon: Lock,
    severity: "warning"
  },
  {
    id: 6,
    action: "Role Deleted",
    description: "Deprecated role 'Legacy Admin' removed from system",
    user: { name: "Mahmudul Karim", avatar: "MK" },
    timestamp: "2026-05-16 16:45:00",
    type: "delete",
    target: "Legacy Admin",
    icon: Trash2,
    severity: "error"
  },
  {
    id: 7,
    action: "Access Revoked",
    description: "Revoked 'Super Admin' access from Arif Hossain",
    user: { name: "Farhana Akter", avatar: "FA" },
    timestamp: "2026-05-16 15:00:00",
    type: "revoke",
    target: "Arif Hossain",
    icon: AlertTriangle,
    severity: "error"
  },
  {
    id: 8,
    action: "Role Modified",
    description: "Updated description and permissions for 'Recruiter' role",
    user: { name: "Mahmudul Karim", avatar: "MK" },
    timestamp: "2026-05-16 13:20:00",
    type: "update",
    target: "Recruiter",
    icon: Edit2,
    severity: "info"
  },
  {
    id: 9,
    action: "Bulk Assignment",
    description: "Assigned 'Employee Manager' role to 12 new team leads",
    user: { name: "Farhana Akter", avatar: "FA" },
    timestamp: "2026-05-16 10:00:00",
    type: "assign",
    target: "12 Users",
    icon: UserPlus,
    severity: "success"
  },
  {
    id: 10,
    action: "Security Review",
    description: "Completed quarterly security audit - All roles reviewed",
    user: { name: "Security Team", avatar: "ST" },
    timestamp: "2026-05-15 17:00:00",
    type: "review",
    target: "All Roles",
    icon: CheckCircle,
    severity: "success"
  },
];

const severityColors = {
  info: "bg-[var(--info)]/20 text-[var(--info)]",
  success: "bg-[var(--success)]/20 text-[var(--success)]",
  warning: "bg-[var(--warning)]/20 text-[var(--warning)]",
  error: "bg-destructive/20 text-destructive",
};

export function AuditTimeline() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Activity Log</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Complete history of role and permission changes</p>
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>All Time</option>
            </select>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

          {/* Timeline Items */}
          <div className="space-y-6">
            {auditLogs.map((log, index) => {
              const Icon = log.icon;
              return (
                <div key={log.id} className="relative pl-16">
                  {/* Icon */}
                  <div className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md ${severityColors[log.severity as keyof typeof severityColors]}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="pb-6 border-b border-border last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-foreground">{log.action}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {log.target}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{log.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--info)] text-white flex items-center justify-center text-xs">
                              {log.user.avatar}
                            </div>
                            <span>{log.user.name}</span>
                          </div>
                          <span>•</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Load More */}
        <div className="mt-6 text-center">
          <Button variant="outline" className="gap-2">
            Load More Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
