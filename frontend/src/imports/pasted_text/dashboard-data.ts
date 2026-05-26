/**
 * dashboardData.ts — Mock data service for dashboard pages.
 *
 * BACKEND INTEGRATION GUIDE:
 * Each exported function maps to one future API endpoint.
 * When your backend is ready, replace the return value with a fetch/axios call.
 *
 * Example swap:
 *   BEFORE: export function getAdminStats() { return mockAdminStats; }
 *   AFTER:  export async function getAdminStats(): Promise<AdminStats> {
 *             return fetch('/api/v1/dashboard/admin/stats').then(r => r.json());
 *           }
 *
 * Then wrap dashboard components with React Query:
 *   const { data: stats } = useQuery({ queryKey: ['adminStats'], queryFn: getAdminStats });
 */

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface TrendData {
  value: string;
  isPositive: boolean;
}

export interface StatItem {
  label: string;
  value: string;
  subtitle: string;
  trend: TrendData;
}

export interface ActivityItem {
  id: number;
  user: string;
  action: string;
  time: string;
  type: 'leave' | 'onboarding' | 'expense' | 'training' | 'profile' | 'payroll';
}

export interface UpcomingEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  day: string;
  month: string;
  type: string;
}

export interface ChartPoint {
  month: string;
  [key: string]: string | number;
}

// ─── Admin Data ──────────────────────────────────────────────────────────────
// Future endpoint: GET /api/v1/dashboard/admin/stats

export interface AdminStats {
  totalEmployees: StatItem;
  presentToday: StatItem;
  onLeave: StatItem;
  openPositions: StatItem;
}

export function getAdminStats(): AdminStats {
  // TODO: return await fetch('/api/v1/dashboard/admin/stats').then(r => r.json());
  return {
    totalEmployees: { label: 'Total Employees', value: '1,234', subtitle: 'Across all departments', trend: { value: '+12 this month', isPositive: true } },
    presentToday:   { label: 'Present Today',   value: '1,156', subtitle: '93.7% attendance rate',  trend: { value: '+2% vs yesterday', isPositive: true } },
    onLeave:        { label: 'On Leave',         value: '48',    subtitle: '5 pending approval',    trend: { value: '3.9% of workforce', isPositive: false } },
    openPositions:  { label: 'Open Positions',   value: '17',    subtitle: '3 offers extended',     trend: { value: '4 new this week',   isPositive: true } },
  };
}

// Future endpoint: GET /api/v1/dashboard/admin/attendance-trend
export function getAdminAttendanceTrend(): ChartPoint[] {
  // TODO: return await fetch('/api/v1/dashboard/admin/attendance-trend').then(r => r.json());
  return [
    { month: 'Jan', present: 1150, absent: 84 },
    { month: 'Feb', present: 1180, absent: 54 },
    { month: 'Mar', present: 1200, absent: 34 },
    { month: 'Apr', present: 1220, absent: 14 },
    { month: 'May', present: 1180, absent: 54 },
    { month: 'Jun', present: 1156, absent: 78 },
  ];
}

// Future endpoint: GET /api/v1/dashboard/admin/department-breakdown
export function getDepartmentBreakdown() {
  // TODO: return await fetch('/api/v1/dashboard/admin/departments').then(r => r.json());
  return [
    { name: 'Engineering', value: 450, color: '#543884' },
    { name: 'Sales',       value: 280, color: '#9A77CF' },
    { name: 'Marketing',   value: 180, color: '#EC4176' },
    { name: 'HR',          value: 120, color: '#FFA45E' },
    { name: 'Finance',     value: 204, color: '#A13670' },
  ];
}

// Future endpoint: GET /api/v1/dashboard/admin/payroll-summary
export function getPayrollSummary() {
  // TODO: return await fetch('/api/v1/dashboard/admin/payroll-summary').then(r => r.json());
  return {
    totalDisbursed: '$2,847,000',
    pending: '$124,500',
    deductions: '$389,200',
    trend: [2600, 2700, 2750, 2800, 2820, 2847],
  };
}

// Future endpoint: GET /api/v1/dashboard/admin/pending-approvals
export function getPendingApprovals() {
  // TODO: return await fetch('/api/v1/dashboard/admin/pending-approvals').then(r => r.json());
  return [
    { label: 'Leave Requests',     count: 12, type: 'leave',       color: '#9A77CF' },
    { label: 'Expense Claims',     count: 8,  type: 'expense',     color: '#FFA45E' },
    { label: 'Onboarding Tasks',   count: 5,  type: 'onboarding',  color: '#543884' },
    { label: 'Performance Reviews',count: 3,  type: 'performance', color: '#EC4176' },
  ];
}

