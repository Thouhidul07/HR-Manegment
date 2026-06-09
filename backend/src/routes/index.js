const router = require("express").Router();

router.use("/auth", require("../main/auth/auth.routes"));
router.use("/employees", require("../main/employees/employees.routes"));
router.use("/account-approvals", require("../main/accountApprovals/accountApprovals.routes"));
router.use("/attendance", require("../main/attendance/attendance.routes"));
router.use("/leave", require("../main/leave/leave.routes"));
router.use("/payroll", require("../main/payroll/payroll.routes"));
router.use("/expenses", require("../main/expenses/expenses.routes"));
router.use("/training", require("../main/training/training.routes"));
router.use("/roles-permissions", require("../main/rolesPermissions/rolesPermissions.routes"));
router.use("/audit-logs", require("../main/auditLogs/auditLogs.routes"));
router.use("/onboarding", require("../main/onboarding/onboarding.routes"));
router.use("/profile", require("../main/profile/profile.routes"));
router.use("/notifications", require("../main/notifications/notifications.routes"));
router.use("/performance", require("../main/performance/performance.routes"));
router.use("/peer-reviews", require("../main/peerReviews/peerReviews.routes"));
router.use("/cv-filter", require("../main/cvFilter/cvFilter.routes"));
router.use("/projects", require("../main/projects/projects.routes"));
router.use("/forum", require("../main/forum/forum.routes"));
router.use("/tasks", require("../main/tasks/tasks.routes"));
router.use("/jobs", require("../main/jobs/jobs.routes"));

router.use("/admin", require("../roles/admin/admin.routes"));
router.use("/hr-manager", require("../roles/hrManager/hrManager.routes"));
router.use("/employee", require("../roles/employee/employee.routes"));

module.exports = router;
