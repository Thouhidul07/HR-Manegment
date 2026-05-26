const router = require("express").Router();
const { listAttendance, clockIn } = require("./attendance.controller");
const { protect } = require("../../middleware/authMiddleware");

router.use(protect);
router.get("/", listAttendance);
router.post("/clock-in", clockIn);

module.exports = router;
