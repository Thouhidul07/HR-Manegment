const router = require("express").Router();
const { body, param } = require("express-validator");
const {
  listExpenses,
  createExpense,
  updateExpense,
  updateExpenseStatus,
  deleteExpense,
} = require("./expenses.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");
const upload = require("../../uploads/upload");

router.use(protect);

router.get("/", listExpenses);

router.post(
  "/",
  authorize("employee"),
  upload.single("receipt"),
  [
    body("category").trim().notEmpty(),
    body("amount").isFloat({ min: 1 }),
    body("expenseDate").isISO8601(),
    body("description").optional().trim(),
  ],
  validate,
  createExpense
);

router.patch(
  "/:id",
  authorize("employee", "admin", "hr_manager"),
  upload.single("receipt"),
  [
    param("id").isInt({ min: 1 }),
    body("category").optional().trim().notEmpty(),
    body("amount").optional().isFloat({ min: 1 }),
    body("expenseDate").optional().isISO8601(),
    body("description").optional().trim(),
  ],
  validate,
  updateExpense
);

router.patch(
  "/:id/status",
  authorize("admin", "hr_manager"),
  [
    param("id").isInt({ min: 1 }),
    body("status").isIn(["approved", "rejected", "paid"]),
    body("paymentDate").optional().isISO8601(),
    body("paymentMethod").optional().trim().notEmpty(),
    body("paymentReference").optional().trim(),
  ],
  validate,
  updateExpenseStatus
);

router.delete(
  "/:id",
  authorize("employee", "admin", "hr_manager"),
  [param("id").isInt({ min: 1 })],
  validate,
  deleteExpense
);

module.exports = router;
