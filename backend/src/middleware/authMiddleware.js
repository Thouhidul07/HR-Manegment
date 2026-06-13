const jwt = require("jsonwebtoken");
const { query } = require("../config/database");
const { ensureCompanyColumns } = require("../utils/companyScope");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_secret");
    await ensureCompanyColumns();
    const [users] = await query(
      `SELECT u.id, u.company_id, u.employee_code, u.name, u.email, u.role, u.avatar, u.status,
              c.name AS company_name, c.domain AS company_domain
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = ? LIMIT 1`,
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (users[0].status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action" });
    }

    next();
  };
}

module.exports = { protect, authorize };
