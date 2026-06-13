const router = require("express").Router();
const { dashboard, attendance } = require("./hrManager.controller");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect, authorize("admin", "hr_manager"));
router.get("/dashboard", dashboard);
router.get("/attendance", attendance);

module.exports = router;
