import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  GraduationCap,
  DollarSign,
  Receipt,
  Target,
  Shield,
  MessageSquare,
  UserCircle,
  FileText,
  BarChart3,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Kanban,
  FolderGit2,
  Network,
  ListChecks,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { HRSpaceLogo } from "../brand/HRSpaceLogo";

interface SidebarProps {
  collapsed: boolean;
  onToggle?: () => void;
}

const navConfig = {
  admin: [
    { path: '/dashboard',                    label: 'Dashboard',                icon: LayoutDashboard },
    { path: '/dashboard/account-approvals',  label: 'Account Approvals',        icon: UserCheck },
    { path: '/dashboard/employees',          label: 'Employee Management',      icon: Users },
    { path: '/dashboard/onboarding',         label: 'Onboarding & Offboarding', icon: Calendar },
    { path: '/dashboard/attendance',         label: 'Attendance & Time',        icon: Clock },
    { path: '/dashboard/leave',              label: 'Leave Management',         icon: FileText },
    { path: '/dashboard/tasks',              label: 'Task Management',          icon: ListChecks },
    { path: '/dashboard/project-management', label: 'Work Management',         icon: Kanban },
    { path: '/dashboard/project-history',    label: 'Work History',             icon: FolderGit2 },
    { path: '/dashboard/project-reports',    label: 'Work Reports',             icon: BarChart3 },
    { path: '/dashboard/design-wbs',         label: 'Design WBS',               icon: Network },
    { path: '/dashboard/payroll',            label: 'Payroll Management',       icon: DollarSign },
    { path: '/dashboard/expense',            label: 'Expense Management',       icon: BarChart3 },
    { path: '/dashboard/training',           label: 'Training & Development',   icon: GraduationCap },
    { path: '/dashboard/performance',        label: 'Performance Management',   icon: Target },
    { path: '/dashboard/roles',              label: 'Roles & Permissions',      icon: Shield },
    { path: '/dashboard/forum',              label: 'Forum',                    icon: MessageSquare },
    { path: '/dashboard/forum/moderation',   label: 'Forum Moderation',         icon: Shield },
    { path: '/dashboard/peer-review',        label: 'Peer Review Analytics',    icon: Target },
    { path: '/dashboard/cv-filter',          label: 'CV Filtration',            icon: TrendingUp },
    { path: '/dashboard/circular-apply',     label: 'Job Circulars',            icon: Briefcase },
  ],
  hr_manager: [
    { path: '/dashboard',                    label: 'Dashboard',                icon: LayoutDashboard },
    { path: '/dashboard/employees',          label: 'Employee Management',      icon: Users },
    { path: '/dashboard/onboarding',         label: 'Onboarding & Offboarding', icon: Calendar },
    { path: '/dashboard/attendance',         label: 'Attendance & Time',        icon: Clock },
    { path: '/dashboard/leave',              label: 'Leave Management',         icon: FileText },
    { path: '/dashboard/tasks',              label: 'Task Management',          icon: ListChecks },
    { path: '/dashboard/project-management', label: 'Work Management',         icon: Kanban },
    { path: '/dashboard/project-history',    label: 'Work History',             icon: FolderGit2 },
    { path: '/dashboard/project-reports',    label: 'Work Reports',             icon: BarChart3 },
    { path: '/dashboard/design-wbs',         label: 'Design WBS',               icon: Network },
    { path: '/dashboard/payroll',            label: 'Payroll Management',       icon: DollarSign },
    { path: '/dashboard/expense',            label: 'Expense Management',       icon: BarChart3 },
    { path: '/dashboard/training',           label: 'Training & Development',   icon: GraduationCap },
    { path: '/dashboard/performance',        label: 'Performance Management',   icon: Target },
    { path: '/dashboard/forum',              label: 'Anonymous Forum',          icon: MessageSquare },
    { path: '/dashboard/forum/moderation',   label: 'Forum Moderation',         icon: Shield },
    { path: '/dashboard/peer-review',        label: 'Peer Review Analytics',    icon: Target },
    { path: '/dashboard/cv-filter',          label: 'CV Filtration',            icon: TrendingUp },
    { path: '/dashboard/circular-apply',     label: 'Job Circulars',            icon: Briefcase },
  ],
  employee: [
    { path: '/dashboard',                label: 'Dashboard',           icon: LayoutDashboard },
    { path: '/dashboard/attendance',     label: 'My Attendance',       icon: Clock },
    { path: '/dashboard/leave',          label: 'My Leave',            icon: Calendar },
    { path: '/dashboard/tasks',          label: 'My Tasks',            icon: ListChecks },
    { path: '/dashboard/training',       label: 'My Training',         icon: GraduationCap },
    { path: '/dashboard/expense',        label: 'My Expenses',         icon: Receipt },
    { path: '/dashboard/payslips',       label: 'My Payslips',         icon: DollarSign },
    { path: '/dashboard/performance',    label: 'My Performance',      icon: Target },
    { path: '/dashboard/my-peer-review', label: 'Peer Reviews',        icon: Star },
    { path: '/dashboard/circular-apply', label: 'Circular & Apply',    icon: Briefcase },
    { path: '/dashboard/forum',          label: 'Forum',               icon: MessageSquare },
  ],
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const navItems = navConfig[user?.role ?? 'employee'];
  return (
    <aside
      className={`bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] transition-all duration-300 ease-in-out flex-shrink-0 relative ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Modern Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-gradient-to-br from-[#543884] via-[#9A77CF] to-[#EC4176] border-2 border-background shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group animate-pulse-slow"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-white group-hover:scale-125 transition-transform duration-200" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-white group-hover:scale-125 transition-transform duration-200" />
          )}
        </button>
      )}

      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-[var(--sidebar-border)] transition-all duration-300 ${collapsed ? 'justify-center px-3' : 'px-6'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <HRSpaceLogo className="w-10 h-10 rounded-xl shadow-sm flex-shrink-0" />
              <h1 className="text-xl text-[var(--sidebar-foreground)] font-bold">
                <span className="text-[var(--sidebar-primary)]">HR</span>Space
              </h1>
            </div>
          )}
          {collapsed && (
            <HRSpaceLogo
              className="w-10 h-10 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-default"
              title="HRSpace"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard"}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white shadow-md"
                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:translate-x-1"
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                >
                  {!collapsed && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#543884]/0 via-[#9A77CF]/0 to-[#EC4176]/0 group-hover:from-[#543884]/5 group-hover:via-[#9A77CF]/5 group-hover:to-[#EC4176]/5 transition-all duration-300 rounded-lg" />
                  )}
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 relative z-10 ${!collapsed && 'group-hover:scale-110'}`} />
                  {!collapsed && <span className="text-sm font-medium relative z-10">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profile Link */}
        <div className="px-3 pb-6 border-t border-[var(--sidebar-border)] pt-3">
          <NavLink
            to="/dashboard/profile"
            title={collapsed ? "Profile & Settings" : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white shadow-md"
                  : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:translate-x-1"
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <UserCircle className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${!collapsed && 'group-hover:scale-110'}`} />
            {!collapsed && <span className="text-sm font-medium">Profile & Settings</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
