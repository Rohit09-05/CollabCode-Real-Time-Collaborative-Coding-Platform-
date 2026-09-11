-- CollabCode — MySQL initialization script
-- Sequelize sync will create/alter tables automatically.
-- This script just ensures the database and user exist with proper permissions.

CREATE DATABASE IF NOT EXISTS `collabcode`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Grant all privileges to the app user (password set via Docker env)
GRANT ALL PRIVILEGES ON `collabcode`.* TO 'collabcode'@'%';
FLUSH PRIVILEGES;
