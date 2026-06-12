const router = require("express").Router();
const { body } = require("express-validator");
const { register, login, logout, me } = require("./auth.controller");
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
router.post("/logout", protect, logout);

module.exports = router;
