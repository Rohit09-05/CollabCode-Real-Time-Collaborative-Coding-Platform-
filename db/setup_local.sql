-- Run this once as your MySQL root user to create the database and app user.
-- Usage:
--   /usr/local/mysql/bin/mysql -u root -p < db/setup_local.sql

-- Create database
CREATE DATABASE IF NOT EXISTS `collabcode`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create dedicated app user (matches DB_USER / DB_PASSWORD in backend/.env)
CREATE USER IF NOT EXISTS 'collabcode_user'@'localhost' IDENTIFIED BY 'CollabCode@2024';
CREATE USER IF NOT EXISTS 'collabcode_user'@'127.0.0.1' IDENTIFIED BY 'CollabCode@2024';

-- Grant permissions
GRANT ALL PRIVILEGES ON `collabcode`.* TO 'collabcode_user'@'localhost';
GRANT ALL PRIVILEGES ON `collabcode`.* TO 'collabcode_user'@'127.0.0.1';

FLUSH PRIVILEGES;

SELECT 'Database and user created successfully.' AS status;
