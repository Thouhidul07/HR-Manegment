const { query } = require("../config/database");

async function ensureAuditLogsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      actor_id INT,
      actor_name VARCHAR(120),
      actor_role VARCHAR(50),
      action VARCHAR(80) NOT NULL,
      module VARCHAR(80) NOT NULL,
      entity_type VARCHAR(80),
      entity_id INT,
      description TEXT,
      metadata_json JSON,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function logAudit({
  actorId,
  actorName,
  actorRole,
  action,
  module,
  entityType,
  entityId,
  description,
  metadata,
  ipAddress,
}) {
  try {
    await ensureAuditLogsTable();
    await query(
      `INSERT INTO audit_logs
        (actor_id, actor_name, actor_role, action, module, entity_type, entity_id, description, metadata_json, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actorId || null,
        actorName || null,
        actorRole || null,
        action,
        module,
        entityType || null,
        entityId || null,
        description || null,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress || null,
      ]
    );
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

module.exports = { ensureAuditLogsTable, logAudit };
