const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");
const { query } = require("../../config/database");
const asyncHandler = require("../../utils/asyncHandler");
const { ensureCompanyColumns } = require("../../utils/companyScope");
const { logAudit } = require("../../utils/auditLogger");

async function ensureProfileTable() {
  await ensureCompanyColumns();
  await query(`
    CREATE TABLE IF NOT EXISTS user_profile_settings (
      user_id INT PRIMARY KEY,
      display_name VARCHAR(120),
      date_of_birth DATE,
      gender VARCHAR(40),
      nationality VARCHAR(80),
      marital_status VARCHAR(80),
      city VARCHAR(100),
      country VARCHAR(100),
      bio TEXT,
      emergency_contact_name VARCHAR(120),
      emergency_contact_phone VARCHAR(60),
      blood_group VARCHAR(20),
      linkedin_url VARCHAR(255),
      language VARCHAR(80) NOT NULL DEFAULT 'English',
      timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Dhaka',
      theme_preference ENUM('light','dark','system') NOT NULL DEFAULT 'system',
      notify_leave_updates TINYINT(1) NOT NULL DEFAULT 1,
      notify_schedule_changes TINYINT(1) NOT NULL DEFAULT 1,
      notify_payslip_available TINYINT(1) NOT NULL DEFAULT 1,
      forum_anonymous_mode TINYINT(1) NOT NULL DEFAULT 0,
      forum_allow_anonymous_posting TINYINT(1) NOT NULL DEFAULT 1,
      forum_hide_identity TINYINT(1) NOT NULL DEFAULT 0,
      forum_notify_replies TINYINT(1) NOT NULL DEFAULT 1,
      privacy_show_directory TINYINT(1) NOT NULL DEFAULT 1,
      privacy_show_phone TINYINT(1) NOT NULL DEFAULT 1,
      privacy_show_email TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function ensureProfileRow(user) {
  await ensureProfileTable();
  await query(
    `INSERT INTO user_profile_settings (user_id, display_name, nationality, city, country)
     VALUES (?, ?, 'Bangladeshi', 'Dhaka', 'Bangladesh')
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [user.id, user.name]
  );
}

function coerceBool(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value === 1 || value === "1" || value === "true" || value === "on") return 1;
  return 0;
}

