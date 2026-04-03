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
  max_tanks INT NOT NULL DEFAULT 2,
  max_healers INT NOT NULL DEFAULT 4,
  max_dps INT NOT NULL DEFAULT 14,
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

-- Mythic+ Group Builder
CREATE TABLE IF NOT EXISTS mplus_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_date DATETIME NOT NULL,
  status ENUM('open','closed','completed','cancelled') DEFAULT 'open',
  created_by_battletag VARCHAR(100),
  discord_guild_id VARCHAR(50),
  discord_message_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_session_date (session_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mplus_signups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  battletag VARCHAR(100) NOT NULL,
  bnet_user_id INT NOT NULL,
  character_name VARCHAR(50) NOT NULL,
  character_realm VARCHAR(100) NOT NULL,
  character_class_id INT NOT NULL,
  character_spec VARCHAR(100),
  character_level INT DEFAULT 80,
  character_ilvl INT DEFAULT 0,
  role ENUM('tank','healer','dps') NOT NULL,
  status ENUM('confirmed','tentative') DEFAULT 'confirmed',
  note TEXT,
  signed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_session_user (session_id, bnet_user_id),
  FOREIGN KEY (session_id) REFERENCES mplus_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_battletag (battletag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mplus_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  group_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES mplus_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mplus_group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  signup_id INT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES mplus_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (signup_id) REFERENCES mplus_signups(id) ON DELETE CASCADE,
  UNIQUE KEY uk_group_signup (group_id, signup_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
