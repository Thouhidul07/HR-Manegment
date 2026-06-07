const router = require("express").Router();
const { body } = require("express-validator");
const { register, login, me, updateProfile, changePassword } = require("./auth.controller");
const validate = require("../../utils/validation");
const { protect } = require("../../middleware/authMiddleware");

router.post(
  "/register",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("department").optional({ nullable: true }).trim(),
    body("phone").optional({ nullable: true }).trim(),
  ],
  validate,
  register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  login
);

router.get("/me", protect, me);

router.patch(
  "/me",
  protect,
  [
    body("name").optional().trim().notEmpty(),
    body("phone").optional({ nullable: true }).trim(),
    body("department").optional({ nullable: true }).trim(),
  ],
  validate,
  updateProfile
);

router.post(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ],
  validate,
  changePassword
);

module.exports = router;
