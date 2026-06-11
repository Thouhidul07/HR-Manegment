const router = require("express").Router();
const { body, param } = require("express-validator");
const {
  listPosts,
  getPost,
  createPost,
  createReply,
  updatePost,
  updateReply,
  deletePost,
  deleteReply,
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
  authorize("employee", "hr_manager"),
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
  authorize("employee", "hr_manager"),
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

router.patch(
  "/posts/:id",
  authorize("employee", "admin", "hr_manager"),
  [
    param("id").isInt({ min: 1 }),
    body("title").optional().trim().notEmpty(),
    body("content").optional().trim().notEmpty(),
    body("category").optional().trim().notEmpty(),
    body("tags").optional().isArray(),
  ],
  validate,
  updatePost
);

router.delete(
  "/posts/:id",
  authorize("employee", "admin", "hr_manager"),
  [param("id").isInt({ min: 1 })],
  validate,
  deletePost
);

router.patch(
  "/replies/:id",
  authorize("employee", "admin", "hr_manager"),
  [param("id").isInt({ min: 1 }), body("content").trim().notEmpty()],
  validate,
  updateReply
);

router.delete(
  "/replies/:id",
  authorize("employee", "admin", "hr_manager"),
  [param("id").isInt({ min: 1 })],
  validate,
  deleteReply
);

router.post(
  "/reactions",
  authorize("employee", "hr_manager"),
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
  authorize("employee", "hr_manager"),
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
