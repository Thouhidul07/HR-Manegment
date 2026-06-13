import api from "./api";
import { formatCurrencyBDT } from "../utils/formatters";

/**
 * dashboardData.ts - API dashboard data helpers.
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
  daysLate?: number;
  daysAbsent?: number;
  daysLeave?: number;
  attendedDays?: number;
  workdaysInMonth?: number;
  workdaysToDate?: number;
  monthAttendance?: {
    year: number;
    month: number;
    daysPresent: number;
    daysLate: number;
    daysAbsent: number;
    daysLeave: number;
    attendedDays: number;
    workdaysInMonth: number;
    workdaysToDate: number;
    days: {
      date: string;
      day: number;
      status: "present" | "late" | "absent" | "leave" | "none";
      isToday: boolean;
      isWeekend: boolean;
      isFuture: boolean;
    }[];
  };
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
    totalEmployees: { label: 'Total Employees', value: '0', subtitle: 'Loaded from employee records', trend: { value: 'Live', isPositive: true } },
    presentToday:   { label: 'Present Today',   value: '0', subtitle: 'Loaded from attendance', trend: { value: 'Live', isPositive: true } },
    onLeave:        { label: 'On Leave',         value: '0', subtitle: 'Loaded from leave records', trend: { value: 'Live', isPositive: true } },
    openPositions:  { label: 'Open Positions',   value: '0', subtitle: 'Loaded from recruitment', trend: { value: 'Live', isPositive: true } },
  };
}

export function getAdminAttendanceTrend(): ChartPoint[] { return []; }

export function getDepartmentBreakdown() { return []; }

export function getPayrollSummary() {
  return { totalDisbursed: formatCurrencyBDT(0), pending: formatCurrencyBDT(0), deductions: formatCurrencyBDT(0), trend: [] };
}

export function getPendingApprovals() { return []; }

export function getAdminActivity(): ActivityItem[] { return []; }

export function getUpcomingEvents(): UpcomingEvent[] { return []; }

// ─── HR Manager Data ─────────────────────────────────────────────────────────

export interface HRStats {
  teamSize: StatItem;
  attendanceRate: StatItem;
  leaveRequests: StatItem;
  trainingProgress: StatItem;
}

export function getHRManagerStats(): HRStats {
  return {
    teamSize: { label: 'Team Size', value: '0', subtitle: 'Loaded from employee records', trend: { value: 'Live', isPositive: true } },
    attendanceRate: { label: 'Attendance Rate', value: '0%', subtitle: 'Loaded from attendance', trend: { value: 'Live', isPositive: true } },
    leaveRequests: { label: 'Leave Requests', value: '0', subtitle: 'Loaded from leave records', trend: { value: 'Live', isPositive: true } },
    trainingProgress: { label: 'Training Completion', value: '0%', subtitle: 'Loaded from training records', trend: { value: 'Live', isPositive: true } },
  };
}

export function getTeamAttendance(): ChartPoint[] { return []; }

export function getPendingLeaveRequests() { return []; }

export function getOnboardingPipeline() { return []; }

export function getHRTodayAgenda() { return []; }
// ─── Employee Data ────────────────────────────────────────────────────────────

export interface EmployeeStats {
  myAttendance: StatItem;
  leaveBalance: StatItem;
  tasksDue: StatItem;
  trainingProgress: StatItem;
}

export function getEmployeeStats(): EmployeeStats {
  return {
    myAttendance: { label: 'My Attendance', value: '0', subtitle: 'Loaded from attendance', trend: { value: 'Live', isPositive: true } },
    leaveBalance: { label: 'Leave Balance', value: '0', subtitle: 'Loaded from leave records', trend: { value: 'Live', isPositive: true } },
    tasksDue: { label: 'Tasks Due', value: '0', subtitle: 'Loaded from tasks', trend: { value: 'Live', isPositive: true } },
    trainingProgress: { label: 'Training Progress', value: '0', subtitle: 'Loaded from training records', trend: { value: 'Live', isPositive: true } },
  };
}

// Future endpoint: GET /api/v1/dashboard/employee/attendance-month
export function getEmployeeMonthAttendance() { return { year: new Date().getFullYear(), month: new Date().getMonth(), days: [] }; }

// Future endpoint: GET /api/v1/leave/balance/me
export function getMyLeaveBalance() { return []; }

// Future endpoint: GET /api/v1/tasks/me
export function getMyTasks() { return []; }

// Future endpoint: GET /api/v1/training/me
export function getMyTraining() { return []; }

// Future endpoint: GET /api/v1/payroll/slips/me?limit=3
export function getMyRecentPayslips() { return []; }

// Future endpoint: GET /api/v1/dashboard/employee/schedule/today
export function getMyTodaySchedule() { return []; }
