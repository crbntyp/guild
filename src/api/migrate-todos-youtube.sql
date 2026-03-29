-- Migration: Todos and YouTube channels from Express/Railway to MySQL
-- Run on VPS: mysql -u root gld < migrate-todos-youtube.sql

CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bnet_user_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(2000),
    image VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (bnet_user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS youtube_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bnet_user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (bnet_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS youtube_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    video_id VARCHAR(20) NOT NULL,
    title VARCHAR(500),
    thumbnail VARCHAR(500),
    url VARCHAR(500),
    published_at TIMESTAMP NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES youtube_channels(id) ON DELETE CASCADE,
    INDEX idx_channel (channel_id),
    INDEX idx_added (added_at),
    UNIQUE KEY unique_video (channel_id, video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
