const router = require("express").Router();
const { body, param } = require("express-validator");
const { protect } = require("../../middleware/authMiddleware");
const validate = require("../../utils/validation");
const {
  listTasks,
  getTasksSummary,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} = require("./tasks.controller");

router.use(protect);

router.get("/", listTasks);
router.get("/summary", getTasksSummary);

router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("category").optional().isIn(['general','performance','expense','training','attendance','leave','onboarding','offboarding','custom']),
    body("priority").optional().isIn(['low','medium','high','urgent']),
    body("status").optional().isIn(['todo','in_progress','completed','cancelled']),
    body("assignedTo").optional().toInt(),
    body("dueDate").optional().custom(value => !value || !isNaN(Date.parse(value))),
  ],
  validate,
  createTask
);

router.patch(
  "/:id",
  [
    param("id").isInt({ min: 1 }).toInt(),
    body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
    body("category").optional().isIn(['general','performance','expense','training','attendance','leave','onboarding','offboarding','custom']),
    body("priority").optional().isIn(['low','medium','high','urgent']),
    body("status").optional().isIn(['todo','in_progress','completed','cancelled']),
    body("assignedTo").optional().toInt(),
    body("dueDate").optional().custom(value => !value || !isNaN(Date.parse(value))),
  ],
  validate,
  updateTask
);

router.patch(
  "/:id/status",
  [
    param("id").isInt({ min: 1 }).toInt(),
    body("status").isIn(['todo','in_progress','completed','cancelled']).withMessage("Invalid status"),
  ],
  validate,
  updateTaskStatus
);

router.delete(
  "/:id",
  [
    param("id").isInt({ min: 1 }).toInt(),
  ],
  validate,
  deleteTask
);

module.exports = router;
