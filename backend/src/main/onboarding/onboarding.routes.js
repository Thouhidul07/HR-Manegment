const router = require("express").Router();
const { body, param } = require("express-validator");
const {
  getStats,
  listCases,
  createCase,
  updateCase,
  updateTask,
  eligibleUsers,
  cancelCase,
  reopenCase,
  completeAllTasks,
} = require("./onboarding.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin", "hr_manager"));

router.get("/stats", getStats);
router.get("/cases", listCases);
router.get("/eligible-users", eligibleUsers);
router.post(
  "/cases",
  [
    body("userId").isInt({ min: 1 }),
    body("type").isIn(["onboarding", "offboarding"]),
    body("startDate").optional({ nullable: true }).isISO8601(),
    body("targetDate").optional({ nullable: true }).isISO8601(),
  ],
  validate,
  createCase
);
router.patch(
  "/cases/:id",
  [
    param("id").isInt({ min: 1 }),
    body("status").optional().isIn(["not_started", "in_progress", "completed", "cancelled"]),
    body("startDate").optional({ nullable: true }).isISO8601(),
    body("targetDate").optional({ nullable: true }).isISO8601(),
  ],
  validate,
  updateCase
);
router.patch(
  "/cases/:id/cancel",
  [param("id").isInt({ min: 1 })],
  validate,
  cancelCase
);
router.patch(
  "/cases/:id/reopen",
  [param("id").isInt({ min: 1 })],
  validate,
  reopenCase
);
router.patch(
  "/cases/:id/complete-all",
  [param("id").isInt({ min: 1 })],
  validate,
  completeAllTasks
);
router.patch(
  "/tasks/:id",
  [param("id").isInt({ min: 1 }), body("status").isIn(["pending", "in_progress", "completed"])],
  validate,
  updateTask
);

module.exports = router;
