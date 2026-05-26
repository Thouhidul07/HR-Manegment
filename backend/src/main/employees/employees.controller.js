const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const listEmployees = asyncHandler(async (req, res) => {
  const [employees] = await query(
    "SELECT id, name, email, role, phone, department, designation, hire_date, avatar FROM users ORDER BY name"
  );
  res.json({ employees });
});

const getEmployee = asyncHandler(async (req, res) => {
  const [employees] = await query(
    "SELECT id, name, email, role, phone, department, designation, hire_date, avatar FROM users WHERE id = ?",
    [req.params.id]
  );

  if (!employees.length) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({ employee: employees[0] });
});

module.exports = { listEmployees, getEmployee };
