const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");

const avatarPalette = [
  { alias: "Panda", color: "#9A77CF" },
  { alias: "Koala", color: "#EC4176" },
  { alias: "Fox", color: "#FFA45E" },
  { alias: "Owl", color: "#7C5FB5" },
  { alias: "Dolphin", color: "#543884" },
  { alias: "Bear", color: "#9A77CF" },
  { alias: "Tiger", color: "#EC4176" },
  { alias: "Rabbit", color: "#7C5FB5" },
];

function pickAvatar(seed = Date.now()) {
  return avatarPalette[Math.abs(Number(seed)) % avatarPalette.length];
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatTimestamp(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return `${days} days ago`;
}

async function columnExists(table, column) {
  const [rows] = await query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function ensureForumTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      title VARCHAR(180) NOT NULL,
      body TEXT NOT NULL,
      category VARCHAR(80) DEFAULT 'General',
      is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
      status ENUM('published', 'hidden', 'flagged') NOT NULL DEFAULT 'published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS forum_replies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT,
      body TEXT NOT NULL,
      is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await addColumnIfMissing("forum_posts", "anonymous_alias", "VARCHAR(40)");
  await addColumnIfMissing("forum_posts", "anonymous_color", "VARCHAR(20)");
  await addColumnIfMissing("forum_posts", "tags", "JSON");
  await addColumnIfMissing("forum_posts", "sentiment", "VARCHAR(40) NOT NULL DEFAULT 'neutral'");
  await addColumnIfMissing("forum_posts", "is_poll", "BOOLEAN NOT NULL DEFAULT FALSE");
  await addColumnIfMissing("forum_posts", "poll_data", "JSON");
  await addColumnIfMissing("forum_posts", "views", "INT NOT NULL DEFAULT 0");
  await addColumnIfMissing("forum_posts", "moderation_note", "VARCHAR(120)");
  await addColumnIfMissing("forum_replies", "parent_reply_id", "INT");
  await addColumnIfMissing("forum_replies", "anonymous_alias", "VARCHAR(40)");
  await addColumnIfMissing("forum_replies", "anonymous_color", "VARCHAR(20)");
  await addColumnIfMissing("forum_replies", "status", "ENUM('published', 'hidden', 'flagged') NOT NULL DEFAULT 'published'");

  await query(`
    CREATE TABLE IF NOT EXISTS forum_reactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      target_type ENUM('post', 'reply') NOT NULL,
      target_id INT NOT NULL,
      user_id INT NOT NULL,
      reaction ENUM('like', 'heart', 'helpful') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_forum_reaction (target_type, target_id, user_id, reaction),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS forum_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      target_type ENUM('post', 'reply') NOT NULL,
      target_id INT NOT NULL,
      reporter_id INT,
      reason VARCHAR(180) NOT NULL,
      notes TEXT,
      status ENUM('pending', 'reviewed', 'dismissed') NOT NULL DEFAULT 'pending',
      action_taken VARCHAR(80),
      reviewed_by INT,
      reviewed_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

function mapPost(row) {
  const alias = row.anonymous_alias || pickAvatar(row.id).alias;
  const color = row.anonymous_color || pickAvatar(row.id).color;
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.body,
    author: {
      name: row.is_anonymous ? `Anonymous ${alias}` : row.user_name || "Former Employee",
      color,
    },
    timestamp: formatTimestamp(row.created_at),
    views: Number(row.views || 0),
    replies: Number(row.reply_count || 0),
    reactions: {
      likes: Number(row.likes || 0),
      hearts: Number(row.hearts || 0),
      helpful: Number(row.helpful || 0),
    },
    tags: parseJson(row.tags, []),
    sentiment: row.sentiment || "neutral",
    isPoll: Boolean(row.is_poll),
    pollData: parseJson(row.poll_data, null),
    hasModeration: row.status === "flagged" || Boolean(row.moderation_note),
    moderationNote: row.moderation_note || (row.status === "flagged" ? "Under review" : undefined),
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapReply(row) {
  const alias = row.anonymous_alias || pickAvatar(row.id).alias;
  const color = row.anonymous_color || pickAvatar(row.id).color;
  return {
    id: row.id,
    postId: row.post_id,
    parentReplyId: row.parent_reply_id,
    author: {
      name: row.is_anonymous ? `Anonymous ${alias}` : row.user_name || "Former Employee",
      color,
    },
    content: row.body,
    timestamp: formatTimestamp(row.created_at),
    reactions: {
      likes: Number(row.likes || 0),
      hearts: Number(row.hearts || 0),
      helpful: Number(row.helpful || 0),
    },
    replies: [],
    status: row.status,
    createdAt: row.created_at,
  };
}

function nestReplies(rows) {
  const byId = new Map();
  const roots = [];
  rows.map(mapReply).forEach((reply) => byId.set(reply.id, reply));
  byId.forEach((reply) => {
    if (reply.parentReplyId && byId.has(reply.parentReplyId)) {
      byId.get(reply.parentReplyId).replies.push(reply);
    } else {
      roots.push(reply);
    }
  });
  return roots;
}

const postSelect = `
  SELECT fp.*, u.name AS user_name,
    COUNT(DISTINCT frp.id) AS reply_count,
    SUM(CASE WHEN fre.reaction = 'like' THEN 1 ELSE 0 END) AS likes,
    SUM(CASE WHEN fre.reaction = 'heart' THEN 1 ELSE 0 END) AS hearts,
    SUM(CASE WHEN fre.reaction = 'helpful' THEN 1 ELSE 0 END) AS helpful
  FROM forum_posts fp
  LEFT JOIN users u ON u.id = fp.user_id
  LEFT JOIN forum_replies frp ON frp.post_id = fp.id AND frp.status != 'hidden'
  LEFT JOIN forum_reactions fre ON fre.target_type = 'post' AND fre.target_id = fp.id
`;

const listPosts = asyncHandler(async (req, res) => {
  await ensureForumTables();

  const filters = ["fp.status != 'hidden'"];
  const params = [];
  if (req.query.category && req.query.category !== "all") {
    filters.push("fp.category = ?");
    params.push(req.query.category);
  }
  if (req.query.search) {
    filters.push("(fp.title LIKE ? OR fp.body LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }

  const sortMap = {
    popular: "likes DESC, fp.views DESC",
    discussed: "reply_count DESC",
    recent: "fp.created_at DESC",
  };
  const sort = sortMap[req.query.sort] || sortMap.recent;
  const [rows] = await query(
    `${postSelect}
     WHERE ${filters.join(" AND ")}
     GROUP BY fp.id
     ORDER BY ${sort}`,
    params
  );

  res.json({ posts: rows.map(mapPost) });
});

const getPost = asyncHandler(async (req, res) => {
  await ensureForumTables();
  await query("UPDATE forum_posts SET views = views + 1 WHERE id = ?", [req.params.id]);
  const [rows] = await query(`${postSelect} WHERE fp.id = ? GROUP BY fp.id`, [req.params.id]);
  if (!rows.length || rows[0].status === "hidden") {
    return res.status(404).json({ message: "Forum post not found" });
  }

  const [replyRows] = await query(
    `SELECT fr.*, u.name AS user_name,
      SUM(CASE WHEN fre.reaction = 'like' THEN 1 ELSE 0 END) AS likes,
      SUM(CASE WHEN fre.reaction = 'heart' THEN 1 ELSE 0 END) AS hearts,
      SUM(CASE WHEN fre.reaction = 'helpful' THEN 1 ELSE 0 END) AS helpful
     FROM forum_replies fr
     LEFT JOIN users u ON u.id = fr.user_id
     LEFT JOIN forum_reactions fre ON fre.target_type = 'reply' AND fre.target_id = fr.id
     WHERE fr.post_id = ? AND fr.status != 'hidden'
     GROUP BY fr.id
     ORDER BY fr.created_at ASC`,
    [req.params.id]
  );

  res.json({ post: { ...mapPost(rows[0]), replies: nestReplies(replyRows) } });
});

const createPost = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const avatar = req.body.avatarAlias
    ? { alias: req.body.avatarAlias, color: req.body.avatarColor || pickAvatar(req.user.id).color }
    : pickAvatar(req.user.id);

  const [result] = await query(
    `INSERT INTO forum_posts
      (user_id, title, body, category, is_anonymous, anonymous_alias, anonymous_color, tags, sentiment, is_poll, poll_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      req.body.title,
      req.body.content,
      req.body.category || "General",
      req.body.isAnonymous !== false,
      avatar.alias,
      avatar.color,
      JSON.stringify(req.body.tags || []),
      req.body.sentiment || "neutral",
      Boolean(req.body.pollData),
      req.body.pollData ? JSON.stringify(req.body.pollData) : null,
    ]
  );

  const [rows] = await query(`${postSelect} WHERE fp.id = ? GROUP BY fp.id`, [result.insertId]);
  res.status(201).json({ post: mapPost(rows[0]) });
});

