const router = require("express").Router();
const { body } = require("express-validator");
const { listLeaveRequests, createLeaveRequest } = require("./leave.controller");
const validate = require("../../utils/validation");
const { protect } = require("../../middleware/authMiddleware");

router.use(protect);
router.get("/", listLeaveRequests);
router.post(
  "/",
  [
    body("leaveType").trim().notEmpty(),
    body("startDate").isISO8601(),
    body("endDate").isISO8601(),
    body("reason").optional().trim(),
  ],
  validate,
  createLeaveRequest
);

module.exports = router;
