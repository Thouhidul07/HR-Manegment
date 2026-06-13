const { query } = require("../config/database");

async function statusColumnExists() {
  const [rows] = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'`
  );
  return rows.length > 0;
}

async function ensureUserStatusWorkflow() {
  if (!(await statusColumnExists())) {
    await query(`
      ALTER TABLE users
      ADD COLUMN status ENUM('pending', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'active'
    `);
    return;
  }

  await query(`
    ALTER TABLE users
    MODIFY status ENUM('pending', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'active'
  `);
}

module.exports = { ensureUserStatusWorkflow };
