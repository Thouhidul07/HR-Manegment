import {
  Users, UserCheck, UserX, Briefcase,
  FileText, UserPlus, Calendar, Receipt,
  GraduationCap,
} from 'lucide-react';
import { useState, type ElementType, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

type AdminModal = 'payroll' | 'approvals' | 'hiring' | 'activity' | 'event' | null;

const activityConfig: Record<ActivityItem['type'], { icon: ElementType; color: string }> = {
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
  const [activeModal, setActiveModal] = useState<AdminModal>(null);
  const [dashboardEvents, setDashboardEvents] = useState(events);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    type: 'general',
  });

  const hiringStages = [
    { stage: 'Applied',   count: 142, pct: 100 },
    { stage: 'Screening', count: 89,  pct: 63 },
    { stage: 'Interview', count: 45,  pct: 32 },
    { stage: 'Offer',     count: 17,  pct: 12 },
    { stage: 'Hired',     count: 9,   pct: 6 },
  ];

  const approvalRoutes: Record<string, string> = {
    leave: '/dashboard/leave',
    expense: '/dashboard/expense',
    onboarding: '/dashboard/onboarding',
    performance: '/dashboard/performance',
  };

  const handleAddEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = new Date(`${eventForm.date}T00:00:00`);
    setDashboardEvents((currentEvents) => [
      {
        id: Date.now(),
        title: eventForm.title,
        description: eventForm.description,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        day: date.toLocaleDateString('en-US', { day: '2-digit' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        type: eventForm.type,
      },
      ...currentEvents,
    ]);
    setEventForm({ title: '', description: '', date: '', type: 'general' });
    setActiveModal(null);
  };
  const handleGenerateReport = () => {
    const lines = [
      'HR Space Admin Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Key Metrics',
      `Total Employees: ${stats.totalEmployees.value}`,
      `Present Today: ${stats.presentToday.value}`,
      `On Leave: ${stats.onLeave.value}`,
      `Open Positions: ${stats.openPositions.value}`,
      '',
      'Department Breakdown',
      ...depts.map((dept) => `${dept.name}: ${dept.value}`),
      '',
      'Pending Approvals',
      ...approvals.map((approval) => `${approval.label}: ${approval.count}`),
    ];
    const file = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-dashboard-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={`${getGreeting()}, ${userName}`}
        subtitle="Here's your organisation overview for today."
        actions={
          <>
            <OutlineButton onClick={handleGenerateReport}><FileText className="w-4 h-4" /> Generate Report</OutlineButton>
            <Link to="/dashboard/employees" state={{ openAddEmployee: true }}>
              <CTAButton><UserPlus className="w-4 h-4" /> Add Employee</CTAButton>
            </Link>
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
              <Area type="monotone" dataKey="present" stroke={C.primary} fill="url(#gPresent)" strokeWidth={2} name="Present" />
              <Area type="monotone" dataKey="absent"  stroke={C.action}  fill="url(#gAbsent)"  strokeWidth={2} name="Absent" />
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
              <Pie data={depts} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                paddingAngle={3} dataKey="value">
                {depts.map((d, i) => <Cell key={i} fill={d.color} />)}
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
        <SectionCard title="Payroll Summary" action={<GhostLink onClick={() => setActiveModal('payroll')}>View Details</GhostLink>}>
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
                <Bar dataKey="v" fill={C.primary} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Pending Approvals" action={<GhostLink onClick={() => setActiveModal('approvals')}>View All</GhostLink>}>
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

        <SectionCard title="Hiring Pipeline" action={<GhostLink onClick={() => setActiveModal('hiring')}>Manage</GhostLink>}>
          {hiringStages.map((s, i) => (
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
        <SectionCard title="Recent Activity" action={<GhostLink onClick={() => setActiveModal('activity')}>View All</GhostLink>}>
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

        <SectionCard title="Upcoming Events" action={<GhostLink onClick={() => setActiveModal('event')}>Add Event</GhostLink>}>
          <div className="space-y-2">
            {dashboardEvents.map(ev => (
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
        isOpen={activeModal === 'payroll'}
        onClose={() => setActiveModal(null)}
        title="Payroll Summary Details"
        size="lg"
        footer={
          <>
            <OutlineButton onClick={() => setActiveModal(null)}>Close</OutlineButton>
            <Link to="/dashboard/payroll">
              <CTAButton>Open Payroll</CTAButton>
            </Link>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Disbursed', value: payroll.totalDisbursed, color: C.primary },
            { label: 'Pending Payroll', value: payroll.pending, color: C.warm },
            { label: 'Deductions', value: payroll.deductions, color: C.action },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-accent/25 p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
              <div className="mt-3 h-1.5 rounded-full" style={{ background: `${item.color}22` }}>
                <div className="h-full w-2/3 rounded-full" style={{ background: item.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          This summary matches the payroll management module and is ready for the current payroll cycle review.
        </p>
      </Modal>

      <Modal
        isOpen={activeModal === 'approvals'}
        onClose={() => setActiveModal(null)}
        title="Pending Approvals"
        size="lg"
        footer={<OutlineButton onClick={() => setActiveModal(null)}>Close</OutlineButton>}
      >
        <div className="space-y-3">
          {approvals.map((approval) => (
            <div key={approval.type} className="flex items-center gap-3 rounded-lg border border-border bg-accent/25 p-4">
              <div className="h-10 w-1 rounded-full" style={{ background: approval.color }} />
              <div className="flex-1">
                <p className="font-medium text-foreground">{approval.label}</p>
                <p className="text-sm text-muted-foreground">{approval.count} items waiting for admin review</p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${approval.color}18`, color: approval.color }}>
                {approval.count}
              </span>
              <Link to={approvalRoutes[approval.type] ?? '/dashboard'}>
                <Button size="sm" variant="outline">Review</Button>
              </Link>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'hiring'}
        onClose={() => setActiveModal(null)}
        title="Hiring Pipeline"
        size="lg"
        footer={
          <>
            <OutlineButton onClick={() => setActiveModal(null)}>Close</OutlineButton>
            <Link to="/dashboard/employees" state={{ openAddEmployee: true }}>
              <CTAButton>Add Employee</CTAButton>
            </Link>
          </>
        }
      >
        <div className="space-y-4">
          {hiringStages.map((stage, index) => (
            <div key={stage.stage} className="rounded-lg border border-border bg-accent/25 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{stage.stage}</p>
                  <p className="text-sm text-muted-foreground">{stage.count} candidates</p>
                </div>
                <span className="text-sm font-semibold" style={{ color: CHART_COLORS[index] }}>{stage.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full" style={{ width: `${stage.pct}%`, background: CHART_COLORS[index] }} />
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'activity'}
        onClose={() => setActiveModal(null)}
        title="Recent Activity"
        size="lg"
        footer={<OutlineButton onClick={() => setActiveModal(null)}>Close</OutlineButton>}
      >
        <div className="space-y-3">
          {activity.map((item) => {
            const cfg = activityConfig[item.type];
            const Icon = cfg.icon;
            return (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border bg-accent/25 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${cfg.color}15` }}>
                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-sm text-foreground"><span className="font-medium">{item.user}</span> {item.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'event'}
        onClose={() => setActiveModal(null)}
        title="Add Upcoming Event"
        footer={
          <>
            <OutlineButton onClick={() => setActiveModal(null)}>Cancel</OutlineButton>
            <Button type="submit" form="admin-add-event-form">Add Event</Button>
          </>
        }
      >
        <form id="admin-add-event-form" onSubmit={handleAddEvent} className="space-y-4">
          <Input
            label="Event Title"
            required
            value={eventForm.title}
            onChange={(event) => setEventForm((form) => ({ ...form, title: event.target.value }))}
            placeholder="Benefits Enrollment"
          />
          <Input
            label="Description"
            required
            value={eventForm.description}
            onChange={(event) => setEventForm((form) => ({ ...form, description: event.target.value }))}
            placeholder="Open enrollment window begins"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={eventForm.date}
              onChange={(event) => setEventForm((form) => ({ ...form, date: event.target.value }))}
            />
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Event Type</label>
              <select
                value={eventForm.type}
                onChange={(event) => setEventForm((form) => ({ ...form, type: event.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="general">general</option>
                <option value="payroll">payroll</option>
                <option value="onboarding">onboarding</option>
                <option value="performance">performance</option>
                <option value="training">training</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
