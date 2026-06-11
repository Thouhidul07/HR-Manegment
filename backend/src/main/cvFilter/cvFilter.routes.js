const router = require("express").Router();
const { body, param } = require("express-validator");
const { protect, authorize } = require("../../middleware/authMiddleware");
const validate = require("../../utils/validation");
const upload = require("../../uploads/upload");
const {
  listPositions,
  listCandidates,
  createCandidate,
  updateCandidateStatus,
} = require("./cvFilter.controller");

router.use(protect, authorize("admin", "hr_manager"));

router.get("/positions", listPositions);
router.get("/candidates", listCandidates);
router.post(
  "/candidates",
  upload.single("cv"),
  [
    body("name").trim().notEmpty(),
    body("email").isEmail(),
    body("phone").optional().trim(),
    body("position").trim().notEmpty(),
    body("skills").optional(),
    body("experience").isFloat({ min: 0 }),
    body("education").optional().trim(),
  ],
  validate,
  createCandidate
);
router.patch(
  "/candidates/:id/status",
  [
    param("id").isInt({ min: 1 }),
    body("status").isIn(["pending", "shortlisted", "rejected"]),
  ],
  validate,
  updateCandidateStatus
);

module.exports = router;
