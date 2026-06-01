const router = require("express").Router();
const { body, param } = require("express-validator");
const { listReviews, startReviewCycle, createReview, updateReview } = require("./performance.controller");
const { protect, authorize } = require("../../middleware/authMiddleware");
const validate = require("../../utils/validation");

router.use(protect);

router.get("/reviews", listReviews);

router.post(
  "/reviews",
  authorize("admin", "hr_manager"),
  [
    body("userId").isInt({ min: 1 }),
    body("reviewPeriod").trim().notEmpty(),
    body("score").optional({ nullable: true }).isFloat({ min: 0, max: 5 }),
    body("goals").optional(),
    body("feedback").optional().trim(),
    body("status").optional().isIn(["draft", "submitted", "approved"]),
  ],
  validate,
  createReview
);

router.patch(
  "/reviews/:id",
  [
    param("id").isInt({ min: 1 }),
    body("score").optional({ nullable: true }).isFloat({ min: 0, max: 5 }),
    body("goals").optional(),
    body("feedback").optional().trim(),
    body("status").optional().isIn(["draft", "submitted", "approved"]),
  ],
  validate,
  updateReview
);

router.post(
  "/review-cycles",
  authorize("admin", "hr_manager"),
  [body("reviewPeriod").optional().trim().notEmpty()],
  validate,
  startReviewCycle
);

module.exports = router;
