import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '未提供認證令牌' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: '無效的認證令牌' });
    }
}; 