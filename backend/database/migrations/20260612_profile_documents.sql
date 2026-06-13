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
);

SET @has_file_name = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_documents' AND COLUMN_NAME = 'file_name'
);
SET @add_file_name = IF(
  @has_file_name = 0,
  'ALTER TABLE user_documents ADD COLUMN file_name VARCHAR(180) NULL AFTER document_name',
  'SELECT 1'
);
PREPARE add_file_name_stmt FROM @add_file_name;
EXECUTE add_file_name_stmt;
DEALLOCATE PREPARE add_file_name_stmt;

SET @has_original_name = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_documents' AND COLUMN_NAME = 'original_name'
);
SET @add_original_name = IF(
  @has_original_name = 0,
  'ALTER TABLE user_documents ADD COLUMN original_name VARCHAR(255) NULL AFTER file_name',
  'SELECT 1'
);
PREPARE add_original_name_stmt FROM @add_original_name;
EXECUTE add_original_name_stmt;
DEALLOCATE PREPARE add_original_name_stmt;

UPDATE user_documents
SET file_name = COALESCE(file_name, SUBSTRING_INDEX(file_path, '/', -1)),
    original_name = COALESCE(original_name, document_name);
