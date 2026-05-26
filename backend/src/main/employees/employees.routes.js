const router = require("express").Router();
const { listEmployees, getEmployee } = require("./employees.controller");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.get("/", authorize("admin", "hr_manager"), listEmployees);
router.get("/:id", getEmployee);

module.exports = router;
