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
  getUpcomingEvents, ActivityItem,
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
  const stats    = getAdminStats();
  const trend    = getAdminAttendanceTrend();
  const depts    = getDepartmentBreakdown();
  const payroll  = getPayrollSummary();
  const approvals= getPendingApprovals();
  const activity = getAdminActivity();
  const events   = getUpcomingEvents();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={`${getGreeting()}, ${userName}`}
        subtitle="Here's your organisation overview for today."
        actions={
          <>
            <OutlineButton><FileText className="w-4 h-4" /> Generate Report</OutlineButton>
            <CTAButton><UserPlus className="w-4 h-4" /> Add Employee</CTAButton>
          </>
        }
      />

      {/* ── Row 1: KPI Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard {...stats.totalEmployees} icon={Users}     iconColor={C.primary} iconBg={`${C.primary}18`} />
        <StatCard {...stats.presentToday}   icon={UserCheck} iconColor={C.mid}     iconBg={`${C.mid}18`} />
        <StatCard {...stats.onLeave}        icon={UserX}     iconColor={C.warm}    iconBg={`${C.warm}20`} />
        <StatCard {...stats.openPositions}  icon={Briefcase} iconColor={C.action}  iconBg={`${C.action}15`} />
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
        <SectionCard title="Payroll Summary" action={<GhostLink>View Details →</GhostLink>}>
          <div className="space-y-0">
            {[
              { label: 'Total Disbursed', value: payroll.totalDisbursed, color: 'text-foreground' },
              { label: 'Pending',         value: payroll.pending,        color: `text-[${C.warm}]` },
              { label: 'Deductions',      value: payroll.deductions,     color: `text-[${C.action}]` },
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
              <BarChart data={payroll.trend.map((v, i) => ({ m: i, v }))} barSize={8}>
                <Bar key="payroll-trend-bar" dataKey="v" fill={C.primary} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Pending Approvals" action={<GhostLink>View All →</GhostLink>}>
          <div className="space-y-0">
            {approvals.map(a => (
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

        <SectionCard title="Hiring Pipeline" action={<GhostLink>Manage →</GhostLink>}>
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
        <SectionCard title="Recent Activity" action={<GhostLink>View All →</GhostLink>}>
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

        <SectionCard title="Upcoming Events" action={<GhostLink>Add Event →</GhostLink>}>
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
    </div>
  );
}
