import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import pool from './database.js';

// JWT 策略配置
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [jwt_payload.id]);
        if (rows.length > 0) {
            return done(null, rows[0]);
        }
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));

// Local 策略配置
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return done(null, false, { message: '用戶不存在' });
        }
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return done(null, false, { message: '密碼錯誤' });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

export default passport; 