const createReply = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const avatar = req.body.avatarAlias
    ? { alias: req.body.avatarAlias, color: req.body.avatarColor || pickAvatar(req.user.id).color }
    : pickAvatar(req.user.id + Number(req.params.id));

  const [result] = await query(
    `INSERT INTO forum_replies
      (post_id, parent_reply_id, user_id, body, is_anonymous, anonymous_alias, anonymous_color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.params.id,
      req.body.parentReplyId || null,
      req.user.id,
      req.body.content,
      req.body.isAnonymous !== false,
      avatar.alias,
      avatar.color,
    ]
  );

  const [rows] = await query(
    `SELECT fr.*, u.name AS user_name, 0 AS likes, 0 AS hearts, 0 AS helpful
     FROM forum_replies fr
     LEFT JOIN users u ON u.id = fr.user_id
     WHERE fr.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ reply: mapReply(rows[0]) });
});

const deletePost = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [result] = await query("UPDATE forum_posts SET status = 'hidden' WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Forum post not found" });
  }

  res.json({ message: "Forum post removed" });
});

const deleteReply = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [result] = await query("UPDATE forum_replies SET status = 'hidden' WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Forum reply not found" });
  }

  res.json({ message: "Forum reply removed" });
});

const toggleReaction = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const { targetType, targetId, reaction } = req.body;
  const [existing] = await query(
    "SELECT id FROM forum_reactions WHERE target_type = ? AND target_id = ? AND user_id = ? AND reaction = ?",
    [targetType, targetId, req.user.id, reaction]
  );

  if (existing.length) {
    await query("DELETE FROM forum_reactions WHERE id = ?", [existing[0].id]);
    return res.json({ active: false });
  }

  await query(
    "INSERT INTO forum_reactions (target_type, target_id, user_id, reaction) VALUES (?, ?, ?, ?)",
    [targetType, targetId, req.user.id, reaction]
  );
  res.status(201).json({ active: true });
});

