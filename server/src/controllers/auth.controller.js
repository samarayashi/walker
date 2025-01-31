import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/db.config.js';
import passport from 'passport';

export const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 檢查郵箱是否已存在
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
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

        res.status(201).json({ message: '註冊成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
};

export const login = (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        
        if (!user) {
            return res.status(401).json({ message: info.message });
        }

        // 生成 JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email
            }
        });
    })(req, res, next);
}; 