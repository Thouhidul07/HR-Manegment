import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, UserX, Briefcase,
  FileText, UserPlus, Calendar, Receipt,
  GraduationCap, ShieldCheck, Search, X, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  getAdminStats, getAdminAttendanceTrend, getDepartmentBreakdown,
  getPayrollSummary, getPendingApprovals,
  getUpcomingEvents, getRoleDashboardSummary,
  formatDashboardCurrency, RoleDashboardSummary,
} from '../../services/dashboardData';
import {
  C, CHART_COLORS, chartStyle, getGreeting,
  DashboardHeader, StatCard, SectionCard, GhostLink, CTAButton, OutlineButton,
} from './shared';
import api from '../../services/api';

interface AuditLog {
  id: number;
  user_name?: string;
  actor_name?: string;
  role?: string;
  actor_role?: string;
  action: string;
  module: string;
  description?: string;
  created_at: string;
}

interface AuditFilters {
  search: string;
  module: string;
  role: string;
  startDate: string;
  endDate: string;
}

const moduleConfig: Record<string, { icon: React.ElementType; color: string }> = {
  Attendance: { icon: Calendar, color: C.mid },
  Authentication: { icon: ShieldCheck, color: C.primary },
  "Forum Moderation": { icon: UserCheck, color: C.action },
  Payroll: { icon: Receipt, color: C.warm },
  "Profile Documents": { icon: FileText, color: C.berry },
  Projects: { icon: Briefcase, color: C.primary },
  Recruitment: { icon: UserPlus, color: C.action },
  Training: { icon: GraduationCap, color: C.mid },
};

function formatAuditAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAuditTime(value: string) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString();
}

function getAuditIdentity(log: AuditLog) {
  return log.user_name || log.actor_name || 'System';
}

