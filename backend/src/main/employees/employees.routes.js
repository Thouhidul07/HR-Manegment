const router = require("express").Router();
const { body, param } = require("express-validator");
const { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee } = require("./employees.controller");
const { protect, authorize } = require("../../middleware/authMiddleware");
const validate = require("../../utils/validation");

router.use(protect);
router.get("/", authorize("admin", "hr_manager"), listEmployees);
router.post(
  "/",
  authorize("admin", "hr_manager"),
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("phone").optional({ nullable: true }).trim(),
    body("department").optional({ nullable: true }).trim(),
    body("designation").optional({ nullable: true }).trim(),
    body("hireDate").optional({ nullable: true }).isISO8601(),
    body("salary").optional({ nullable: true }).isFloat({ min: 0 }),
    body("status").optional({ nullable: true }).isIn(["active", "inactive"]),
  ],
  validate,
  createEmployee
);
router.get("/:id", authorize("admin", "hr_manager"), [param("id").isInt({ min: 1 })], validate, getEmployee);
router.patch(
  "/:id",
  authorize("admin", "hr_manager"),
  [
    param("id").isInt({ min: 1 }),
    body("name").optional().trim().notEmpty(),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional({ nullable: true }).trim(),
    body("department").optional({ nullable: true }).trim(),
    body("designation").optional({ nullable: true }).trim(),
    body("hireDate").optional({ nullable: true }).isISO8601(),
    body("salary").optional({ nullable: true }).isFloat({ min: 0 }),
    body("status").optional({ nullable: true }).isIn(["active", "inactive"]),
  ],
  validate,
  updateEmployee
);
router.delete("/:id", authorize("admin"), [param("id").isInt({ min: 1 })], validate, deleteEmployee);

module.exports = router;
