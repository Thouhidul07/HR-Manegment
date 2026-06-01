const router = require("express").Router();
const { body, param } = require("express-validator");
const { listTasks, getProjectStats, createTask, updateTask, deleteTask } = require("./projects.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect, authorize("admin", "hr_manager"));

router.get("/tasks", listTasks);
router.get("/stats", getProjectStats);

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
