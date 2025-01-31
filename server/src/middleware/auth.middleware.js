import passport from 'passport';

export const authenticateJWT = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        
        if (!user) {
            return res.status(401).json({ message: '未授權的訪問' });
        }

        req.user = user;
        next();
    })(req, res, next);
}; 