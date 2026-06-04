import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Users, UserCheck, UserX, Briefcase, TrendingUp, TrendingDown, FileText,
  UserPlus, CheckCircle, Clock, Calendar, GraduationCap, Receipt, Target,
  Shield, MessageSquare, BookOpen, CheckSquare, Palmtree, BarChart2, CalendarPlus,
  Download, User, Check
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { AdminDashboard } from "../components/dashboard/AdminDashboard";
import { useNavigate } from "react-router-dom";
import {
  formatDashboardCurrency,
  getRoleDashboardSummary,
  RoleDashboardSummary,
} from "../services/dashboardData";

export function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin')           return <AdminDashboard userName={user.name} />;
  if (user?.role === 'hr_manager')      return <HRManagerDashboard user={user} />;
  if (user?.role === 'project_manager') return <ProjectManagerDashboard user={user} />;
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
  const [summary, setSummary] = useState<RoleDashboardSummary | null>(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    let isMounted = true;

    getRoleDashboardSummary("hr_manager")
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch((error) => {
        console.warn("Unable to load HR manager dashboard summary", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeEmployees = Number(summary?.activeEmployees ?? 247);
  const pendingLeave = Number(summary?.pendingLeave ?? 12);
  const upcomingTraining = Number(summary?.upcomingTraining ?? 18);

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
        subtitle={`You have ${pendingLeave} pending leave requests and ${upcomingTraining} upcoming training sessions.`}
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
        <StatCard label="Team Size" value={String(activeEmployees)} change={summary ? "Loaded from users table" : "8 new this month"} trend="up" icon={Users} iconBg="#5438841A" iconColor="#543884" index={0} />
        <StatCard label="Attendance Rate" value="94.2%" change="+1.2% vs last week" trend="up" icon={Clock} iconBg="#9A77CF1A" iconColor="#9A77CF" index={1} />
        <StatCard label="Leave Requests" value={String(pendingLeave)} change={summary ? "Awaiting approval" : "5 urgent"} trend="down" icon={Calendar} iconBg="#FFA45E1A" iconColor="#FFA45E" index={2} />
        <StatCard label="Upcoming Training" value={String(upcomingTraining)} change={summary ? "Scheduled sessions" : "18 completions"} trend="up" icon={GraduationCap} iconBg="#EC41761A" iconColor="#EC4176" index={3} />
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
                <Bar key="present-bar" dataKey="present" fill="#543884" radius={[8, 8, 0, 0]} />
                <Bar key="leave-bar" dataKey="leave" fill="#EC4176" radius={[8, 8, 0, 0]} />
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
          <SectionCard title="Leave Requests" action={<a href="#" className="text-[#9A77CF] text-sm hover:text-[#EC4176]">View All →</a>}>
            <div className="space-y-3">
              {[
                { name: 'Rafi Ahmed', days: 3, type: 'Annual Leave', initial: 'RA' },
                { name: 'Priya Sen', days: 1, type: 'Sick Leave', initial: 'PS' },
                { name: 'Karim Hassan', days: 5, type: 'Annual Leave', initial: 'KH' }
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#543884]/8 last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: `linear-gradient(135deg, ${chartTheme.colors[i % 5]}, ${chartTheme.colors[(i + 1) % 5]})` }}>
                    {req.initial}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#262254] dark:text-white">{req.name}</p>
                    <p className="text-xs text-muted-foreground">{req.days} days · {req.type}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg px-2 py-1 text-xs">✓</button>
                    <button className="bg-[#EC4176]/10 text-[#EC4176] rounded-lg px-2 py-1 text-xs">✗</button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Onboarding Pipeline" action={<a href="#" className="text-[#9A77CF] text-sm hover:text-[#EC4176]">Manage →</a>}>
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

// Project Manager Dashboard
function ProjectManagerDashboard({ user }: any) {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const projectData = [
    { project: 'Website Redesign', completed: 6, inProgress: 3, todo: 2 },
    { project: 'User Portal', completed: 4, inProgress: 5, todo: 3 }
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
        subtitle="Track project progress and manage team assignments."
        actions={
          <>
            <button
              onClick={() => navigate('/dashboard/new-task')}
              className="rounded-xl px-4 py-2 text-sm text-white flex items-center gap-2 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #543884, #A13670, #EC4176)' }}
            >
              <CheckSquare className="w-4 h-4" />
              New Task
            </button>
            <button
              onClick={() => navigate('/dashboard/project-reports')}
              className="border border-[#543884]/20 text-[#543884] rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#543884]/5"
            >
              <BarChart2 className="w-4 h-4" />
              View Reports
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Projects" value="2" change="On track" trend="neutral" icon={Briefcase} iconBg="#5438841A" iconColor="#543884" index={0} />
        <StatCard label="Total Tasks" value="23" change="8 completed this week" trend="up" icon={CheckSquare} iconBg="#9A77CF1A" iconColor="#9A77CF" index={1} />
        <StatCard label="Team Members" value="5" change="All active" trend="neutral" icon={Users} iconBg="#FFA45E1A" iconColor="#FFA45E" index={2} />
        <StatCard label="Overdue Tasks" value="1" change="1 needs attention" trend="down" icon={Clock} iconBg="#EC41761A" iconColor="#EC4176" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="Project Progress">
            <div className="space-y-6">
              {projectData.map((project, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[#262254] dark:text-white">{project.project}</h4>
                    <span className="text-xs text-muted-foreground">
                      {project.completed + project.inProgress + project.todo} tasks total
                    </span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden mb-2">
                    <div
                      className="bg-green-500"
                      style={{ width: `${(project.completed / (project.completed + project.inProgress + project.todo)) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(project.inProgress / (project.completed + project.inProgress + project.todo)) * 100}%` }}
                    />
                    <div
                      className="bg-gray-400"
                      style={{ width: `${(project.todo / (project.completed + project.inProgress + project.todo)) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {project.completed} Completed
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {project.inProgress} In Progress
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      {project.todo} To Do
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Team Performance" action={<a href="#" className="text-[#9A77CF] text-sm hover:text-[#EC4176]">View All →</a>}>
          <div className="space-y-3">
            {[
              { name: 'Sarah Johnson', tasks: 5, completed: 4, avatar: 'SJ' },
              { name: 'Michael Chen', tasks: 6, completed: 5, avatar: 'MC' },
              { name: 'Emily Rodriguez', tasks: 4, completed: 3, avatar: 'ER' },
              { name: 'David Kim', tasks: 3, completed: 2, avatar: 'DK' }
            ].map((member, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#543884]/8 last:border-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white text-xs font-semibold">
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#262254] dark:text-white">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.completed}/{member.tasks} tasks completed</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#543884]">{Math.round((member.completed / member.tasks) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Upcoming Deadlines" action={<a href="#" className="text-[#9A77CF] text-sm hover:text-[#EC4176]">View All →</a>}>
          <div className="space-y-3">
            {[
              { task: 'Database Schema Migration', date: 'Jun 2', overdue: true },
              { task: 'Design Homepage Mockup', date: 'Jun 5', overdue: false },
              { task: 'Mobile Responsive Design', date: 'Jun 7', overdue: false }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${item.overdue ? 'bg-red-500' : 'bg-[#9A77CF]'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#262254] dark:text-white">{item.task}</p>
                  <p className={`text-xs ${item.overdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {item.overdue ? 'Overdue' : `Due ${item.date}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Task Distribution">
          <div className="space-y-4">
            {[
              { status: 'To Do', count: 5, color: '#9A77CF' },
              { status: 'In Progress', count: 8, color: '#543884' },
              { status: 'In Review', count: 3, color: '#FFA45E' },
              { status: 'Completed', count: 10, color: '#00C853' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{stat.status}</span>
                  <span className="font-semibold text-[#262254] dark:text-white">{stat.count}</span>
                </div>
                <div className="h-2 bg-[#543884]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(stat.count / 26) * 100}%`, backgroundColor: stat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Activity">
          <div className="space-y-3">
            {[
              { action: 'Task assigned to Sarah', time: '10 min ago', color: '#543884' },
              { action: 'David completed a task', time: '1 hour ago', color: '#00C853' },
              { action: 'Emily updated design', time: '2 hours ago', color: '#9A77CF' },
              { action: 'New task created', time: '3 hours ago', color: '#FFA45E' }
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: activity.color }} />
                <div className="flex-1">
                  <p className="text-sm text-[#262254] dark:text-white">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/dashboard/new-task')}
            className="rounded-xl border border-[#543884]/10 p-4 flex flex-col items-center gap-2 hover:bg-[#543884]/5 hover:border-[#543884]/30 cursor-pointer transition-all"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #543884, #EC4176)' }}>
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-center font-medium text-[#262254] dark:text-white">Create Task</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/project-reports')}
            className="rounded-xl border border-[#543884]/10 p-4 flex flex-col items-center gap-2 hover:bg-[#543884]/5 hover:border-[#543884]/30 cursor-pointer transition-all"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EC4176, #A13670)' }}>
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-center font-medium text-[#262254] dark:text-white">View Reports</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/project-management')}
            className="rounded-xl border border-[#543884]/10 p-4 flex flex-col items-center gap-2 hover:bg-[#543884]/5 hover:border-[#543884]/30 cursor-pointer transition-all"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9A77CF, #EC4176)' }}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-center font-medium text-[#262254] dark:text-white">Track Progress</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/forum')}
            className="rounded-xl border border-[#543884]/10 p-4 flex flex-col items-center gap-2 hover:bg-[#543884]/5 hover:border-[#543884]/30 cursor-pointer transition-all"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #543884, #9A77CF)' }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-center font-medium text-[#262254] dark:text-white">Team Chat</span>
          </button>
        </div>
      </SectionCard>
    </motion.div>
  );
}

// Employee Dashboard
function EmployeeDashboard({ user }: any) {
  const [summary, setSummary] = useState<RoleDashboardSummary | null>(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Have a productive morning!' : hour < 17 ? 'Keep up the great work!' : 'Finish strong!';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    let isMounted = true;

    getRoleDashboardSummary("employee")
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch((error) => {
        console.warn("Unable to load employee dashboard summary", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const daysPresent = Number(summary?.daysPresent ?? 23);
  const pendingLeave = Number(summary?.pendingLeave ?? 0);
  const latestPayroll = summary?.latestPayroll?.net_pay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      key={user.role}
      className="space-y-6"
    >
      <DashboardHeader
        title={`Welcome back, ${user.name} 👋`}
        subtitle={`${today} · ${greeting}`}
        actions={
          <>
            <button className="rounded-xl px-4 py-2 text-sm text-white flex items-center gap-2 shadow-sm" style={{ background: 'linear-gradient(135deg, #543884, #A13670, #EC4176)' }}>
              <CalendarPlus className="w-4 h-4" />
              Apply for Leave
            </button>
            <button className="border border-[#543884]/20 text-[#543884] rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#543884]/5">
              <Clock className="w-4 h-4" />
              Log Attendance
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="My Attendance" value={`${daysPresent} / 25`} change={summary ? "Present days this month" : "92% this month"} trend="up" icon={Clock} iconBg="#5438841A" iconColor="#543884" index={0} subtitle="days" />
        <StatCard label="Pending Leave" value={String(pendingLeave)} change={summary ? "Requests awaiting decision" : "6 used this year"} trend="neutral" icon={Palmtree} iconBg="#9A77CF1A" iconColor="#9A77CF" index={1} />
        <StatCard label="Latest Payroll" value={latestPayroll ? formatDashboardCurrency(latestPayroll) : "N/A"} change={summary ? "Most recent payroll record" : "1 overdue"} trend="neutral" icon={CheckSquare} iconBg="#EC41761A" iconColor="#EC4176" index={2} />
        <StatCard label="Training Progress" value="2 / 5" change="40% complete" trend="neutral" icon={BookOpen} iconBg="#FFA45E1A" iconColor="#FFA45E" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="My Attendance This Month">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 25 }, (_, i) => {
              const isPresent = i % 6 !== 0;
              const isToday = i === 23;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center ${
                    isToday ? 'ring-2 ring-[#FFA45E]' : ''
                  } ${isPresent ? 'bg-[#543884] text-white' : 'bg-[#EC4176]/20 text-[#EC4176]'}`}
                >
                  {i + 1}
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
        <SectionCard title="My Tasks" action={<a href="#" className="text-[#9A77CF] text-sm hover:text-[#EC4176]">View All →</a>}>
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

        <SectionCard title="My Training" action={<a href="#" className="text-[#9A77CF] text-sm hover:text-[#EC4176]">Browse Courses →</a>}>
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
        <SectionCard title="Recent Payslips" action={<a href="#" className="text-[#9A77CF] text-sm hover:text-[#EC4176]">View All →</a>}>
          <div className="space-y-0">
            {[
              { month: 'March 2026', amount: 'BDT 75,000' },
              { month: 'February 2026', amount: 'BDT 75,000' },
              { month: 'January 2026', amount: 'BDT 73,500' }
            ].map((slip, i) => (
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
                  <button className="text-[#9A77CF] hover:text-[#EC4176]">
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
              { icon: CalendarPlus, label: 'Apply Leave', colors: ['#543884', '#EC4176'] },
              { icon: Clock, label: 'Log Attendance', colors: ['#9A77CF', '#543884'] },
              { icon: Receipt, label: 'Submit Expense', colors: ['#EC4176', '#A13670'] },
              { icon: FileText, label: 'Download Payslip', colors: ['#FFA45E', '#A13670'] },
              { icon: MessageSquare, label: 'Go to Forum', colors: ['#9A77CF', '#EC4176'] },
              { icon: User, label: 'Update Profile', colors: ['#543884', '#9A77CF'] }
            ].map((action, i) => (
              <button
                key={i}
                className="rounded-xl border border-[#543884]/10 p-4 flex flex-col items-center gap-2 hover:bg-[#543884]/5 hover:border-[#543884]/30 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${action.colors[0]}, ${action.colors[1]})` }}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-center font-medium text-[#262254] dark:text-white">{action.label}</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}
