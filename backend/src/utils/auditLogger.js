const { query } = require("../config/database");

async function ensureAuditLogsTable() {
  const sql = `
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
  `;
  await query(sql);
}

async function logAudit({ actorId, actorName, actorRole, action, module, entityType, entityId, description, metadata, ipAddress }) {
  try {
    await ensureAuditLogsTable();
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    const sql = `
      INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, module, entity_type, entity_id, description, metadata_json, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      actorId || null,
      actorName || null,
      actorRole || null,
      action,
      module,
      entityType || null,
      entityId || null,
      description || null,
      metadataStr,
      ipAddress || null
    ]);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

async function seedAuditLogsIfEmpty() {
  try {
    await ensureAuditLogsTable();
    const [countRows] = await query("SELECT COUNT(*) as cnt FROM audit_logs");
    if (countRows[0].cnt > 0) return; // already seeded — do nothing

    const demoLogs = [
      {
        actorName: "Employee 01",
        actorRole: "employee",
        action: "leave_request_submitted",
        module: "Leave Management",
        entityType: "leave_request",
        description: "Employee 01 submitted a leave request",
      },
      {
        actorName: "Employee 07",
        actorRole: "employee",
        action: "onboarding_step_completed",
        module: "Onboarding & Offboarding",
        entityType: "onboarding_task",
        description: "Employee 07 completed orientation step",
      },
      {
        actorName: "Employee 03",
        actorRole: "employee",
        action: "expense_claim_submitted",
        module: "Expense Management",
        entityType: "expense",
        description: "Employee 03 filed an expense claim",
      },
      {
        actorName: "Employee 08",
        actorRole: "employee",
        action: "training_enrolled",
        module: "Training & Development",
        entityType: "training_enrollment",
        description: "Employee 08 enrolled in training course",
      },
      {
        actorName: "Employee 05",
        actorRole: "employee",
        action: "profile_updated",
        module: "Profile & Documents",
        entityType: "user_profile",
        description: "Employee 05 updated profile information",
      },
      {
        actorName: "HR Manager 01",
        actorRole: "hr_manager",
        action: "payroll_processed",
        module: "Payroll Management",
        entityType: "payroll_run",
        description: "HR Manager 01 processed monthly payroll for all employees",
      },
      {
        actorName: "HR Manager 01",
        actorRole: "hr_manager",
        action: "job_circular_published",
        module: "Recruitment",
        entityType: "job_circular",
        description: "HR Manager 01 published a new job circular for Backend Engineer",
      },
      {
        actorName: "System Admin",
        actorRole: "admin",
        action: "forum_post_removed",
        module: "Forum Moderation",
        entityType: "forum_post",
        description: "System Admin removed a flagged forum post for policy violation",
      },
      {
        actorName: "Employee 02",
        actorRole: "employee",
        action: "attendance_checked_in",
        module: "Attendance & Time",
        entityType: "attendance_record",
        description: "Employee 02 checked in at the office",
      },
      {
        actorName: "HR Manager 02",
        actorRole: "hr_manager",
        action: "leave_approved",
        module: "Leave Management",
        entityType: "leave_request",
        description: "HR Manager 02 approved leave request for Employee 04",
      },
      {
        actorName: "Employee 06",
        actorRole: "employee",
        action: "wbs_task_created",
        module: "Work Management",
        entityType: "wbs_task",
        description: "Employee 06 created a new WBS task for Q3 Planning",
      },
      {
        actorName: "System Admin",
        actorRole: "admin",
        action: "account_approved",
        module: "Account Approvals",
        entityType: "user_account",
        description: "System Admin approved new employee account for onboarding",
      },
    ];

    const sql = `
      INSERT INTO audit_logs (actor_name, actor_role, action, module, entity_type, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? MINUTE))
    `;

    for (let i = 0; i < demoLogs.length; i++) {
      const log = demoLogs[i];
      // Spread entries over the past 24 hours, newest first
      const minutesAgo = (i + 1) * 90;
      await query(sql, [
        log.actorName,
        log.actorRole,
        log.action,
        log.module,
        log.entityType,
        log.description,
        minutesAgo,
      ]);
    }

    console.log("[auditLogger] Seeded", demoLogs.length, "demo audit log entries");
  } catch (error) {
    console.error("[auditLogger] Failed to seed audit logs:", error);
  }
}

module.exports = {
  ensureAuditLogsTable,
  logAudit,
  seedAuditLogsIfEmpty,
};
