-- 移除 marker_serials 表的唯一約束
ALTER TABLE marker_serials
DROP INDEX unique_marker_serial;

-- 保留 sequence_number 的約束
ALTER TABLE marker_serials
ADD UNIQUE KEY unique_sequence (serial_id, sequence_number); 