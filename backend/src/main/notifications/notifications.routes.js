const router = require("express").Router();
const { protect } = require("../../middleware/authMiddleware");
const controller = require("./notifications.controller");

router.use(protect);
router.get("/", controller.listNotifications);
router.post("/", controller.createNotification);
router.patch("/:id/read", controller.markNotificationRead);
router.patch("/read-all", controller.markAllRead);

module.exports = router;
