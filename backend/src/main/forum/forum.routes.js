const router = require("express").Router();
const { body, param } = require("express-validator");
const {
  listPosts,
  getPost,
  createPost,
  createReply,
  toggleReaction,
  reportContent,
  listReports,
  moderateReport,
} = require("./forum.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);

router.get("/posts", listPosts);
router.get("/posts/:id", [param("id").isInt({ min: 1 })], validate, getPost);

router.post(
  "/posts",
  [
    body("title").trim().notEmpty(),
    body("content").trim().notEmpty(),
    body("category").optional().trim().notEmpty(),
    body("isAnonymous").optional().isBoolean(),
    body("avatarAlias").optional().trim().notEmpty(),
    body("avatarColor").optional().trim().notEmpty(),
    body("tags").optional().isArray(),
    body("sentiment").optional().isIn(["positive", "negative", "neutral", "concerned"]),
    body("pollData").optional(),
  ],
  validate,
  createPost
);

router.post(
  "/posts/:id/replies",
  [
    param("id").isInt({ min: 1 }),
    body("content").trim().notEmpty(),
    body("parentReplyId").optional({ nullable: true }).isInt({ min: 1 }),
    body("isAnonymous").optional().isBoolean(),
    body("avatarAlias").optional().trim().notEmpty(),
    body("avatarColor").optional().trim().notEmpty(),
  ],
  validate,
  createReply
);

router.post(
  "/reactions",
  [
    body("targetType").isIn(["post", "reply"]),
    body("targetId").isInt({ min: 1 }),
    body("reaction").isIn(["like", "heart", "helpful"]),
  ],
  validate,
  toggleReaction
);

router.post(
  "/reports",
  [
    body("targetType").isIn(["post", "reply"]),
    body("targetId").isInt({ min: 1 }),
    body("reason").trim().notEmpty(),
    body("notes").optional().trim(),
  ],
  validate,
  reportContent
);

router.get("/reports", authorize("admin", "hr_manager"), listReports);
router.patch(
  "/reports/:id",
  authorize("admin", "hr_manager"),
  [param("id").isInt({ min: 1 }), body("action").isIn(["approve", "remove", "dismiss"])],
  validate,
  moderateReport
);

module.exports = router;
