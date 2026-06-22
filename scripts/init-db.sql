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
  INDEX idx_username (username_hash)
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

-- Reply Maskings table
CREATE TABLE IF NOT EXISTS reply_maskings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reply_address VARCHAR(255) NOT NULL,
  sender_address_hash VARCHAR(255) NOT NULL,
  sender_address VARCHAR(255) NOT NULL,
  receiver_address_hash VARCHAR(255) NOT NULL,
  receiver_address VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_used_at DATETIME NULL,
  INDEX idx_reply_address (reply_address),
  INDEX idx_sender_receiver_hash (sender_address_hash, receiver_address_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lambda email forwarding idempotency table
CREATE TABLE IF NOT EXISTS email_forwarding_attempts (
  idempotency_key CHAR(64) PRIMARY KEY,
  bucket_name VARCHAR(255) NOT NULL,
  object_key VARCHAR(1024) NOT NULL,
  status VARCHAR(16) NOT NULL,
  processing_token CHAR(36) NOT NULL,
  lease_expires_at DATETIME(6) NULL,
  attempts INT UNSIGNED DEFAULT 1 NOT NULL,
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) NOT NULL,
  completed_at DATETIME(6) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables
SHOW TABLES;
