const router = require("express").Router();
const { listPayroll } = require("./payroll.controller");
const { protect } = require("../../middleware/authMiddleware");

router.use(protect);
router.get("/", listPayroll);

module.exports = router;
