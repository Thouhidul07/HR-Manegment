const router = require("express").Router();
const { protect } = require("../../middleware/authMiddleware");
const controller = require("./profile.controller");
const multer = require("multer");
const path = require("path");

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
    if (ext !== ".pdf" && ext !== ".doc" && ext !== ".docx" && ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      return cb(new Error("Only PDF, DOC, DOCX, JPG, and PNG files are allowed"));
    }
    cb(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single("document")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Document file size exceeds 5MB limit" });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.use(protect);
router.get("/me", controller.getMyProfile);
router.patch("/me", controller.updateMyProfile);
router.patch("/preferences", controller.updatePreferences);
router.patch("/password", controller.updatePassword);

router.get("/documents", controller.getMyDocuments);
router.post("/documents", handleUpload, controller.uploadDocument);
router.delete("/documents/:id", controller.deleteDocument);

module.exports = router;
