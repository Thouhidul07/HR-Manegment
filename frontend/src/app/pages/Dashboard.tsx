import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Users, UserCheck, UserX, Briefcase, TrendingUp, TrendingDown, FileText,
  UserPlus, CheckCircle, Check, X, ArrowRight, Clock, Calendar, GraduationCap, Receipt, Target,
  Shield, MessageSquare, BookOpen, CheckSquare, Palmtree, BarChart2, CalendarPlus,
  Download, User
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { AdminDashboard } from "../components/dashboard/AdminDashboard";

export function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin')      return <AdminDashboard userName={user.name} />;
  if (user?.role === 'hr_manager') return <HRManagerDashboard user={user} />;
  return <EmployeeDashboard user={user} />;
}

// Shared Components
function DashboardHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#543884] to-[#EC4176] bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-sm text-[#9A77CF] mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
  index?: number;
}

function StatCard({ label, value, change, trend, icon: Icon, iconColor, iconBg, subtitle, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className="bg-card rounded-2xl border border-[#543884]/10 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {trend !== 'neutral' && (
          <div className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${
            trend === 'up' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-[#EC4176]/10 text-[#EC4176]'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-[#262254] dark:text-white mt-3">{value}</p>
      <p className="text-sm text-[#9A77CF] mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {trend === 'neutral' && <p className="text-xs text-muted-foreground mt-1">{change}</p>}
    </motion.div>
  );
}

function SectionCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-2xl border border-[#543884]/10 p-6 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[#262254] dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-[#9A77CF] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

const chartTheme = {
  grid: { stroke: "#543884", strokeOpacity: 0.08, strokeDasharray: "3 3" },
  tooltip: { contentStyle: { backgroundColor: "var(--card)", borderColor: "#543884", borderRadius: "0.75rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" } },
  axis: { stroke: "#9A77CF", fontSize: 12 },
  colors: ['#543884', '#9A77CF', '#EC4176', '#FFA45E', '#A13670']
};

// HR Manager Dashboard
function HRManagerDashboard({ user }: any) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const [leaveRequests, setLeaveRequests] = useState([
    { name: 'Rafi Ahmed', days: 3, type: 'Annual Leave', initial: 'RA', status: 'pending' },
    { name: 'Priya Sen', days: 1, type: 'Sick Leave', initial: 'PS', status: 'pending' },
    { name: 'Karim Hassan', days: 5, type: 'Annual Leave', initial: 'KH', status: 'pending' },
  ]);

  const updateLeaveStatus = (name: string, status: 'approved' | 'rejected') => {
    setLeaveRequests((requests) =>
      requests.map((request) =>
        request.name === name ? { ...request, status } : request
      )
    );
  };

  const weekData = [
    { day: 'Mon', present: 238, leave: 9 },
    { day: 'Tue', present: 242, leave: 5 },
    { day: 'Wed', present: 235, leave: 12 },
    { day: 'Thu', present: 240, leave: 7 },
    { day: 'Fri', present: 230, leave: 15 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      key={user.role}
      className="space-y-6"
    >
      <DashboardHeader
        title={`${greeting}, ${user.name}`}
        subtitle="You have 12 pending approvals and 4 onboarding tasks today."
        actions={
          <>
            <button className="rounded-xl px-4 py-2 text-sm text-white flex items-center gap-2 shadow-sm" style={{ background: 'linear-gradient(135deg, #543884, #A13670, #EC4176)' }}>
              <CheckCircle className="w-4 h-4" />
              Approve Leaves
            </button>
            <button className="border border-[#543884]/20 text-[#543884] rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#543884]/5">
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Team Size" value="247" change="8 new this month" trend="up" icon={Users} iconBg="#5438841A" iconColor="#543884" index={0} />
        <StatCard label="Attendance Rate" value="94.2%" change="+1.2% vs last week" trend="up" icon={Clock} iconBg="#9A77CF1A" iconColor="#9A77CF" index={1} />
        <StatCard label="Leave Requests" value="12" change="5 urgent" trend="down" icon={Calendar} iconBg="#FFA45E1A" iconColor="#FFA45E" index={2} />
        <StatCard label="Training Progress" value="73%" change="18 completions" trend="up" icon={GraduationCap} iconBg="#EC41761A" iconColor="#EC4176" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SectionCard title="Team Attendance This Week">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekData}>
                <CartesianGrid {...chartTheme.grid} />
                <XAxis dataKey="day" {...chartTheme.axis} />
                <YAxis {...chartTheme.axis} />
                <Tooltip {...chartTheme.tooltip} />
                <Bar dataKey="present" fill="#543884" radius={[8, 8, 0, 0]} />
                <Bar dataKey="leave" fill="#EC4176" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#543884]" />
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#EC4176]" />
                <span className="text-xs text-muted-foreground">On Leave</span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Leave Requests" action={<Link to="/dashboard/leave" className="inline-flex items-center gap-1 text-[#9A77CF] text-sm hover:text-[#EC4176]">View All <ArrowRight className="w-3 h-3" /></Link>}>
            <div className="space-y-3">
              {leaveRequests.map((req, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#543884]/8 last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: `linear-gradient(135deg, ${chartTheme.colors[i % 5]}, ${chartTheme.colors[(i + 1) % 5]})` }}>
                    {req.initial}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#262254] dark:text-white">{req.name}</p>
                    <p className="text-xs text-muted-foreground">{req.days} days · {req.type}</p>
                  </div>
                  {req.status === 'pending' ? (
                    <div className="flex gap-1">
                      <button type="button" aria-label={`Approve ${req.name}`} onClick={() => updateLeaveStatus(req.name, 'approved')} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"><Check className="w-4 h-4" /></button>
                      <button type="button" aria-label={`Reject ${req.name}`} onClick={() => updateLeaveStatus(req.name, 'rejected')} className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-[#EC4176]/10 text-[#EC4176] hover:bg-[#EC4176]/20 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${req.status === 'approved' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-[#EC4176]/10 text-[#EC4176]'}`}>{req.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Onboarding Pipeline" action={<a href="#" className="text-[#9A77CF] text-sm hover:text-[#EC4176]">Manage â†’</a>}>
          <div className="space-y-4">
            {[
              { name: 'Sofia Rahman', progress: 92 },
              { name: 'James Okafor', progress: 68 },
              { name: 'Mei Lin', progress: 45 }
            ].map((hire, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#262254] dark:text-white">{hire.name}</span>
                  <span className="text-[#543884] font-medium">{hire.progress}%</span>
                </div>
                <div className="h-1.5 bg-[#543884]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#543884] rounded-full" style={{ width: `${hire.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Department Health">
          <div className="space-y-3">
            {[
              { dept: 'Engineering', score: 87, color: '#543884' },
              { dept: 'Sales', score: 79, color: '#9A77CF' },
              { dept: 'Marketing', score: 91, color: '#EC4176' }
            ].map((dept, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{dept.dept}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${dept.color}1A`, color: dept.color }}>
                    {dept.score}%
                  </span>
                </div>
                <div className="h-2 bg-[#543884]/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${dept.score}%`, backgroundColor: dept.color }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Today's Agenda">
          <div className="space-y-3">
            {[
              { time: '09:00', title: 'Interview: Senior Dev Role', badge: 'Interview', color: '#9A77CF' },
              { time: '11:00', title: 'Team Standup', badge: 'Meeting', color: '#543884' },
              { time: '14:00', title: 'Performance Review: Rafi A.', badge: 'Review', color: '#EC4176' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs text-[#9A77CF] font-mono mt-0.5">{item.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#262254] dark:text-white">{item.title}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${item.color}1A`, color: item.color }}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}

// Employee Dashboard
function EmployeeDashboard({ user }: any) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Have a productive morning!' : hour < 17 ? 'Keep up the great work!' : 'Finish strong!';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const totalAttendanceDays = 25;
  const absentAttendanceDays = new Set([13, 25]);
  const presentAttendanceDays = totalAttendanceDays - absentAttendanceDays.size;
  const attendancePercent = Math.round((presentAttendanceDays / totalAttendanceDays) * 100);
  const recentPayslips = [
    { month: 'March 2026', amount: '$3,450' },
    { month: 'February 2026', amount: '$3,450' },
    { month: 'January 2026', amount: '$3,380' }
  ];
  const downloadPayslip = (month: string, amount: string) => {
    const file = new Blob(
      [`HR Space Payslip\nMonth: ${month}\nNet Pay: ${amount}\nStatus: Processed\n`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${month.replace(/\s+/g, '-').toLowerCase()}-payslip.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      key={user.role}
      className="space-y-6"
    >
      <DashboardHeader
        title={`Welcome back, ${user.name}`}
        subtitle={`${today} - ${greeting}`}
        actions={
          <>
            <Link to="/dashboard/leave" state={{ openRequestLeave: true }} className="rounded-xl px-4 py-2 text-sm text-white flex items-center gap-2 shadow-sm" style={{ background: 'linear-gradient(135deg, #543884, #A13670, #EC4176)' }}>
              <CalendarPlus className="w-4 h-4" />
              Apply for Leave
            </Link>
            <Link to="/dashboard/attendance" state={{ openLogAttendance: true }} className="border border-[#543884]/20 text-[#543884] rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#543884]/5">
              <Clock className="w-4 h-4" />
              Log Attendance
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="My Attendance" value={`${presentAttendanceDays} / ${totalAttendanceDays}`} change={`${attendancePercent}% this month`} trend="up" icon={Clock} iconBg="#5438841A" iconColor="#543884" index={0} subtitle="days" />
        <StatCard label="Leave Balance" value="12 days" change="6 used this year" trend="neutral" icon={Palmtree} iconBg="#9A77CF1A" iconColor="#9A77CF" index={1} />
        <StatCard label="Tasks Due" value="3" change="1 overdue" trend="down" icon={CheckSquare} iconBg="#EC41761A" iconColor="#EC4176" index={2} />
        <StatCard label="Training Progress" value="2 / 5" change="40% complete" trend="neutral" icon={BookOpen} iconBg="#FFA45E1A" iconColor="#FFA45E" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="My Attendance This Month">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: totalAttendanceDays }, (_, i) => {
              const day = i + 1;
              const isPresent = !absentAttendanceDays.has(day);
              const isToday = i === 23;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center ${
                    isToday ? 'ring-2 ring-[#FFA45E]' : ''
                  } ${isPresent ? 'bg-[#543884] text-white' : 'bg-[#EC4176]/20 text-[#EC4176]'}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#543884]" />
              <span className="text-xs text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#EC4176]/20" />
              <span className="text-xs text-muted-foreground">Absent</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Leave Balance">
          <div className="space-y-4">
            {[
              { type: 'Annual Leave', remaining: 12, total: 18, color: '#543884', icon: Calendar },
              { type: 'Sick Leave', remaining: 8, total: 10, color: '#9A77CF', icon: Shield },
              { type: 'Casual Leave', remaining: 3, total: 6, color: '#EC4176', icon: Clock }
            ].map((leave, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 mb-2">
                  <leave.icon className="w-4 h-4" style={{ color: leave.color }} />
                  <span className="text-sm text-[#262254] dark:text-white flex-1">{leave.type}</span>
                  <span className="text-xs text-muted-foreground">{leave.remaining} days left</span>
                </div>
                <div className="h-2 bg-[#543884]/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(leave.remaining / leave.total) * 100}%`, backgroundColor: leave.color }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="My Tasks" action={<Link to="/dashboard/tasks" className="inline-flex items-center gap-1 text-[#9A77CF] text-sm hover:text-[#EC4176]">View Tasks <ArrowRight className="w-3 h-3" /></Link>}>
          <div className="space-y-0">
            {[
              { task: 'Complete Q1 self-review', done: true, due: '' },
              { task: 'Submit expense report', done: false, due: 'Due today' },
              { task: 'Complete Safety Training', done: false, due: 'Due Apr 8' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#543884]/8 last:border-0">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  item.done ? 'bg-[#543884] border-[#543884]' : 'border-[#9A77CF]/40'
                }`}>
                  {item.done && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm flex-1 ${item.done ? 'line-through text-muted-foreground' : 'text-[#262254] dark:text-white'}`}>
                  {item.task}
                </span>
                {item.due && <span className="text-xs text-muted-foreground">{item.due}</span>}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="My Training" action={<Link to="/dashboard/training" className="inline-flex items-center gap-1 text-[#9A77CF] text-sm hover:text-[#EC4176]">Browse Training <ArrowRight className="w-3 h-3" /></Link>}>
          <div className="space-y-3">
            {[
              { name: 'Leadership Essentials', progress: 78, provider: 'LinkedIn Learning', color: '#543884' },
              { name: 'Data Privacy & GDPR', progress: 45, provider: 'Coursera', color: '#9A77CF' }
            ].map((course, i) => (
              <div key={i} className="border-b border-[#543884]/8 last:border-0 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#262254] dark:text-white">{course.name}</p>
                    <p className="text-xs text-muted-foreground">{course.provider}</p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: course.color }}>{course.progress}%</span>
                </div>
                <div className="h-1.5 bg-[#543884]/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${course.progress}%`, backgroundColor: course.color }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Today's Schedule">
          <div className="space-y-3">
            {[
              { time: '09:00', title: 'Team Standup', duration: '30 min', badge: 'Meeting', color: '#9A77CF' },
              { time: '10:30', title: 'Focus Work Block', duration: '', badge: 'Focus', color: '#543884' },
              { time: '14:00', title: '1:1 with Manager', duration: '', badge: 'Meeting', color: '#9A77CF' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs text-[#9A77CF] font-mono mt-0.5">{item.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#262254] dark:text-white">{item.title}</p>
                  {item.duration && <p className="text-xs text-muted-foreground">{item.duration}</p>}
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${item.color}1A`, color: item.color }}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Recent Payslips" action={<Link to="/dashboard/payslips" className="inline-flex items-center gap-1 text-[#9A77CF] text-sm hover:text-[#EC4176]">View Payslips <ArrowRight className="w-3 h-3" /></Link>}>
          <div className="space-y-0">
            {recentPayslips.map((slip, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[#543884]/8 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#543884]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#543884]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#262254] dark:text-white">{slip.month}</p>
                    <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">Processed</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#262254] dark:text-white">{slip.amount}</span>
                  <button type="button" aria-label={`Download ${slip.month} payslip`} onClick={() => downloadPayslip(slip.month, slip.amount)} className="text-[#9A77CF] hover:text-[#EC4176]">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: CalendarPlus, label: 'Apply Leave', to: '/dashboard/leave', colors: ['#543884', '#EC4176'] },
              { icon: Clock, label: 'Log Attendance', to: '/dashboard/attendance', colors: ['#9A77CF', '#543884'] },
              { icon: Receipt, label: 'Submit Expense', to: '/dashboard/expense', colors: ['#EC4176', '#A13670'] },
              { icon: FileText, label: 'Download Payslip', to: '/dashboard/payslips', colors: ['#FFA45E', '#A13670'] },
              { icon: MessageSquare, label: 'Go to Forum', to: '/dashboard/forum', colors: ['#9A77CF', '#EC4176'] },
              { icon: User, label: 'Update Profile', to: '/dashboard/profile', colors: ['#543884', '#9A77CF'] }
            ].map((action, i) => (
              <Link
                key={i}
                to={action.to}
                className="rounded-xl border border-[#543884]/10 p-4 flex flex-col items-center gap-2 hover:bg-[#543884]/5 hover:border-[#543884]/30 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${action.colors[0]}, ${action.colors[1]})` }}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-center font-medium text-[#262254] dark:text-white">{action.label}</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}
