import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { Features } from "./pages/Features";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { EmployeeManagement } from "./pages/EmployeeManagement";
import { EmployeeProfile } from "./pages/EmployeeProfile";
import { Onboarding } from "./pages/Onboarding";
import { Attendance } from "./pages/Attendance";
import { LeaveManagement } from "./pages/LeaveManagement";
import { Training } from "./pages/Training";
import { Payroll } from "./pages/Payroll";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
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
          { path: "employees", Component: EmployeeManagement },
          { path: "employees/:id", Component: EmployeeProfile },
          { path: "onboarding", Component: Onboarding },
          { path: "attendance", Component: Attendance },
          { path: "leave", Component: LeaveManagement },
          { path: "training", Component: Training },
          { path: "payroll", Component: Payroll },
          { path: "expense", Component: Expense },
          { path: "performance", Component: Performance },
          { path: "roles", Component: RolesPermissions },
          { path: "forum", Component: Forum },
          { path: "forum/thread/:threadId", Component: ForumThread },
          { path: "forum/moderation", Component: ForumModeration },
          { path: "peer-review", Component: PeerReview },
          { path: "my-peer-review", Component: EmployeePeerReview },
          { path: "cv-filter", Component: CVFilter },
          { path: "circular-apply", Component: CircularApply },
          { path: "project-management", Component: ProjectManagement },
          { path: "new-task", Component: NewTask },
          { path: "project-reports", Component: ProjectReports },
          { path: "project-history", Component: ProjectHistory },
          { path: "design-wbs", Component: DesignWBS },
          { path: "design-system", Component: DesignSystem },
          { path: "profile", Component: Profile },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