function clean(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function dateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function serializeProfile(user, profile, company) {
  const filledFields = [
    user.name,
    profile.display_name,
    user.email,
    user.phone,
    profile.date_of_birth,
    profile.gender,
    profile.nationality,
    profile.city,
    profile.country,
    user.department,
    user.designation,
    user.hire_date,
    profile.emergency_contact_name,
    profile.emergency_contact_phone,
  ].filter(Boolean).length;

  return {
    user: {
      id: user.id,
      company_id: user.company_id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      department: user.department || "",
      designation: user.designation || "",
      hire_date: dateOnly(user.hire_date),
      salary: Number(user.salary || 0),
      avatar: user.avatar || "",
      status: user.status || "active",
      employee_code: user.employee_code || "",
      company: company ? { id: company.id, name: company.name, domain: company.domain } : null,
    },
    profile: {
      displayName: profile.display_name || user.name,
      dateOfBirth: dateOnly(profile.date_of_birth),
      gender: profile.gender || "",
      nationality: profile.nationality || "Bangladeshi",
      maritalStatus: profile.marital_status || "",
      city: profile.city || "Dhaka",
      country: profile.country || "Bangladesh",
      bio: profile.bio || "",
      emergencyContactName: profile.emergency_contact_name || "",
      emergencyContactPhone: profile.emergency_contact_phone || "",
      bloodGroup: profile.blood_group || "",
      linkedIn: profile.linkedin_url || "",
    },
    settings: {
      language: profile.language || "English",
      timezone: profile.timezone || "Asia/Dhaka",
      themePreference: profile.theme_preference || "system",
      notifications: {
        leaveUpdates: Boolean(profile.notify_leave_updates),
        scheduleChanges: Boolean(profile.notify_schedule_changes),
        payslipAvailable: Boolean(profile.notify_payslip_available),
      },
      forum: {
        anonymousMode: Boolean(profile.forum_anonymous_mode),
        allowAnonymousPosting: Boolean(profile.forum_allow_anonymous_posting),
        hideIdentity: Boolean(profile.forum_hide_identity),
        notifyReplies: Boolean(profile.forum_notify_replies),
      },
      privacy: {
        showDirectory: Boolean(profile.privacy_show_directory),
        showPhone: Boolean(profile.privacy_show_phone),
        showEmail: Boolean(profile.privacy_show_email),
      },
    },
    completion: Math.round((filledFields / 14) * 100),
  };
}

async function getProfilePayload(userId, companyId) {
  await ensureProfileTable();
  const [users] = await query(
    `SELECT u.id, u.company_id, u.name, u.email, u.role, u.phone, u.department, u.designation,
            u.hire_date, u.salary, u.avatar, u.status, u.employee_code, c.name AS company_name, c.domain AS company_domain
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.id = ? AND u.company_id = ?
     LIMIT 1`,
    [userId, companyId]
  );

  if (!users.length) return null;
  await ensureProfileRow(users[0]);

  const [profiles] = await query("SELECT * FROM user_profile_settings WHERE user_id = ? LIMIT 1", [userId]);
  const company = {
    id: users[0].company_id,
    name: users[0].company_name,
    domain: users[0].company_domain,
  };

  return serializeProfile(users[0], profiles[0], company);
}

const getMyProfile = asyncHandler(async (req, res) => {
  const payload = await getProfilePayload(req.user.id, req.user.company_id);
  if (!payload) {
    return res.status(404).json({ message: "Profile not found" });
  }

  res.json(payload);
});

const updateMyProfile = asyncHandler(async (req, res) => {
  await ensureProfileRow(req.user);

  const body = req.body || {};
  const [companies] = await query("SELECT domain FROM companies WHERE id = ? LIMIT 1", [req.user.company_id]);
  const companyDomain = companies[0]?.domain;

  const userUpdates = [];
  const userParams = [];
  const userFieldMap = {
    name: "name",
    email: "email",
    phone: "phone",
    department: "department",
    designation: "designation",
    avatar: "avatar",
  };

  for (const [bodyKey, column] of Object.entries(userFieldMap)) {
    if (body[bodyKey] !== undefined) {
      const value = clean(body[bodyKey]);
      if (bodyKey === "email") {
        const normalizedEmail = String(value || "").toLowerCase();
        if (!normalizedEmail || !normalizedEmail.includes("@")) {
          return res.status(400).json({ message: "A valid email address is required" });
        }
        if (companyDomain && !normalizedEmail.endsWith(`@${companyDomain}`)) {
          return res.status(400).json({ message: `Email must use @${companyDomain}` });
        }
        const [existing] = await query("SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1", [normalizedEmail, req.user.id]);
        if (existing.length) {
          return res.status(409).json({ message: "Email address is already used by another user" });
        }
        userUpdates.push(`${column} = ?`);
        userParams.push(normalizedEmail);
      } else {
        userUpdates.push(`${column} = ?`);
        userParams.push(value);
      }
    }
  }

  if (userUpdates.length) {
    userParams.push(req.user.id, req.user.company_id);
    await query(`UPDATE users SET ${userUpdates.join(", ")} WHERE id = ? AND company_id = ?`, userParams);
  }

  const profileFieldMap = {
    displayName: "display_name",
    dateOfBirth: "date_of_birth",
    gender: "gender",
    nationality: "nationality",
    maritalStatus: "marital_status",
    city: "city",
    country: "country",
    bio: "bio",
    emergencyContactName: "emergency_contact_name",
    emergencyContactPhone: "emergency_contact_phone",
    bloodGroup: "blood_group",
    linkedIn: "linkedin_url",
  };

  const profileUpdates = [];
  const profileParams = [];
  for (const [bodyKey, column] of Object.entries(profileFieldMap)) {
    if (body[bodyKey] !== undefined) {
      profileUpdates.push(`${column} = ?`);
      profileParams.push(clean(body[bodyKey]));
    }
  }

  if (profileUpdates.length) {
    profileParams.push(req.user.id);
    await query(`UPDATE user_profile_settings SET ${profileUpdates.join(", ")} WHERE user_id = ?`, profileParams);
  }

  const payload = await getProfilePayload(req.user.id, req.user.company_id);
  res.json({ message: "Profile updated successfully", ...payload });
});

const updatePreferences = asyncHandler(async (req, res) => {
  await ensureProfileRow(req.user);
  const body = req.body || {};

  const fieldMap = {
    language: { column: "language", transform: clean },
    timezone: { column: "timezone", transform: clean },
    themePreference: { column: "theme_preference", transform: clean },
    leaveUpdates: { column: "notify_leave_updates", transform: coerceBool },
    scheduleChanges: { column: "notify_schedule_changes", transform: coerceBool },
    payslipAvailable: { column: "notify_payslip_available", transform: coerceBool },
    anonymousMode: { column: "forum_anonymous_mode", transform: coerceBool },
    allowAnonymousPosting: { column: "forum_allow_anonymous_posting", transform: coerceBool },
    hideIdentity: { column: "forum_hide_identity", transform: coerceBool },
    notifyReplies: { column: "forum_notify_replies", transform: coerceBool },
    showDirectory: { column: "privacy_show_directory", transform: coerceBool },
    showPhone: { column: "privacy_show_phone", transform: coerceBool },
    showEmail: { column: "privacy_show_email", transform: coerceBool },
  };

  const updates = [];
  const params = [];
  for (const [bodyKey, config] of Object.entries(fieldMap)) {
    if (body[bodyKey] !== undefined) {
      const value = config.transform(body[bodyKey]);
      if (value !== undefined) {
        if (bodyKey === "themePreference" && !["light", "dark", "system"].includes(value)) {
          return res.status(400).json({ message: "Theme preference must be light, dark, or system" });
        }
        updates.push(`${config.column} = ?`);
        params.push(value);
      }
    }
  }

  if (!updates.length) {
    return res.status(400).json({ message: "No preference updates provided" });
  }

  params.push(req.user.id);
  await query(`UPDATE user_profile_settings SET ${updates.join(", ")} WHERE user_id = ?`, params);

  const payload = await getProfilePayload(req.user.id, req.user.company_id);
  res.json({ message: "Preferences updated successfully", settings: payload.settings });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Current password, new password, and confirmation are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New password and confirmation do not match" });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters" });
  }

  const [users] = await query("SELECT password FROM users WHERE id = ? AND company_id = ? LIMIT 1", [req.user.id, req.user.company_id]);
  if (!users.length || !(await bcrypt.compare(currentPassword, users[0].password))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await query("UPDATE users SET password = ? WHERE id = ? AND company_id = ?", [hashedPassword, req.user.id, req.user.company_id]);

  res.json({ message: "Password updated successfully" });
});