const reportContent = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [result] = await query(
    `INSERT INTO forum_reports (target_type, target_id, reporter_id, reason, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [req.body.targetType, req.body.targetId, req.user.id, req.body.reason, req.body.notes || null]
  );

  const table = req.body.targetType === "post" ? "forum_posts" : "forum_replies";
  await query(`UPDATE ${table} SET status = 'flagged' WHERE id = ?`, [req.body.targetId]);
  res.status(201).json({ reportId: result.insertId, message: "Content reported" });
});

const listReports = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [rows] = await query(
    `SELECT fr.*, reporter.name AS reporter_name, reviewer.name AS reviewer_name
     FROM forum_reports fr
     LEFT JOIN users reporter ON reporter.id = fr.reporter_id
     LEFT JOIN users reviewer ON reviewer.id = fr.reviewed_by
     ORDER BY fr.created_at DESC`
  );
  res.json({ reports: rows });
});

const moderateReport = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [reports] = await query("SELECT * FROM forum_reports WHERE id = ?", [req.params.id]);
  if (!reports.length) {
    return res.status(404).json({ message: "Report not found" });
  }

  const report = reports[0];
  const action = req.body.action;
  const nextStatus = action === "dismiss" ? "dismissed" : "reviewed";
  await query(
    `UPDATE forum_reports
     SET status = ?, action_taken = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [nextStatus, action, req.user.id, req.params.id]
  );

  const table = report.target_type === "post" ? "forum_posts" : "forum_replies";
  if (action === "remove") {
    await query(`UPDATE ${table} SET status = 'hidden' WHERE id = ?`, [report.target_id]);
  } else if (action === "approve" || action === "dismiss") {
    await query(`UPDATE ${table} SET status = 'published' WHERE id = ?`, [report.target_id]);
  }

  res.json({ message: "Moderation action saved" });
});

module.exports = {
  listPosts,
  getPost,
  createPost,
  createReply,
  deletePost,
  deleteReply,
  toggleReaction,
  reportContent,
  listReports,
  moderateReport,
};
