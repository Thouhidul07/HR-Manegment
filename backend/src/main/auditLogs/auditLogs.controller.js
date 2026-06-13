const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureAuditLogsTable } = require("../../utils/auditLogger");

function parseMetadata(value) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const getAuditLogs = asyncHandler(async (req, res) => {
  await ensureAuditLogsTable();

  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 100;
  const conditions = [];
  const params = [];
  const {
    module: moduleFilter,
    action,
    role,
    user,
    search,
    keyword,
    startDate,
    endDate,
    dateRange,
  } = req.query;

  if (moduleFilter) {
    conditions.push("module = ?");
    params.push(moduleFilter);
  }

  if (action) {
    conditions.push("action = ?");
    params.push(action);
  }

  if (role) {
    conditions.push("actor_role = ?");
    params.push(role);
  }

  if (user) {
    conditions.push("(actor_name LIKE ? OR CAST(actor_id AS CHAR) = ?)");
    params.push("%" + user + "%", user);
  }

  const term = search || keyword;
  if (term) {
    conditions.push("(actor_name LIKE ? OR action LIKE ? OR module LIKE ? OR description LIKE ? OR entity_type LIKE ?)");
    params.push("%" + term + "%", "%" + term + "%", "%" + term + "%", "%" + term + "%", "%" + term + "%");
  }

  let fromDate = startDate;
  let toDate = endDate;
  if (dateRange && !fromDate && !toDate) {
    const parts = String(dateRange).split(",");
    fromDate = parts[0];
    toDate = parts[1];
  }

  if (fromDate) {
    conditions.push("created_at >= ?");
    params.push(fromDate);
  }

  if (toDate) {
    conditions.push("created_at <= ?");
    params.push(String(toDate).length <= 10 ? String(toDate) + " 23:59:59" : toDate);
  }

  const whereSql = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const [logs] = await query(
    "SELECT id, actor_id, actor_name, actor_role, action, module, entity_type, entity_id, description, metadata_json, ip_address, created_at FROM audit_logs " +
      whereSql +
      " ORDER BY created_at DESC, id DESC LIMIT " +
      limit,
    params
  );

  res.json({
    logs: logs.map((log) => ({
      ...log,
      user_id: log.actor_id,
      user_name: log.actor_name,
      role: log.actor_role,
      metadata: parseMetadata(log.metadata_json),
    })),
  });
});

module.exports = { getAuditLogs };
