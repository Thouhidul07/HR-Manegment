const router = require("express").Router();
const { body } = require("express-validator");
const { register, login, me } = require("./auth.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.post(
  "/register",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("role").optional().isIn(["admin", "hr_manager", "employee"]),
  ],
  validate,
  protect,
  authorize("admin", "hr_manager"),
  register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  login
);

router.get("/me", protect, me);

module.exports = router;
