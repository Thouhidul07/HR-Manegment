const router = require("express").Router();
const { protect } = require("../../middleware/authMiddleware");
const controller = require("./profile.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const documentUploadDirectory = path.join(__dirname, "../../../uploads/profile-documents");
fs.mkdirSync(documentUploadDirectory, { recursive: true });

const allowedDocumentTypes = new Map([
  [".pdf", ["application/pdf"]],
  [".doc", ["application/msword"]],
  [".docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]],
  [".jpg", ["image/jpeg"]],
  [".jpeg", ["image/jpeg"]],
  [".png", ["image/png"]],
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, documentUploadDirectory);
  },
  filename(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + extension);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = allowedDocumentTypes.get(ext);
    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
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
