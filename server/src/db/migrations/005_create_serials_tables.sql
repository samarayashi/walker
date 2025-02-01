-- 創建序列表
CREATE TABLE IF NOT EXISTS serials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- 存儲 HEX 顏色代碼
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 創建標記點和序列的關聯表
CREATE TABLE IF NOT EXISTS marker_serials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    serial_id INT NOT NULL,
    marker_id INT NOT NULL,
    sequence_number INT NOT NULL, -- 用於確定點的順序
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (serial_id) REFERENCES serials(id) ON DELETE CASCADE,
    FOREIGN KEY (marker_id) REFERENCES markers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_marker_serial (serial_id, marker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 添加索引以提高查詢效率
CREATE INDEX idx_marker_serials_serial_id ON marker_serials(serial_id);
CREATE INDEX idx_marker_serials_marker_id ON marker_serials(marker_id);
CREATE INDEX idx_marker_serials_sequence ON marker_serials(sequence_number); 