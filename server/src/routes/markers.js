import express from 'express';
import passport from 'passport';
import pool from '../config/database.js';

const router = express.Router();

// 獲取所有標記點（包含標籤）
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const [markers] = await pool.query(`
            SELECT m.*, 
                   GROUP_CONCAT(t.name) as tags
            FROM markers m
            LEFT JOIN marker_tags mt ON m.id = mt.marker_id
            LEFT JOIN tags t ON mt.tag_id = t.id
            WHERE m.user_id = ?
            GROUP BY m.id
        `, [req.user.id]);

        // 處理標籤字符串轉換為數組
        const markersWithTags = markers.map(marker => ({
            ...marker,
            tags: marker.tags ? marker.tags.split(',') : []
        }));

        res.json(markersWithTags);
    } catch (error) {
        next(error);
    }
});

// 創建新標記點（包含標籤）
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 插入標記點
        const [result] = await connection.query(
            'INSERT INTO markers (user_id, title, latitude, longitude, description, weather, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, req.body.title, req.body.latitude, req.body.longitude, req.body.description, req.body.weather, req.body.date]
        );
        const markerId = result.insertId;

        // 處理標籤
        if (req.body.tags && req.body.tags.length > 0) {
            for (const tagName of req.body.tags) {
                // 插入或獲取標籤
                const [tagResult] = await connection.query(
                    'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
                    [tagName]
                );
                const tagId = tagResult.insertId;

                // 建立標記點和標籤的關聯
                await connection.query(
                    'INSERT INTO marker_tags (marker_id, tag_id) VALUES (?, ?)',
                    [markerId, tagId]
                );
            }
        }

        await connection.commit();
        res.status(201).json({
            message: '標記點創建成功',
            markerId: markerId
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

// 更新標記點（包含標籤）
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 檢查標記點所有權
        const [marker] = await connection.query(
            'SELECT * FROM markers WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (marker.length === 0) {
            return res.status(404).json({ message: '標記點不存在或無權限修改' });
        }

        // 更新標記點基本信息
        await connection.query(
            'UPDATE markers SET title = ?, description = ?, weather = ?, date = ? WHERE id = ?',
            [req.body.title, req.body.description, req.body.weather, req.body.date, req.params.id]
        );

        // 刪除現有的標籤關聯
        await connection.query(
            'DELETE FROM marker_tags WHERE marker_id = ?',
            [req.params.id]
        );

        // 添加新的標籤
        if (req.body.tags && req.body.tags.length > 0) {
            for (const tagName of req.body.tags) {
                // 插入或獲取標籤
                const [tagResult] = await connection.query(
                    'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
                    [tagName]
                );
                const tagId = tagResult.insertId;

                // 建立新的關聯
                await connection.query(
                    'INSERT INTO marker_tags (marker_id, tag_id) VALUES (?, ?)',
                    [req.params.id, tagId]
                );
            }
        }

        await connection.commit();
        res.json({ message: '標記點更新成功' });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

// 刪除標記點
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM markers WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '標記點不存在或無權限刪除' });
        }
        
        res.json({ message: '標記點刪除成功' });
    } catch (error) {
        next(error);
    }
});

// 獲取所有標籤
router.get('/tags', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const [tags] = await pool.query(`
            SELECT DISTINCT t.name
            FROM tags t
            INNER JOIN marker_tags mt ON t.id = mt.tag_id
            INNER JOIN markers m ON mt.marker_id = m.id
            WHERE m.user_id = ?
        `, [req.user.id]);

        res.json(tags.map(tag => tag.name));
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 