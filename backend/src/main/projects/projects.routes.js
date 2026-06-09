const router = require("express").Router();
const { body, param } = require("express-validator");
const {
  listProjects,
  createProject,
  listTasks,
  getProjectStats,
  getProjectHistory,
  createTask,
  updateTask,
  deleteTask,
  listWBS,
  getWBSById,
  createWBS,
  updateWBS,
  deleteWBS
} = require("./projects.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect, authorize("admin", "hr_manager"));

router.get("/", listProjects);
router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("description").optional().trim(),
    body("ownerId").optional().isInt({ min: 1 }),
    body("status").optional().isIn(["planning", "active", "on-hold", "completed"]),
    body("startDate").optional({ nullable: true }).isISO8601(),
    body("endDate").optional({ nullable: true }).isISO8601(),
  ],
  validate,
  createProject
);

router.get("/tasks", listTasks);
router.get("/stats", getProjectStats);
router.get("/history", getProjectHistory);

router.post(
  "/tasks",
  [
    body("title").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("status").isIn(["todo", "in-progress", "in-review", "completed"]),
    body("priority").isIn(["low", "medium", "high", "urgent"]),
    body("assignee").trim().notEmpty(),
    body("deadline").isISO8601(),
    body("project").trim().notEmpty(),
    body("tags").optional().isArray(),
  ],
  validate,
  createTask
);

router.patch(
  "/tasks/:id",
  [
    param("id").isInt({ min: 1 }),
    body("title").optional().trim().notEmpty(),
    body("description").optional().trim().notEmpty(),
    body("status").optional().isIn(["todo", "in-progress", "in-review", "completed"]),
    body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
    body("deadline").optional().isISO8601(),
    body("tags").optional().isArray(),
  ],
  validate,
  updateTask
);

router.delete("/tasks/:id", [param("id").isInt({ min: 1 })], validate, deleteTask);

router.get("/wbs", listWBS);
router.get("/wbs/:id", getWBSById);
router.post(
  "/wbs",
  [
    body("projectId").isInt({ min: 1 }),
    body("title").trim().notEmpty(),
    body("description").optional().trim(),
    body("nodes").notEmpty()
  ],
  validate,
  createWBS
);
router.put(
  "/wbs/:id",
  [
    param("id").isInt({ min: 1 }),
    body("projectId").optional().isInt({ min: 1 }),
    body("title").optional().trim().notEmpty(),
    body("description").optional().trim(),
    body("nodes").optional().notEmpty()
  ],
  validate,
  updateWBS
);
router.delete("/wbs/:id", [param("id").isInt({ min: 1 })], validate, deleteWBS);

module.exports = router;
