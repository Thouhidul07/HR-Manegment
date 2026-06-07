import { useState } from "react";
import {
  Shield, Users, Lock, Search, Filter, Download,
  CheckCircle, XCircle, TrendingUp, UserCheck, History, Bell
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Switch } from "../components/ui/switch";
import { RoleHierarchy } from "../components/roles/RoleHierarchy";
import { AccountApprovals } from "./AccountApprovals";

const roles = [
  {
    id: 1,
    name: "System Admin",
    users: 1,
    description: "Company authority and system control",
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
    name: "Employee",
    users: 42,
    description: "Self-service access for assigned employee flows",
    color: "success",
    status: "active",
    level: 3
  },
];

const permissions = [
  { module: "Dashboard", view: true, create: true, edit: true, delete: true, restricted: false },
  { module: "Employee Management", view: true, create: true, edit: true, delete: false, restricted: false },
  { module: "CV Filtration", view: true, create: true, edit: true, delete: false, restricted: false },
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
    name: "System Admin",
    email: "admin@hrms.com",
    role: "System Admin",
    avatar: "SA",
    lastActive: "Active now",
    status: "active"
  },
  {
    id: 2,
    name: "Farhana Akter",
    email: "farhana.akter@hrspace.local",
    role: "HR Manager",
    avatar: "FA",
    lastActive: "2 hours ago",
    status: "active"
  },
  {
    id: 3,
    name: "Tanvir Hasan",
    email: "tanvir.hasan@hrspace.local",
    role: "Employee",
    avatar: "TH",
    lastActive: "5 hours ago",
    status: "active"
  },
];

export function RolesPermissions() {
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'assignments' | 'approvals' | 'audit'>('overview');
  const [selectedRole, setSelectedRole] = useState("HR Manager");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentRoleFilter, setAssignmentRoleFilter] = useState("All Roles");
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRoleUsers = roleUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(assignmentSearch.toLowerCase());
    const matchesRole =
      assignmentRoleFilter === "All Roles" || user.role === assignmentRoleFilter;
    return matchesSearch && matchesRole;
  });

  const exportRoles = () => {
    const rows = [
      ['Role', 'Users', 'Description', 'Status'],
      ...roles.map((role) => [role.name, role.users, role.description, role.status]),
      [],
      ['Permission Role', selectedRole],
      ['Module', 'View', 'Create', 'Edit', 'Delete', 'Restricted'],
      ...permissions.map((permission) => [
        permission.module,
        permission.view ? 'Yes' : 'No',
        permission.create ? 'Yes' : 'No',
        permission.edit ? 'Yes' : 'No',
        permission.delete ? 'Yes' : 'No',
        permission.restricted ? 'Yes' : 'No',
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `hrspace-roles-permissions-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Roles & Permissions Management</h1>
          <p className="text-sm text-muted-foreground">Manage user roles, permissions, and access control across your organization</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={exportRoles}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--info)]/25 bg-[var(--info)]/10 px-4 py-3 text-sm text-muted-foreground">
        Custom roles are not enabled in this version. HRSpace currently supports System Admin, HR Manager, and Employee authorization only.
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
          <p className="text-2xl text-foreground mb-1">{roleUsers.length}</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-3)]/20">
              <Lock className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">0</p>
          <p className="text-sm text-muted-foreground">Custom Roles</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--warning)]/20">
              <Bell className="w-5 h-5 text-[var(--warning)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">0</p>
          <p className="text-sm text-muted-foreground">Pending Requests</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--success)]/20">
              <UserCheck className="w-5 h-5 text-[var(--success)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">1</p>
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
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setSearchQuery("")}>
                    <Filter className="w-4 h-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoles.map((role) => (
                  <div
                    key={role.id}
                    className="group p-6 rounded-xl border border-border hover:border-[var(--primary)]/50 transition-all hover:shadow-lg bg-card hover:bg-accent/20"
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
                    <div className="rounded-lg bg-[var(--muted)]/50 px-3 py-2 text-xs text-muted-foreground">
                      Role editing is disabled because custom role configuration is not enabled in the backend.
                    </div>
                  </div>
                ))}
                {!filteredRoles.length && (
                  <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No supported roles match your search.
                  </div>
                )}
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
                        <Switch checked={perm.view} disabled />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch checked={perm.create} disabled />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch checked={perm.edit} disabled />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch checked={perm.delete} disabled />
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
              <p className="text-sm text-muted-foreground">Permissions are read-only in this version.</p>
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
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
                  />
                </div>
                <select
                  value={assignmentRoleFilter}
                  onChange={(e) => setAssignmentRoleFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
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
                  <TableHead>Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoleUsers.map((user) => (
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
                      <Badge variant="secondary">Read-only</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {roleUsers.length} supported role assignments
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Requests Tab */}
      {activeTab === 'approvals' && <AccountApprovals />}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <Card>
          <CardContent>
            <div className="py-12 text-center text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No audit log records are available.</p>
              <p className="text-xs mt-1">Backend audit logging is not enabled in this version.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
