import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置 multer 存儲
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('只允許上傳圖片文件'));
    }
});

// 上傳照片
router.post('/:markerId', 
    passport.authenticate('jwt', { session: false }),
    upload.single('photo'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: '請選擇要上傳的照片' });
            }
            
            const markerId = req.params.markerId;
            const photoUrl = `/uploads/${req.file.filename}`;
            
            // 驗證標記點是否屬於當前用戶
            const [markers] = await pool.query(
                'SELECT * FROM markers WHERE id = ? AND user_id = ?',
                [markerId, req.user.id]
            );
            
            if (markers.length === 0) {
                return res.status(404).json({ message: '標記點不存在或無權限' });
            }
            
            const [result] = await pool.query(
                'INSERT INTO photos (marker_id, photo_url) VALUES (?, ?)',
                [markerId, photoUrl]
            );
            
            res.status(201).json({
                message: '照片上傳成功',
                photoId: result.insertId,
                photoUrl
            });
        } catch (error) {
            next(error);
        }
    }
);

// 獲取標記點的所有照片
router.get('/:markerId', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const [photos] = await pool.query(
            'SELECT p.* FROM photos p JOIN markers m ON p.marker_id = m.id WHERE m.id = ? AND m.user_id = ?',
            [req.params.markerId, req.user.id]
        );
        
        res.json(photos);
    } catch (error) {
        next(error);
    }
});

// 刪除照片
router.delete('/:photoId', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const [photos] = await pool.query(
            'SELECT p.* FROM photos p JOIN markers m ON p.marker_id = m.id WHERE p.id = ? AND m.user_id = ?',
            [req.params.photoId, req.user.id]
        );
        
        if (photos.length === 0) {
            return res.status(404).json({ message: '照片不存在或無權限刪除' });
        }
        
        await pool.query('DELETE FROM photos WHERE id = ?', [req.params.photoId]);
        
        res.json({ message: '照片刪除成功' });
    } catch (error) {
        next(error);
    }
});

export default router; 