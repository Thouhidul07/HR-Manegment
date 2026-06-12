const router = require("express").Router();
const { getAuditLogs } = require("./auditLogs.controller");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect, authorize("admin"));
router.get("/", getAuditLogs);

module.exports = router;
