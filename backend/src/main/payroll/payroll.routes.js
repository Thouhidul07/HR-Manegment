const router = require("express").Router();
const { body, param } = require("express-validator");
const { listPayroll, downloadPayslip, exportPayroll, processPayroll } = require("./payroll.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.get("/", listPayroll);
router.get("/export", authorize("admin", "hr_manager"), exportPayroll);
router.post(
  "/process",
  authorize("admin", "hr_manager"),
  [body("payPeriod").optional().isISO8601()],
  validate,
  processPayroll
);
router.get("/:id/payslip", [param("id").isInt({ min: 1 })], validate, downloadPayslip);

module.exports = router;