// Future endpoint: GET /api/v1/dashboard/admin/recent-activity
export function getAdminActivity(): ActivityItem[] {
  // TODO: return await fetch('/api/v1/dashboard/admin/activity').then(r => r.json());
  return [
    { id: 1, user: 'Rafi Ahmed',    action: 'submitted a leave request',   time: '5 min ago',   type: 'leave' },
    { id: 2, user: 'Sofia Rahman',  action: 'completed onboarding',        time: '22 min ago',  type: 'onboarding' },
    { id: 3, user: 'James Okafor', action: 'filed an expense claim',       time: '1 hour ago',  type: 'expense' },
    { id: 4, user: 'Mei Lin',       action: 'enrolled in training course', time: '2 hours ago', type: 'training' },
    { id: 5, user: 'Arif Islam',    action: 'updated profile information', time: '3 hours ago', type: 'profile' },
  ];
}

export function getUpcomingEvents(): UpcomingEvent[] {
  // TODO: return await fetch('/api/v1/dashboard/events/upcoming').then(r => r.json());
  return [
    { id: 1, title: 'Payroll Processing',       description: 'Monthly payroll run',      date: 'May 30, 2026', day: '30', month: 'MAY', type: 'payroll' },
    { id: 2, title: 'New Hire Orientation',      description: '4 new employees joining',  date: 'Jun 2, 2026',  day: '02', month: 'JUN', type: 'onboarding' },
    { id: 3, title: 'Performance Reviews Due',   description: 'Q1 appraisal cycle ends',  date: 'Jun 5, 2026',  day: '05', month: 'JUN', type: 'performance' },
    { id: 4, title: 'Leadership Workshop',       description: 'Training series — Day 1',  date: 'Jun 10, 2026', day: '10', month: 'JUN', type: 'training' },
  ];
}

// ─── HR Manager Data ─────────────────────────────────────────────────────────

export interface HRStats {
  teamSize: StatItem;
  attendanceRate: StatItem;
  leaveRequests: StatItem;
  trainingProgress: StatItem;
}

export function getHRManagerStats(): HRStats {
  // TODO: return await fetch('/api/v1/dashboard/hr-manager/stats').then(r => r.json());
  return {
    teamSize:         { label: 'Team Size',          value: '247',   subtitle: 'Direct + indirect reports', trend: { value: '+8 this month',     isPositive: true } },
    attendanceRate:   { label: 'Attendance Rate',    value: '94.2%', subtitle: 'Team average this week',    trend: { value: '+1.2% vs last week', isPositive: true } },
    leaveRequests:    { label: 'Leave Requests',     value: '12',    subtitle: '5 marked urgent',           trend: { value: 'Needs attention',    isPositive: false } },
    trainingProgress: { label: 'Training Completion',value: '73%',   subtitle: '18 completed this month',   trend: { value: '+6% this month',     isPositive: true } },
  };
}

// Future endpoint: GET /api/v1/dashboard/hr-manager/team-attendance
export function getTeamAttendance(): ChartPoint[] {
  // TODO: return await fetch('/api/v1/dashboard/hr-manager/team-attendance').then(r => r.json());
  return [
    { day: 'Mon', present: 238, leave: 9  },
    { day: 'Tue', present: 241, leave: 6  },
    { day: 'Wed', present: 235, leave: 12 },
    { day: 'Thu', present: 240, leave: 7  },
    { day: 'Fri', present: 232, leave: 15 },
  ];
}

// Future endpoint: GET /api/v1/leave/pending
export function getPendingLeaveRequests() {
  // TODO: return await fetch('/api/v1/leave/pending').then(r => r.json());
  return [
    { id: 1, name: 'Rafi Ahmed',   days: 3, type: 'Annual Leave',  initials: 'RA', color: '#543884' },
    { id: 2, name: 'Priya Sen',    days: 1, type: 'Sick Leave',    initials: 'PS', color: '#9A77CF' },
    { id: 3, name: 'Karim Hassan', days: 5, type: 'Annual Leave',  initials: 'KH', color: '#EC4176' },
    { id: 4, name: 'Nadia Malik',  days: 2, type: 'Casual Leave',  initials: 'NM', color: '#FFA45E' },
    { id: 5, name: 'Arif Islam',   days: 4, type: 'Annual Leave',  initials: 'AI', color: '#A13670' },
  ];
}

// Future endpoint: GET /api/v1/onboarding/pipeline
export function getOnboardingPipeline() {
  // TODO: return await fetch('/api/v1/onboarding/pipeline').then(r => r.json());
  return [
    { name: 'Sofia Rahman', role: 'UX Designer',        progress: 92, initials: 'SR', startDate: 'May 1' },
    { name: 'James Okafor', role: 'Backend Engineer',   progress: 68, initials: 'JO', startDate: 'May 8' },
    { name: 'Mei Lin',      role: 'Product Manager',    progress: 45, initials: 'ML', startDate: 'May 15' },
    { name: 'David Owusu',  role: 'Sales Representative',progress: 20, initials: 'DO', startDate: 'May 20' },
  ];
}

// Future endpoint: GET /api/v1/dashboard/hr-manager/agenda/today
export function getHRTodayAgenda() {
  // TODO: return await fetch('/api/v1/dashboard/hr-manager/agenda/today').then(r => r.json());
  return [
    { id: 1, time: '09:00', title: 'Interview: Senior Dev Role',  badge: 'Interview', color: '#9A77CF' },
    { id: 2, time: '11:00', title: 'Weekly Team Standup',         badge: 'Meeting',   color: '#543884' },
    { id: 3, time: '14:00', title: 'Performance Review — Rafi A.', badge: 'Review',   color: '#EC4176' },
    { id: 4, time: '16:00', title: 'Monthly Payroll Sign-off',    badge: 'Payroll',   color: '#FFA45E' },
  ];
}

