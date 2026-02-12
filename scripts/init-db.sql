-- Database initialization script for Private MailHub
-- This script creates the database and tables for production deployment

CREATE DATABASE IF NOT EXISTS private_mailhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE private_mailhub;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  username_hash CHAR(64) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'USER' NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
  subscription_tier ENUM('FREE', 'PRO') DEFAULT 'FREE' NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deactivated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  last_logined_at DATETIME NULL,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relay Emails table
CREATE TABLE IF NOT EXISTS relay_emails (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  primary_email VARCHAR(255) NOT NULL,
  relay_email VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  forward_count BIGINT DEFAULT 0 NOT NULL,
  last_forwarded_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  paused_at DATETIME NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_primary_email (primary_email),
  INDEX idx_relay_email (relay_email),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reply Mapping table
CREATE TABLE `reply_mappings` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `reply_address` varchar(255) NOT NULL,
    `relay_email_id` bigint NOT NULL,
    `original_sender_encrypted` text NOT NULL,
    `original_sender_hash` char(64) NOT NULL,
    `user_id` bigint NOT NULL,
    `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
    `last_used_at` datetime(6) NULL,
    UNIQUE KEY `uk_relay_sender` (`relay_email_id`, `original_sender_hash`),
    INDEX `idx_reply_address` (`reply_address`),
    FOREIGN KEY (`relay_email_id`) REFERENCES `relay_emails`(`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  );

-- Verify tables
SHOW TABLES;
