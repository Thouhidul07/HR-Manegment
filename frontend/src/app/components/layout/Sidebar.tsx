import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  Calendar,
  GraduationCap,
  DollarSign,
  Receipt,
  Target,
  Shield,
  MessageSquare,
  ListChecks,
} from "lucide-react";
import { FaRegUserCircle } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
}

const navConfig = {
  admin: [
    { path: '/dashboard',              label: 'Dashboard',           icon: LayoutDashboard },
    { path: '/dashboard/employees',    label: 'Employees',           icon: Users },
    { path: '/dashboard/onboarding',   label: 'Onboarding',          icon: UserPlus },
    { path: '/dashboard/attendance',   label: 'Attendance',          icon: Clock },
    { path: '/dashboard/leave',        label: 'Leave',               icon: Calendar },
    { path: '/dashboard/payroll',      label: 'Payroll',             icon: DollarSign },
    { path: '/dashboard/expense',      label: 'Expenses',            icon: Receipt },
    { path: '/dashboard/performance',  label: 'Performance',         icon: Target },
    { path: '/dashboard/training',     label: 'Training',            icon: GraduationCap },
    { path: '/dashboard/roles',        label: 'Roles & Permissions', icon: Shield },
    { path: '/dashboard/forum',        label: 'Forum',               icon: MessageSquare },
  ],
  hr_manager: [
    { path: '/dashboard',              label: 'Dashboard',           icon: LayoutDashboard },
    { path: '/dashboard/employees',    label: 'Employees',           icon: Users },
    { path: '/dashboard/onboarding',   label: 'Onboarding',          icon: UserPlus },
    { path: '/dashboard/attendance',   label: 'Attendance',          icon: Clock },
    { path: '/dashboard/leave',        label: 'Leave',               icon: Calendar },
    { path: '/dashboard/payroll',      label: 'Payroll',             icon: DollarSign },
    { path: '/dashboard/performance',  label: 'Performance',         icon: Target },
    { path: '/dashboard/training',     label: 'Training',            icon: GraduationCap },
    { path: '/dashboard/forum',        label: 'Forum',               icon: MessageSquare },
  ],
  employee: [
    { path: '/dashboard',              label: 'Dashboard',           icon: LayoutDashboard },
    { path: '/dashboard/attendance',   label: 'My Attendance',       icon: Clock },
    { path: '/dashboard/leave',        label: 'My Leave',            icon: Calendar },
    { path: '/dashboard/tasks',        label: 'My Tasks',            icon: ListChecks },
    { path: '/dashboard/training',     label: 'My Training',         icon: GraduationCap },
    { path: '/dashboard/expense',      label: 'My Expenses',         icon: Receipt },
    { path: '/dashboard/payslips',     label: 'My Payslips',         icon: DollarSign },
    { path: '/dashboard/performance',  label: 'My Performance',      icon: Target },
    { path: '/dashboard/forum',        label: 'Forum',               icon: MessageSquare },
  ],
};

export function Sidebar({ collapsed }: SidebarProps) {
  const { user } = useAuth();
  const navItems = navConfig[user?.role ?? 'employee'];
  return (
    <aside
      className={`app-sidebar bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] transition-all duration-300 flex-shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--sidebar-border)]">
          {!collapsed && (
            <h1 className="text-xl font-bold text-[var(--sidebar-foreground)]">
              <span className="text-[var(--action)]">HR</span> Space
            </h1>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-[var(--sidebar-primary)] flex items-center justify-center text-[var(--sidebar-primary-foreground)] text-sm">
                HR
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profile Link */}
        <div className="px-3 pb-6 border-t border-[var(--sidebar-border)] pt-3">
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]"
                  : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
              }`
            }
          >
            <FaRegUserCircle className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Profile</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
