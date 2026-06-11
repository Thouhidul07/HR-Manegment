const router = require("express").Router();
const { dashboard, attendance } = require("./employee.controller");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect, authorize("employee"));
router.get("/dashboard", dashboard);
router.get("/attendance", attendance);

module.exports = router;
