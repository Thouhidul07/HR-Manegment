const router = require("express").Router();
const { body } = require("express-validator");
const { listAttendance, clockIn, logAttendance } = require("./attendance.controller");
const { protect, authorize } = require("../../middleware/authMiddleware");
const validate = require("../../utils/validation");

router.use(protect);
router.get("/", listAttendance);
router.post("/clock-in", authorize("employee"), clockIn);
router.post(
  "/log",
  authorize("employee"),
  [
    body("workDate").isISO8601(),
    body("clockIn").matches(/^([01]\d|2[0-3]):[0-5]\d$/),
    body("clockOut").matches(/^([01]\d|2[0-3]):[0-5]\d$/),
    body("status").optional().isIn(["present", "late", "absent", "leave"]),
  ],
  validate,
  logAttendance
);

module.exports = router;
