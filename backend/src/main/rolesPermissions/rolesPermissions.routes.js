const router = require("express").Router();
const { param } = require("express-validator");
const { getSummary, getRoleUsers, getPermissions } = require("./rolesPermissions.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin", "hr_manager"));

router.get("/summary", getSummary);
router.get("/permissions", getPermissions);
router.get(
  "/roles/:roleCode/users",
  [param("roleCode").isIn(["admin", "hr_manager", "employee"])],
  validate,
  getRoleUsers
);

module.exports = router;
