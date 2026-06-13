const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename(req, file, cb) {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

module.exports = multer({ storage });
