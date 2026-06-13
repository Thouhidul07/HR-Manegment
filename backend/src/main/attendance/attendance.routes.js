const router = require("express").Router();
const { body } = require("express-validator");
const {
  listAttendance,
  clockIn,
  clockOut,
  logAttendance,
} = require("./attendance.controller");
const { protect, authorize } = require("../../middleware/authMiddleware");
const validate = require("../../utils/validation");

router.use(protect);
router.get("/", listAttendance);
router.post("/clock-in", authorize("employee"), clockIn);
router.post("/clock-out", authorize("employee"), clockOut);
router.post(
  "/log",
  authorize("employee"),
  [
    body("workDate").isISO8601(),
    body("status").optional().isIn(["present", "late", "absent", "leave"]),
    body("clockIn")
      .if(body("status").optional().isIn(["present", "late"]))
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/),
    body("clockOut")
      .if(body("status").optional().isIn(["present", "late"]))
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  ],
  validate,
  logAttendance
);

module.exports = router;
