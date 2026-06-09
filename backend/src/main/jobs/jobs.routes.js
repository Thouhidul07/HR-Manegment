const router = require("express").Router();
const { body, param } = require("express-validator");
const { protect, authorize } = require("../../middleware/authMiddleware");
const validate = require("../../utils/validation");
const multer = require("multer");
const path = require("path");

const {
  listPublicJobs,
  getPublicJob,
  submitApplication,
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  listApplications,
  updateApplicationStatus,
  updateApplicationScore
} = require("./jobs.controller");

// Configure custom multer upload with validation rules (PDF, DOC, DOCX and 5MB limit)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "../../../uploads"));
  },
  filename(req, file, cb) {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".pdf" && ext !== ".doc" && ext !== ".docx") {
      return cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
    cb(null, true);
  },
});

// Helper wrapper to handle multer file upload errors cleanly
const handleUpload = (req, res, next) => {
  upload.single("cv")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "CV file size exceeds 5MB limit" });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// ── Public Endpoints ────────────────────────────────────────────────────────
router.get("/public", listPublicJobs);
router.get("/public/:id", [param("id").isInt({ min: 1 })], validate, getPublicJob);

router.post(
  "/public/:id/apply",
  handleUpload,
  [
    param("id").isInt({ min: 1 }),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
    body("cover_letter").trim().notEmpty().withMessage("Cover letter is required"),
    body("skills").optional(),
    body("experience_years").isFloat({ min: 0 }).withMessage("Experience must be a positive number"),
  ],
  validate,
  submitApplication
);

// ── Protected Endpoints (Admin and HR Manager Only) ─────────────────────────
router.use(protect, authorize("admin", "hr_manager"));

router.get("/", listJobs);

router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("department").trim().notEmpty().withMessage("Department is required"),
    body("employmentType").optional().isIn(["Full-time", "Part-time", "Contract"]),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("salaryRange").optional().trim(),
    body("description").optional().trim(),
    body("requirements").optional(),
    body("responsibilities").optional(),
    body("benefits").optional(),
    body("deadline").optional().isDate(),
    body("status").optional().isIn(["draft", "published", "closed"]),
  ],
  validate,
  createJob
);

router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("department").trim().notEmpty().withMessage("Department is required"),
    body("employmentType").optional().isIn(["Full-time", "Part-time", "Contract"]),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("salaryRange").optional().trim(),
    body("description").optional().trim(),
    body("requirements").optional(),
    body("responsibilities").optional(),
    body("benefits").optional(),
    body("deadline").optional().isDate(),
    body("status").optional().isIn(["draft", "published", "closed"]),
  ],
  validate,
  updateJob
);

router.delete("/:id", [param("id").isInt({ min: 1 })], validate, deleteJob);

router.patch(
  "/:id/status",
  [
    param("id").isInt({ min: 1 }),
    body("status").isIn(["draft", "published", "closed"]),
  ],
  validate,
  updateJobStatus
);

router.get("/:id/applications", [param("id").isInt({ min: 1 })], validate, listApplications);

router.patch(
  "/applications/:applicationId/status",
  [
    param("applicationId").isInt({ min: 1 }),
    body("status").isIn(["submitted", "reviewing", "shortlisted", "rejected", "hired"]),
  ],
  validate,
  updateApplicationStatus
);

router.post(
  "/applications/:applicationId/score",
  [
    param("applicationId").isInt({ min: 1 }),
    body("score").isInt({ min: 0, max: 100 }),
  ],
  validate,
  updateApplicationScore
);

module.exports = router;
