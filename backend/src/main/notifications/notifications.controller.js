const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureCompanyColumns } = require("../../utils/companyScope");

async function ensureNotificationsTable() {
  await ensureCompanyColumns();
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      user_id INT NOT NULL,
      type VARCHAR(60) NOT NULL DEFAULT 'info',
      title VARCHAR(180) NOT NULL,
      body TEXT,
      link VARCHAR(255),
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_notifications_user_read (user_id, is_read, created_at),
      INDEX idx_notifications_company (company_id, created_at)
    )
  `);
}

async function seedNotificationsForUser(user) {
  await ensureNotificationsTable();
  const [existing] = await query("SELECT id FROM notifications WHERE user_id = ? LIMIT 1", [user.id]);
  if (existing.length) return;

  const roleNotifications = user.role === "employee"
    ? [
        ["training", "Training session starts soon", "Workplace Safety starts next week.", "/dashboard/training"],
        ["payroll", "Payslip available", "Your latest payslip is ready to view.", "/dashboard/payslips"],
        ["leave", "Leave balance updated", "Your annual leave balance has been refreshed.", "/dashboard/leave"],
      ]
    : [
        ["leave", "New leave request from Employee 03", "Employee 03 submitted a casual leave request.", "/dashboard/leave"],
        ["payroll", "Payroll processing completed", "Monthly payroll has been processed for NexoraTech Ltd.", "/dashboard/payroll"],
        ["attendance", "3 employees on leave today", "Review today’s team attendance summary.", "/dashboard/attendance"],
      ];

  for (const [type, title, body, link] of roleNotifications) {
    await query(
      `INSERT INTO notifications (company_id, user_id, type, title, body, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.company_id, user.id, type, title, body, link]
    );
  }
}

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body || "",
    link: row.link || "",
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

const listNotifications = asyncHandler(async (req, res) => {
  await seedNotificationsForUser(req.user);

  const limit = Math.min(Number(req.query.limit || 10), 50);
  const [notifications] = await query(
    `SELECT id, type, title, body, link, is_read, created_at, read_at
     FROM notifications
     WHERE company_id = ? AND user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [req.user.company_id, req.user.id, limit]
  );

  const [counts] = await query(
    `SELECT COUNT(*) AS unreadCount
     FROM notifications
     WHERE company_id = ? AND user_id = ? AND is_read = 0`,
    [req.user.company_id, req.user.id]
  );

  res.json({
    notifications: notifications.map(mapNotification),
    unreadCount: Number(counts[0]?.unreadCount || 0),
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  await ensureNotificationsTable();
  const [result] = await query(
    `UPDATE notifications
     SET is_read = 1, read_at = COALESCE(read_at, NOW())
     WHERE id = ? AND company_id = ? AND user_id = ?`,
    [req.params.id, req.user.company_id, req.user.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.json({ message: "Notification marked as read" });
});

const markAllRead = asyncHandler(async (req, res) => {
  await ensureNotificationsTable();
  await query(
    `UPDATE notifications
     SET is_read = 1, read_at = COALESCE(read_at, NOW())
     WHERE company_id = ? AND user_id = ? AND is_read = 0`,
    [req.user.company_id, req.user.id]
  );

  res.json({ message: "All notifications marked as read" });
});

const createNotification = asyncHandler(async (req, res) => {
  await ensureNotificationsTable();

  if (!["admin", "hr_manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to create notifications" });
  }

  const { userId, type, title, body, link } = req.body || {};
  if (!userId || !title) {
    return res.status(400).json({ message: "userId and title are required" });
  }

  const [users] = await query("SELECT id FROM users WHERE id = ? AND company_id = ? LIMIT 1", [userId, req.user.company_id]);
  if (!users.length) {
    return res.status(404).json({ message: "Recipient not found in your company" });
  }

  const [result] = await query(
    `INSERT INTO notifications (company_id, user_id, type, title, body, link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.company_id, userId, type || "info", title, body || null, link || null]
  );

  res.status(201).json({ id: result.insertId, message: "Notification created" });
});

module.exports = {
  ensureNotificationsTable,
  listNotifications,
  markNotificationRead,
  markAllRead,
  createNotification,
};
