const router = require("express").Router();
const { protect } = require("../../middleware/authMiddleware");
const controller = require("./profile.controller");

router.use(protect);
router.get("/me", controller.getMyProfile);
router.patch("/me", controller.updateMyProfile);
router.patch("/preferences", controller.updatePreferences);
router.patch("/password", controller.updatePassword);

module.exports = router;
