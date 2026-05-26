const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const listPayroll = asyncHandler(async (req, res) => {
  const userFilter = req.user.role === "employee" ? "WHERE p.user_id = ?" : "";
  const params = req.user.role === "employee" ? [req.user.id] : [];
  const [payroll] = await query(
    `SELECT p.*, u.name AS employee_name FROM payroll p JOIN users u ON u.id = p.user_id ${userFilter} ORDER BY p.pay_period DESC`,
    params
  );

  res.json({ payroll });
});

module.exports = { listPayroll };
