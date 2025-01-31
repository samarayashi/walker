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