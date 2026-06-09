import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Modal } from '../ui/Modal';
import {
  Users, UserCheck, UserX, Briefcase,
  FileText, UserPlus, Calendar, Receipt,
  GraduationCap,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  getAdminStats, getAdminAttendanceTrend, getDepartmentBreakdown,
  getPayrollSummary, getPendingApprovals, getAdminActivity,
  getUpcomingEvents, ActivityItem, getRoleDashboardSummary,
  formatDashboardCurrency, RoleDashboardSummary,
} from '../../services/dashboardData';
import {
  C, CHART_COLORS, chartStyle, getGreeting,
  DashboardHeader, StatCard, SectionCard, GhostLink, CTAButton, OutlineButton,
} from './shared';

const activityConfig: Record<ActivityItem['type'], { icon: React.ElementType; color: string }> = {
  leave:      { icon: Calendar,      color: C.mid },
  onboarding: { icon: UserPlus,      color: C.primary },
  expense:    { icon: Receipt,       color: C.warm },
  training:   { icon: GraduationCap, color: C.action },
  profile:    { icon: Users,         color: C.berry },
  payroll:    { icon: FileText,      color: C.mid },
};

export function AdminDashboard({ userName }: { userName: string }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<RoleDashboardSummary | null>(null);
  const [reporting, setReporting] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [modalLogs, setModalLogs] = useState<any[]>([]);
  const [loadingModalLogs, setLoadingModalLogs] = useState(false);
  const [modalLogsError, setModalLogsError] = useState("");
  const [modalFilters, setModalFilters] = useState({
    module: "",
    actor: "",
    keyword: "",
  });

  const stats    = getAdminStats();
  const trend    = getAdminAttendanceTrend();
  const depts    = getDepartmentBreakdown();
  const payroll  = getPayrollSummary();
  const approvals= getPendingApprovals();
  const activity = getAdminActivity();
  const events   = getUpcomingEvents();

  useEffect(() => {
    let isMounted = true;

    getRoleDashboardSummary("admin")
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch((error) => {
        console.warn("Unable to load admin dashboard summary", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchModalLogs = async () => {
      setLoadingModalLogs(true);
      setModalLogsError("");
      try {
        const params: any = {};
        if (modalFilters.module) params.module = modalFilters.module;
        if (modalFilters.actor) params.actor = modalFilters.actor;
        if (modalFilters.keyword) params.search = modalFilters.keyword;

        const response = await api.get("/audit-logs", { params });
        if (!isMounted) return;
        setModalLogs(response.data.logs || []);
      } catch (err: any) {
        if (!isMounted) return;
        setModalLogsError(err?.response?.data?.message || "Failed to load activity logs");
      } finally {
        if (isMounted) setLoadingModalLogs(false);
      }
    };

    if (isActivityModalOpen) {
      fetchModalLogs();
    }
    return () => {
      isMounted = false;
    };
  }, [isActivityModalOpen, modalFilters]);

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
        <SectionCard title="Recent Activity" action={<GhostLink onClick={() => setIsActivityModalOpen(true)}>View All →</GhostLink>}>
          <div className="space-y-0">
            {activity.map(a => {
              const cfg = activityConfig[a.type];
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{a.user}</span> {a.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
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

      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="All Platform Activities"
        size="lg"
        footer={
          <OutlineButton onClick={() => setIsActivityModalOpen(false)}>
            Close
          </OutlineButton>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="text"
              placeholder="Search actor..."
              value={modalFilters.actor}
              onChange={(e) => setModalFilters(prev => ({ ...prev, actor: e.target.value }))}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary w-40"
            />
            <input
              type="text"
              placeholder="Search keyword..."
              value={modalFilters.keyword || ""}
              onChange={(e) => setModalFilters(prev => ({ ...prev, keyword: e.target.value }))}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary w-40"
            />
            <select
              value={modalFilters.module}
              onChange={(e) => setModalFilters(prev => ({ ...prev, module: e.target.value }))}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Modules</option>
              <option value="Leave Management">Leave Management</option>
              <option value="Onboarding & Offboarding">Onboarding &amp; Offboarding</option>
              <option value="Expense Management">Expense Management</option>
              <option value="Training & Development">Training &amp; Development</option>
              <option value="Profile & Documents">Profile &amp; Documents</option>
              <option value="Payroll Management">Payroll Management</option>
              <option value="Recruitment">Recruitment</option>
              <option value="Forum Moderation">Forum Moderation</option>
              <option value="Attendance & Time">Attendance &amp; Time</option>
              <option value="Work Management">Work Management</option>
              <option value="Account Approvals">Account Approvals</option>
              <option value="Auth">Auth</option>
            </select>
            <OutlineButton
              onClick={() => setModalFilters({ module: "", actor: "", keyword: "" })}
            >
              Reset
            </OutlineButton>
          </div>

          {modalLogsError && (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {modalLogsError}
            </div>
          )}

          {loadingModalLogs ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading activities...
            </div>
          ) : modalLogs.length ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {modalLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold text-primary">{log.actor_name || "System"}</span> (
                      <span className="text-xs text-muted-foreground capitalize">{log.actor_role || "system"}</span>) - {log.description}
                    </p>
                    <div className="flex gap-3 mt-1 items-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground uppercase font-semibold">
                        {log.module}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      {log.ip_address && (
                        <span className="text-xs font-mono text-muted-foreground">IP: {log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No activity logs found.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
