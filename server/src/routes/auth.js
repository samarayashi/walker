import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import pool from '../config/database.js';

const router = express.Router();

// 註冊
router.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // 檢查用戶是否已存在
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: '該郵箱已被註冊' });
        }
        
        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 創建新用戶
        const [result] = await pool.query(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );
        
        res.status(201).json({
            message: '註冊成功',
            userId: result.insertId
        });
    } catch (error) {
        next(error);
    }
});

// 登錄
router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) return next(err);
        
        if (!user) {
            return res.status(401).json({
                message: info.message || '登錄失敗'
            });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: '登錄成功',
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });
    })(req, res, next);
});

export default router; 