async function ensureUserDocumentsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      document_type VARCHAR(80) NOT NULL DEFAULT 'Other',
      document_name VARCHAR(180) NOT NULL,
      file_name VARCHAR(180),
      original_name VARCHAR(255),
      file_path VARCHAR(255) NOT NULL,
      file_size INT,
      mime_type VARCHAR(100),
      uploaded_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  const [columns] = await query("SHOW COLUMNS FROM user_documents");
  const columnNames = new Set(columns.map((column) => column.Field));
  const additions = [
    ["file_name", "ALTER TABLE user_documents ADD COLUMN file_name VARCHAR(180) NULL AFTER document_name"],
    ["original_name", "ALTER TABLE user_documents ADD COLUMN original_name VARCHAR(255) NULL AFTER file_name"],
  ];

  for (const [column, sql] of additions) {
    if (!columnNames.has(column)) {
      await query(sql);
    }
  }

  await query(
    "UPDATE user_documents SET file_name = COALESCE(file_name, SUBSTRING_INDEX(file_path, '/', -1)), original_name = COALESCE(original_name, document_name)"
  );
}

function serializeDocument(document, req) {
  const relativePath = String(document.file_path || "").replace(/\\/g, "/").replace(/^\/+/, "");
  return {
    id: document.id,
    userId: document.user_id,
    documentType: document.document_type,
    documentName: document.document_name,
    fileName: document.file_name,
    originalName: document.original_name,
    filePath: relativePath,
    fileUrl: relativePath ? req.protocol + "://" + req.get("host") + "/uploads/" + relativePath : null,
    mimeType: document.mime_type,
    size: Number(document.file_size || 0),
    uploadedAt: document.created_at,
    createdAt: document.created_at,
  };
}

