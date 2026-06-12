const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { logAudit } = require("../../utils/auditLogger");

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
  await addColumnIfMissing("forum_replies", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

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

  await addColumnIfMissing("forum_reports", "severity", "VARCHAR(40) NOT NULL DEFAULT 'medium'");
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
    isOwner: Boolean(row.is_owner),
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
    isOwner: Boolean(row.is_owner),
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
    fp.user_id = ? AS is_owner,
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

  const filters = ["fp.status != 'hidden'", "u.company_id = ?"];
  const params = [req.user.id, req.user.company_id];
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
  await query(
    `UPDATE forum_posts fp
     JOIN users u ON u.id = fp.user_id
     SET fp.views = fp.views + 1
     WHERE fp.id = ? AND u.company_id = ?`,
    [req.params.id, req.user.company_id]
  );

  const [rows] = await query(
    `${postSelect} WHERE fp.id = ? AND u.company_id = ? GROUP BY fp.id`,
    [req.user.id, req.params.id, req.user.company_id]
  );
  if (!rows.length || rows[0].status === "hidden") {
    return res.status(404).json({ message: "Forum post not found" });
  }

  const [replyRows] = await query(
    `SELECT fr.*, u.name AS user_name, fr.user_id = ? AS is_owner,
      SUM(CASE WHEN fre.reaction = 'like' THEN 1 ELSE 0 END) AS likes,
      SUM(CASE WHEN fre.reaction = 'heart' THEN 1 ELSE 0 END) AS hearts,
      SUM(CASE WHEN fre.reaction = 'helpful' THEN 1 ELSE 0 END) AS helpful
     FROM forum_replies fr
     LEFT JOIN users u ON u.id = fr.user_id
     LEFT JOIN forum_reactions fre ON fre.target_type = 'reply' AND fre.target_id = fr.id
     WHERE fr.post_id = ? AND fr.status != 'hidden' AND u.company_id = ?
     GROUP BY fr.id
     ORDER BY fr.created_at ASC`,
    [req.user.id, req.params.id, req.user.company_id]
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

  const [rows] = await query(
    `${postSelect} WHERE fp.id = ? AND u.company_id = ? GROUP BY fp.id`,
    [req.user.id, result.insertId, req.user.company_id]
  );
  res.status(201).json({ post: mapPost(rows[0]) });
});

const createReply = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [posts] = await query(
    "SELECT fp.id FROM forum_posts fp JOIN users u ON u.id = fp.user_id WHERE fp.id = ? AND u.company_id = ? LIMIT 1",
    [req.params.id, req.user.company_id]
  );
  if (!posts.length) {
    return res.status(404).json({ message: "Forum post not found" });
  }

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
    `SELECT fr.*, u.name AS user_name, fr.user_id = ? AS is_owner, 0 AS likes, 0 AS hearts, 0 AS helpful
     FROM forum_replies fr
     LEFT JOIN users u ON u.id = fr.user_id
     WHERE fr.id = ? AND u.company_id = ?`,
    [req.user.id, result.insertId, req.user.company_id]
  );

  res.status(201).json({ reply: mapReply(rows[0]) });
});

const updatePost = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [posts] = await query(
    "SELECT fp.user_id, fp.status FROM forum_posts fp JOIN users u ON u.id = fp.user_id WHERE fp.id = ? AND u.company_id = ?",
    [req.params.id, req.user.company_id]
  );
  if (!posts.length || posts[0].status === "hidden") {
    return res.status(404).json({ message: "Forum post not found" });
  }

  const isOwner = Number(posts[0].user_id) === Number(req.user.id);
  const isModerator = ["admin", "hr_manager"].includes(req.user.role);
  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: "You do not have permission to edit this post" });
  }

  await query(
    `UPDATE forum_posts fp
     JOIN users u ON u.id = fp.user_id
     SET fp.title = COALESCE(?, fp.title),
         fp.body = COALESCE(?, fp.body),
         fp.category = COALESCE(?, fp.category),
         fp.tags = COALESCE(?, fp.tags),
         fp.updated_at = CURRENT_TIMESTAMP
     WHERE fp.id = ? AND u.company_id = ?`,
    [
      req.body.title || null,
      req.body.content || null,
      req.body.category || null,
      req.body.tags ? JSON.stringify(req.body.tags) : null,
      req.params.id,
      req.user.company_id,
    ]
  );

  const [rows] = await query(
    `${postSelect} WHERE fp.id = ? AND u.company_id = ? GROUP BY fp.id`,
    [req.user.id, req.params.id, req.user.company_id]
  );
  res.json({ post: mapPost(rows[0]) });
});

