-- gld Raid Signup System
-- Run on Hostinger VPS MySQL 8.0

CREATE DATABASE IF NOT EXISTS gld CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gld_user'@'localhost' IDENTIFIED BY 'GldPass123!';
GRANT ALL PRIVILEGES ON gld.* TO 'gld_user'@'localhost';
FLUSH PRIVILEGES;

USE gld;

CREATE TABLE IF NOT EXISTS raids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  raid_date DATETIME NOT NULL,
  max_players INT NOT NULL DEFAULT 20,
  min_tanks INT NOT NULL DEFAULT 2,
  min_healers INT NOT NULL DEFAULT 4,
  min_dps INT NOT NULL DEFAULT 14,
  difficulty VARCHAR(20) DEFAULT 'heroic',
  status ENUM('open','full','cancelled','completed') DEFAULT 'open',
  created_by_battletag VARCHAR(100),
  discord_message_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_raid_date (raid_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS raid_signups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  raid_id INT NOT NULL,
  battletag VARCHAR(100) NOT NULL,
  bnet_user_id INT NOT NULL,
  character_name VARCHAR(50) NOT NULL,
  character_realm VARCHAR(100) NOT NULL,
  character_class_id INT NOT NULL,
  character_spec VARCHAR(100),
  character_level INT DEFAULT 80,
  character_ilvl INT DEFAULT 0,
  role ENUM('tank','healer','dps') NOT NULL,
  status ENUM('confirmed','tentative','declined') DEFAULT 'confirmed',
  note TEXT,
  signed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_raid_user (raid_id, bnet_user_id),
  FOREIGN KEY (raid_id) REFERENCES raids(id) ON DELETE CASCADE,
  INDEX idx_raid_id (raid_id),
  INDEX idx_battletag (battletag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
