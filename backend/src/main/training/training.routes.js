const router = require("express").Router();
const { body, param } = require("express-validator");
const {
  listTraining,
  createTraining,
  updateTraining,
  deleteTraining,
  assignTraining,
  enrollTraining,
  updateTrainingProgress,
} = require("./training.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);

router.get("/", listTraining);

router.post(
  "/",
  authorize("admin", "hr_manager"),
  [
    body("title").trim().notEmpty(),
    body("description").optional().trim(),
    body("trainer").optional().trim(),
    body("startsAt").isISO8601(),
    body("endsAt").optional({ nullable: true }).isISO8601(),
  ],
  validate,
  createTraining
);

router.patch(
  "/:id",
  authorize("admin", "hr_manager"),
  [
    param("id").isInt({ min: 1 }),
    body("title").optional().trim().notEmpty(),
    body("description").optional().trim(),
    body("trainer").optional().trim(),
    body("startsAt").optional().isISO8601(),
    body("endsAt").optional({ nullable: true }).isISO8601(),
  ],
  validate,
  updateTraining
);

router.post(
  "/:id/assign",
  authorize("admin", "hr_manager"),
  [
    param("id").isInt({ min: 1 }),
    body("userIds").isArray({ min: 1 }),
    body("userIds.*").isInt({ min: 1 }),
  ],
  validate,
  assignTraining
);

router.post("/:id/enroll", authorize("employee"), [param("id").isInt({ min: 1 })], validate, enrollTraining);

router.delete(
  "/:id",
  authorize("admin", "hr_manager"),
  [param("id").isInt({ min: 1 })],
  validate,
  deleteTraining
);

router.patch(
  "/enrollments/:id/progress",
  authorize("employee"),
  [param("id").isInt({ min: 1 }), body("progress").isInt({ min: 0, max: 100 })],
  validate,
  updateTrainingProgress
);

module.exports = router;