const updateReply = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [replies] = await query(
    "SELECT fr.user_id, fr.status FROM forum_replies fr JOIN users u ON u.id = fr.user_id WHERE fr.id = ? AND u.company_id = ?",
    [req.params.id, req.user.company_id]
  );
  if (!replies.length || replies[0].status === "hidden") {
    return res.status(404).json({ message: "Forum reply not found" });
  }

  const isOwner = Number(replies[0].user_id) === Number(req.user.id);
  const isModerator = ["admin", "hr_manager"].includes(req.user.role);
  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: "You do not have permission to edit this reply" });
  }

  await query(
    `UPDATE forum_replies fr
     JOIN users u ON u.id = fr.user_id
     SET fr.body = ?, fr.updated_at = CURRENT_TIMESTAMP
     WHERE fr.id = ? AND u.company_id = ?`,
    [req.body.content, req.params.id, req.user.company_id]
  );

  const [rows] = await query(
    `SELECT fr.*, u.name AS user_name, fr.user_id = ? AS is_owner,
      SUM(CASE WHEN fre.reaction = 'like' THEN 1 ELSE 0 END) AS likes,
      SUM(CASE WHEN fre.reaction = 'heart' THEN 1 ELSE 0 END) AS hearts,
      SUM(CASE WHEN fre.reaction = 'helpful' THEN 1 ELSE 0 END) AS helpful
     FROM forum_replies fr
     LEFT JOIN users u ON u.id = fr.user_id
     LEFT JOIN forum_reactions fre ON fre.target_type = 'reply' AND fre.target_id = fr.id
     WHERE fr.id = ? AND u.company_id = ?
     GROUP BY fr.id`,
    [req.user.id, req.params.id, req.user.company_id]
  );

  res.json({ reply: mapReply(rows[0]) });
});

const deletePost = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [posts] = await query(
    "SELECT fp.user_id, fp.status FROM forum_posts fp JOIN users u ON u.id = fp.user_id WHERE fp.id = ? AND u.company_id = ?",
    [req.params.id, req.user.company_id]
  );
  if (!posts.length || posts[0].status === "hidden") {
    return res.status(404).json({ message: "Forum post not found" });
  }

  const isOwner = Number(posts[0].user_id) === Number(req.user.id);
  const isModerator = ["admin", "hr_manager"].includes(req.user.role);
  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: "You do not have permission to delete this post" });
  }

  const [result] = await query(
    `UPDATE forum_posts fp
     JOIN users u ON u.id = fp.user_id
     SET fp.status = 'hidden'
     WHERE fp.id = ? AND u.company_id = ?`,
    [req.params.id, req.user.company_id]
  );
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Forum post not found" });
  }

  res.json({ message: "Forum post removed" });
});

const deleteReply = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [replies] = await query(
    "SELECT fr.user_id, fr.status FROM forum_replies fr JOIN users u ON u.id = fr.user_id WHERE fr.id = ? AND u.company_id = ?",
    [req.params.id, req.user.company_id]
  );
  if (!replies.length || replies[0].status === "hidden") {
    return res.status(404).json({ message: "Forum reply not found" });
  }

  const isOwner = Number(replies[0].user_id) === Number(req.user.id);
  const isModerator = ["admin", "hr_manager"].includes(req.user.role);
  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: "You do not have permission to delete this reply" });
  }

  const [result] = await query(
    `UPDATE forum_replies fr
     JOIN users u ON u.id = fr.user_id
     SET fr.status = 'hidden'
     WHERE fr.id = ? AND u.company_id = ?`,
    [req.params.id, req.user.company_id]
  );
  if (!result.affectedRows) {
    return res.status(404).json({ message: "Forum reply not found" });
  }

  res.json({ message: "Forum reply removed" });
});

