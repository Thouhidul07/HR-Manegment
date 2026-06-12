const router = require("express").Router();
const { body, param } = require("express-validator");
const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  listTasks,
  getProjectStats,
  getProjectReports,
  getProjectHistory,
  getProjectHistoryById,
  createTask,
  updateTask,
  deleteTask,
  getAdminOverview,
  listWBS,
  listProjectWBS,
  createWBS,
  updateWBS,
  deleteWBS,
} = require("./projects.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.get("/overview", authorize("admin"), getAdminOverview);
router.get("/history", authorize("project_manager", "employee"), getProjectHistory);
router.get("/:id/history", authorize("project_manager", "employee"), [param("id").isInt({ min: 1 })], validate, getProjectHistoryById);

router.get("/wbs", authorize("project_manager", "employee"), listWBS);
router.get("/:id/wbs", authorize("project_manager", "employee"), [param("id").isInt({ min: 1 })], validate, listProjectWBS);
router.post(
  "/:id/wbs",
  authorize("project_manager"),
  [
    param("id").isInt({ min: 1 }),
    body("parentId").optional({ nullable: true }).isInt({ min: 1 }),
    body("title").trim().notEmpty(),
    body("description").optional({ nullable: true }).trim(),
    body("assignedTo").optional({ nullable: true }).isInt({ min: 1 }),
    body("status").optional().isIn(["todo", "not-started", "in-progress", "in-review", "completed"]),
    body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
    body("startDate").optional({ nullable: true }).isISO8601(),
    body("dueDate").optional({ nullable: true }).isISO8601(),
    body("progress").optional().isInt({ min: 0, max: 100 }),
  ],
  validate,
  createWBS
);
router.put(
  "/wbs/:id",
  authorize("project_manager"),
  [
    param("id").isInt({ min: 1 }),
    body("projectId").optional().isInt({ min: 1 }),
    body("parentId").optional({ nullable: true }).isInt({ min: 1 }),
    body("title").optional().trim().notEmpty(),
    body("description").optional({ nullable: true }).trim(),
    body("assignedTo").optional({ nullable: true }).isInt({ min: 1 }),
    body("status").optional().isIn(["todo", "not-started", "in-progress", "in-review", "completed"]),
    body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
    body("startDate").optional({ nullable: true }).isISO8601(),
    body("dueDate").optional({ nullable: true }).isISO8601(),
    body("progress").optional().isInt({ min: 0, max: 100 }),
  ],
  validate,
  updateWBS
);
router.delete("/wbs/:id", authorize("project_manager"), [param("id").isInt({ min: 1 })], validate, deleteWBS);

router.use(authorize("project_manager"));

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
router.patch(
  "/:id",
  [
    param("id").isInt({ min: 1 }),
    body("name").optional().trim().notEmpty(),
    body("description").optional({ nullable: true }).trim(),
    body("ownerId").optional({ nullable: true }).isInt({ min: 1 }),
    body("status").optional().isIn(["planning", "active", "on-hold", "completed"]),
    body("startDate").optional({ nullable: true }).isISO8601(),
    body("endDate").optional({ nullable: true }).isISO8601(),
  ],
  validate,
  updateProject
);
router.delete("/:id", [param("id").isInt({ min: 1 })], validate, deleteProject);

router.get("/tasks", listTasks);
router.get("/stats", getProjectStats);
router.get("/reports", getProjectReports);
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

module.exports = router;
