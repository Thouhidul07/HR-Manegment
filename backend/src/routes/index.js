const router = require("express").Router();

router.use("/auth", require("../main/auth/auth.routes"));
router.use("/employees", require("../main/employees/employees.routes"));
router.use("/attendance", require("../main/attendance/attendance.routes"));
router.use("/leave", require("../main/leave/leave.routes"));
router.use("/payroll", require("../main/payroll/payroll.routes"));

router.use("/admin", require("../roles/admin/admin.routes"));
router.use("/hr-manager", require("../roles/hrManager/hrManager.routes"));
router.use("/employee", require("../roles/employee/employee.routes"));

module.exports = router;
