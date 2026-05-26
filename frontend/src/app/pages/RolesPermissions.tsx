import { useState } from "react";
import {
  Shield, Users, Lock, Plus, Search, Filter, Download,
  Edit2, Trash2, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronRight, TrendingUp, UserCheck, History, Bell
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Switch } from "../components/ui/switch";
import { RoleHierarchy } from "../components/roles/RoleHierarchy";
import { CreateRoleModal } from "../components/roles/CreateRoleModal";
import { AccessRequestApproval } from "../components/roles/AccessRequestApproval";
import { AuditTimeline } from "../components/roles/AuditTimeline";

const roles = [
  {
    id: 1,
    name: "Super Admin",
    users: 3,
    description: "Full system access and control",
    color: "destructive",
    status: "active",
    level: 1
  },
  {
    id: 2,
    name: "HR Manager",
    users: 8,
    description: "Manage employee records, leave, and payroll",
    color: "info",
    status: "active",
    level: 2
  },
  {
    id: 3,
    name: "Recruiter",
    users: 12,
    description: "Manage recruitment and onboarding",
    color: "success",
    status: "active",
    level: 3
  },
  {
    id: 4,
    name: "Finance Officer",
    users: 5,
    description: "Process payroll and manage compensation",
    color: "warning",
    status: "active",
    level: 3
  },
  {
    id: 5,
    name: "Employee Manager",
    users: 42,
    description: "Manage team members and approve requests",
    color: "secondary",
    status: "active",
    level: 3
  },
];

const permissions = [
  { module: "Dashboard", view: true, create: true, edit: true, delete: true, restricted: false },
  { module: "Employee Management", view: true, create: true, edit: true, delete: false, restricted: false },
  { module: "Recruitment", view: true, create: true, edit: true, delete: false, restricted: false },
  { module: "Attendance", view: true, create: true, edit: true, delete: false, restricted: false },
  { module: "Leave Management", view: true, create: true, edit: true, delete: false, restricted: false },
  { module: "Payroll", view: true, create: false, edit: false, delete: false, restricted: true },
  { module: "Performance", view: true, create: true, edit: true, delete: false, restricted: false },
  { module: "Training", view: true, create: true, edit: true, delete: false, restricted: false },
  { module: "Expense Management", view: true, create: true, edit: true, delete: false, restricted: false },
  { module: "Roles & Permissions", view: true, create: false, edit: false, delete: false, restricted: true },
  { module: "Reports & Analytics", view: true, create: true, edit: false, delete: false, restricted: false },
  { module: "System Settings", view: false, create: false, edit: false, delete: false, restricted: true },
];

const roleUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    role: "HR Manager",
    avatar: "SJ",
    lastActive: "2 hours ago",
    status: "active"
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael.c@company.com",
    role: "Employee Manager",
    avatar: "MC",
    lastActive: "5 hours ago",
    status: "active"
  },
  {
    id: 3,
    name: "Emily Davis",
    email: "emily.d@company.com",
    role: "Finance Officer",
    avatar: "ED",
    lastActive: "1 day ago",
    status: "active"
  },
  {
    id: 4,
    name: "Robert Wilson",
    email: "robert.w@company.com",
    role: "Recruiter",
    avatar: "RW",
    lastActive: "3 hours ago",
    status: "active"
  },
  {
    id: 5,
    name: "Jessica Martinez",
    email: "jessica.m@company.com",
    role: "Employee Manager",
    avatar: "JM",
    lastActive: "30 mins ago",
    status: "active"
  },
];

export function RolesPermissions() {
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'assignments' | 'approvals' | 'audit'>('overview');
  const [selectedRole, setSelectedRole] = useState("HR Manager");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Roles & Permissions Management</h1>
          <p className="text-sm text-muted-foreground">Manage user roles, permissions, and access control across your organization</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="primary"
            className="gap-2 bg-[var(--action)] hover:bg-[var(--action)]/90"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white border-0 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-2xl mb-1">{roles.length}</p>
          <p className="text-sm text-white/80">Total Roles</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-2)]/20">
              <Users className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <Badge variant="success" className="text-xs">+12%</Badge>
          </div>
          <p className="text-2xl text-foreground mb-1">1,239</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-3)]/20">
              <Lock className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">2</p>
          <p className="text-sm text-muted-foreground">Custom Roles</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--warning)]/20">
              <Bell className="w-5 h-5 text-[var(--warning)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">7</p>
          <p className="text-sm text-muted-foreground">Pending Requests</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--success)]/20">
              <UserCheck className="w-5 h-5 text-[var(--success)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">856</p>
          <p className="text-sm text-muted-foreground">Active Sessions</p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'permissions', label: 'Permissions Matrix', icon: Lock },
            { id: 'assignments', label: 'Role Assignments', icon: Users },
            { id: 'approvals', label: 'Access Requests', icon: Bell },
            { id: 'audit', label: 'Audit Log', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Roles Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>System Roles</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="group p-6 rounded-xl border border-border hover:border-[var(--primary)]/50 transition-all hover:shadow-lg cursor-pointer bg-gradient-to-br from-white to-[var(--accent)]/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 shadow-md">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20">
                          {role.users} users
                        </Badge>
                        <Badge variant="success" className="text-xs">Active</Badge>
                      </div>
                    </div>
                    <h3 className="text-foreground mb-2">{role.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{role.description}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 group-hover:bg-[var(--primary)] group-hover:text-white group-hover:border-[var(--primary)] transition-colors"
                      >
                        Manage
                      </Button>
                      <Button variant="ghost" size="sm" className="px-2">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Hierarchy */}
          <RoleHierarchy roles={roles} />
        </div>
      )}

      {/* Permissions Matrix Tab */}
      {activeTab === 'permissions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permission Matrix</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Configure access permissions for each role</p>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[var(--muted)] to-[var(--accent)] border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Module</th>
                    <th className="px-6 py-4 text-center text-sm text-foreground">View</th>
                    <th className="px-6 py-4 text-center text-sm text-foreground">Create</th>
                    <th className="px-6 py-4 text-center text-sm text-foreground">Edit</th>
                    <th className="px-6 py-4 text-center text-sm text-foreground">Delete</th>
                    <th className="px-6 py-4 text-center text-sm text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {permissions.map((perm, index) => (
                    <tr key={index} className="hover:bg-[var(--accent)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{perm.module}</span>
                          {perm.restricted && (
                            <Badge variant="warning" className="text-xs">Restricted</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch checked={perm.view} disabled={perm.restricted} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch checked={perm.create} disabled={perm.restricted} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch checked={perm.edit} disabled={perm.restricted} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch checked={perm.delete} disabled={perm.restricted} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {perm.view || perm.create || perm.edit || perm.delete ? (
                          <CheckCircle className="w-5 h-5 text-success inline-block" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground inline-block" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border bg-[var(--accent)]/30 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Last updated: <span className="text-foreground">May 17, 2026 at 2:30 PM</span>
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline">Reset</Button>
                <Button variant="primary" className="bg-[var(--action)] hover:bg-[var(--action)]/90">
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Assignments Tab */}
      {activeTab === 'assignments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employee Role Assignments</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Manage and assign roles to employees</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
                  />
                </div>
                <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>All Roles</option>
                  {roles.map((role) => (
                    <option key={role.id}>{role.name}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                          {user.avatar}
                        </div>
                        <span className="text-sm text-foreground">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                        <span className="text-sm text-muted-foreground capitalize">{user.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing 5 of 1,239 employees
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Requests Tab */}
      {activeTab === 'approvals' && <AccessRequestApproval />}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && <AuditTimeline />}

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