const toggleReaction = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const { targetType, targetId, reaction } = req.body;

  if (targetType === "post") {
    const [posts] = await query(
      "SELECT fp.id FROM forum_posts fp JOIN users u ON u.id = fp.user_id WHERE fp.id = ? AND u.company_id = ? LIMIT 1",
      [targetId, req.user.company_id]
    );
    if (!posts.length) return res.status(404).json({ message: "Content not found" });
  } else if (targetType === "reply") {
    const [replies] = await query(
      "SELECT fr.id FROM forum_replies fr JOIN users u ON u.id = fr.user_id WHERE fr.id = ? AND u.company_id = ? LIMIT 1",
      [targetId, req.user.company_id]
    );
    if (!replies.length) return res.status(404).json({ message: "Content not found" });
  }

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
  const table = req.body.targetType === "post" ? "forum_posts" : "forum_replies";
  const [rows] = await query(
    `SELECT t.id FROM ${table} t JOIN users u ON u.id = t.user_id WHERE t.id = ? AND u.company_id = ? LIMIT 1`,
    [req.body.targetId, req.user.company_id]
  );
  if (!rows.length) {
    return res.status(404).json({ message: "Content not found" });
  }

  const severity = req.body.severity || "medium";
  const [result] = await query(
    `INSERT INTO forum_reports (target_type, target_id, reporter_id, reason, notes, severity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.body.targetType, req.body.targetId, req.user.id, req.body.reason, req.body.notes || null, severity]
  );

  await query(
    `UPDATE ${table} t JOIN users u ON u.id = t.user_id SET t.status = 'flagged' WHERE t.id = ? AND u.company_id = ?`,
    [req.body.targetId, req.user.company_id]
  );
  res.status(201).json({ reportId: result.insertId, message: "Content reported" });
});

const listReports = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const companyId = req.user.company_id;
  const filters = ["reporter.company_id = ?"];
  const params = [companyId];

  if (req.query.status) {
    filters.push("fr.status = ?");
    params.push(req.query.status);
  }
  if (req.query.category || req.query.reason) {
    filters.push("fr.reason = ?");
    params.push(req.query.category || req.query.reason);
  }
  if (req.query.severity) {
    filters.push("fr.severity = ?");
    params.push(req.query.severity);
  }
  if (req.query.search || req.query.keyword) {
    const kw = `%${req.query.search || req.query.keyword}%`;
    filters.push("(fr.notes LIKE ? OR fr.reason LIKE ? OR fp.title LIKE ? OR fp.body LIKE ? OR frp.body LIKE ?)");
    params.push(kw, kw, kw, kw, kw);
  }
  if (req.query.reportedUser) {
    const ru = `%${req.query.reportedUser}%`;
    filters.push("(u_post.name LIKE ? OR u_reply.name LIKE ? OR u_post.id = ? OR u_reply.id = ?)");
    params.push(ru, ru, req.query.reportedUser, req.query.reportedUser);
  }
  if (req.query.startDate && req.query.endDate) {
    filters.push("fr.created_at BETWEEN ? AND ?");
    params.push(req.query.startDate, req.query.endDate);
  } else if (req.query.startDate) {
    filters.push("fr.created_at >= ?");
    params.push(req.query.startDate);
  } else if (req.query.endDate) {
    filters.push("fr.created_at <= ?");
    params.push(req.query.endDate);
  }

  const sql = `
    SELECT 
      fr.*, 
      reporter.name AS reporter_name, 
      reviewer.name AS reviewer_name,
      COALESCE(fp.user_id, frp.user_id) AS reported_user_id,
      COALESCE(u_post.name, u_reply.name) AS reported_user_name,
      COALESCE(fp.title, '') AS post_title,
      COALESCE(fp.body, frp.body) AS content_preview
    FROM forum_reports fr
    JOIN users reporter ON reporter.id = fr.reporter_id
    LEFT JOIN users reviewer ON reviewer.id = fr.reviewed_by
    LEFT JOIN forum_posts fp ON fr.target_type = 'post' AND fp.id = fr.target_id
    LEFT JOIN forum_replies frp ON fr.target_type = 'reply' AND frp.id = fr.target_id
    LEFT JOIN users u_post ON u_post.id = fp.user_id
    LEFT JOIN users u_reply ON u_reply.id = frp.user_id
    WHERE ${filters.join(" AND ")}
    ORDER BY fr.created_at DESC
  `;
  const [rows] = await query(sql, params);
  res.json({ reports: rows });
});

const getReportContext = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [reports] = await query(
    `SELECT fr.*, reporter.name AS reporter_name, reporter.email AS reporter_email,
            reviewer.name AS reviewer_name, reviewer.email AS reviewer_email
     FROM forum_reports fr
     JOIN users reporter ON reporter.id = fr.reporter_id
     LEFT JOIN users reviewer ON reviewer.id = fr.reviewed_by
     WHERE fr.id = ? AND reporter.company_id = ?`,
    [req.params.id, req.user.company_id]
  );
  if (!reports.length) {
    return res.status(404).json({ message: "Report not found" });
  }
  const report = reports[0];

  const [reporters] = await query(
    "SELECT id, name, email, department, designation, role, avatar FROM users WHERE id = ?",
    [report.reporter_id]
  );
  const reporterDetails = reporters[0] || null;

  let reportedPost = null;
  let reportedReply = null;
  let originalPost = null;
  let relatedReplies = [];
  let reportedUser = null;

  if (report.target_type === 'post') {
    const [posts] = await query(
      `SELECT fp.*, u.name AS user_name, u.email AS user_email, u.department, u.designation, u.role, u.avatar
       FROM forum_posts fp
       LEFT JOIN users u ON u.id = fp.user_id
       WHERE fp.id = ?`,
      [report.target_id]
    );
    reportedPost = posts[0] || null;
    if (reportedPost) {
      reportedUser = {
        id: reportedPost.user_id,
        name: reportedPost.user_name || "Former Employee",
        email: reportedPost.user_email || "",
        department: reportedPost.department || "",
        designation: reportedPost.designation || "",
        role: reportedPost.role || "",
        avatar: reportedPost.avatar || "",
      };

      const [replies] = await query(
        `SELECT fr.*, u.name AS user_name
         FROM forum_replies fr
         LEFT JOIN users u ON u.id = fr.user_id
         WHERE fr.post_id = ? AND fr.status != 'hidden'
         ORDER BY fr.created_at ASC`,
        [report.target_id]
      );
      relatedReplies = replies;
    }
  } else {
    const [replies] = await query(
      `SELECT fr.*, u.name AS user_name, u.email AS user_email, u.department, u.designation, u.role, u.avatar
       FROM forum_replies fr
       LEFT JOIN users u ON u.id = fr.user_id
       WHERE fr.id = ?`,
      [report.target_id]
    );
    reportedReply = replies[0] || null;
    if (reportedReply) {
      reportedUser = {
        id: reportedReply.user_id,
        name: reportedReply.user_name || "Former Employee",
        email: reportedReply.user_email || "",
        department: reportedReply.department || "",
        designation: reportedReply.designation || "",
        role: reportedReply.role || "",
        avatar: reportedReply.avatar || "",
      };

      const [posts] = await query(
        `SELECT fp.*, u.name AS user_name
         FROM forum_posts fp
         LEFT JOIN users u ON u.id = fp.user_id
         WHERE fp.id = ?`,
        [reportedReply.post_id]
      );
      originalPost = posts[0] || null;

      const [siblingReplies] = await query(
        `SELECT fr.*, u.name AS user_name
         FROM forum_replies fr
         LEFT JOIN users u ON u.id = fr.user_id
         WHERE fr.post_id = ? AND fr.status != 'hidden'
         ORDER BY fr.created_at ASC`,
        [reportedReply.post_id]
      );
      relatedReplies = siblingReplies;
    }
  }

  let previousUserReports = [];
  if (reportedUser && reportedUser.id) {
    const [userReports] = await query(
      `SELECT fr.*, reporter.name AS reporter_name
       FROM forum_reports fr
       JOIN users reporter ON reporter.id = fr.reporter_id
       LEFT JOIN forum_posts fp ON fr.target_type = 'post' AND fp.id = fr.target_id
       LEFT JOIN forum_replies frp ON fr.target_type = 'reply' AND frp.id = fr.target_id
       WHERE (fp.user_id = ? OR frp.user_id = ?) AND fr.id != ?
       ORDER BY fr.created_at DESC`,
      [reportedUser.id, reportedUser.id, report.id]
    );
    previousUserReports = userReports;
  }

  const [contentReports] = await query(
    `SELECT fr.*, reporter.name AS reporter_name
     FROM forum_reports fr
     JOIN users reporter ON reporter.id = fr.reporter_id
     WHERE fr.target_type = ? AND fr.target_id = ? AND fr.id != ?
     ORDER BY fr.created_at DESC`,
    [report.target_type, report.target_id, report.id]
  );
  const previousContentReports = contentReports;

  const [modHistory] = await query(
    `SELECT * FROM audit_logs 
     WHERE module = 'Forum Moderation' AND entity_type = ? AND entity_id = ?
     ORDER BY created_at DESC`,
    [report.target_type, report.target_id]
  );

  res.json({
    report,
    reporter: reporterDetails,
    reportedUser,
    targetType: report.target_type,
    reportedContent: report.target_type === 'post' ? reportedPost : reportedReply,
    originalPostContext: report.target_type === 'post' ? reportedPost : originalPost,
    relatedReplies,
    previousUserReports,
    previousContentReports,
    moderationHistory: modHistory
  });
});

const moderateReport = asyncHandler(async (req, res) => {
  await ensureForumTables();
  const [reports] = await query(
    `SELECT fr.* FROM forum_reports fr
     JOIN users reporter ON reporter.id = fr.reporter_id
     WHERE fr.id = ? AND reporter.company_id = ?`,
    [req.params.id, req.user.company_id]
  );
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

  let reportedUserId = null;
  if (report.target_type === "post") {
    const [posts] = await query("SELECT user_id FROM forum_posts WHERE id = ? LIMIT 1", [report.target_id]);
    reportedUserId = posts[0]?.user_id;
  } else {
    const [replies] = await query("SELECT user_id FROM forum_replies WHERE id = ? LIMIT 1", [report.target_id]);
    reportedUserId = replies[0]?.user_id;
  }

  if (action === "warn" && reportedUserId) {
    await query(
      `INSERT INTO notifications (company_id, user_id, type, title, body, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.company_id,
        reportedUserId,
        "warning",
        "Community Guidelines Warning",
        `A moderator has issued a warning regarding your recent forum ${report.target_type}. Please ensure your posts adhere to our company's community standards.`,
        `/dashboard/forum`
      ]
    );
  }

  const table = report.target_type === "post" ? "forum_posts" : "forum_replies";
  if (action === "remove" || action === "hide") {
    await query(
      `UPDATE ${table} t JOIN users u ON u.id = t.user_id SET t.status = 'hidden' WHERE t.id = ? AND u.company_id = ?`,
      [report.target_id, req.user.company_id]
    );
  } else if (action === "approve" || action === "dismiss" || action === "resolve" || action === "warn") {
    await query(
      `UPDATE ${table} t JOIN users u ON u.id = t.user_id SET t.status = 'published' WHERE t.id = ? AND u.company_id = ?`,
      [report.target_id, req.user.company_id]
    );
  }

  await logAudit({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: "forum_moderation_" + action,
    module: "Forum Moderation",
    entityType: report.target_type,
    entityId: report.target_id,
    description: "Moderated forum " + report.target_type + " report #" + req.params.id + " with action " + action,
    metadata: { reportId: Number(req.params.id), reason: report.reason, status: nextStatus },
    ipAddress: req.ip,
  });
  res.json({ message: "Moderation action saved" });
});

module.exports = {
  listPosts,
  getPost,
  createPost,
  createReply,
  updatePost,
  updateReply,
  deletePost,
  deleteReply,
  toggleReaction,
  reportContent,
  listReports,
  getReportContext,
  moderateReport,
};