// ─── Employee Data ────────────────────────────────────────────────────────────

export interface EmployeeStats {
  myAttendance: StatItem;
  leaveBalance: StatItem;
  tasksDue: StatItem;
  trainingProgress: StatItem;
}

export function getEmployeeStats(): EmployeeStats {
  // TODO: return await fetch('/api/v1/dashboard/employee/stats').then(r => r.json());
  return {
    myAttendance:     { label: 'My Attendance',      value: '23/25',  subtitle: '92% this month',      trend: { value: '+3% vs last month', isPositive: true } },
    leaveBalance:     { label: 'Leave Balance',      value: '12 days', subtitle: '6 days used this year', trend: { value: 'Annual leave',     isPositive: true } },
    tasksDue:         { label: 'Tasks Due',          value: '3',      subtitle: '1 overdue',            trend: { value: 'Needs attention',   isPositive: false } },
    trainingProgress: { label: 'Training Progress',  value: '2 / 5',  subtitle: '40% of courses done',  trend: { value: '2 due this month',  isPositive: false } },
  };
}

// Future endpoint: GET /api/v1/dashboard/employee/attendance-month
export function getEmployeeMonthAttendance() {
  // TODO: return await fetch('/api/v1/dashboard/employee/attendance-month').then(r => r.json());
  // 0=weekend, 1=present, 2=absent, 3=leave
  return {
    year: 2026, month: 4, // May 2026 (0-indexed)
    days: [
      0,0,1,1,1,1,1,  // week 1 — Mon 4th to Fri 8th (May 1 is Fri so pad)
      1,1,1,2,1,0,0,  // week 2
      1,1,3,3,1,0,0,  // week 3 — Wed/Thu on leave
      1,1,1,1,1,0,0,  // week 4
      1,0,0,0,0,0,0,  // week 5
    ],
  };
}

// Future endpoint: GET /api/v1/leave/balance/me
export function getMyLeaveBalance() {
  // TODO: return await fetch('/api/v1/leave/balance/me').then(r => r.json());
  return [
    { type: 'Annual Leave',  remaining: 12, total: 18, color: '#543884' },
    { type: 'Sick Leave',    remaining: 8,  total: 10, color: '#9A77CF' },
    { type: 'Casual Leave',  remaining: 3,  total: 6,  color: '#EC4176' },
  ];
}

// Future endpoint: GET /api/v1/tasks/me
export function getMyTasks() {
  // TODO: return await fetch('/api/v1/tasks/me').then(r => r.json());
  return [
    { id: 1, title: 'Complete Q1 self-review',    done: true,  due: 'Done',      urgent: false },
    { id: 2, title: 'Submit expense report',       done: false, due: 'Due today', urgent: true },
    { id: 3, title: 'Complete Safety Training',    done: false, due: 'Due Jun 8', urgent: false },
    { id: 4, title: 'Update emergency contacts',   done: false, due: 'Due Jun 12',urgent: false },
  ];
}

// Future endpoint: GET /api/v1/training/me
export function getMyTraining() {
  // TODO: return await fetch('/api/v1/training/me').then(r => r.json());
  return [
    { id: 1, title: 'Leadership Essentials',  provider: 'HR Academy',   progress: 78, color: '#543884' },
    { id: 2, title: 'Data Privacy & GDPR',    provider: 'Compliance HQ', progress: 45, color: '#9A77CF' },
    { id: 3, title: 'Advanced Excel',          provider: 'SkillPath',    progress: 20, color: '#EC4176' },
  ];
}

// Future endpoint: GET /api/v1/payroll/slips/me?limit=3
export function getMyRecentPayslips() {
  // TODO: return await fetch('/api/v1/payroll/slips/me?limit=3').then(r => r.json());
  return [
    { id: 1, period: 'May 2026',      amount: '$3,450', status: 'Processed' },
    { id: 2, period: 'April 2026',    amount: '$3,450', status: 'Processed' },
    { id: 3, period: 'March 2026',    amount: '$3,380', status: 'Processed' },
  ];
}

// Future endpoint: GET /api/v1/dashboard/employee/schedule/today
export function getMyTodaySchedule() {
  // TODO: return await fetch('/api/v1/dashboard/employee/schedule/today').then(r => r.json());
  return [
    { id: 1, time: '09:00', title: 'Team Standup',              badge: 'Meeting',  color: '#9A77CF' },
    { id: 2, time: '10:30', title: 'Deep Work Block',           badge: 'Focus',    color: '#543884' },
    { id: 3, time: '14:00', title: '1:1 with Manager',          badge: 'Meeting',  color: '#9A77CF' },
    { id: 4, time: '15:30', title: 'Leadership Essentials — L3', badge: 'Training', color: '#EC4176' },
  ];
}