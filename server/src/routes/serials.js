import express from 'express';
import { pool } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 獲取用戶的所有序列
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [serials] = await pool.query(
            `SELECT s.*, 
                    COUNT(DISTINCT ms.marker_id) as marker_count
             FROM serials s
             LEFT JOIN marker_serials ms ON s.id = ms.serial_id
             WHERE s.user_id = ?
             GROUP BY s.id
             ORDER BY s.created_at DESC`,
            [req.user.id]
        );
        res.json(serials);
    } catch (error) {
        console.error('Error fetching serials:', error);
        res.status(500).json({ message: '獲取序列失敗' });
    }
});

// 創建新序列
router.post('/', authenticateToken, async (req, res) => {
    const { name, description, color, markers } = req.body;
    const conn = await pool.getConnection();
    
    try {
        // 檢查標記點數量
        if (!markers || markers.length < 2) {
            return res.status(400).json({ message: '序列至少需要包含兩個標記點' });
        }

        // 檢查連續重複的標記點
        for (let i = 1; i < markers.length; i++) {
            if (markers[i] === markers[i - 1]) {
                return res.status(400).json({ message: '序列中不能包含連續重複的標記點' });
            }
        }

        await conn.beginTransaction();
        
        // 創建序列
        const [result] = await conn.query(
            'INSERT INTO serials (name, description, color, user_id) VALUES (?, ?, ?, ?)',
            [name, description, color, req.user.id]
        );
        
        const serialId = result.insertId;
        
        // 添加標記點到序列
        if (markers && markers.length > 0) {
            const values = markers.map((markerId, index) => [serialId, markerId, index + 1]);
            await conn.query(
                'INSERT INTO marker_serials (serial_id, marker_id, sequence_number) VALUES ?',
                [values]
            );
        }
        
        await conn.commit();
        res.status(201).json({ id: serialId, message: '序列創建成功' });
    } catch (error) {
        await conn.rollback();
        console.error('Error creating serial:', error);
        res.status(500).json({ message: '創建序列失敗' });
    } finally {
        conn.release();
    }
});

// 更新序列
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, color, markers } = req.body;
    const conn = await pool.getConnection();
    
    try {
        // 檢查標記點數量
        if (!markers || markers.length < 2) {
            return res.status(400).json({ message: '序列至少需要包含兩個標記點' });
        }

        // 檢查連續重複的標記點
        for (let i = 1; i < markers.length; i++) {
            if (markers[i] === markers[i - 1]) {
                return res.status(400).json({ message: '序列中不能包含連續重複的標記點' });
            }
        }

        await conn.beginTransaction();
        
        // 檢查序列所有權
        const [serial] = await conn.query(
            'SELECT * FROM serials WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (serial.length === 0) {
            return res.status(404).json({ message: '序列不存在或無權訪問' });
        }
        
        // 更新序列信息
        await conn.query(
            'UPDATE serials SET name = ?, description = ?, color = ? WHERE id = ?',
            [name, description, color, id]
        );
        
        // 更新標記點
        await conn.query('DELETE FROM marker_serials WHERE serial_id = ?', [id]);
        
        if (markers && markers.length > 0) {
            const values = markers.map((markerId, index) => [id, markerId, index + 1]);
            await conn.query(
                'INSERT INTO marker_serials (serial_id, marker_id, sequence_number) VALUES ?',
                [values]
            );
        }
        
        await conn.commit();
        res.json({ message: '序列更新成功' });
    } catch (error) {
        await conn.rollback();
        console.error('Error updating serial:', error);
        res.status(500).json({ message: '更新序列失敗' });
    } finally {
        conn.release();
    }
});

// 刪除序列
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM serials WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '序列不存在或無權訪問' });
        }
        
        res.json({ message: '序列刪除成功' });
    } catch (error) {
        console.error('Error deleting serial:', error);
        res.status(500).json({ message: '刪除序列失敗' });
    }
});

// 獲取特定序列的詳細信息
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [serials] = await pool.query(
            `SELECT s.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'marker_id', m.id,
                            'sequence_number', ms.sequence_number,
                            'latitude', m.latitude,
                            'longitude', m.longitude,
                            'title', m.title,
                            'description', m.description
                        )
                    ) as markers
             FROM serials s
             LEFT JOIN marker_serials ms ON s.id = ms.serial_id
             LEFT JOIN markers m ON ms.marker_id = m.id
             WHERE s.id = ? AND s.user_id = ?
             GROUP BY s.id`,
            [req.params.id, req.user.id]
        );
        
        if (serials.length === 0) {
            return res.status(404).json({ message: '序列不存在或無權訪問' });
        }
        
        res.json(serials[0]);
    } catch (error) {
        console.error('Error fetching serial details:', error);
        res.status(500).json({ message: '獲取序列詳情失敗' });
    }
});

export default router; 