const getMyDocuments = asyncHandler(async (req, res) => {
  await ensureUserDocumentsTable();
  const [documents] = await query("SELECT * FROM user_documents WHERE user_id = ? ORDER BY id DESC", [req.user.id]);
  res.json({ documents: documents.map((document) => serializeDocument(document, req)) });
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No document file was uploaded" });
  }
  const documentType = String(req.body.documentType || req.body.document_type || "Other").trim().slice(0, 80);
  const documentName = String(req.body.documentName || req.body.document_name || req.body.title || req.file.originalname)
    .trim()
    .slice(0, 180);
  const relativePath = path.posix.join("profile-documents", req.file.filename);

  await ensureUserDocumentsTable();
  let result;
  try {
    [result] = await query(
      `INSERT INTO user_documents
        (user_id, document_type, document_name, file_name, original_name, file_path, file_size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        documentType || "Other",
        documentName || req.file.originalname,
        req.file.filename,
        req.file.originalname,
        relativePath,
        req.file.size,
        req.file.mimetype,
        req.user.id,
      ]
    );
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => undefined);
    throw error;
  }

  const [documents] = await query("SELECT * FROM user_documents WHERE id = ? LIMIT 1", [result.insertId]);
  await logAudit({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: "document_uploaded",
    module: "Profile Documents",
    entityType: "user_document",
    entityId: result.insertId,
    description: "Uploaded document " + (documentName || req.file.originalname),
    metadata: { documentType, originalName: req.file.originalname, mimeType: req.file.mimetype, fileSize: req.file.size },
    ipAddress: req.ip,
  });

  res.status(201).json({ message: "Document uploaded successfully", document: serializeDocument(documents[0], req) });
});

const deleteDocument = asyncHandler(async (req, res) => {
  await ensureUserDocumentsTable();
  const [documents] = await query("SELECT * FROM user_documents WHERE id = ? AND user_id = ? LIMIT 1", [req.params.id, req.user.id]);
  if (!documents.length) {
    return res.status(404).json({ message: "Document not found" });
  }
  const document = documents[0];

  const uploadsRoot = path.resolve(__dirname, "../../../uploads");
  const storedPath = String(document.file_path || document.file_name || "");
  const absolutePath = path.resolve(uploadsRoot, storedPath);
  if (!absolutePath.startsWith(uploadsRoot + path.sep)) {
    return res.status(400).json({ message: "Invalid document storage path" });
  }

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await query("DELETE FROM user_documents WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  await logAudit({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: "document_deleted",
    module: "Profile Documents",
    entityType: "user_document",
    entityId: Number(req.params.id),
    description: "Deleted document " + document.document_name,
    metadata: { documentType: document.document_type, originalName: document.original_name },
    ipAddress: req.ip,
  });

  res.json({ message: "Document deleted successfully" });
});

module.exports = {
  ensureProfileTable,
  getMyProfile,
  updateMyProfile,
  updatePreferences,
  updatePassword,
  getMyDocuments,
  uploadDocument,
  deleteDocument,
};
