import { createBrowserRouter, Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Features } from "./pages/Features";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { EmployeeManagement } from "./pages/EmployeeManagement";
import { EmployeeProfile } from "./pages/EmployeeProfile";
import { AccountApprovals } from "./pages/AccountApprovals";
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
import { PeerReview } from "./pages/PeerReview";
import { EmployeePeerReview } from "./pages/EmployeePeerReview";
import { CVFilter } from "./pages/CVFilter";
import { CircularApply } from "./pages/CircularApply";
import { ProjectManagement } from "./pages/ProjectManagement";
import { NewTask } from "./pages/NewTask";
import { ProjectReports } from "./pages/ProjectReports";
import { ProjectHistory } from "./pages/ProjectHistory";
import { DesignWBS } from "./pages/DesignWBS";

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

function DevOnlyRoute({ children }: { children: ReactElement }) {
  const isLocalDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isLocalDev) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

const adminHr: UserRole[] = ["admin", "hr_manager"];
const allRoles: UserRole[] = ["admin", "hr_manager", "employee"];
const employeesOnly: UserRole[] = ["employee"];
const forumRoles: UserRole[] = ["hr_manager", "employee"];

function ForumRoute({ children }: { children: ReactElement }) {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <Navigate to="/dashboard/forum/moderation" replace />;
  }

  return <RoleRoute allowed={forumRoles}>{children}</RoleRoute>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/features",
    Component: Features,
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
          { path: "account-approvals", element: <RoleRoute allowed={["admin"]}><AccountApprovals /></RoleRoute> },
          { path: "employees", element: <RoleRoute allowed={adminHr}><EmployeeManagement /></RoleRoute> },
          { path: "employees/:id", element: <RoleRoute allowed={adminHr}><EmployeeProfile /></RoleRoute> },
          { path: "onboarding", element: <RoleRoute allowed={adminHr}><Onboarding /></RoleRoute> },
          { path: "attendance", element: <RoleRoute allowed={allRoles}><Attendance /></RoleRoute> },
          { path: "leave", element: <RoleRoute allowed={allRoles}><LeaveManagement /></RoleRoute> },
          { path: "tasks", element: <RoleRoute allowed={employeesOnly}><Tasks /></RoleRoute> },
          { path: "training", element: <RoleRoute allowed={allRoles}><Training /></RoleRoute> },
          { path: "payroll", element: <RoleRoute allowed={adminHr}><Payroll /></RoleRoute> },
          { path: "payslips", element: <RoleRoute allowed={employeesOnly}><Payslips /></RoleRoute> },
          { path: "expense", element: <RoleRoute allowed={allRoles}><Expense /></RoleRoute> },
          { path: "performance", element: <RoleRoute allowed={allRoles}><Performance /></RoleRoute> },
          { path: "roles", element: <RoleRoute allowed={["admin"]}><RolesPermissions /></RoleRoute> },
          { path: "forum", element: <ForumRoute><Forum /></ForumRoute> },
          { path: "forum/thread/:threadId", element: <ForumRoute><ForumThread /></ForumRoute> },
          { path: "forum/moderation", element: <RoleRoute allowed={adminHr}><ForumModeration /></RoleRoute> },
          { path: "peer-review", element: <RoleRoute allowed={adminHr}><PeerReview /></RoleRoute> },
          { path: "my-peer-review", element: <RoleRoute allowed={["employee"]}><EmployeePeerReview /></RoleRoute> },
          { path: "cv-filter", element: <RoleRoute allowed={adminHr}><CVFilter /></RoleRoute> },
          { path: "circular-apply", element: <RoleRoute allowed={["employee"]}><CircularApply /></RoleRoute> },
          { path: "project-management", element: <RoleRoute allowed={adminHr}><ProjectManagement /></RoleRoute> },
          { path: "new-task", element: <RoleRoute allowed={adminHr}><NewTask /></RoleRoute> },
          { path: "project-reports", element: <RoleRoute allowed={adminHr}><ProjectReports /></RoleRoute> },
          { path: "project-history", element: <RoleRoute allowed={adminHr}><ProjectHistory /></RoleRoute> },
          { path: "design-wbs", element: <RoleRoute allowed={adminHr}><DesignWBS /></RoleRoute> },
          { path: "design-system", element: <DevOnlyRoute><RoleRoute allowed={["admin"]}><DesignSystem /></RoleRoute></DevOnlyRoute> },
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
