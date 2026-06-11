const router = require("express").Router();
const { body, param } = require("express-validator");
const { listLeaveRequests, createLeaveRequest, updateLeaveStatus } = require("./leave.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.get("/", listLeaveRequests);
router.post(
  "/",
  authorize("employee"),
  [
    body("leaveType").trim().notEmpty(),
    body("startDate").isISO8601(),
    body("endDate").isISO8601(),
    body("reason").optional().trim(),
  ],
  validate,
  createLeaveRequest
);
router.patch(
  "/:id/status",
  authorize("admin", "hr_manager"),
  [
    param("id").isInt({ min: 1 }),
    body("status").isIn(["approved", "rejected"]),
  ],
  validate,
  updateLeaveStatus
);

module.exports = router;
