import api from "./api";
import { formatCurrencyBDT } from "../utils/formatters";

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
  month?: string;
  day?: string;
  [key: string]: string | number | undefined;
}

export type DashboardRole = "admin" | "hr_manager" | "employee";

export interface RoleDashboardSummary {
  totalEmployees?: number;
  presentToday?: number;
  pendingLeave?: number;
  monthlyPayroll?: number | string;
  activeEmployees?: number;
  upcomingTraining?: number;
  daysPresent?: number;
  latestPayroll?: {
    net_pay: number | string;
    pay_period: string;
  } | null;
}

const roleDashboardEndpoints: Record<DashboardRole, string> = {
  admin: "/admin/dashboard",
  hr_manager: "/hr-manager/dashboard",
  employee: "/employee/dashboard",
};

export async function getRoleDashboardSummary(role: DashboardRole): Promise<RoleDashboardSummary> {
  const response = await api.get(roleDashboardEndpoints[role]);
  return response.data.dashboard ?? {};
}

export function formatDashboardCurrency(value: number | string | undefined | null): string {
  return formatCurrencyBDT(value);
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
  return {
    totalEmployees: { label: 'Total Employees', value: '11', subtitle: 'Across all departments', trend: { value: 'All active', isPositive: true } },
    presentToday:   { label: 'Present Today',   value: '11', subtitle: '100% attendance rate',  trend: { value: 'Consistent', isPositive: true } },
    onLeave:        { label: 'On Leave',         value: '0',    subtitle: '0 pending approval',    trend: { value: '0% of workforce', isPositive: false } },
    openPositions:  { label: 'Open Positions',   value: '3',    subtitle: 'Candidates shortlisted',     trend: { value: '3 in pipeline',   isPositive: true } },
  };
}

export function getAdminAttendanceTrend(): ChartPoint[] {
  return [
    { month: 'Jan', present: 11, absent: 0 },
    { month: 'Feb', present: 11, absent: 0 },
    { month: 'Mar', present: 11, absent: 0 },
    { month: 'Apr', present: 11, absent: 0 },
    { month: 'May', present: 11, absent: 0 },
    { month: 'Jun', present: 11, absent: 0 },
  ];
}

export function getDepartmentBreakdown() {
  return [
    { name: 'Human Resources', value: 2, color: '#543884' },
    { name: 'Information Technology', value: 1, color: '#9A77CF' },
    { name: 'Finance',     value: 1, color: '#EC4176' },
    { name: 'Marketing',   value: 1, color: '#FFA45E' },
    { name: 'Sales',       value: 1, color: '#A13670' },
    { name: 'Other',       value: 5, color: '#00C853' },
  ];
}

export function getPayrollSummary() {
  return {
    totalDisbursed: formatCurrencyBDT(827000),
    pending: formatCurrencyBDT(0),
    deductions: formatCurrencyBDT(15000),
    trend: [8200, 8250, 8270, 8270, 8270, 8270],
  };
}

export function getPendingApprovals() {
  return [
    { label: 'Leave Requests',     count: 2, type: 'leave',       color: '#9A77CF' },
    { label: 'Expense Claims',     count: 1,  type: 'expense',     color: '#FFA45E' },
    { label: 'Onboarding Tasks',   count: 3,  type: 'onboarding',  color: '#543884' },
    { label: 'Performance Reviews',count: 1,  type: 'performance', color: '#EC4176' },
  ];
}

export function getAdminActivity(): ActivityItem[] {
  return [
    { id: 1, user: 'Employee 01',   action: 'submitted a leave request',   time: '5 min ago',   type: 'leave' },
    { id: 2, user: 'Employee 07',   action: 'completed orientation step',  time: '22 min ago',  type: 'onboarding' },
    { id: 3, user: 'Employee 03',   action: 'filed an expense claim',       time: '1 hour ago',  type: 'expense' },
    { id: 4, user: 'Employee 08',   action: 'enrolled in training course', time: '2 hours ago', type: 'training' },
    { id: 5, user: 'Employee 05',   action: 'updated profile information', time: '3 hours ago', type: 'profile' },
  ];
}

export function getUpcomingEvents(): UpcomingEvent[] {
  return [
    { id: 1, title: 'Payroll Processing',       description: 'Monthly payroll run',      date: 'May 30, 2026', day: '30', month: 'MAY', type: 'payroll' },
    { id: 2, title: 'New Hire Orientation',      description: 'Employee 07 & Employee 08 joining',  date: 'Jun 2, 2026',  day: '02', month: 'JUN', type: 'onboarding' },
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
  return {
    teamSize:         { label: 'Team Size',          value: '11',   subtitle: 'Direct + indirect reports', trend: { value: 'All active',     isPositive: true } },
    attendanceRate:   { label: 'Attendance Rate',    value: '95.4%', subtitle: 'Team average this week',    trend: { value: 'Stable', isPositive: true } },
    leaveRequests:    { label: 'Leave Requests',     value: '2',    subtitle: 'Awaiting review',           trend: { value: 'Needs attention',    isPositive: false } },
    trainingProgress: { label: 'Training Completion',value: '60%',   subtitle: 'In-progress sessions',   trend: { value: 'On track',     isPositive: true } },
  };
}

export function getTeamAttendance(): ChartPoint[] {
  return [
    { day: 'Mon', present: 10, leave: 1 },
    { day: 'Tue', present: 11, leave: 0 },
    { day: 'Wed', present: 9,  leave: 2 },
    { day: 'Thu', present: 10, leave: 1 },
    { day: 'Fri', present: 10, leave: 1 },
  ];
}

export function getPendingLeaveRequests() {
  return [
    { id: 1, name: 'Employee 01',   days: 3, type: 'Annual Leave',  initials: 'E1', color: '#543884' },
    { id: 2, name: 'Employee 02',   days: 1, type: 'Sick Leave',    initials: 'E2', color: '#9A77CF' },
    { id: 3, name: 'Employee 03',   days: 5, type: 'Annual Leave',  initials: 'E3', color: '#EC4176' },
  ];
}

export function getOnboardingPipeline() {
  return [
    { name: 'Employee 07', role: 'Training & Development Executive', progress: 92, initials: 'E7', startDate: 'Jul 7' },
    { name: 'Employee 08', role: 'Administration Executive',   progress: 68, initials: 'E8', startDate: 'Aug 8' },
    { name: 'Employee 06', role: 'Customer Support Executive', progress: 45, initials: 'E6', startDate: 'Jun 6' },
  ];
}

export function getHRTodayAgenda() {
  return [
    { id: 1, time: '09:00', title: 'Interview: Candidate screening',  badge: 'Interview', color: '#9A77CF' },
    { id: 2, time: '11:00', title: 'Weekly Team Standup',         badge: 'Meeting',   color: '#543884' },
    { id: 3, time: '14:00', title: 'Performance Review — Employee 01', badge: 'Review',   color: '#EC4176' },
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
    { id: 1, period: 'May 2026',      amount: formatCurrencyBDT(75000), status: 'Processed' },
    { id: 2, period: 'April 2026',    amount: formatCurrencyBDT(75000), status: 'Processed' },
    { id: 3, period: 'March 2026',    amount: formatCurrencyBDT(73500), status: 'Processed' },
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
