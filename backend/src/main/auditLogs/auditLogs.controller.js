const { query } = require("../../config/database");
const { ensureAuditLogsTable } = require("../../utils/auditLogger");

async function getAuditLogs(req, res) {
  try {
    await ensureAuditLogsTable();
    
    let sql = "SELECT * FROM audit_logs";
    const params = [];
    const conditions = [];

    const { module: mod, action, actor, search, dateRange, limit } = req.query;

    if (mod) {
      conditions.push("module = ?");
      params.push(mod);
    }
    if (action) {
      conditions.push("action = ?");
      params.push(action);
    }
    if (actor) {
      conditions.push("(actor_name LIKE ? OR actor_role = ? OR CAST(actor_id AS CHAR) = ?)");
      params.push(`%${actor}%`);
      params.push(actor);
      params.push(actor);
    }
    if (search && !actor) {
      conditions.push("(actor_name LIKE ? OR description LIKE ? OR action LIKE ?)");
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }
    if (dateRange) {
      const parts = dateRange.split(",");
      if (parts.length === 2 && parts[0] && parts[1]) {
        conditions.push("created_at >= ? AND created_at <= ?");
        params.push(parts[0]);
        params.push(parts[1] + " 23:59:59");
      } else if (parts[0]) {
        conditions.push("created_at >= ?");
        params.push(parts[0]);
      }
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY id DESC";

    const limitVal = parseInt(limit, 10);
    if (!isNaN(limitVal) && limitVal > 0) {
      sql += " LIMIT ?";
      params.push(limitVal);
    } else {
      sql += " LIMIT 100";
    }

    const [rows] = await query(sql, params);
    return res.json({ success: true, logs: rows });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({ message: "Internal server error fetching audit logs" });
  }
}

module.exports = {
  getAuditLogs,
};
