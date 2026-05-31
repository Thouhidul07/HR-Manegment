import { createBrowserRouter, Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { EmployeeManagement } from "./pages/EmployeeManagement";
import { EmployeeProfile } from "./pages/EmployeeProfile";
import { Onboarding } from "./pages/Onboarding";
import { Attendance } from "./pages/Attendance";
import { LeaveManagement } from "./pages/LeaveManagement";
import { Training } from "./pages/Training";
import { Tasks } from "./pages/Tasks";
import { Payroll } from "./pages/Payroll";
import { Payslips } from "./pages/Payslips";
import { Expense } from "./pages/Expense";
import { Performance } from "./pages/Performance";
import { RolesPermissions } from "./pages/RolesPermissions";
import { Forum } from "./pages/Forum";
import { ForumThread } from "./pages/ForumThread";
import { ForumModeration } from "./pages/ForumModeration";
import { DesignSystem } from "./pages/DesignSystem";
import { Profile } from "./pages/Profile";

type UserRole = "admin" | "hr_manager" | "employee";

function RoleRoute({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: ReactElement;
}) {
  const { user } = useAuth();

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

const adminHr: UserRole[] = ["admin", "hr_manager"];
const allRoles: UserRole[] = ["admin", "hr_manager", "employee"];

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/dashboard",
    Component: ProtectedRoute,
    children: [
      {
        path: "/dashboard",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "employees", element: <RoleRoute allowed={adminHr}><EmployeeManagement /></RoleRoute> },
          { path: "employees/:id", element: <RoleRoute allowed={adminHr}><EmployeeProfile /></RoleRoute> },
          { path: "onboarding", element: <RoleRoute allowed={adminHr}><Onboarding /></RoleRoute> },
          { path: "attendance", element: <RoleRoute allowed={allRoles}><Attendance /></RoleRoute> },
          { path: "leave", element: <RoleRoute allowed={allRoles}><LeaveManagement /></RoleRoute> },
          { path: "tasks", element: <RoleRoute allowed={allRoles}><Tasks /></RoleRoute> },
          { path: "training", element: <RoleRoute allowed={allRoles}><Training /></RoleRoute> },
          { path: "payroll", element: <RoleRoute allowed={adminHr}><Payroll /></RoleRoute> },
          { path: "payslips", element: <RoleRoute allowed={allRoles}><Payslips /></RoleRoute> },
          { path: "expense", element: <RoleRoute allowed={allRoles}><Expense /></RoleRoute> },
          { path: "performance", element: <RoleRoute allowed={allRoles}><Performance /></RoleRoute> },
          { path: "roles", element: <RoleRoute allowed={["admin"]}><RolesPermissions /></RoleRoute> },
          { path: "forum", element: <RoleRoute allowed={allRoles}><Forum /></RoleRoute> },
          { path: "forum/thread/:threadId", element: <RoleRoute allowed={allRoles}><ForumThread /></RoleRoute> },
          { path: "forum/moderation", element: <RoleRoute allowed={adminHr}><ForumModeration /></RoleRoute> },
          { path: "design-system", element: <RoleRoute allowed={["admin"]}><DesignSystem /></RoleRoute> },
          { path: "profile", element: <RoleRoute allowed={allRoles}><Profile /></RoleRoute> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
