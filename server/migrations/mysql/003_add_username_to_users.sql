-- Migration 003: Add `username` column to the users table
--
-- Fixes: Error: Unknown column 'username' in 'field list'
--   SQL: SELECT id, username, email, role, created_at FROM users ...
--
-- Background: The live database was created with mysql/001_initial_schema.sql,
-- which defines users as (id, email, password_hash, name, role, is_active, ...).
-- The backend routes (src/routes/users.ts and src/routes/projects.ts) and the
-- frontend Users/Projects pages expect the canonical schema from
-- mysql/002_users_projects.sql, which uses `username` instead of `name`.
-- This migration reconciles the two by adding a UNIQUE `username` column and
-- backfilling it from existing data. Safe to run on databases that already
-- have `username` (it becomes a no-op / ignores duplicate errors).

USE sql_api_builder;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL AFTER id',
  'SELECT ''username column already exists - skipping ADD COLUMN'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill username for existing rows before enforcing uniqueness:
-- 1) prefer the legacy `name` column if present, 2) fall back to the email local-part.
SET @has_name = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name'
);

SET @sql = IF(@has_name > 0,
  'UPDATE users SET username = LOWER(REPLACE(`name`, '' '', ''_'')) WHERE username IS NULL OR username = ''''',
  'SELECT ''no name column to backfill from'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE users
   SET username = LOWER(SUBSTRING_INDEX(email, '@', 1))
 WHERE username IS NULL OR username = '';

-- De-duplicate (e.g. two users sharing an email local-part) by appending the id prefix.
UPDATE users u
  JOIN (
    SELECT email_local, MIN(id) AS keep_id FROM (
      SELECT LOWER(SUBSTRING_INDEX(email, '@', 1)) AS email_local, id FROM users
    ) t GROUP BY email_local HAVING COUNT(*) > 1
  ) dup ON LOWER(SUBSTRING_INDEX(u.email, '@', 1)) = dup.email_local AND u.id <> dup.keep_id
   SET u.username = CONCAT(u.username, '_', LEFT(u.id, 8));

-- Enforce uniqueness + NOT NULL now that all rows are populated.
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_username'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NOT NULL, ADD UNIQUE KEY idx_users_username (username)',
  'SELECT ''username unique index already exists - skipping'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Keep `name` (if present) in sync so any legacy code reading it still works.
SET @sql = IF(@has_name > 0,
  'UPDATE users SET `name` = username WHERE `name` IS NULL OR `name` = ''''',
  'SELECT ''nothing to sync'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
