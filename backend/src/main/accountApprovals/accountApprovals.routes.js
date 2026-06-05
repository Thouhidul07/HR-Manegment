const router = require("express").Router();
const { param } = require("express-validator");
const {
  listPendingAccounts,
  approveAccount,
  rejectAccount,
} = require("./accountApprovals.controller");
const validate = require("../../utils/validation");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect, authorize("admin"));

router.get("/", listPendingAccounts);
router.patch("/:id/approve", [param("id").isInt({ min: 1 })], validate, approveAccount);
router.patch("/:id/reject", [param("id").isInt({ min: 1 })], validate, rejectAccount);

module.exports = router;
