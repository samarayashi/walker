-- 如果數據庫不存在則創建
CREATE DATABASE IF NOT EXISTS hiking_trail;

-- 使用數據庫
USE hiking_trail;

-- 創建用戶表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建標記點表
CREATE TABLE IF NOT EXISTS markers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT,
    weather VARCHAR(50),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 創建照片表
CREATE TABLE IF NOT EXISTS photos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    marker_id INT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (marker_id) REFERENCES markers(id) ON DELETE CASCADE
); 

-- 創建標籤表
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建標記點和標籤的關聯表
CREATE TABLE marker_tags (
    marker_id INT,
    tag_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (marker_id, tag_id),
    FOREIGN KEY (marker_id) REFERENCES markers(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 添加索引以提高查詢效率
CREATE INDEX idx_marker_tags_marker_id ON marker_tags(marker_id);
CREATE INDEX idx_marker_tags_tag_id ON marker_tags(tag_id);