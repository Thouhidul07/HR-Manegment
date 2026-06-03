const router = require("express").Router();
const { body } = require("express-validator");
const { protect, authorize } = require("../../middleware/authMiddleware");
const validate = require("../../utils/validation");
const {
  listAnalytics,
  listMine,
  listTeammates,
  createReview,
} = require("./peerReviews.controller");

router.use(protect);

router.get("/analytics", authorize("admin", "hr_manager"), listAnalytics);
router.get("/mine", listMine);
router.get("/teammates", listTeammates);
router.post(
  "/",
  [
    body("revieweeId").isInt({ min: 1 }),
    body("project").trim().notEmpty(),
    body("duration").trim().notEmpty(),
    body("review").trim().isLength({ min: 10 }),
    body("communication").isInt({ min: 1, max: 5 }),
    body("technical").isInt({ min: 1, max: 5 }),
    body("teamwork").isInt({ min: 1, max: 5 }),
    body("leadership").isInt({ min: 1, max: 5 }),
    body("strengths").optional(),
    body("improvements").optional(),
  ],
  validate,
  createReview
);

module.exports = router;
