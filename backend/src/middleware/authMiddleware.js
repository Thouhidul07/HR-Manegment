const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_secret");
    const [users] = await query(
      "SELECT id, name, email, role, avatar, status FROM users WHERE id = ? LIMIT 1",
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