export function AdminDashboard({ userName }: { userName: string }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<RoleDashboardSummary | null>(null);
  const [projectOverview, setProjectOverview] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    search: '',
    module: '',
    role: '',
    startDate: '',
    endDate: '',
  });
  const [reporting, setReporting] = useState(false);
  const stats    = getAdminStats();
  const trend    = getAdminAttendanceTrend();
  const depts    = getDepartmentBreakdown();
  const payroll  = getPayrollSummary();
  const approvals= getPendingApprovals();
  const events   = getUpcomingEvents();

  const loadAuditLogs = (filters: AuditFilters = auditFilters) => {
    setAuditLoading(true);
    setAuditError('');

    const params: Record<string, string | number> = { limit: 100 };
    if (filters.search) params.search = filters.search;
    if (filters.module) params.module = filters.module;
    if (filters.role) params.role = filters.role;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    api.get('/audit-logs', { params })
      .then((response) => {
        setAuditLogs(response.data?.logs || []);
      })
      .catch(() => {
        setAuditError('Unable to load recent activity right now.');
      })
      .finally(() => {
        setAuditLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    getRoleDashboardSummary("admin")
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch((error) => {
        console.warn("Unable to load admin dashboard summary", error);
      });

    api.get("/projects/overview")
      .then((response) => {
        if (isMounted) setProjectOverview(response.data);
      })
      .catch((error) => {
        console.warn("Unable to load admin project overview", error);
      });

    api.get('/audit-logs', { params: { limit: 100 } })
      .then((response) => {
        if (isMounted) setAuditLogs(response.data?.logs || []);
      })
      .catch(() => {
        if (isMounted) setAuditError('Unable to load recent activity right now.');
      })
      .finally(() => {
        if (isMounted) setAuditLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const recentAuditLogs = auditLogs.slice(0, 6);
  const filteredModules = Array.from(new Set(auditLogs.map((log) => log.module).filter(Boolean)));

  const liveStats = {
    ...stats,
    totalEmployees: {
      ...stats.totalEmployees,
      value: String(summary?.totalEmployees ?? stats.totalEmployees.value),
      subtitle: summary ? "Loaded from employee records" : stats.totalEmployees.subtitle,
    },
    presentToday: {
      ...stats.presentToday,
      value: String(summary?.presentToday ?? stats.presentToday.value),
      subtitle: summary ? "Attendance records for today" : stats.presentToday.subtitle,
    },
    onLeave: {
      ...stats.onLeave,
      label: summary ? "Pending Leave" : stats.onLeave.label,
      value: String(summary?.pendingLeave ?? stats.onLeave.value),
      subtitle: summary ? "Requests awaiting approval" : stats.onLeave.subtitle,
    },
  };

  const livePayroll = {
    ...payroll,
    totalDisbursed: summary ? formatDashboardCurrency(summary.monthlyPayroll) : payroll.totalDisbursed,
  };

  const liveApprovals = approvals.map((approval) =>
    approval.type === "leave" && summary
      ? { ...approval, count: Number(summary.pendingLeave ?? approval.count) }
      : approval
  );

  const downloadDashboardReport = () => {
    setReporting(true);

    const rows = [
      ['Metric', 'Value'],
      ['Total Employees', liveStats.totalEmployees.value],
      ['Present Today', liveStats.presentToday.value],
      ['Pending Leave', liveStats.onLeave.value],
      ['Open Positions', liveStats.openPositions.value],
      ['Monthly Payroll', livePayroll.totalDisbursed],
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `hrspace-admin-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    window.setTimeout(() => setReporting(false), 400);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={`${getGreeting()}, ${userName}`}
        subtitle="Here's your organisation overview for today."
        actions={
          <>
            <OutlineButton onClick={downloadDashboardReport}>
              <FileText className="w-4 h-4" />
              {reporting ? 'Preparing...' : 'Generate Report'}
            </OutlineButton>
            <CTAButton onClick={() => navigate('/dashboard/employees')}>
              <UserPlus className="w-4 h-4" /> Add Employee
            </CTAButton>
          </>
        }
      />

      {/* ── Row 1: KPI Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button type="button" onClick={() => navigate('/dashboard/employees')} className="text-left w-full cursor-pointer hover:scale-102 transition-all duration-200">
          <StatCard {...liveStats.totalEmployees} icon={Users}     iconColor={C.primary} iconBg={`${C.primary}18`} />
        </button>
        <button type="button" onClick={() => navigate('/dashboard/attendance')} className="text-left w-full cursor-pointer hover:scale-102 transition-all duration-200">
          <StatCard {...liveStats.presentToday}   icon={UserCheck} iconColor={C.mid}     iconBg={`${C.mid}18`} />
        </button>
        <button type="button" onClick={() => navigate('/dashboard/leave')} className="text-left w-full cursor-pointer hover:scale-102 transition-all duration-200">
          <StatCard {...liveStats.onLeave}        icon={UserX}     iconColor={C.warm}    iconBg={`${C.warm}20`} />
        </button>
        <button type="button" onClick={() => navigate('/dashboard/cv-filter')} className="text-left w-full cursor-pointer hover:scale-102 transition-all duration-200">
          <StatCard {...liveStats.openPositions}  icon={Briefcase} iconColor={C.action}  iconBg={`${C.action}15`} />
        </button>
      </div>

      <SectionCard
        title="Project Overview"
        subtitle="Read-only summary for admin oversight"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Projects" value={String(projectOverview?.totalProjects ?? 0)} subtitle="All project workspaces" trend={{ value: "Read only", isPositive: true }} icon={Briefcase} iconColor={C.primary} iconBg={`${C.primary}18`} />
          <StatCard label="Active Projects" value={String(projectOverview?.activeProjects ?? 0)} subtitle="Currently in progress" trend={{ value: "Overview", isPositive: true }} icon={UserCheck} iconColor={C.mid} iconBg={`${C.mid}18`} />
          <StatCard label="Completed Projects" value={String(projectOverview?.completedProjects ?? 0)} subtitle="Closed delivery work" trend={{ value: "Overview", isPositive: true }} icon={FileText} iconColor={C.warm} iconBg={`${C.warm}20`} />
          <StatCard label="Overdue Tasks" value={String(projectOverview?.overdueTasks ?? 0)} subtitle="Needs PM attention" trend={{ value: "Monitor", isPositive: false }} icon={UserX} iconColor={C.action} iconBg={`${C.action}15`} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h4 className="text-sm font-semibold mb-3 text-[#262254] dark:text-white">Recent Project Activity</h4>
            <div className="space-y-2">
              {(projectOverview?.recentActivity || []).slice(0, 5).map((item: any) => (
                <div key={item.id} className="rounded-xl border border-[#543884]/10 p-3">
                  <p className="text-sm font-medium text-[#262254] dark:text-white">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.project} - {item.status}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-[#262254] dark:text-white">Project Manager Summary</h4>
            <div className="space-y-2">
              {(projectOverview?.projectManagers || []).map((manager: any) => (
                <div key={manager.id} className="flex items-center justify-between rounded-xl border border-[#543884]/10 p-3">
                  <div>
                    <p className="text-sm font-medium text-[#262254] dark:text-white">{manager.name}</p>
                    <p className="text-xs text-muted-foreground">{manager.email}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#543884]">{manager.activeProjects}/{manager.projects} active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Row 2: Attendance Chart + Department Pie ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Workforce Attendance"
          subtitle="6-month overview"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.action} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.action} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartStyle.grid} />
              <XAxis dataKey="month" {...chartStyle.axis} />
              <YAxis {...chartStyle.axis} />
              <Tooltip {...chartStyle.tooltip} />
              <Area key="present-area" type="monotone" dataKey="present" stroke={C.primary} fill="url(#gPresent)" strokeWidth={2} name="Present" />
              <Area key="absent-area" type="monotone" dataKey="absent"  stroke={C.action}  fill="url(#gAbsent)"  strokeWidth={2} name="Absent" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3">
            {[{ label: 'Present', color: C.primary }, { label: 'Absent', color: C.action }].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Department Breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie key="department-pie" data={depts} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                paddingAngle={3} dataKey="value">
                {depts.map((d, i) => <Cell key={`cell-${i}`} fill={d.color} />)}
              </Pie>
              <Tooltip {...chartStyle.tooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {depts.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="text-muted-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Row 3: Payroll + Approvals + Pipeline ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Payroll Summary" action={<GhostLink onClick={() => navigate('/dashboard/payroll')}>View Details →</GhostLink>}>
          <div className="space-y-0">
            {[
              { label: 'Total Disbursed', value: livePayroll.totalDisbursed, color: 'text-foreground' },
              { label: 'Pending',         value: livePayroll.pending,        color: `text-[${C.warm}]` },
              { label: 'Deductions',      value: livePayroll.deductions,     color: `text-[${C.action}]` },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{r.label}</span>
                <span className="text-sm font-semibold text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Monthly trend</p>
            <ResponsiveContainer width="100%" height={56}>
              <BarChart data={livePayroll.trend.map((v, i) => ({ m: i, v }))} barSize={8}>
                <Bar key="payroll-trend-bar" dataKey="v" fill={C.primary} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Pending Approvals" action={<GhostLink onClick={() => navigate('/dashboard/leave')}>View All →</GhostLink>}>
          <div className="space-y-0">
            {liveApprovals.map(a => (
              <div key={a.type} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: a.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.count} items waiting</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: `${a.color}18`, color: a.color }}>
                  {a.count}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Hiring Pipeline" action={<GhostLink onClick={() => navigate('/dashboard/cv-filter')}>Manage →</GhostLink>}>
          {[
            { stage: 'Applied',   count: 142, pct: 100 },
            { stage: 'Screening', count: 89,  pct: 63 },
            { stage: 'Interview', count: 45,  pct: 32 },
            { stage: 'Offer',     count: 17,  pct: 12 },
            { stage: 'Hired',     count: 9,   pct: 6 },
          ].map((s, i) => (
            <div key={s.stage} className="mb-3 last:mb-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">{s.stage}</span>
                <span className="text-muted-foreground">{s.count}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(84,56,132,0.1)' }}>
                <div className="h-1.5 rounded-full transition-all"
                  style={{ width: `${s.pct}%`, background: CHART_COLORS[i] }} />
              </div>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* ── Row 4: Activity + Events ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Recent Activity" action={<GhostLink onClick={() => setAuditModalOpen(true)}>View All →</GhostLink>}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Live audit log activity from the database</p>
            <button type="button" onClick={() => setAuditModalOpen(true)} className="text-xs font-medium" style={{ color: C.mid }}>
              Open Audit Logs
            </button>
          </div>
          <div className="space-y-0">
            {auditLoading && (
              <div className="py-6 text-sm text-muted-foreground">Loading recent activity...</div>
            )}
            {!auditLoading && auditError && (
              <div className="py-6 text-sm text-[#EC4176]">{auditError}</div>
            )}
            {!auditLoading && !auditError && !recentAuditLogs.length && (
              <div className="py-6 text-sm text-muted-foreground">No audit activity has been recorded yet.</div>
            )}
            {!auditLoading && !auditError && recentAuditLogs.map(log => {
              const cfg = moduleConfig[log.module] || { icon: ShieldCheck, color: C.mid };
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{getAuditIdentity(log)}</span> {log.description || formatAuditAction(log.action)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.module} - {log.role || log.actor_role || 'unknown role'} - {formatAuditTime(log.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming Events">
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-accent/40 cursor-pointer">
                <div className="w-12 text-center rounded-xl py-1.5 flex-shrink-0"
                  style={{ background: 'rgba(84,56,132,0.08)' }}>
                  <p className="text-lg font-bold leading-none" style={{ color: C.primary }}>{ev.day}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.mid }}>{ev.month}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${C.primary}12`, color: C.primary }}>
                  {ev.type}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-2xl bg-card shadow-2xl border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Audit Logs</h2>
                <p className="text-xs text-muted-foreground">Admin-only activity from /api/audit-logs</p>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="rounded-full p-2 hover:bg-accent"
                aria-label="Close audit logs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b border-border p-5">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <label className="md:col-span-2">
                  <span className="text-xs text-muted-foreground">Search</span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                      value={auditFilters.search}
                      onChange={(event) => setAuditFilters({ ...auditFilters, search: event.target.value })}
                      placeholder="Keyword, actor, action"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>
                <label>
                  <span className="text-xs text-muted-foreground">Module</span>
                  <select
                    value={auditFilters.module}
                    onChange={(event) => setAuditFilters({ ...auditFilters, module: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
                  >
                    <option value="">All modules</option>
                    {filteredModules.map((module) => <option key={module} value={module}>{module}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-xs text-muted-foreground">Role</span>
                  <select
                    value={auditFilters.role}
                    onChange={(event) => setAuditFilters({ ...auditFilters, role: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
                  >
                    <option value="">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </label>
                <label>
                  <span className="text-xs text-muted-foreground">From</span>
                  <input
                    type="date"
                    value={auditFilters.startDate}
                    onChange={(event) => setAuditFilters({ ...auditFilters, startDate: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
                  />
                </label>
                <label>
                  <span className="text-xs text-muted-foreground">To</span>
                  <input
                    type="date"
                    value={auditFilters.endDate}
                    onChange={(event) => setAuditFilters({ ...auditFilters, endDate: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <CTAButton onClick={() => loadAuditLogs(auditFilters)}>
                  <Search className="w-4 h-4" /> Apply Filters
                </CTAButton>
                <OutlineButton
                  onClick={() => {
                    const emptyFilters = { search: '', module: '', role: '', startDate: '', endDate: '' };
                    setAuditFilters(emptyFilters);
                    loadAuditLogs(emptyFilters);
                  }}
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </OutlineButton>
              </div>
            </div>

            <div className="max-h-[48vh] overflow-y-auto p-5">
              {auditLoading && <div className="py-10 text-center text-sm text-muted-foreground">Loading audit logs...</div>}
              {!auditLoading && auditError && <div className="py-10 text-center text-sm text-[#EC4176]">{auditError}</div>}
              {!auditLoading && !auditError && !auditLogs.length && (
                <div className="py-10 text-center text-sm text-muted-foreground">No audit logs match those filters.</div>
              )}
              {!auditLoading && !auditError && auditLogs.length > 0 && (
                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    const cfg = moduleConfig[log.module] || { icon: ShieldCheck, color: C.mid };
                    const Icon = cfg.icon;
                    return (
                      <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">{formatAuditAction(log.action)}</p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{formatAuditTime(log.created_at)}</span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{log.description || 'No description provided.'}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getAuditIdentity(log)} - {log.role || log.actor_role || 'unknown role'} - {log.module}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
