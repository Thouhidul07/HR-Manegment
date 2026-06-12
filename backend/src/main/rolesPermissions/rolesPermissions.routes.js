const router = require("express").Router();
const { body, param } = require("express-validator");
const { getSummary, getRoleUsers, getPermissions, createRole } = require("./rolesPermissions.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/summary", getSummary);
router.get("/permissions", getPermissions);
router.post(
  "/roles",
  [
    body("name").trim().notEmpty(),
    body("description").optional().trim(),
    body("modules").optional().isArray(),
  ],
  validate,
  createRole
);
router.get(
  "/roles/:roleCode/users",
  [param("roleCode").isIn(["admin", "hr_manager", "project_manager", "employee"])],
  validate,
  getRoleUsers
);

module.exports = router;
