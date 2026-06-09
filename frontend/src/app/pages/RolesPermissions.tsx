import { useEffect, useMemo, useState } from "react";
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
import api from "../services/api";

type TabId = "overview" | "permissions" | "assignments" | "approvals" | "audit";

type RoleSummary = {
  id: number;
  code: "admin" | "hr_manager" | "employee";
  name: string;
  users: number;
  userCount: number;
  description: string;
  level: number;
  status: string;
};

type RoleUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  roleName?: string;
  department: string;
  designation: string;
  status: string;
  avatar?: string;
  initials?: string;
};

type RoleSummaryResponse = {
  totalRoles: number;
  totalUsers: number;
  customRoles: number;
  pendingRequests: number;
  activeSessions: number;
  roles: Array<Omit<RoleSummary, "id" | "users" | "status"> & { userCount: number; users?: number; status?: string }>;
};

const fallbackRoles: RoleSummary[] = [
  { id: 1, code: "admin", name: "System Admin", users: 1, userCount: 1, description: "Company authority and system control", level: 1, status: "active" },
  { id: 2, code: "hr_manager", name: "HR Manager", users: 2, userCount: 2, description: "Manage employee records, leave, onboarding, training, and payroll", level: 2, status: "active" },
  { id: 3, code: "employee", name: "Employee", users: 8, userCount: 8, description: "Self-service access for assigned employee flows", level: 3, status: "active" },
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

function getApiErrorMessage(error: unknown, fallback: string) {
  const anyError = error as { response?: { data?: { message?: string } } };
  return anyError?.response?.data?.message || fallback;
}

function roleLabel(roleCode: string) {
  if (roleCode === "admin") return "System Admin";
  if (roleCode === "hr_manager") return "HR Manager";
  return "Employee";
}

export function RolesPermissions() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedRoleCode, setSelectedRoleCode] = useState<RoleSummary["code"]>("hr_manager");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [summary, setSummary] = useState<RoleSummaryResponse | null>(null);
  const [roles, setRoles] = useState<RoleSummary[]>(fallbackRoles);
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditFilters, setAuditFilters] = useState({
    module: "",
    action: "",
    actor: "",
  });

  const selectedRole = roles.find((role) => role.code === selectedRoleCode) || roles[0];

  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      setLoadingSummary(true);
      setError("");
      try {
        const response = await api.get<RoleSummaryResponse>("/roles-permissions/summary");
        if (!isMounted) return;
        const mappedRoles = response.data.roles.map((role, index) => ({
          id: index + 1,
          code: role.code,
          name: role.name,
          users: Number(role.userCount ?? role.users ?? 0),
          userCount: Number(role.userCount ?? role.users ?? 0),
          description: role.description,
          level: role.level || index + 1,
          status: role.status || "active",
        })) as RoleSummary[];
        setSummary(response.data);
        setRoles(mappedRoles.length ? mappedRoles : fallbackRoles);
      } catch (fetchError) {
        if (!isMounted) return;
        setError(getApiErrorMessage(fetchError, "Unable to load role summary from the backend."));
        setRoles(fallbackRoles);
      } finally {
        if (isMounted) setLoadingSummary(false);
      }
    }
    fetchSummary();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchRoleUsers() {
      setLoadingUsers(true);
      setUsersError("");
      try {
        const response = await api.get<{ users: RoleUser[] }>(`/roles-permissions/roles/${selectedRoleCode}/users`);
        if (!isMounted) return;
        setRoleUsers(response.data.users || []);
      } catch (fetchError) {
        if (!isMounted) return;
        setUsersError(getApiErrorMessage(fetchError, `Unable to load ${roleLabel(selectedRoleCode)} users.`));
        setRoleUsers([]);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    }
    fetchRoleUsers();
    return () => { isMounted = false; };
  }, [selectedRoleCode]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAuditLogs() {
      setLoadingAudit(true);
      setAuditError("");
      try {
        const params: any = {};
        if (auditFilters.module) params.module = auditFilters.module;
        if (auditFilters.actor) params.actor = auditFilters.actor;

        const response = await api.get("/audit-logs", { params });
        if (!isMounted) return;
        setAuditLogs(response.data.logs || []);
      } catch (err: any) {
        if (!isMounted) return;
        setAuditError(err?.response?.data?.message || "Failed to load audit logs");
      } finally {
        if (isMounted) setLoadingAudit(false);
      }
    }
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
    return () => { isMounted = false; };
  }, [activeTab, auditFilters]);

  const filteredRoles = useMemo(() => roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [roles, searchQuery]);

  const filteredRoleUsers = useMemo(() => roleUsers.filter((user) => {
    const q = assignmentSearch.toLowerCase().trim();
    if (!q) return true;
    return [user.name, user.email, user.department, user.designation, user.roleName || user.role]
      .some((value) => String(value || "").toLowerCase().includes(q));
  }), [roleUsers, assignmentSearch]);

  const exportRoles = () => {
    const rows = [
      ["Company", "NexoraTech Ltd"],
      ["Total Roles", String(summary?.totalRoles ?? roles.length)],
      ["Total Users", String(summary?.totalUsers ?? roles.reduce((sum, role) => sum + role.users, 0))],
      [],
      ["Role", "Users", "Description", "Status"],
      ...roles.map((role) => [role.name, String(role.users), role.description, role.status]),
      [],
      ["Selected Role Users", selectedRole?.name || roleLabel(selectedRoleCode)],
      ["Name", "Email", "Role", "Department", "Designation", "Status"],
      ...roleUsers.map((user) => [user.name, user.email, user.roleName || roleLabel(user.role), user.department, user.designation, user.status]),
      [],
      ["Permission Role", selectedRole?.name || roleLabel(selectedRoleCode)],
      ["Module", "View", "Create", "Edit", "Delete", "Restricted"],
      ...permissions.map((permission) => [
        permission.module,
        permission.view ? "Yes" : "No",
        permission.create ? "Yes" : "No",
        permission.edit ? "Yes" : "No",
        permission.delete ? "Yes" : "No",
        permission.restricted ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hrspace-roles-permissions-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleRoleClick = (role: RoleSummary) => {
    setSelectedRoleCode(role.code);
    setActiveTab("assignments");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Roles & Permissions Management</h1>
          <p className="text-sm text-muted-foreground">Manage user roles, permissions, and access control across NexoraTech Ltd</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportRoles}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--info)]/25 bg-[var(--info)]/10 px-4 py-3 text-sm text-muted-foreground">
        Custom roles are not enabled in this version. HRSpace currently supports System Admin, HR Manager, and Employee authorization only.
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white border-0 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm"><Shield className="w-5 h-5 text-white" /></div>
            <TrendingUp className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-2xl mb-1">{loadingSummary ? "..." : summary?.totalRoles ?? roles.length}</p>
          <p className="text-sm text-white/80">Total Roles</p>
        </Card>
        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-2)]/20"><Users className="w-5 h-5 text-[var(--chart-2)]" /></div>
          </div>
          <p className="text-2xl text-foreground mb-1">{loadingSummary ? "..." : summary?.totalUsers ?? roles.reduce((sum, role) => sum + role.users, 0)}</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </Card>
        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3"><div className="p-2.5 rounded-lg bg-[var(--chart-3)]/20"><Lock className="w-5 h-5 text-[var(--chart-3)]" /></div></div>
          <p className="text-2xl text-foreground mb-1">{summary?.customRoles ?? 0}</p>
          <p className="text-sm text-muted-foreground">Custom Roles</p>
        </Card>
        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3"><div className="p-2.5 rounded-lg bg-[var(--warning)]/20"><Bell className="w-5 h-5 text-[var(--warning)]" /></div></div>
          <p className="text-2xl text-foreground mb-1">{summary?.pendingRequests ?? 0}</p>
          <p className="text-sm text-muted-foreground">Pending Requests</p>
        </Card>
        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3"><div className="p-2.5 rounded-lg bg-[var(--success)]/20"><UserCheck className="w-5 h-5 text-[var(--success)]" /></div></div>
          <p className="text-2xl text-foreground mb-1">{summary?.activeSessions ?? 1}</p>
          <p className="text-sm text-muted-foreground">Active Sessions</p>
        </Card>
      </div>

      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {[
            { id: "overview", label: "Overview", icon: Shield },
            { id: "permissions", label: "Permissions Matrix", icon: Lock },
            { id: "assignments", label: "Role Assignments", icon: Users },
            { id: "approvals", label: "Access Requests", icon: Bell },
            { id: "audit", label: "Audit Log", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>System Roles</CardTitle>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading roles from backend...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {filteredRoles.map((role) => (
                    <button
                      type="button"
                      key={role.code}
                      onClick={() => handleRoleClick(role)}
                      className="text-left p-6 rounded-xl border border-border hover:border-[var(--primary)]/60 hover:shadow-md transition-all bg-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 shadow-md"><Shield className="w-6 h-6 text-white" /></div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="secondary" className="bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20">{role.users} users</Badge>
                          <Badge variant="secondary" className="text-xs bg-[var(--success)]/10 text-[var(--success)]">Active</Badge>
                        </div>
                      </div>
                      <h3 className="text-foreground mb-2">{role.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{role.description}</p>
                      <div className="rounded-lg bg-[var(--muted)]/50 px-3 py-2 text-xs text-muted-foreground">
                        Click to view company users under this role. Editing is disabled because custom roles are not enabled.
                      </div>
                    </button>
                  ))}
                  {!filteredRoles.length && <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No supported roles match your search.</div>}
                </div>
              )}
            </CardContent>
          </Card>
          <RoleHierarchy roles={roles} />
        </div>
      )}

      {activeTab === "permissions" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permission Matrix</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Read-only permission coverage for supported roles</p>
              </div>
              <select
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedRoleCode}
                onChange={(event) => setSelectedRoleCode(event.target.value as RoleSummary["code"])}
              >
                {roles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
              </select>
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
                  {permissions.map((perm) => (
                    <tr key={perm.module} className="hover:bg-[var(--accent)]/50 transition-colors">
                      <td className="px-6 py-4"><span className="text-sm text-foreground">{perm.module}</span>{perm.restricted && <Badge variant="secondary" className="ml-2 text-xs bg-[var(--warning)]/10 text-[var(--warning)]">Restricted</Badge>}</td>
                      <td className="px-6 py-4 text-center"><Switch checked={perm.view} disabled /></td>
                      <td className="px-6 py-4 text-center"><Switch checked={perm.create} disabled /></td>
                      <td className="px-6 py-4 text-center"><Switch checked={perm.edit} disabled /></td>
                      <td className="px-6 py-4 text-center"><Switch checked={perm.delete} disabled /></td>
                      <td className="px-6 py-4 text-center">{perm.view || perm.create || perm.edit || perm.delete ? <CheckCircle className="w-5 h-5 text-success inline-block" /> : <XCircle className="w-5 h-5 text-muted-foreground inline-block" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border bg-[var(--accent)]/30 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Selected role: <span className="text-foreground">{selectedRole?.name}</span></p>
              <p className="text-sm text-muted-foreground">Permissions are read-only in this version.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "assignments" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Users under {selectedRole?.name || roleLabel(selectedRoleCode)}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Users are loaded from the backend and scoped to NexoraTech Ltd.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={assignmentSearch} onChange={(event) => setAssignmentSearch(event.target.value)} placeholder="Search employees..." className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64" />
                </div>
                <select value={selectedRoleCode} onChange={(event) => setSelectedRoleCode(event.target.value as RoleSummary["code"])} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  {roles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                </select>
                <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4" />Filter</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {usersError && <div className="m-4 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{usersError}</div>}
            {loadingUsers ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading users for {selectedRole?.name || roleLabel(selectedRoleCode)}...</div>
            ) : filteredRoleUsers.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoleUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 text-white flex items-center justify-center flex-shrink-0 shadow-md">{user.avatar || user.initials}</div><span className="text-sm text-foreground">{user.name}</span></div></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20">{user.roleName || roleLabel(user.role)}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.department || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.designation || "—"}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"></div><span className="text-sm text-muted-foreground capitalize">{user.status}</span></div></TableCell>
                      <TableCell><Badge variant="secondary">Read-only</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">No users found for {selectedRole?.name || roleLabel(selectedRoleCode)}.</div>
            )}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Showing {filteredRoleUsers.length} of {roleUsers.length} users</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "approvals" && <AccountApprovals />}

      {activeTab === "audit" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Platform Audit Logs</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Track user and system activities across the platform
                </p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Search actor..."
                  value={auditFilters.actor}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, actor: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-48"
                />
                <select
                  value={auditFilters.module}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, module: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Modules</option>
                  <option value="auth">Auth</option>
                  <option value="account_approvals">Account Approvals</option>
                  <option value="profile">Profile & Documents</option>
                  <option value="forum_moderation">Forum Moderation</option>
                  <option value="forum">Forum</option>
                  <option value="projects">Work & Projects</option>
                  <option value="tasks">Tasks</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuditFilters({ module: "", action: "", actor: "" })}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {auditError && (
              <div className="m-4 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {auditError}
              </div>
            )}
            {loadingAudit ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading audit logs...
              </div>
            ) : auditLogs.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-foreground">{log.actor_name || "System"}</TableCell>
                      <TableCell>
                        {log.actor_role ? (
                          <Badge variant="secondary" className="capitalize">
                            {log.actor_role}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="capitalize text-sm text-muted-foreground">{log.module.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono uppercase text-foreground border-border">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate text-foreground" title={log.description}>{log.description}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{log.ip_address || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No audit log records found matching the criteria.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
